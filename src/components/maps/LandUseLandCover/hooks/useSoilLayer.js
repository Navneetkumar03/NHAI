import { DEFAULT_ZOOM } from "../constants";
import { onEachSoilFeature, soilStyle } from "../mapUtils";
import { useEffect } from "react";

export function useSoilLayer({
  hasFitSoilBoundsRef,
  isMapReadyRef,
  mapContainerRef,
  mapRef,
  showSoil,
  soilData,
  soilLayerRef
}) {
useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;

    const map = mapRef.current;

    if (!showSoil) {
      if (soilLayerRef.current && map.hasLayer(soilLayerRef.current)) {
        map.removeLayer(soilLayerRef.current);
      }
      soilLayerRef.current = null;
      hasFitSoilBoundsRef.current = false;
      return;
    }

    if (!soilData) return;

    if (soilLayerRef.current && map.hasLayer(soilLayerRef.current)) {
      map.removeLayer(soilLayerRef.current);
    }

    soilLayerRef.current = L.geoJSON(soilData, {
      pane: "soilPane",
      style: soilStyle,
      onEachFeature: onEachSoilFeature,
    }).addTo(map);

    if (!hasFitSoilBoundsRef.current) {
      try {
        const bounds = soilLayerRef.current.getBounds();
        if (bounds.isValid()) {
          map.setView(bounds.getCenter(), DEFAULT_ZOOM, { animate: false });
          hasFitSoilBoundsRef.current = true;
        }
      } catch (err) {
        console.warn("[LULC] Could not set soil view:", err);
      }
    }

    requestAnimationFrame(() => {
      if (mapRef.current && mapContainerRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    return () => {
      if (soilLayerRef.current && map.hasLayer(soilLayerRef.current)) {
        map.removeLayer(soilLayerRef.current);
      }
    };
  }, [showSoil, soilData]);
}
