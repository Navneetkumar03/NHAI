// src/components/maps/LandUseLandCover/hooks/useFlyoverImageLayer.js
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Camera } from "lucide-react";
import L from "leaflet";
import { BASE_ZOOM } from "../constants";
import { addAllToMap, removeAllFromMap } from "../mapUtils";
import { fetchFlyoverImage } from "../../../../services/api/flyoverImage";

// ── Zoom-based sizing ────────────────────────────────────────────────
// Camera pins are DOM markers, so (unlike the movement circles, which are
// real-world-radius L.circle shapes) they stay a fixed pixel size at every
// zoom level. We emulate the same behaviour: small when zoomed out, larger
// when zoomed in, recalculated on every zoomend.
//
// Tune these four numbers to change how the pins scale.
const ICON_BASE_SIZE = 26;      // px at BASE_ZOOM
const ICON_MIN_SIZE = 14;       // px, never smaller than this
const ICON_MAX_SIZE = 40;       // px, never larger than this
const ICON_ZOOM_FACTOR = 1.2;   // size multiplier per zoom level
const SELECTED_SCALE = 1.15;    // selected pin is slightly bigger

function getIconSizeForZoom(zoom, selected = false) {
    const raw = ICON_BASE_SIZE * Math.pow(ICON_ZOOM_FACTOR, zoom - BASE_ZOOM);
    const size = Math.min(ICON_MAX_SIZE, Math.max(ICON_MIN_SIZE, raw));
    return Math.round(selected ? size * SELECTED_SCALE : size);
}

// ── Icon rendering ───────────────────────────────────────────────────
// The lucide Camera is rendered to static markup once per pixel size and
// cached, so zooming never re-renders the same size twice.
const cameraSvgCache = new Map();

function getCameraSvg(px) {
    if (!cameraSvgCache.has(px)) {
        cameraSvgCache.set(
            px,
            renderToStaticMarkup(
                createElement(Camera, {
                    size: px,
                    color: "#ffffff",
                    strokeWidth: 2.4,
                    style: { display: "block" },
                }),
            ),
        );
    }
    return cameraSvgCache.get(px);
}

function buildCameraIconHtml(size, selected) {
    const bg = selected ? "#b309aa" : "#0EA5E9";
    const ringWidth = Math.max(1.5, Math.round(size * 0.09 * 10) / 10);
    const shadow = selected
        ? "0 3px 8px rgba(0,0,0,0.35)"
        : "0 2px 5px rgba(0,0,0,0.28)";
    const iconPx = Math.round(size * 0.5);

    return `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      <div style="
        position: absolute; inset: 0; border-radius: 50%;
        background: rgba(255,255,255,0.35); transform: scale(1.35);
      "></div>
      <div style="
        position: absolute; inset: 0; border-radius: 50%;
        background: ${bg}; border: ${ringWidth}px solid #ffffff;
        box-shadow: ${shadow};
        display: flex; align-items: center; justify-content: center;
      ">
        ${getCameraSvg(iconPx)}
      </div>
    </div>
  `;
}

