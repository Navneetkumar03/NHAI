import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { DIFF_COLORS } from "../constants";

export function VelocityDiffLegend({ range }) {
  const minDiff = range?.min_diff !== undefined ? Number(range.min_diff) : null;
  const maxDiff = range?.max_dif !== undefined ? Number(range.max_dif) : null;
  const midDiff =
    minDiff !== null && maxDiff !== null ? (minDiff + maxDiff) / 2 : null;

  // const fmt = (v) => (v === null || Number.isNaN(v) ? "—" : `${Math.round(v)}`);
  const fmt = (v) => (v === null || Number.isNaN(v) ? "—" : `${Math.round(v)}`);

  return (
    <div className="absolute bottom-3 left-3 z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[220px] max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:max-w-[150px] max-[480px]:bottom-2 max-[480px]:left-2">
      <div className="text-[11px] font-semibold text-gray-700 mb-1.5 max-[480px]:text-[9px] max-[480px]:mb-1">
        Velocity Difference (mm/yr)
      </div>

      <div className="flex items-center gap-1.5 max-[480px]:gap-1">
        <span className="text-[10px] text-gray-600 font-medium max-[480px]:text-[8px]">
          {fmt(minDiff)}
        </span>
        <div
          className="flex-1 h-3 rounded-full overflow-hidden min-w-[110px] max-[480px]:h-2 max-[480px]:min-w-[70px]"
          style={{
            background: `linear-gradient(to right, ${DIFF_COLORS.negative} 0%, ${DIFF_COLORS.neutral} 50%, ${DIFF_COLORS.positive} 100%)`,
          }}
        />
        <span className="text-[10px] text-gray-600 font-medium max-[480px]:text-[8px]">
          {fmt(maxDiff)}
        </span>
      </div>
    </div>
  );
}
