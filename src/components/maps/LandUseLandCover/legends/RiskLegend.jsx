import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { RISK_LEVELS } from "../constants";

export function RiskLegend() {
  return (
    <div className="absolute bottom-3 right-3 z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[220px] max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:max-w-[160px] max-[480px]:bottom-2 max-[480px]:right-2">
      <div className="text-[11px] font-semibold text-gray-700 mb-1.5 max-[480px]:text-[9px] max-[480px]:mb-1">
        Risk
      </div>
      <div className="flex items-center gap-1.5 max-[480px]:gap-1">
        <span className="text-[10px] text-gray-500 max-[480px]:text-[8px]">
          Low
        </span>
        {RISK_LEVELS.map((item) => (
          <span
            key={item.level}
            className="inline-flex items-center gap-0.5 max-[480px]:gap-[2px]"
          >
            <span
              className="inline-block w-3 h-3 rounded-sm border border-gray-200 max-[480px]:w-2.5 max-[480px]:h-2.5"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-gray-600 max-[480px]:text-[8px]">
              {item.level}
            </span>
          </span>
        ))}
        <span className="text-[10px] text-gray-500 max-[480px]:text-[8px]">
          High
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
 * SEGMENT TABLE
 * ==========================================================================*/
