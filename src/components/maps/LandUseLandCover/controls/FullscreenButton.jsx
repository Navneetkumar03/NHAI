import "leaflet/dist/leaflet.css";
import {
  Maximize,
  Minimize,
} from "lucide-react";

export function FullscreenButton({ isFullscreen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Toggle fullscreen"
      aria-label="Toggle fullscreen"
      className={`
        flex
        items-center
        justify-center
        w-[22px]
        h-[22px]
        min-w-[22px]
        min-h-[22px]
        p-0
        m-0
        bg-white
        rounded-none
        border-0
        transition-colors
        duration-150
        hover:bg-gray-50
        focus:outline-none
        focus:ring-0
        ${isFullscreen
          ? "text-blue-600 bg-blue-50"
          : "text-gray-700"
        }
      `}
    >
      {isFullscreen ? (
        <Minimize
          className="w-[12px] h-[12px]"
          strokeWidth={2}
        />
      ) : (
        <Maximize
          className="w-[12px] h-[12px]"
          strokeWidth={2}
        />
      )}
    </button>
  );
}