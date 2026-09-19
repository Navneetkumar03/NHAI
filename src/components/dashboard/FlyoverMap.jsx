import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    Marker,
    useMap,
    useMapEvents,
} from "react-leaflet";

import {
    makeFlyoverIcon,
    getPointDetailFields,
    formatPointName,
} from "../maps/shared/mapHelpers";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, X } from "lucide-react";
import { createRoot } from "react-dom/client";
import { FullscreenButton } from "../maps/LandUseLandCover/controls/FullscreenButton";

// ---- base map sources -------------------------------------------------
const BASE_MAPS = {
    streets: {
        url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        maxZoom: 25,
        attribution: "",
    },
    satellite: {
        url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        maxZoom: 25,
        attribution: "",
    },
    esriSatellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        subdomains: [], // IMPORTANT
        maxNativeZoom: 19,
        maxZoom: 25,
        attribution: "",
    },
};

function ResizeHandler() {
    const map = useMap();
    useEffect(() => {
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);
    return null;
}

// Deliberately re-focuses the map on the layer's full extent the moment
// this card enters fullscreen — the zoom/center chosen for the small card
// view rarely makes sense once the container is the whole screen. Restores
// the pre-fullscreen view on exit so the card looks the same as before.
function FullscreenFit({ geojson, isFullscreen }) {
    const map = useMap();
    const prevViewRef = useRef(null);

    useEffect(() => {
        if (isFullscreen) {
            prevViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
            // small delay lets the native fullscreen transition/resize settle
            // before we measure the container and compute new bounds
            const t = setTimeout(() => {
                map.invalidateSize();
                try {
                    const bounds = getGeoJsonBounds(geojson);
                    if (bounds) {
                        map.fitBounds(bounds, { padding: [60, 60] });
                    }
                } catch (e) {
                    console.warn("Error fitting bounds on fullscreen:", e);
                }
            }, 150);
            return () => clearTimeout(t);
        } else if (prevViewRef.current) {
            const { center, zoom } = prevViewRef.current;
            const t = setTimeout(() => {
                map.invalidateSize();
                map.setView(center, zoom);
            }, 150);
            return () => clearTimeout(t);
        }
    }, [isFullscreen, map, geojson]);

    return null;
}

function getGeoJsonBounds(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0)
        return null;
    const lats = [];
    const lngs = [];
    const walk = (coords) => {
        if (typeof coords[0] === "number") {
            const [lng, lat] = coords;
            lats.push(lat);
            lngs.push(lng);
            return;
        }
        coords.forEach(walk);
    };
    geojson.features.forEach((f) => walk(f.geometry.coordinates));
    if (lats.length === 0) return null;
    return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
    ];
}

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            // Generic click on bare map (no specific marker/point) — no point
            // object to pass, downstream code treats this as a segment-level click.
            if (onMapClick) onMapClick(lat, lng);
        },
    });
    return null;
}

// ---------------------------------------------------------------------
// Fullscreen toggle.
//
// Instead of registering as its own separate Leaflet control (which used
// to float below the zoom control with its own gap), this button is
// appended as an extra row INSIDE the zoom control's own container —
// same trick BaseMapPicker uses for the layers button. That guarantees
// it lands in the same stacked box as +/-, with zero gap and identical
// width, and — because this component is rendered in JSX *before*
// BaseMapPicker — its effect attaches first, so the row order ends up
// zoom-in, zoom-out, fullscreen, layers.
// ---------------------------------------------------------------------
function FullscreenControl({ containerRef, isFullscreen }) {
    const map = useMap();
    const [zoomContainer, setZoomContainer] = useState(null);

    useEffect(() => {
        let attempts = 0;
        let cancelled = false;

        const findZoomContainer = () => {
            if (cancelled) return;

            const container = map
                .getContainer()
                .querySelector(".leaflet-control-zoom");

            if (container) {
                setZoomContainer(container);
                return;
            }

            if (attempts++ < 20) {
                requestAnimationFrame(findZoomContainer);
            }
        };

        findZoomContainer();

        return () => {
            cancelled = true;
        };
    }, [map]);

    // Always keep fullscreen immediately before the layer button.
    useEffect(() => {
        if (!zoomContainer) return;

        const moveFullscreenBeforeLayers = () => {
            const fullscreenRow = zoomContainer.querySelector(
                ".fullscreen-control-row"
            );

            const layerButton = zoomContainer.querySelector(
                ".leaflet-layer-picker-control"
            );

            if (fullscreenRow && layerButton) {
                zoomContainer.insertBefore(fullscreenRow, layerButton);
            }
        };

        moveFullscreenBeforeLayers();

        const observer = new MutationObserver(() => {
            moveFullscreenBeforeLayers();
        });

        observer.observe(zoomContainer, {
            childList: true,
        });

        return () => {
            observer.disconnect();
        };
    }, [zoomContainer, isFullscreen]);

    const handleToggle = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }, [containerRef]);

    if (!zoomContainer) return null;

    return createPortal(
        <div
            className="fullscreen-control-row"
            style={{
                width: "22px",
                height: "22px",
                minWidth: "22px",
                minHeight: "22px",
                padding: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                background: "#ffffff",
                borderTop: "1px solid #ccc",
            }}
        >
            <FullscreenButton
                isFullscreen={isFullscreen}
                onToggle={handleToggle}
            />
        </div>,
        zoomContainer
    );
}

