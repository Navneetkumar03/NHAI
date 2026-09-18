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
import { YEARS } from "../constants";

export function YearSelect({ label, value, onChange, disabledYears = [] }) {
  return (
    <div className="flex items-center gap-2 max-[480px]:gap-1.5">
      <label className="text-sm text-black-700 font-medium max-[480px]:text-xs">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-[480px]:text-xs max-[480px]:px-1.5 max-[480px]:py-0.5"
      >
        {YEARS.map((y) => {
          const isDisabled = disabledYears.includes(y);
          return (
            <option
              key={y}
              value={y}
              disabled={isDisabled}
              className={
                isDisabled ? "text-gray-400 bg-gray-100" : "text-gray-900"
              }
            >
              {y}
            </option>
          );
        })}
      </select>
    </div>
  );
}

