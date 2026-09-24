import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../constants";
import { onEachSoilBoundaryFeature, soilBoundaryStyle } from "../mapUtils";

export const soilBoundaryOverlay = {
    id: "soilBoundary",
    name: "Soil Taxo",       // pick whatever label your manager wants in the menu
    color: "#8B5E3C",
    exclusive: true,
    defaultOn: false,
    hasLegend: true,

    add({ map, soilDataRef, soilLayerRef, hasFitSoilBoundsRef, mapContainerRef }) {
        const data = soilDataRef?.current;
        if (!data) return null;

        const layer = L.geoJSON(data, {
            pane: "soilPane",
            style: soilBoundaryStyle,
            onEachFeature: onEachSoilBoundaryFeature,
        }).addTo(map);

        if (hasFitSoilBoundsRef) hasFitSoilBoundsRef.current = true;

        requestAnimationFrame(() => {
            if (mapContainerRef?.current) {
                try { map.invalidateSize(); } catch { }
            }
        });

        if (soilLayerRef) soilLayerRef.current = layer;
        return layer;
    },

    remove({ map, soilLayerRef, hasFitSoilBoundsRef }, layer) {
        if (layer && map.hasLayer(layer)) map.removeLayer(layer);
        if (soilLayerRef) soilLayerRef.current = null;
        if (hasFitSoilBoundsRef) hasFitSoilBoundsRef.current = false;
    },

    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true, duration: 1.2 });
    },
};