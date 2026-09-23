// src/components/maps/LandUseLandCover/overlays/dem.js
import { DEM_LAYER_URL, MAX_ZOOM, MIN_ZOOM, DEFAULT_CENTER } from "../constants";


const DEM__DEFAULT_ZOOM = 6;

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
        map.flyTo(DEFAULT_CENTER, DEM__DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};










