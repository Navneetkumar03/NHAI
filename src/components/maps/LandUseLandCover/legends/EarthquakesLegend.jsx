// src/components/maps/LandUseLandCover/legends/EarthquakesLegend.jsx
import "leaflet/dist/leaflet.css";

// YlOrRd palette — same colors the earthquake tile server uses.
const EARTHQUAKE_GRADIENT =
    "linear-gradient(to right, rgb(255,247,188), rgb(254,227,145), rgb(254,196,79), rgb(254,153,41), rgb(236,112,20), rgb(204,76,2), rgb(127,0,0))";

export function EarthquakesLegend() {
    return (
        <div
            className="
                absolute bottom-18 left-3 z-[1500]
                bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200
                px-3 py-2
                max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:bottom-2 max-[480px]:right-2
            "
        >
            <div className="text-[11px] font-semibold text-gray-700 mb-1.5 max-[480px]:text-[9px] max-[480px]:mb-1">
                Earthquake Hazard
            </div>

            <div className="w-[220px] max-[480px]:w-[130px]">
                <div
                    className="h-[14px] w-full rounded-sm border border-gray-400 max-[480px]:h-[10px]"
                    style={{ background: EARTHQUAKE_GRADIENT }}
                />
                <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-600 max-[480px]:text-[8px]">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
}