function makeCameraIcon({ selected = false, zoom = BASE_ZOOM } = {}) {
    const size = getIconSizeForZoom(zoom, selected);

    return L.divIcon({
        className: "flyover-image-marker",
        html: buildCameraIconHtml(size, selected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
}



// ── Popup (zoomable image) ───────────────────────────────────────────
const POPUP_WIDTH = 220;    // px, popup / image width
const IMAGE_HEIGHT = 220;   // px, image box height
const MIN_SCALE = 1;        // no zooming out past the original size
const MAX_SCALE = 10;       // maximum zoom
const ZOOM_STEP = 1.25;     // zoom per wheel tick / button press

function makeRow(label, value, style) {
    const row = document.createElement("div");
    row.style.cssText = style;
    const l = document.createElement("span");
    l.textContent = `${label} `;
    l.style.cssText =
        "color:#6b7280;font-weight:500;font-family:Arial,sans-serif;";
    row.appendChild(l);
    row.appendChild(document.createTextNode(value));
    return row;
}

function buildPopupContent(feature) {
    const { image_url, date_time, latitude, longitude } =
        feature?.properties || {};

    const root = document.createElement("div");
    root.style.cssText = `font-family: Arial, sans-serif; width: ${POPUP_WIDTH}px;`;

    // Viewport: clips the image so zooming never changes the popup size
    const viewport = document.createElement("div");
    viewport.style.cssText = `
        position: relative; width: ${POPUP_WIDTH}px; height: ${IMAGE_HEIGHT}px;
        overflow: hidden; border-radius: 6px; background: #f3f4f6;
        touch-action: none; user-select: none; cursor: zoom-in;
    `;

    const img = document.createElement("img");
    img.src = image_url || "";
    img.alt = "Flyover";
    img.draggable = false;
    img.style.cssText = `
        display: block; width: 100%; height: 100%; object-fit: cover;
        transform-origin: 0 0; will-change: transform;
    `;
    viewport.appendChild(img);

    // ── Zoom / pan state ─────────────────────────────────────────────
    let scale = 1, tx = 0, ty = 0;

    // Buttons need to be reachable from apply() so we can update their
    // active/inactive styling after every scale change. Declared up
    // here (before their creation below) so the reference is captured.
    let zoomInBtn = null;
    let zoomOutBtn = null;

    const updateButtonStates = () => {
        if (zoomInBtn) {
            const atMax = scale >= MAX_SCALE;
            zoomInBtn.disabled = atMax;
            zoomInBtn.style.opacity = atMax ? "0.4" : "1";
            zoomInBtn.style.cursor = atMax ? "not-allowed" : "pointer";
            // Accent border + background when this action is "available"
            zoomInBtn.style.borderColor = atMax ? "#9c095c" : "#2563eb";
            zoomInBtn.style.color = atMax ? "#2c6606" : "#2563eb";
        }
        if (zoomOutBtn) {
            const atMin = scale <= MIN_SCALE;
            zoomOutBtn.disabled = atMin;
            zoomOutBtn.style.opacity = atMin ? "0.4" : "1";
            zoomOutBtn.style.cursor = atMin ? "not-allowed" : "pointer";
            zoomOutBtn.style.borderColor = atMin ? "#9c095c" : "#2563eb";
            zoomOutBtn.style.color = atMin ? "#2c6606" : "#2563eb";
        }
    };

    const apply = () => {
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        viewport.style.cursor = scale > 1 ? "grab" : "zoom-in";
        updateButtonStates();
    };

    // Keep the image covering the viewport (no empty edges)
    const clamp = () => {
        const minX = POPUP_WIDTH - POPUP_WIDTH * scale;
        const minY = IMAGE_HEIGHT - IMAGE_HEIGHT * scale;
        tx = Math.min(0, Math.max(minX, tx));
        ty = Math.min(0, Math.max(minY, ty));
    };

    // Zoom keeping the point (cx, cy) fixed under the cursor
    const zoomAt = (factor, cx, cy) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
        if (next === scale) return;
        const ratio = next / scale;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
        scale = next;
        clamp();
        apply();
    };

    const reset = () => {
        scale = 1; tx = 0; ty = 0;
        apply();
    };

    // Mouse wheel
    viewport.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            const r = viewport.getBoundingClientRect();
            zoomAt(
                e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP,
                e.clientX - r.left,
                e.clientY - r.top,
            );
        },
        { passive: false },
    );

    // Drag to pan (only when zoomed in)
    let drag = null;
    viewport.addEventListener("pointerdown", (e) => {
        if (scale <= 1) return;
        drag = { x: e.clientX, y: e.clientY, tx, ty };
        viewport.setPointerCapture(e.pointerId);
        viewport.style.cursor = "grabbing";
    });
    viewport.addEventListener("pointermove", (e) => {
        if (!drag) return;
        tx = drag.tx + (e.clientX - drag.x);
        ty = drag.ty + (e.clientY - drag.y);
        clamp();
        apply();
    });
    const endDrag = () => { drag = null; apply(); };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Double-click: zoom in, or reset if already zoomed
    viewport.addEventListener("dblclick", (e) => {

        if (e.target.closest(".flyover-image-controls")) return;
        e.stopPropagation();
        if (scale > 1) {
            reset();
        } else {
            const r = viewport.getBoundingClientRect();
            zoomAt(2.5, e.clientX - r.left, e.clientY - r.top);
        }
    });

    // ── Buttons (top-left of the image) ──────────────────────────────
    const controls = document.createElement("div");
    controls.className = "flyover-image-controls";
    controls.style.cssText =
        "position:absolute; left:6px; top:6px; display:flex; gap:4px;";
    controls.addEventListener("pointerdown", (e) => e.stopPropagation());

    const makeBtn = (label, title, onClick, wide = false) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.title = title;
        b.style.cssText = `
            min-width: 24px; height: 24px; padding: 0 ${wide ? 6 : 0}px;
            border: 1px solid #d1d5db; border-radius: 4px;
            background: rgba(255,255,255,0.95); color: #374151;
            font-size: ${wide ? 10 : 15}px; font-weight: 700; line-height: 1;
            cursor: pointer;
            transition: background 120ms ease, border-color 120ms ease,
                        color 120ms ease, opacity 120ms ease;
        `;
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            onClick();
        });
        // Hover feedback — only when not disabled.
        b.addEventListener("mouseenter", () => {
            if (b.disabled) return;
            b.style.background = "rgba(37,99,235,0.12)";
        });
        b.addEventListener("mouseleave", () => {
            if (b.disabled) return;
            b.style.background = "rgba(255,255,255,0.95)";
        });
        return b;
    };

    zoomInBtn = makeBtn("+", "Zoom in", () =>
        zoomAt(ZOOM_STEP, POPUP_WIDTH / 2, IMAGE_HEIGHT / 2),
    );
    zoomOutBtn = makeBtn("−", "Zoom out", () =>
        zoomAt(1 / ZOOM_STEP, POPUP_WIDTH / 2, IMAGE_HEIGHT / 2),
    );

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    viewport.appendChild(controls);

    root.appendChild(viewport);

    // ── Text under the image ─────────────────────────────────────────
    const meta = document.createElement("div");
    meta.style.cssText = "padding: 4px 2px 0;";
    meta.appendChild(
        makeRow(
            "DateTime:",
            date_time || "",
            "font-size:11px;color:#1f2937;font-weight:600;line-height:1.3;",
        ),
    );
    meta.appendChild(
        makeRow(
            "Location:",
            `${latitude?.toFixed?.(5) ?? latitude}, ${longitude?.toFixed?.(5) ?? longitude}`,
            "font-size:11px;color:#1f2937;font-weight:600;line-height:1.3;",
        ),
    );
    root.appendChild(meta);

    // Initialize button states for the starting scale (1x).
    apply();

    return root;
}






