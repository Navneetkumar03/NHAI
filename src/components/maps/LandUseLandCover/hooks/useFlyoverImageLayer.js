// src/components/maps/LandUseLandCover/hooks/useFlyoverImageLayer.js
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Camera } from "lucide-react";
import L from "leaflet";
import { BASE_ZOOM } from "../constants";
import { addAllToMap, removeAllFromMap } from "../mapUtils";
import { fetchFlyoverImage } from "../../../../services/api/flyoverImage";

// ── Zoom-based sizing ────────────────────────────────────────────────
const ICON_BASE_SIZE = 26;
const ICON_MIN_SIZE = 14;
const ICON_MAX_SIZE = 40;
const ICON_ZOOM_FACTOR = 1.2;
const SELECTED_SCALE = 1.15;

function getIconSizeForZoom(zoom, selected = false) {
    const raw = ICON_BASE_SIZE * Math.pow(ICON_ZOOM_FACTOR, zoom - BASE_ZOOM);
    const size = Math.min(ICON_MAX_SIZE, Math.max(ICON_MIN_SIZE, raw));
    return Math.round(selected ? size * SELECTED_SCALE : size);
}

// ── Icon rendering ───────────────────────────────────────────────────
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
    });
}

// ── Popup content (zoomable image) ───────────────────────────────────
const POPUP_WIDTH = 220;
const IMAGE_HEIGHT = 220;
const MAX_IMG_W = 260; // widest the image box may get
const MAX_IMG_H = 320; // tallest the image box may get
const MIN_POPUP_W = 172; // keeps the DateTime / Location text from wrapping
const MIN_SCALE = 1;
const MAX_SCALE = 10;
const ZOOM_STEP = 1.25;

// Inline SVG icons for the fullscreen button — lucide's Maximize / Minimize
// paths, so they visually match the rest of the app's icon set.
const EXPAND_ICON_SVG = `<svg style="pointer-events:none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;

const COLLAPSE_ICON_SVG = `<svg style="pointer-events:none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`;

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

/**
 * Builds the inner content (image viewport + meta text).
 * Returns { root, destroy }.
 *   onLayout — called whenever the content size changes (image loaded)
 *              so the popup can re-pan to stay in view.
 */