// ---------------------------------------------------------------------
// Base-map (Layers) picker.
//
// The OPEN PANEL is rendered through a React portal directly into
// document.body — not as a descendant of the card, the grid, or the
// Leaflet map at all. This is the only way to guarantee it always
// renders above everything else: as long as the panel lives anywhere
// inside the card's DOM tree, it's subject to whatever stacking
// context that tree ends up inside (which can change independent of
// this file — e.g. a sibling badge's z-index, a parent's transform,
// etc.). A portal to <body> sidesteps that entirely.
//
// The toggle button itself stays inline (it just needs to sit roughly
// where the Layers icon should appear on the card); only the panel is
// portaled, positioned via the button's on-screen coordinates.
// ---------------------------------------------------------------------
function BaseMapPicker({ baseMap, onChange }) {
    const map = useMap();
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPanelPos({ top: rect.bottom + 6, left: rect.left });
    }, []);

    useEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open, updatePosition]);

    // Instead of registering a SEPARATE Leaflet control (which always gets its
    // own margin-top gap from the zoom control, plus its own width if it
    // doesn't exactly match 26x26), we append our button as an extra row
    // INSIDE the zoom control's own container. That makes it the same box as
    // +/-, so it lines up with zero gap and identical width on any screen.
    useEffect(() => {
        let root;
        let btnEl;
        let cancelled = false;
        let attempts = 0;

        const tryAttach = () => {
            if (cancelled) return;
            const zoomContainer = map
                .getContainer()
                .querySelector(".leaflet-control-zoom");

            if (!zoomContainer) {
                if (attempts++ < 20) requestAnimationFrame(tryAttach);
                return;
            }

            // Leaflet styles its zoom buttons via ".leaflet-bar a" — since this is a
            // <div>, not an <a>, none of those rules apply automatically. Set the
            // same look explicitly instead of relying on the class name.
            btnEl = L.DomUtil.create(
                "div",
                "leaflet-control-zoom-in leaflet-layer-picker-control",
            );
            btnEl.style.cursor = "pointer";
            btnEl.style.display = "flex";
            btnEl.style.alignItems = "center";
            btnEl.style.justifyContent = "center";
            btnEl.style.boxSizing = "border-box";
            btnEl.style.width = "22px";
            btnEl.style.height = "22px";
            btnEl.style.background = "#ffffff";
            btnEl.style.borderTop = "1px solid #ccc"; // separates it from the button above
            btnEl.title = "Layer control";

            L.DomEvent.disableClickPropagation(btnEl);
            L.DomEvent.on(btnEl, "click", (e) => {
                L.DomEvent.stop(e);
                setOpen((o) => !o);
            });
            L.DomEvent.on(btnEl, "mouseover", () => {
                btnEl.style.background = "#f4f4f4";
            });
            L.DomEvent.on(btnEl, "mouseout", () => {
                btnEl.style.background = "#ffffff";
            });

            zoomContainer.appendChild(btnEl);
            buttonRef.current = btnEl;

            root = createRoot(btnEl);
            root.render(<Layers size={11} className="text-blue-600" />);
        };

        tryAttach();

        return () => {
            cancelled = true;
            if (btnEl && btnEl.parentNode) btnEl.parentNode.removeChild(btnEl);
        };
    }, [map]);

    return (
        open &&
        createPortal(
            <>
                <div
                    className="fixed inset-0 z-[99998]"
                    onClick={() => setOpen(false)}
                />
                <div
                    className="fixed z-[99999] w-35 max-w-[70vw] rounded-lg bg-white shadow-xl ring-1 ring-black/10 p-1 text-sm"
                    style={{ top: panelPos.top, left: panelPos.left }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-0">
                            Base map
                        </p>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-0">
                        {[
                            { key: "streets", label: "Street" },
                            { key: "satellite", label: "Google Satellite" },
                            { key: "esriSatellite", label: "Satellite" },
                        ].map((opt) => (
                            <label
                                key={opt.key}
                                className="flex items-center gap-2 cursor-pointer text-[11px]"
                            >
                                <input
                                    type="radio"
                                    name="basemap"
                                    checked={baseMap === opt.key}
                                    onChange={() => onChange(opt.key)}
                                    className="accent-blue-600"
                                />
                                <span className="text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </>,
            document.body,
        )
    );
}



function FlyoverGeoJsonLayer({ data, onFeatureClick, riskFocusRequest }) {
    const map = useMap();
    const segmentLayersRef = useRef([]);
    const highlightedLayersRef = useRef(new Set());

    const getRiskColor = (risk) => {
        switch (Number(risk)) {
            case 1:
                return "#3B82F6";
            case 2:
                return "#63A0F0";
            case 3:
                return "#F97316";
            case 4:
                return "#EA580C";
            case 5:
                return "#EF4444";
            default:
                return "#64748b";
        }
    };

    const getSegmentStyle = (feature) => {
        const risk = feature?.properties?.risk;

        return {
            color: getRiskColor(risk),
            weight: 7,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
        };
    };

    useEffect(() => {
        if (!riskFocusRequest) return;

        const highlightedLayers = segmentLayersRef.current.filter(
            ({ feature }) => Number(feature?.properties?.risk) === 3,
        );

        if (highlightedLayers.length === 0) return;

        highlightedLayersRef.current.forEach(({ layer, feature }) => {
            layer.setStyle(getSegmentStyle(feature));
        });

        highlightedLayersRef.current = new Set(highlightedLayers);
        highlightedLayers.forEach(({ layer }) => {
            // layer.setStyle({ color: "#a855f7", weight: 10, opacity: 1 });
            layer.bringToFront?.();
        });

        const bounds = L.featureGroup(
            highlightedLayers.map(({ layer }) => layer),
        ).getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18 });
        }
    }, [map, riskFocusRequest]);

    if (!data || !data.features || data.features.length === 0) {
        return null;
    }

    const onEachFeature = (feature, layer) => {
        // Only apply segment behavior to LineString features
        if (feature?.geometry?.type !== "LineString") {
            return;
        }

        segmentLayersRef.current.push({ feature, layer });

        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e);

                const { lat, lng } = e.latlng;

                if (onFeatureClick) {
                    onFeatureClick(lat, lng);
                }
            },

            // SAME AS useSegmentLayer
            mouseover: (e) => {
                const layer = e.target;

                layer.setStyle({
                    weight: 9,
                    opacity: 1,
                    color: "#ffff00",
                });

                // Keep hovered segment above other segments
                if (layer.bringToFront) {
                    layer.bringToFront();
                }
            },

            // Restore original risk color
            mouseout: (e) => {
                const layer = e.target;
                const risk = feature?.properties?.risk;


                if (
                    highlightedLayersRef.current.has(
                        segmentLayersRef.current.find((entry) => entry.layer === layer),
                    )
                ) {
                    layer.setStyle({
                        color: getRiskColor(risk),
                        weight: 7,
                        opacity: 0.9,
                    });
                    return;
                }

                layer.setStyle({
                    color: getRiskColor(risk),
                    weight: 7,
                    opacity: 0.9,
                });
            },
        });
    };

    return (
        <GeoJSON
            key={JSON.stringify(data.features.map((f) => f.properties?.OBJECTID))}
            data={data}
            filter={(feature) => {
                return feature?.geometry?.type === "LineString";
            }}
            style={getSegmentStyle}
            onEachFeature={onEachFeature}
        />
    );
}

