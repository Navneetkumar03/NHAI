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

export function FullscreenButton({ isFullscreen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title="Toggle fullscreen"
      className={`
        flex items-center justify-center
        w-[22px] h-[22px]
        max-[480px]:w-[18px] max-[480px]:h-[18px]
        bg-white
        rounded-[4px]
        border-2
        transition-all duration-200
        hover:bg-gray-50
        ${isFullscreen
          ? "border-blue-500 bg-blue-50 text-blue-600"
          : "border-gray-400 text-gray-700 hover:border-gray-500"
        }
        focus:outline-none
        focus:ring-0
        leaflet-bar
      `}
      style={{
        boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
      }}
      aria-label="Toggle fullscreen"
    >
      {isFullscreen ? (
        <Minimize className="w-3 h-3 max-[480px]:w-2.5 max-[480px]:h-2.5" />
      ) : (
        <Maximize className="w-3 h-3 max-[480px]:w-2.5 max-[480px]:h-2.5" />
      )}
    </button>
  );
}