function buildPopupContent(feature, { onLayout } = {}) {
    const { image_url, date_time, latitude, longitude } =
        feature?.properties || {};

    const root = document.createElement("div");
    root.style.cssText = `font-family: Arial, sans-serif; width: ${POPUP_WIDTH}px;`;

    // Viewport: clips the image so zooming never changes the popup size
    const viewport = document.createElement("div");
    viewport.style.cssText = `
        position: relative; width: ${POPUP_WIDTH}px; height: ${IMAGE_HEIGHT}px;
        margin: 0 auto;
        overflow: hidden; border-radius: 6px; background: #f3f4f6;
        touch-action: none; user-select: none; cursor: zoom-in;
    `;

    const img = document.createElement("img");
    img.src = image_url || "";
    img.alt = "Flyover";
    img.draggable = false;
    img.style.cssText = `
        display: block; width: 100%; height: 100%; object-fit: contain;
        transform-origin: 0 0; will-change: transform;
    `;
    viewport.appendChild(img);

    // ── Zoom / pan state ─────────────────────────────────────────────
    let scale = 1, tx = 0, ty = 0;

    let zoomInBtn = null;
    let zoomOutBtn = null;
    let fullscreenBtn = null;

    // Own boolean flag; driven by the fullscreenchange event so we don't
    // have to trust document.fullscreenElement during transitions.
    let isFullscreen = false;
    let transitioning = false;

    let viewW = POPUP_WIDTH;
    let viewH = IMAGE_HEIGHT;
    let renderedFullscreen = null;

    const updateButtonStates = () => {
        if (zoomInBtn) {
            const atMax = scale >= MAX_SCALE;
            zoomInBtn.disabled = atMax;
            zoomInBtn.style.opacity = atMax ? "0.6" : "1";
            zoomInBtn.style.cursor = atMax ? "not-allowed" : "pointer";
            zoomInBtn.style.borderColor = atMax ? "#374151" : "#2563eb";
            zoomInBtn.style.color = atMax ? "#2c6606" : "#374151";
        }
        if (zoomOutBtn) {
            const atMin = scale <= MIN_SCALE;
            zoomOutBtn.disabled = atMin;
            zoomOutBtn.style.opacity = atMin ? "0.6" : "1";
            zoomOutBtn.style.cursor = atMin ? "not-allowed" : "pointer";
            zoomOutBtn.style.borderColor = atMin ? "#374151" : "#2563eb";
            zoomOutBtn.style.color = atMin ? "#374151" : "#374151";
        }
        if (fullscreenBtn && renderedFullscreen !== isFullscreen) {
            renderedFullscreen = isFullscreen;
            fullscreenBtn.innerHTML = isFullscreen
                ? COLLAPSE_ICON_SVG
                : EXPAND_ICON_SVG;
            fullscreenBtn.title = isFullscreen
                ? "Exit fullscreen"
                : "Fullscreen";
        }
    };

    const apply = () => {
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        viewport.style.cursor = scale > 1 ? "grab" : "zoom-in";
        updateButtonStates();
    };

    // Uses the viewport's live size so it also works in fullscreen.
    const clamp = () => {
        const w = viewport.clientWidth;
        const h = viewport.clientHeight;
        const minX = w - w * scale;
        const minY = h - h * scale;
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
    const endDrag = () => {
        if (!drag) return;
        drag = null;
        apply();
    };
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

    // ── Fullscreen handling ──────────────────────────────────────────
    // We track our OWN boolean and update it from the fullscreenchange
    // event, rather than querying document.fullscreenElement on every
    // click. That property can momentarily be null during the enter /
    // exit animation on some browsers.
    const applyFullscreenLayout = () => {
        if (isFullscreen) {
            viewport.style.width = "100vw";
            viewport.style.height = "100vh";
            viewport.style.borderRadius = "0";
            viewport.style.background = "#000";
        } else {
            viewport.style.width = `${viewW}px`;
            viewport.style.height = `${viewH}px`;
            viewport.style.borderRadius = "6px";
            viewport.style.background = "#f3f4f6";
        }
        reset();
    };

    // Size the image box to the image's real aspect ratio (no empty bars).
    const fitToImage = () => {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!nw || !nh) return;

        const ratio = Math.min(MAX_IMG_W / nw, MAX_IMG_H / nh);
        viewW = Math.round(nw * ratio);
        viewH = Math.round(nh * ratio);

        root.style.width = `${Math.max(viewW, MIN_POPUP_W)}px`;

        if (!isFullscreen) {
            viewport.style.width = `${viewW}px`;
            viewport.style.height = `${viewH}px`;
            clamp();
            apply();
            onLayout?.();
        }
    };

    img.addEventListener("load", fitToImage);
    if (img.complete) fitToImage(); // image already cached

    const handleFullscreenChange = () => {
        const stillOurs = document.fullscreenElement === viewport;
        const was = isFullscreen;
        isFullscreen = stillOurs;
        if (isFullscreen !== was) {
            applyFullscreenLayout();
        }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Called by the popup controller when the popup is closed / removed.
    const destroy = () => {
        document.removeEventListener(
            "fullscreenchange",
            handleFullscreenChange,
        );
        if (document.fullscreenElement === viewport) {
            document.exitFullscreen?.().catch(() => { });
        }
    };

    // ── Buttons (top-left of the image) ──────────────────────────────
    const controls = document.createElement("div");
    controls.className = "flyover-image-controls";
    controls.style.cssText =
        "position:absolute; left:6px; top:6px; display:flex; gap:4px; z-index:10;";
    controls.addEventListener("pointerdown", (e) => e.stopPropagation());

    const makeBtn = (content, title, onClick, isHtml = false, wide = false) => {
        const b = document.createElement("button");
        b.type = "button";
        if (isHtml) {
            b.innerHTML = content;
        } else {
            b.textContent = content;
        }
        b.title = title;
        b.style.cssText = `
            min-width: 18px; height: 18px; padding: 0 ${wide ? 6 : 0}px;
            display: inline-flex; align-items: center; justify-content: center;
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
        b.addEventListener("mouseenter", () => {
            if (b.disabled) return;
            b.style.background = "#dbeafe";
        });
        b.addEventListener("mouseleave", () => {
            if (b.disabled) return;
            b.style.background = "rgba(255,255,255,0.95)";
        });
        return b;
    };

    zoomInBtn = makeBtn("+", "Zoom in", () =>
        zoomAt(ZOOM_STEP, viewport.clientWidth / 2, viewport.clientHeight / 2),
    );
    zoomOutBtn = makeBtn("−", "Zoom out", () =>
        zoomAt(
            1 / ZOOM_STEP,
            viewport.clientWidth / 2,
            viewport.clientHeight / 2,
        ),
    );

    const toggleFullscreen = async () => {
        // Guard against rapid double-clicks that would fire the toggle
        // twice before the browser finishes the transition.
        if (transitioning) return;
        transitioning = true;

        try {
            if (isFullscreen) {
                await document.exitFullscreen?.();
            } else {
                await viewport.requestFullscreen?.();
            }
        } catch (err) {
            console.warn("[flyover-image] fullscreen toggle failed:", err);
            // Force our state to reflect reality if the browser refused.
            isFullscreen = document.fullscreenElement === viewport;
            applyFullscreenLayout();
        } finally {
            // Give the browser a moment to settle before allowing
            // another toggle.
            setTimeout(() => {
                transitioning = false;
            }, 250);
        }
    };

    fullscreenBtn = makeBtn(
        EXPAND_ICON_SVG,
        "Fullscreen",
        toggleFullscreen,
        true,
    );

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(fullscreenBtn);
    viewport.appendChild(controls);

    root.appendChild(viewport);

    // ── Text under the image ─────────────────────────────────────────
    const meta = document.createElement("div");
    meta.style.cssText = "padding: 6px 2px 0; white-space: nowrap;";
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

    apply();

    return { root, destroy };
}

// ── Custom popup (replaces Leaflet's built-in popup) ─────────────────
// A plain DOM element appended to the map container (NOT to a Leaflet
// pane), so it is never affected by pane transforms. It is positioned
// above the marker with a tail, follows the marker while the map moves,
// auto-pans into view, and closes on the × button or a map click.
const TAIL_SIZE = 14; // side of the rotated square used as the tail
const TAIL_HEIGHT = 10; // how far the tail sticks out below the box
const AUTO_PAN_PADDING = 10;
const ZOOM_ANIM_TRANSITION =
    "transform 250ms cubic-bezier(0, 0, 0.25, 1)";

function createFlyoverPopupController() {
    let current = null;

    const close = () => {
        if (!current) return;
        const c = current;
        current = null;

        c.map.off("move resize", c.reposition);
        c.map.off("zoomanim", c.onZoomAnim);
        c.map.off("zoomend", c.onZoomEnd);

        c.destroyContent();
        c.el.remove();
    };

    const open = (map, marker, feature) => {
        close();

        const container = map.getContainer();
        const latlng = marker.getLatLng();

        // ── Shell ────────────────────────────────────────────────────
        const el = document.createElement("div");
        el.className = "flyover-custom-popup";
        el.style.cssText = `
            position: absolute; left: 0; top: 0; z-index: 2500;
            width: max-content; pointer-events: auto;
            font-family: Arial, sans-serif;
        `;

        // Tail (drawn first so the body paints on top of its upper half)
        const tail = document.createElement("div");
        tail.style.cssText = `
            position: absolute; left: 50%; bottom: -${TAIL_SIZE / 2}px;
            width: ${TAIL_SIZE}px; height: ${TAIL_SIZE}px;
            margin-left: -${TAIL_SIZE / 2}px;
            background: #ffffff; transform: rotate(45deg);
            box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        `;
        el.appendChild(tail);

        const body = document.createElement("div");
        body.style.cssText = `
            position: relative; background: #ffffff; border-radius: 12px;
            box-shadow: 0 3px 14px rgba(0,0,0,0.4);
            padding: 18px 3px 2px; box-sizing: content-box;
        `;
        el.appendChild(body);

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.textContent = "×";
        closeBtn.style.cssText = `
            position: absolute; top: 1px; right: 4px; z-index: 20;
            width: 20px; height: 20px; padding: 0; border: none;
            background: transparent; color: #757575;
            font: 18px/20px Tahoma, Verdana, sans-serif; cursor: pointer;
        `;
        closeBtn.addEventListener("mouseenter", () => {
            closeBtn.style.color = "#333";
        });
        closeBtn.addEventListener("mouseleave", () => {
            closeBtn.style.color = "#757575";
        });
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            close();
        });
        body.appendChild(closeBtn);

        // ── Positioning ──────────────────────────────────────────────
        const currentIconSize = () =>
            getIconSizeForZoom(map.getZoom(), !!marker._isSelected);

        const place = (pt) => {
            const size = currentIconSize();
            // clear the marker icon + its halo (scale 1.35) + a small gap
            const tipOffset = Math.round(size * 0.675) + 4;
            const x = Math.round(pt.x);
            const y = Math.round(pt.y - tipOffset - TAIL_HEIGHT);
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        };

        const reposition = () => {
            place(map.latLngToContainerPoint(latlng));
        };

        // Follow the map's animated zoom so the popup glides with the marker
        const onZoomAnim = (e) => {
            const half = map.getSize().divideBy(2);
            const pt = map
                .project(latlng, e.zoom)
                .subtract(map.project(e.center, e.zoom))
                .add(half);
            el.style.transition = ZOOM_ANIM_TRANSITION;
            place(pt);
        };

        const onZoomEnd = () => {
            el.style.transition = "none";
            reposition();
        };

        // Pan the map just enough so the whole popup is visible
        const ensureVisible = () => {
            if (current?.el !== el) return;
            if (document.fullscreenElement) return;

            const c = container.getBoundingClientRect();
            const r = el.getBoundingClientRect();

            let dx = 0;
            let dy = 0;
            if (r.left < c.left + AUTO_PAN_PADDING) {
                dx = r.left - (c.left + AUTO_PAN_PADDING);
            } else if (r.right > c.right - AUTO_PAN_PADDING) {
                dx = r.right - (c.right - AUTO_PAN_PADDING);
            }
            if (r.top < c.top + AUTO_PAN_PADDING) {
                dy = r.top - (c.top + AUTO_PAN_PADDING);
            } else if (r.bottom > c.bottom - AUTO_PAN_PADDING) {
                dy = r.bottom - (c.bottom - AUTO_PAN_PADDING);
            }

            if (dx || dy) map.panBy([dx, dy]);
        };

        // ── Content ──────────────────────────────────────────────────
        const { root, destroy } = buildPopupContent(feature, {
            onLayout: () => {
                // size changed (image loaded) → re-place and keep in view
                if (current?.el !== el) return;
                reposition();
                requestAnimationFrame(ensureVisible);
            },
        });
        body.appendChild(root);

        // Keep clicks / drags / wheel inside the popup from reaching the map
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);

        container.appendChild(el);

        current = {
            map,
            marker,
            el,
            reposition,
            onZoomAnim,
            onZoomEnd,
            destroyContent: destroy,
        };

        map.on("move resize", reposition);
        map.on("zoomanim", onZoomAnim);
        map.on("zoomend", onZoomEnd);

        reposition();
        requestAnimationFrame(ensureVisible);
    };

    return {
        open,
        close,
        isOpenFor: (marker) => current?.marker === marker,
    };
}

/**
 * useFlyoverImageLayer
 *
 * Fetches the /get_flyover_image FeatureCollection and manages the
 * camera-icon marker layer on the map.
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

    const popupRef = useRef(null);
    if (!popupRef.current) {
        popupRef.current = createFlyoverPopupController();
    }

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
    const addLayer = useCallback(
        (map) => {
            if (!map || images.length === 0) return;

            popupRef.current.close();
            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];

            const zoom = map.getZoom();

            images.forEach((feature) => {
                const p = feature?.properties || {};
                const lat = p.latitude;
                const lng = p.longitude;
                if (typeof lat !== "number" || typeof lng !== "number") return;

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

                marker.on("click", () => {
                    onSelectRef.current?.(feature);

                    const popup = popupRef.current;
                    if (popup.isOpenFor(marker)) {
                        popup.close(); // clicking the same marker toggles
                    } else {
                        popup.open(map, marker, feature);
                    }
                });

                markersRef.current.push(marker);
            });

            addAllToMap(map, markersRef.current);
        },
        [images],
    );

    const applyIconSizes = useCallback((map) => {
        if (!map) return;
        const zoom = map.getZoom();

        markersRef.current.forEach((marker) => {
            const size = getIconSizeForZoom(zoom, marker._isSelected);
            if (size === marker._iconSize) return;

            marker._iconSize = size;
            marker.setIcon(
                makeCameraIcon({ selected: marker._isSelected, zoom }),
            );
        });
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isMapReadyRef.current) return;

        if (!enabled) {
            popupRef.current.close();
            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
            return;
        }

        if (images.length === 0) return;

        addLayer(map);

        const handleZoomEnd = () => applyIconSizes(map);
        const handleMapClick = () => popupRef.current.close();

        map.on("zoomend", handleZoomEnd);
        map.on("click", handleMapClick);

        return () => {
            map.off("zoomend", handleZoomEnd);
            map.off("click", handleMapClick);
            popupRef.current.close();
            removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
        };
    }, [enabled, images, addLayer, applyIconSizes, mapRef, isMapReadyRef]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const zoom = map.getZoom();

        markersRef.current.forEach((marker) => {
            const isSelected = marker._flyoverImageId === selectedId;

            if (isSelected === marker._isSelected) return;

            marker._isSelected = isSelected;
            marker._iconSize = getIconSizeForZoom(zoom, isSelected);
            marker.setIcon(makeCameraIcon({ selected: isSelected, zoom }));

            if (isSelected && marker.bringToFront) {
                marker.bringToFront();
            }
        });
    }, [selectedId, mapRef]);

    useEffect(() => {
        const popup = popupRef.current;
        return () => {
            popup.close();
            const map = mapRef.current;
            if (map) removeAllFromMap(map, markersRef.current);
            markersRef.current = [];
        };
    }, [mapRef]);

    const removeLayer = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        popupRef.current.close();
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