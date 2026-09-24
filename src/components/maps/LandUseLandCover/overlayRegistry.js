// src/components/maps/LandUseLandCover/overlayRegistry.js
import { demOverlay } from "./overlays/dem";
import { soilOverlay } from "./overlays/soil";
import { lulcOverlay } from "./overlays/lulc";
import { linearOverlay } from "./overlays/linear";
import { trafficOverlay } from "./overlays/traffic";
import { rainfallOverlay } from "./overlays/rainfall";
import { soilBoundaryOverlay } from "./overlays/soilBoundary";

export const OVERLAY_REGISTRY = [
    linearOverlay,
    lulcOverlay,
    soilOverlay,
    soilBoundaryOverlay, // 🆕 the restored GeoJSON layer
    demOverlay,
    trafficOverlay,
    rainfallOverlay,
];

export const LAYER_MENU = OVERLAY_REGISTRY;

export const getOverlay = (id) =>
    OVERLAY_REGISTRY.find((o) => o.id === id);

export const EXCLUSIVE_IDS = OVERLAY_REGISTRY
    .filter((o) => o.exclusive)
    .map((o) => o.id);

export const MANAGED_IDS = OVERLAY_REGISTRY
    .filter((o) => !o.custom)
    .map((o) => o.id);

export const INITIAL_ENABLED = Object.fromEntries(
    OVERLAY_REGISTRY.map((o) => [o.id, !!o.defaultOn]),
);
