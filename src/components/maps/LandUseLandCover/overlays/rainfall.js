// src/components/maps/LandUseLandCover/overlays/rainfall.js
import {
    DEFAULT_CENTER,
    MAX_ZOOM,
    MIN_ZOOM,
    RAINFALL_LAYER_URL,
    RAINFALL_YEARS,
} from "../constants";



const RAINFALL_DEFAULT_ZOOM = 6;


function getDefaultYear() {
    return RAINFALL_YEARS[RAINFALL_YEARS.length - 1];
}


export function buildRainfallUrl(year) {
    const y = year ?? getDefaultYear();
    return RAINFALL_LAYER_URL.replace("{year}", String(y));
}

export const rainfallOverlay = {
    id: "rainfall",
    name: "Rainfall",
    color: "#2563EB",
    exclusive: true,
    defaultOn: false,
    hasLegend: false,

    add({ map, rainfallYear }) {

        if (!map.getPane("rainfallPane")) {
            map.createPane("rainfallPane");
            map.getPane("rainfallPane").style.zIndex = 280;
        }

        const layer = L.tileLayer(buildRainfallUrl(rainfallYear), {
            pane: "rainfallPane",
            tileSize: 256,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            opacity: 0.75,
            crossOrigin: true,
        }).addTo(map);


        layer._rainfallYear = rainfallYear ?? getDefaultYear();

        return layer;
    },

    remove({ map }, layer) {
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    },

    onToggle({ map }, want) {
        if (!want) return;

        // Fly to the shared DEFAULT_CENTER but at the Rainfall overlay's
        // OWN zoom (RAINFALL_DEFAULT_ZOOM), not the LULC DEFAULT_ZOOM.
        map.flyTo(DEFAULT_CENTER, RAINFALL_DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};



export function updateRainfallYear(map, layer, rainfallYear) {
    if (!map || !layer || typeof layer.setUrl !== "function") return false;

    const nextYear = rainfallYear ?? getDefaultYear();
    if (layer._rainfallYear === nextYear) return false;

    layer.setUrl(buildRainfallUrl(nextYear));
    layer._rainfallYear = nextYear;
    return true;
}