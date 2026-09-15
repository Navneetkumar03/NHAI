import { Waypoints } from "lucide-react";
import StatChip from "./StatChip";
import { getHighwayDetailFields, formatPointName } from "./mapHelpers";

export default function FlyoverDetailsPanel({
  selectedHighway,
  selectedPoint,
  flyoverMarkers,
  visibleFlyoverIds,
  onSelectHighway,
  onSelectPoint,
}) {
  const visibleHighways = flyoverMarkers.filter((f) =>
    visibleFlyoverIds.has(f.id),
  );

  if (selectedPoint) {
    const displayName = formatPointName(selectedPoint.name);
    return (
      <div>
        <div className="flex items-start justify-between px-2 py-1 ">
          <div className="flex items-start gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
              style={{ background: selectedHighway?.color || "#8f1b8b" }}
            />
            <h3 className="text-xs font-bold text-gray-900 leading-tight break-words min-w-0">
              {displayName}
            </h3>
          </div>
        </div>
        <div className="px-0.5 py-1">
          <div className="grid grid-cols-2 gap-1.5">
            {selectedPoint.chainage && (
              <StatChip label="Chainage" value={selectedPoint.chainage} />
            )}
            {selectedPoint.length && (
              <StatChip label="Length" value={selectedPoint.length} />
            )}
            {selectedPoint.description && (
              <StatChip label="Type" value={selectedPoint.description} />
            )}
            {selectedPoint.detail && (
              <StatChip label="Structure" value={selectedPoint.detail} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedHighway) {
    const fields = getHighwayDetailFields(selectedHighway);
    return (
      <div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: selectedHighway.color }}
            />
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {selectedHighway.displayName}
            </h3>
          </div>
        </div>

        <div className="px-4 py-3">
          {fields.length > 0 && (
            <div className="flex flex-row gap-1.5 mb-4">
              {fields.map((f) => (
                <div key={f.label} className="flex-1 min-w-0">
                  <StatChip label={f.label} value={f.value} />
                </div>
              ))}
            </div>
          )}

          {selectedHighway.namedPoints?.length > 0 && (
            <>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Flyovers on this segment
              </p>
              <div className="space-y-2">
                {selectedHighway.namedPoints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPoint(p, selectedHighway)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:border-gray-200 hover:bg-gray-50 text-left transition-colors"
                  >
                    <span className="text-[12px] font-semibold text-gray-800 truncate">
                      {formatPointName(p.name)}
                    </span>
                    {p.chainage && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {p.chainage}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Waypoints className="w-4 h-4 text-blue-400" />
        <p className="text-sm font-bold text-gray-700">Flyovers</p>
      </div>

      {visibleHighways.length === 0 ? (
        <p className="text-[12px] text-gray-400 mt-2">
          No flyovers are currently visible  turn one on from the dropdown
          above the map.
        </p>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 mb-3">
            {visibleHighways.length} segment
            {visibleHighways.length > 1 ? "s" : ""} on the map. Select one for
            full details.
          </p>
          <div className="space-y-2">
            {visibleHighways.map((f) => (
              <button
                key={f.id}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:border-gray-200 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12px] font-semibold text-gray-800 truncate">
                    {f.displayName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
