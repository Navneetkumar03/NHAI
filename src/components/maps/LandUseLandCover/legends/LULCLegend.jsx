import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { LULC_CLASSES } from "../constants";

export function LULCLegend() {
  return (
    <div className="absolute bottom-[70px] left-3 max-[480px]:bottom-[50px] z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[180px] max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:max-w-[130px] max-[480px]:bottom-2 max-[480px]:right-2">
      <div className="text-[11px] font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5 max-[480px]:text-[10px] max-[480px]:mb-1">
        Land Cover
      </div>
      <div className="flex flex-col gap-1">
        {LULC_CLASSES.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-200 max-[480px]:w-2.5 max-[480px]:h-2.5"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-gray-600 leading-tight max-[480px]:text-[9px]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
