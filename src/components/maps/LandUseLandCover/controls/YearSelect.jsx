// import "leaflet/dist/leaflet.css";
// import "leaflet-side-by-side";
// import {
//   Loader2,
//   AlertTriangle,
//   Layers,
//   X,
//   Maximize,
//   Minimize,
//   CircleDot,
//   ChevronDown,
//   Calendar,
//   Table,
//   Map,
//   Eye,
//   EyeOff,
//   Navigation,   // 🆕 add this
// } from "lucide-react";
// import { YEARS } from "../constants";

// export function YearSelect({ label, value, onChange, disabledYears = [] }) {
//   return (
//     <div className="flex items-center gap-2 max-[480px]:gap-1.5">
//       <label className="text-xs font-medium text-gray-700 tracking-wide max-[480px]:text-xs">
//         {label}
//       </label>
//       <select
//         value={value}
//         onChange={(e) => onChange(Number(e.target.value))}
//         className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-[480px]:text-xs max-[480px]:px-1.5 max-[480px]:py-0.5"
//       >
//         {YEARS.map((y) => {
//           const isDisabled = disabledYears.includes(y);
//           return (
//             <option
//               key={y}
//               value={y}
//               disabled={isDisabled}
//               className={
//                 isDisabled ? "text-gray-400 bg-gray-100" : "text-gray-900"
//               }
//             >
//               {y}
//             </option>
//           );
//         })}
//       </select>
//     </div>
//   );
// }




import { useEffect, useRef, useState } from "react";
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
  Navigation,
} from "lucide-react";
import { YEARS } from "../constants";
import { sendUserActivity } from "../../../../services/api/auth";

export function YearSelect({ label, value, onChange, disabledYears = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 max-[480px]:gap-1.5">
      <label className="text-xs font-medium text-gray-700 tracking-wide max-[480px]:text-xs">
        {label}
      </label>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-1 px-2 py-1 border border-gray-300 rounded bg-white hover:border-blue-400 transition-colors text-xs min-w-[70px] max-[480px]:min-w-[55px] max-[480px]:text-[10px] max-[480px]:px-1.5 max-[480px]:py-0.5"
        >
          <span className="text-gray-800">{value}</span>
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto w-full"
            style={{
              zIndex: 9999,
              position: "absolute",
            }}
          >
            {YEARS.map((y) => {
              const isDisabled = disabledYears.includes(y);
              return (
                <button
                  key={y}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(Number(y));
                    setIsOpen(false);
                    sendUserActivity(`Selected Year: ${y}`, "InfraRisk");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${isDisabled
                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : value === y
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-blue-50"
                    }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}