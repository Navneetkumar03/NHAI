// src/components/maps/LandUseLandCover/RainfallLayer.jsx
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Loader2, X } from "lucide-react";
import { renderIDWToCanvas, getColor } from "../../../utils/idwRenderer";

const RAINFALL_PROPERTY = "monsoon_rainfall_mm";
const BASE = import.meta.env.BASE_URL;

// Available years — drop a matching geojson in public/rainfall/ and add
// the year here to make it selectable.
const AVAILABLE_YEARS = ["2024", "2025", "2026"];
const DEFAULT_YEAR = "2026";

// Legend / description cap — matches the CAP inside idwRenderer.js
const VALUE_CAP = 2500;

// ─── PERFORMANCE KNOBS ────────────────────────────────────────────────
const STATION_STEP = 5;   // keep every Nth station (4640 → ~928)
const DOWNSCALE = 1;      // 1 = full resolution, 2 = half, 4 = quarter

function fmt(v) {
    return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${Math.round(v)}`;
}

export default function RainfallLayer({ mapRef, onClose }) {
    const [year, setYear] = useState(DEFAULT_YEAR);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        if (!mapRef?.current) return;
        const map = mapRef.current;
        let cancelled = false;

        const draw = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Load geojson for the selected year
                const url = `${BASE}rainfall/rainfall_${year}.geojson`;
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error(`Failed to load rainfall ${year} (${res.status})`);
                const geojson = await res.json();

                // 2. Flatten features → flat station rows
                const stations = geojson.features
                    .map((f) => {
                        const p = f.properties || {};
                        return {
                            latitude: p.latitude,
                            longitude: p.longitude,
                            [RAINFALL_PROPERTY]: p[RAINFALL_PROPERTY],
                        };
                    })
                    .filter(
                        (s) =>
                            typeof s.latitude === "number" &&
                            typeof s.longitude === "number" &&
                            typeof s[RAINFALL_PROPERTY] === "number"
                    );

                if (stations.length === 0)
                    throw new Error(`No valid rainfall stations for ${year}`);

                // 3. Decimate
                const decimated = stations.filter((_, i) => i % STATION_STEP === 0);


                // 4. Bounds covering ALL stations (whole-India extent, not the map view)
                let minLat = Infinity,
                    maxLat = -Infinity,
                    minLng = Infinity,
                    maxLng = -Infinity;
                for (const s of stations) {
                    if (s.latitude < minLat) minLat = s.latitude;
                    if (s.latitude > maxLat) maxLat = s.latitude;
                    if (s.longitude < minLng) minLng = s.longitude;
                    if (s.longitude > maxLng) maxLng = s.longitude;
                }
                const bounds = { minLat, maxLat, minLng, maxLng };

                // 5. Canvas size = current viewport / DOWNSCALE
                const size = map.getSize();
                const canvasW = Math.max(100, Math.floor(size.x / DOWNSCALE));
                const canvasH = Math.max(100, Math.floor(size.y / DOWNSCALE));



                const canvas = await renderIDWToCanvas(
                    decimated,
                    RAINFALL_PROPERTY,
                    bounds,
                    canvasW,
                    canvasH
                );

                if (cancelled) return;

                // 6. Replace any existing overlay with the new one
                if (overlayRef.current) {
                    map.removeLayer(overlayRef.current);
                    overlayRef.current = null;
                }

                const overlay = L.imageOverlay(
                    canvas.toDataURL(),
                    [
                        [bounds.minLat, bounds.minLng],
                        [bounds.maxLat, bounds.maxLng],
                    ],
                    {
                        opacity: 0.75,
                        interactive: false,
                        zIndex: 300,
                    }
                );

                overlay.addTo(map);
                overlayRef.current = overlay;
                setLoading(false);
            } catch (err) {
                console.error("[RainfallLayer] ERROR:", err);
                if (!cancelled) {
                    setError(err.message || "Failed to render rainfall layer");
                    setLoading(false);
                }
            }
        };

        draw();

        return () => {
            cancelled = true;
            if (overlayRef.current && mapRef?.current) {
                mapRef.current.removeLayer(overlayRef.current);
                overlayRef.current = null;
            }
        };
    }, [mapRef, year]);

    return (
        <>
            {loading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200 flex items-center gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Loading rainfall layer…
                </div>
            )}

            {error && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                    {error}
                </div>
            )}

            {/* Legend + year selector */}
            <div className="absolute bottom-3 left-3 z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[240px]">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="text-[11px] font-semibold text-gray-700">
                        Monsoon Rainfall (mm)
                    </div>

                    <div className="flex items-center gap-1.5">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            disabled={loading}
                            className="text-[10px] font-medium border border-gray-300 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                        >
                            {AVAILABLE_YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-500 -mr-1"
                            title="Close"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-600 font-medium">
                        {fmt(0)}
                    </span>
                    <div
                        className="flex-1 h-3 rounded-full overflow-hidden min-w-[110px]"
                        style={{
                            background: `linear-gradient(to right, ${[0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
                                .map((t) => {
                                    const [r, g, b] = getColor(t);
                                    return `rgb(${r},${g},${b})`;
                                })
                                .join(", ")})`,
                        }}
                    />
                    <span className="text-[10px] text-gray-600 font-medium">
                        {fmt(VALUE_CAP)}
                    </span>
                </div>

                <div className="text-[9px] text-gray-400 mt-1">
                    Year {year} · values capped at {fmt(VALUE_CAP)}
                </div>
            </div>
        </>
    );
}