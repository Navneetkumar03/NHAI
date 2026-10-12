// src/components/maps/LandUseLandCover/overlays/earthquakes.js
import {
    DEFAULT_CENTER,
    EARTHQUAKES_LAYER_URL,
    MAX_ZOOM,
    MIN_ZOOM,
} from "../constants";

// Match the zoom the other overlays use when they fly into view.
const EARTHQUAKES_DEFAULT_ZOOM = 6;

export const earthquakesOverlay = {
    id: "earthquakes",
    name: "Earthquakes",
    color: "#DC2626",
    exclusive: true,      // turning this on turns off LULC / Soil / DEM / Rainfall
    defaultOn: false,
    hasLegend: true,

    add({ map }) {
        // Dedicated pane so this layer stacks predictably against the others.
        // zIndex 260 keeps it just above DEM (250) and below Soil (300).
        if (!map.getPane("earthquakesPane")) {
            map.createPane("earthquakesPane");
            map.getPane("earthquakesPane").style.zIndex = 260;
        }

        return L.tileLayer(EARTHQUAKES_LAYER_URL, {
            pane: "earthquakesPane",
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

    // Fly to a sensible view when the layer is turned on.
    // Adjust center/zoom to wherever your earthquake data is concentrated.
    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(DEFAULT_CENTER, EARTHQUAKES_DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};