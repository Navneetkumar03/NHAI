// src/components/maps/LandUseLandCover/overlays/soil.js
import {
    DEFAULT_CENTER,
    MAX_ZOOM,
    MIN_ZOOM,
    SOIL_LAYER_URL,
} from "../constants";


const SOIL_DEFAULT_ZOOM = 6;
export const soilOverlay = {
    id: "soil",
    name: "Soil",
    color: "#8B5E3C",
    exclusive: true,
    defaultOn: false,
    hasLegend: true,

    add({ map }) {
        // Dedicated pane so soil stacks above base tiles but below
        // vectors (LULC divider, flyover pins, movement circles).
        if (!map.getPane("soilPane")) {
            map.createPane("soilPane");
            map.getPane("soilPane").style.zIndex = 300;
        }

        return L.tileLayer(SOIL_LAYER_URL, {
            pane: "soilPane",
            tileSize: 256,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            opacity: 1,
            crossOrigin: true,
        }).addTo(map);
    },

    remove({ map }, layer) {
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    },

    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(DEFAULT_CENTER, SOIL_DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};