// src/components/maps/LandUseLandCover/overlays/dem.js
import { DEM_LAYER_URL, MAX_ZOOM, MIN_ZOOM } from "../constants";

// DEM-specific default view. Intentionally NOT the global DEFAULT_CENTER /
// DEFAULT_ZOOM from constants.js — DEM has its own home position.
const DEM_CENTER = [30.3, 76.7];
const DEM_ZOOM = 6;

export const demOverlay = {
    id: "dem",
    name: "Terrain",
    color: "#A16207",
    exclusive: true,
    defaultOn: false,
    hasLegend: false,

    add({ map }) {
        // Dedicated pane so DEM can sit above base tiles but below vectors.
        if (!map.getPane("demPane")) {
            map.createPane("demPane");
            map.getPane("demPane").style.zIndex = 250;
        }

        return L.tileLayer(DEM_LAYER_URL, {
            pane: "demPane",
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
        map.flyTo(DEM_CENTER, DEM_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};










