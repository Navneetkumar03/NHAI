// src/components/maps/LandUseLandCover/overlays/soil.js
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../constants";
import { onEachSoilFeature, soilStyle } from "../mapUtils";

export const soilOverlay = {
    id: "soil",
    name: "Soil",
    color: "#8B5E3C",
    exclusive: true,
    defaultOn: false,
    hasLegend: true,

    add({ map, soilDataRef, soilLayerRef, hasFitSoilBoundsRef, mapContainerRef }) {
        const data = soilDataRef?.current;
        if (!data) {
            return null;
        }

        const layer = L.geoJSON(data, {
            pane: "soilPane",
            style: soilStyle,
            onEachFeature: onEachSoilFeature,
        }).addTo(map);


        if (hasFitSoilBoundsRef) {
            hasFitSoilBoundsRef.current = true;
        }


        requestAnimationFrame(() => {
            if (mapContainerRef?.current) {
                try { map.invalidateSize(); } catch { }
            }
        });

        if (soilLayerRef) soilLayerRef.current = layer;
        return layer;
    },

    remove({ map, soilLayerRef, hasFitSoilBoundsRef }, layer) {
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
        if (soilLayerRef) soilLayerRef.current = null;
        if (hasFitSoilBoundsRef) hasFitSoilBoundsRef.current = false;
    },

    // 🆕 Fly to the default view whenever Soil is turned on.
    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};