/**
 * useFlyoverImageLayer
 *
 * Fetches the /get_flyover_image FeatureCollection and manages the
 * camera-icon marker layer on the map.
 *
 * The fetch is gated on `enabled`: nothing hits the network until the
 * user turns the "Flyover Images" overlay on.
 */
export function useFlyoverImageLayer({
    mapRef,
    isMapReadyRef,
    enabled,
    selectedId,
    onSelect,
}) {
    const markersRef = useRef([]);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const selectedIdRef = useRef(selectedId);
    selectedIdRef.current = selectedId;

    // ── Data fetching ────────────────────────────────────────────────
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            setImages([]);
            setLoading(false);
            setError(null);
            return;
        }

        const myRequestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);

        fetchFlyoverImage()
            .then((response) => {
                if (myRequestId !== requestIdRef.current) return;

                const ok = response?.status === "success";
                const features = Array.isArray(response?.data?.features)
                    ? response.data.features
                    : [];

                if (!ok) {
                    throw new Error("Invalid response from flyover image API");
                }

                setImages(features);
            })
            .catch((err) => {
                if (myRequestId !== requestIdRef.current) return;
                console.error("Error loading flyover images:", err);
                setError(err.message || "Failed to fetch flyover images");
                setImages([]);
            })
            .finally(() => {
                if (myRequestId === requestIdRef.current) {
                    setLoading(false);
                }
            });
    }, [enabled]);

    // ── Map layer ────────────────────────────────────────────────────
    // Depends on `images` only (callbacks are read through refs).
    const addLayer = useCallback(
        (map) => {
            if (!map || images.length === 0) return;

            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];

            const zoom = map.getZoom();

            images.forEach((feature) => {
                const p = feature?.properties || {};
                const lat = p.latitude;
                const lng = p.longitude;
                if (typeof lat !== "number" || typeof lng !== "number") return;

                // A rebuilt marker must start in the correct state.
                const selected = feature.id === selectedIdRef.current;

                const marker = L.marker([lat, lng], {
                    icon: makeCameraIcon({ selected, zoom }),
                    pane: "movementPane",
                    riseOnHover: true,
                    riseOffset: 250,
                });

                marker._flyoverImageId = feature.id;
                marker._flyoverImageFeature = feature;
                marker._isSelected = selected;
                marker._iconSize = getIconSizeForZoom(zoom, selected);

                marker.bindPopup(() => buildPopupContent(feature), {
                    maxWidth: 220,
                    minWidth: 200,
                    closeButton: true,
                    autoPan: true,
                    className: "flyover-image-popup",
                });


                marker.on("popupopen", (e) => {
                    const popupEl = e.popup.getElement();
                    const closeBtn = popupEl?.querySelector(".leaflet-popup-close-button");
                    if (closeBtn) {
                        closeBtn.removeAttribute("href");
                        closeBtn.style.cursor = "pointer";
                    }

                    const img = popupEl?.querySelector("img");
                    if (img && !img.complete) {
                        img.addEventListener("load", () => e.popup.update(), {
                            once: true,
                        });
                    }
                });

                marker.on("click", () => {
                    onSelectRef.current?.(feature);
                });

                markersRef.current.push(marker);
            });

            addAllToMap(map, markersRef.current);
        },
        [images],
    );

    // Re-size every pin to match the current zoom (and selection state).
    const applyIconSizes = useCallback(
        (map) => {
            if (!map) return;
            const zoom = map.getZoom();

            markersRef.current.forEach((marker) => {
                const size = getIconSizeForZoom(zoom, marker._isSelected);
                if (size === marker._iconSize) return; // nothing to change

                marker._iconSize = size;
                marker.setIcon(
                    makeCameraIcon({ selected: marker._isSelected, zoom }),
                );
            });
        },
        [],
    );

    // Toggle: mount the layer when enabled (and data is ready), tear it
    // down when disabled. Also keeps pin size in sync with map zoom.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isMapReadyRef.current) return;

        if (!enabled) {
            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
            return;
        }

        if (images.length === 0) return;

        addLayer(map);

        const handleZoomEnd = () => applyIconSizes(map);
        map.on("zoomend", handleZoomEnd);

        return () => {
            map.off("zoomend", handleZoomEnd);
            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
        };
    }, [enabled, images, addLayer, applyIconSizes, mapRef, isMapReadyRef]);

    // Swap icons when selection changes — the selected pin flips to the
    // amber, slightly larger variant.
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const zoom = map.getZoom();

        markersRef.current.forEach((marker) => {
            const isSelected = marker._flyoverImageId === selectedId;

            if (isSelected === marker._isSelected) return; // no change

            marker._isSelected = isSelected;
            marker._iconSize = getIconSizeForZoom(zoom, isSelected);
            marker.setIcon(makeCameraIcon({ selected: isSelected, zoom }));

            if (isSelected && marker.bringToFront) {
                marker.bringToFront();
            }
        });
    }, [selectedId, mapRef]);

    // Cleanup on unmount only.
    useEffect(() => {
        return () => {
            const map = mapRef.current;
            if (map) removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
        };
    }, [mapRef]);

    const removeLayer = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        removeAllFromMap(map, markersRef.current);
        markersRef.current = [];
    }, [mapRef]);

    return {
        loading,
        error,
        count: images.length,
        removeLayer,
    };
}