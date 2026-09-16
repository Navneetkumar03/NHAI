import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { VELOCITY_RANGES } from "../constants";

export function VelocityLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1500] bg-blue-200 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-4 py-2 max-w-[200px] max-[480px]:px-1.5 max-[480px]:py-1 max-[480px]:max-w-[108px] max-[480px]:bottom-2 max-[480px]:left-2">
      <div className="text-[10px] font-medium text-black-100 text-center mb-1 max-[480px]:text-[7px] max-[480px]:mb-0.5 max-[480px]:leading-tight">
        Velocity (mm/yr)
      </div>
      <div className="flex items-center gap-1 max-[480px]:gap-0.5">
        <span className="text-[9px] font-medium text-black-100 max-[480px]:text-[6.5px]">
          -50
        </span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex min-w-[100px] max-[480px]:h-1.5 max-[480px]:min-w-[52px]">
          {VELOCITY_RANGES.map((range, index) => {
            const totalRange = 100;
            const rangeSize = range.max - range.min + 1;
            const percentage = (rangeSize / totalRange) * 100;
            return (
              <div
                key={index}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: range.color,
                  borderRight:
                    index < VELOCITY_RANGES.length - 1
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "none",
                }}
              />
            );
          })}
        </div>
        <span className="text-[9px] font-medium text-black-100 max-[480px]:text-[6.5px]">
          50
        </span>
      </div>
    </div>
  );
}
