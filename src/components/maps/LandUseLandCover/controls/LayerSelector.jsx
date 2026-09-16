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

export function LayerSelector({ selectedLayer, onLayerChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getLayerLabel = (layer) => {
    switch (layer) {
      case "velocity":
        return "Velocity";
      case "difference":
        return "Difference";
      case "none":
        return "None";
      default:
        return "Velocity";
    }
  };

  const getLayerColor = (layer) => {
    switch (layer) {
      case "velocity":
        return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
      case "difference":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
      case "none":
        return "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200";
      default:
        return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
    }
  };

  const options = ["velocity", "difference", "none"];

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef}>
      <span className="text-xs font-medium text-gray-700 max-[480px]:text-[10px]">
        Layer:
      </span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 border min-w-[90px] h-[28px] max-[480px]:min-w-[70px] max-[480px]:h-[24px] max-[480px]:text-[10px] max-[480px]:px-1.5 ${getLayerColor(
          selectedLayer,
        )}`}
      >
        <span>{getLayerLabel(selectedLayer)}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-[45px] mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-[1600] min-w-[120px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onLayerChange(opt);
                setIsOpen(false);
                sendUserActivity(
                  `Selected Layer: ${getLayerLabel(opt)}`,
                  "InfraRisk",
                );
              }}
              className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors text-xs ${selectedLayer === opt
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700"
                }`}
            >
              {getLayerLabel(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
