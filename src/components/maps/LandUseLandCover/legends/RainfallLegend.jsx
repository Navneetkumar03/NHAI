// src/components/maps/LandUseLandCover/legends/RainfallLegend.jsx
import "leaflet/dist/leaflet.css";

// Blue → pale → red palette the rainfall tile server uses.
const RAINFALL_GRADIENT =
    "linear-gradient(to right, #08306b, #2171b5, #6baed6, #c6dbef, #fee8c8, #fdbb84, #e34a33, #b30000, #67000d)";

export function RainfallLegend() {
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
                Rainfall
            </div>

            <div className="w-[220px] max-[480px]:w-[130px]">
                <div
                    className="h-[14px] w-full rounded-sm border border-gray-400 max-[480px]:h-[10px]"
                    style={{ background: RAINFALL_GRADIENT }}
                />
                <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-600 max-[480px]:text-[8px]">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
}