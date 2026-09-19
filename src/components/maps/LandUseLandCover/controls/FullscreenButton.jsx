import "leaflet/dist/leaflet.css";
import { Maximize, Minimize } from "lucide-react";

// Sizing, dividers and hover come from the `className` passed by the parent
// (CTRL_BTN in MapOverlays.jsx, or the row wrapper in FlyoverMap.jsx), so the
// button always matches the other buttons in its column.
export function FullscreenButton({ isFullscreen, onToggle, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      aria-label="Toggle fullscreen"
      className={`${className} ${
        isFullscreen ? "bg-blue-50! text-blue-600!" : ""
      }`}
    >
      {isFullscreen ? (
        <Minimize
          size={16}
          strokeWidth={2}
          className="max-[480px]:w-3.5 max-[480px]:h-3.5"
        />
      ) : (
        <Maximize
          size={16}
          strokeWidth={2}
          className="max-[480px]:w-3.5 max-[480px]:h-3.5"
        />
      )}
    </button>
  );
}