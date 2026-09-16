import { logError } from "../mapUtils";
import { useEffect } from "react";

export function useResponsiveUI({
  mapContainerRef,
  mapRef,
  setIsFullscreen,
  setIsMobile
}) {
useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    /* 🆕 GPS marker pulse */
    @keyframes gps-pulse {
      0%   { transform: scale(0.6); opacity: 0.9; }
      70%  { transform: scale(2.2); opacity: 0;   }
      100% { transform: scale(2.2); opacity: 0;   }
    }
    .gps-user-marker-wrapper {
      background: transparent !important;
      border: none !important;
    }

    /* existing overrides — unchanged */
    .leaflet-interactive:focus,
    .leaflet-interactive:focus-visible {
      outline: none !important;
    }
    path.leaflet-interactive:focus {
      outline: none !important;
    }
    .leaflet-bar a {
      width: 22px !important;
      height: 22px !important;
      line-height: 22px !important;
      font-size: 14px !important;
    }
    @media (max-width: 480px) {
      .leaflet-bar a {
        width: 18px !important;
        height: 18px !important;
        line-height: 18px !important;
        font-size: 12px !important;
      }
    }
  `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        try {
          if (
            mapRef.current &&
            mapContainerRef.current &&
            document.contains(mapContainerRef.current)
          ) {
            mapRef.current.invalidateSize();
          }
        } catch (err) {
          logError("[LULC] Error during fullscreen change:", err);
        }
      }, 200);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
}
