import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { useState, useEffect, useRef } from "react";
import { Info, X } from "lucide-react";
import { DEFAULT_SOIL_COLOR, SOIL_TYPE_DEFINITIONS } from "../constants";

export function SoilLegend({ taxoValues, colorMap, title = "Soil Type" }) {
  const [showDefinitions, setShowDefinitions] = useState(false);
  const wrapperRef = useRef(null);

  // Close the definitions panel when the user clicks outside the legend.
  useEffect(() => {
    if (!showDefinitions) return;

    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowDefinitions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDefinitions]);

  if (!taxoValues || taxoValues.length === 0) return null;

  return (
    <div ref={wrapperRef}>
      {/* ── Existing legend (unchanged) ─────────────────────── */}
      <div className="absolute bottom-18 left-3 z-[1500] bg-white/95 backdrop-blur-sm rounded-md shadow-md border border-gray-200 px-3 py-2 max-w-[220px] max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:max-w-[160px] max-[480px]:bottom-2 max-[480px]:right-2">
        {/* Header row: title + eye icon */}
        <div className="flex items-center justify-between gap-2 mb-1.5 max-[480px]:mb-1">
          <div className="text-[11px] font-semibold text-gray-700 max-[480px]:text-[9px]">
            {title}
          </div>
          <button
            type="button"
            onClick={() => setShowDefinitions((v) => !v)}
            title={showDefinitions ? "Hide definitions" : "Show definitions"}
            aria-label={showDefinitions ? "Hide definitions" : "Show definitions"}
            aria-pressed={showDefinitions}
            className={`p-0.5 rounded transition-colors flex-shrink-0 ${showDefinitions
              ? "bg-blue-50 text-blue-600"
              : "text-gray-400 hover:text-blue-600 hover:bg-gray-50"
              }`}
          >
            <Info size={16} strokeWidth={3} className="max-[480px]:w-4 max-[480px]:h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1 max-[480px]:gap-0.5">
          {taxoValues.map((taxo) => (
            <div
              key={taxo}
              className="flex items-center gap-2 max-[480px]:gap-1.5"
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-400 max-[480px]:w-2.5 max-[480px]:h-2.5"
                style={{
                  backgroundColor: colorMap?.[taxo] || DEFAULT_SOIL_COLOR,
                }}
              />
              <span className="text-[10px] text-gray-600 leading-tight max-[480px]:text-[8px]">
                {taxo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Definitions panel (new) ─────────────────────────── */}
      {showDefinitions && (
        <div className="absolute bottom-5 left-1 z-[1501] ml-[230px] bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200 px-3 py-2 w-[260px] max-h-[70vh] overflow-y-auto max-[480px]:bottom-2 max-[480px]:left-auto max-[480px]:right-2 max-[480px]:ml-0 max-[480px]:w-[200px] max-[480px]:px-2 max-[480px]:py-1.5">

          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-gray-700 max-[480px]:text-[9px]">
              Soil Type Definitions
            </span>
            <button
              type="button"
              onClick={() => setShowDefinitions(false)}
              className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5 rounded transition-colors"
              aria-label="Close definitions"
            >
              <X size={14} className="max-[480px]:w-3 max-[480px]:h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2 max-[480px]:gap-1.5">
            {taxoValues.map((taxo) => {
              const definition = SOIL_TYPE_DEFINITIONS?.[taxo];
              return (
                <div key={taxo} className="flex items-start gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-400 mt-[3px] max-[480px]:w-2.5 max-[480px]:h-2.5"
                    style={{
                      backgroundColor:
                        colorMap?.[taxo] || DEFAULT_SOIL_COLOR,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-800 leading-tight max-[480px]:text-[9px]">
                      {taxo}
                    </p>
                    <p className="text-[10px] text-gray-600 leading-snug mt-0.5 max-[480px]:text-[8px]">
                      {definition || "No description available."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}