function MarkerZoomVisibility({ onDetailZoomChange }) {
    const map = useMap();

    useEffect(() => {
        const updateZoom = () => {
            onDetailZoomChange(map.getZoom() >= 16);
        };

        updateZoom();

        map.on("zoomend", updateZoom);

        return () => {
            map.off("zoomend", updateZoom);
        };
    }, [map, onDetailZoomChange]);

    return null;
}

export default function FlyoverMap({
    center,
    points,
    geojson,
    onMapClick,
    isActive,
    color,
    riskFocusRequest,
}) {
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDetailZoom, setIsDetailZoom] = useState(false);
    const [baseMap, setBaseMap] = useState("satellite");

    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };
        document.addEventListener("fullscreenchange", handleChange);
        return () => document.removeEventListener("fullscreenchange", handleChange);
    }, []);

    const validCenter =
        center && center.length === 2 ? center : [28.6139, 77.229];

    // `point` is undefined for a bare map/polygon click (no specific marker
    // involved) and is the actual flyover point object when a marker is
    // clicked. Forwarded up to FlyoverCard -> DashboardPage as-is so the
    // dashboard can open the exact detail card instead of guessing.
    //
    // useCallback keeps this stable across re-renders — react-leaflet
    // unbinds/rebinds a Marker's click listener whenever its eventHandlers
    // prop changes identity, and an unstable handleClick here was causing
    // that churn on every render (the "need to click twice" bug).
    const handleClick = useCallback(
        (lat, lng, point) => {
            if (onMapClick) onMapClick(lat, lng, point);
        },
        [onMapClick],
    );

    const layerMarkers = (points || []).filter(
        (point) => Array.isArray(point.latlng) && point.latlng.length === 2,
    );

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black flyover-map-shell"
        >
            <style>{`
        :fullscreen .leaflet-container { border-radius: 0 !important; }

        /* Scoped to .flyover-map-shell so these always win over unrelated
           global CSS (e.g. a ".leaflet-top.leaflet-left { top: 65px }"
           rule meant for a different page with a header above its map,
           which was shoving this card's controls down into the middle
           of the map instead of the top-left corner). Selector specificity
           here (3 classes) beats any 1- or 2-class global rule regardless
           of which stylesheet loads last. */
        .flyover-map-shell .leaflet-top.leaflet-left {
          top: 8px !important;
          left: 8px !important;
        }

        .flyover-map-shell .leaflet-control-zoom {
          margin: 0 !important;
        }

        /* Match the zoom +/- boxes to the smaller scale of the custom
           fullscreen/layers rows appended below them, so the whole
           control stack is one uniform, smaller size end to end —
           covers both touch and non-touch device class variants. */
        .flyover-map-shell .leaflet-control-zoom-in,
        .flyover-map-shell .leaflet-control-zoom-out,
        .flyover-map-shell .leaflet-touch .leaflet-control-zoom-in,
        .flyover-map-shell .leaflet-touch .leaflet-control-zoom-out {
          width: 22px !important;
          height: 22px !important;
          line-height: 22px !important;
          font-size: 14px !important;
        }
      `}</style>

            <MapContainer
                center={validCenter}
                zoom={15}
                minZoom={9}
                maxZoom={20}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
                zoomControl={true}
                touchZoom={true}
                attributionControl={false}
                style={{
                    height: "100%",
                    width: "100%",
                    minHeight: "200px",
                    cursor: "pointer",
                }}
                className="rounded-lg"
            >
                <ResizeHandler />
                <FullscreenFit geojson={geojson} isFullscreen={isFullscreen} />
                <MapClickHandler onMapClick={handleClick} />

                {/* Rendered before BaseMapPicker so its effect attaches its row
                    into the zoom control first — keeps the stack ordered as
                    zoom-in, zoom-out, fullscreen, layers. */}
                <FullscreenControl
                    containerRef={containerRef}
                    isFullscreen={isFullscreen}
                />

                <TileLayer
                    key={baseMap}
                    url={BASE_MAPS[baseMap].url}
                    subdomains={BASE_MAPS[baseMap].subdomains}
                    maxNativeZoom={BASE_MAPS[baseMap].maxNativeZoom}
                    maxZoom={BASE_MAPS[baseMap].maxZoom}
                    attribution={BASE_MAPS[baseMap].attribution}
                />
                <MarkerZoomVisibility onDetailZoomChange={setIsDetailZoom} />
                <FlyoverGeoJsonLayer
                    data={geojson}
                    // color={color}
                    // isActive={isActive}
                    onFeatureClick={handleClick}
                    riskFocusRequest={riskFocusRequest}
                />
                {layerMarkers.map((point, index) => {
                    const displayName = formatPointName(point.name);

                    return (
                        <Marker
                            key={`layer-marker-${point.id ?? index}`}
                            position={point.latlng}
                            icon={makeFlyoverIcon({
                                color: color,
                                labelText: displayName,
                                detailed: isDetailZoom,
                                name: displayName,
                                detailFields: getPointDetailFields(point),
                            })}
                            eventHandlers={{
                                click: (e) => {
                                    e.originalEvent.stopPropagation();
                                    // Pass the point itself up, not just its coordinates —
                                    // this is what lets the dashboard open the exact flyover
                                    // detail card instead of guessing which point was clicked.
                                    handleClick(point.latlng[0], point.latlng[1], point);
                                },
                            }}
                        />
                    );
                })}
                <BaseMapPicker baseMap={baseMap} onChange={setBaseMap} />
            </MapContainer>
        </div>
    );
}