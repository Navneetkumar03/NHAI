// overlays/traffic.js

const TRAFFIC_ZOOM = 13;
const TRAFFIC_CENTER = [30.412966, 76.774168];

export const trafficOverlay = {
    id: "traffic",
    name: "Traffic",
    color: "#EF4444",
    exclusive: true,
    defaultOn: false,
    custom: true,

    // When turned ON → fly to the traffic hotspot at TRAFFIC_ZOOM.
    // When turned OFF → do nothing (panel cleanup handled by the feature hook).
    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(TRAFFIC_CENTER, TRAFFIC_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};