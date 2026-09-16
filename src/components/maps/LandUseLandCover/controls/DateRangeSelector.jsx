import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import {
  Loader2,
  AlertTriangle,
  Layers,
  X,
  Maximize,
  Minimize,
  CircleDot,
  ChevronDown,
  Calendar,
  Table,
  Map,
  Eye,
  EyeOff,
  Navigation,   // 🆕 add this
} from "lucide-react";
import { sendUserActivity } from "../../../../services/api/auth";

export function DateRangeSelector({
  availableDates = [],
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startRef.current && !startRef.current.contains(event.target)) {
        setIsStartOpen(false);
      }
      if (endRef.current && !endRef.current.contains(event.target)) {
        setIsEndOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Select Date";
    const parts = dateStr.split("-");
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  };

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 rounded-md border border-blue-200 shadow-sm relative h-[34px] max-[480px]:gap-1 max-[480px]:px-1.5 max-[480px]:h-[28px]">
      <div className="relative" ref={startRef}>
        <button
          onClick={() => setIsStartOpen(!isStartOpen)}
          className="flex items-center justify-between gap-1 px-2 py-1 border border-gray-300 rounded bg-white hover:border-blue-400 transition-colors text-xs min-w-[70px] max-[480px]:min-w-[55px] max-[480px]:text-[10px] max-[480px]:px-1.5 max-[480px]:py-0.5"
        >
          <span className={startDate ? "text-gray-800" : "text-gray-400"}>
            {startDate ? formatDisplayDate(startDate) : "Start"}
          </span>
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform ${isStartOpen ? "rotate-180" : ""
              }`}
          />
        </button>
        {isStartOpen && availableDates.length > 0 && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-[110px]"
            style={{
              zIndex: 9999,
              position: "absolute",
            }}
          >
            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => {
                  onStartDateChange(date);
                  setIsStartOpen(false);
                  sendUserActivity(`Selected Start Date: ${date}`, "InfraRisk");
                  if (!endDate || endDate < date) {
                    onEndDateChange(date);
                  }
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${startDate === date
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700"
                  }`}
              >
                {formatDisplayDate(date)}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="text-gray-400 text-xs max-[480px]:text-[10px]">→</span>
      <div className="relative" ref={endRef}>
        <button
          onClick={() => setIsEndOpen(!isEndOpen)}
          className="flex items-center justify-between gap-1 px-2 py-1 border border-gray-300 rounded bg-white hover:border-blue-400 transition-colors text-xs min-w-[70px] max-[480px]:min-w-[55px] max-[480px]:text-[10px] max-[480px]:px-1.5 max-[480px]:py-0.5"
        >
          <span className={endDate ? "text-gray-800" : "text-gray-400"}>
            {endDate ? formatDisplayDate(endDate) : "End"}
          </span>
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform ${isEndOpen ? "rotate-180" : ""
              }`}
          />
        </button>
        {isEndOpen && availableDates.length > 0 && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-[110px]"
            style={{
              zIndex: 9999,
              position: "absolute",
            }}
          >
            {availableDates
              .filter((date) => !startDate || date >= startDate)
              .map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    onEndDateChange(date);
                    setIsEndOpen(false);
                    sendUserActivity(`Selected End Date: ${date}`, "InfraRisk");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${endDate === date
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700"
                    }`}
                >
                  {formatDisplayDate(date)}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
