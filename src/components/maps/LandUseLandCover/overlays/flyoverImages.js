// src/components/maps/LandUseLandCover/overlays/flyoverImages.js
export const flyoverImagesOverlay = {
    id: "flyoverImages",
    name: "Flyover Images",
    color: "#0EA5E9",
    exclusive: false,     // can coexist with Linear, Traffic, etc.
    defaultOn: false,
    hasLegend: false,
    custom: true,         // tells useOverlayLayers to skip the tile-layer lifecycle
};