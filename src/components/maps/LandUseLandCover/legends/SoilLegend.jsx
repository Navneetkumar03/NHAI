import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { getSoilColor } from "../mapUtils";

export function SoilLegend({ taxoValues }) {
  if (!taxoValues || taxoValues.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[220px] max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:max-w-[160px] max-[480px]:bottom-2 max-[480px]:right-2">
      <div className="text-[11px] font-semibold text-gray-700 mb-1.5 max-[480px]:text-[9px] max-[480px]:mb-1">
        Soil Type
      </div>
      <div className="flex flex-col gap-1 max-[480px]:gap-0.5">
        {taxoValues.map((taxo) => (
          <div
            key={taxo}
            className="flex items-center gap-2 max-[480px]:gap-1.5"
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-400 max-[480px]:w-2.5 max-[480px]:h-2.5"
              style={{ backgroundColor: getSoilColor({ S_TAXO: taxo }) }}
            />
            <span className="text-[10px] text-gray-600 leading-tight max-[480px]:text-[8px]">
              {taxo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
