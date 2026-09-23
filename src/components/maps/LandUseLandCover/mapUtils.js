import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import {
  BASE_WEIGHT,
  BASE_ZOOM,
  DEBUG,
  DEFAULT_SOIL_COLOR,
  getRiskColor,
  HOVER_BORDER,
  HOVER_FILL,
  HOVER_WEIGHT_BONUS,
  MAX_WEIGHT,
  MIN_WEIGHT,
  NEUTRAL_BORDER,
  NEUTRAL_FILL,
  SELECT_BORDER,
  SELECT_FILL,
  SOIL_TAXO_COLORS,
  VELOCITY_BORDER,
  VELOCITY_RANGES,
} from "./constants";

/* ============================================================================
 * SOIL
 * ==========================================================================*/

// Still used by SoilLegend.jsx — maps a soil taxonomy code to its color.
// The SOIL_TAXO_COLORS map is the single source of truth for both the legend
// and the tile server's palette.
export function getSoilColor(props) {
  return SOIL_TAXO_COLORS[props?.S_TAXO] || DEFAULT_SOIL_COLOR;
}

/* ============================================================================
 * LOGGING
 * ==========================================================================*/

export function log(...args) {
  if (DEBUG) console.log(...args);
}

export function logError(...args) {
  console.error(...args);
}

/* ============================================================================
 * VELOCITY / CIRCLE STYLES
 * ==========================================================================*/

export function getVelocityColor(velocity) {
  for (const range of VELOCITY_RANGES) {
    if (velocity >= range.min && velocity <= range.max) {
      return range.color;
    }
  }
  return NEUTRAL_FILL;
}

export function getWeightForZoom(zoom) {
  const scale = Math.pow(2, zoom - BASE_ZOOM);
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, BASE_WEIGHT * scale));
}

export function getRestingCircleStyle(selectedLayer, velocity, zoom) {
  const isVelocityMode = selectedLayer === "velocity";

  return {
    fillColor: isVelocityMode ? getVelocityColor(velocity) : NEUTRAL_FILL,
    color: isVelocityMode ? VELOCITY_BORDER : NEUTRAL_BORDER,
    weight: getWeightForZoom(zoom),
    opacity: 0.9,
    fillOpacity: 0.85,
  };
}

// Difference-mode resting style. Uses the backend-provided color as the
// fill so the map matches the API's legend exactly.
export function getDiffRestingCircleStyle(color, zoom) {
  return {
    fillColor: color || NEUTRAL_FILL,
    color: "#ffffff",
    weight: getWeightForZoom(zoom) + 1,
    opacity: 1,
    fillOpacity: 1,
  };
}

export function getHoverCircleStyle(zoom) {
  return {
    fillColor: HOVER_FILL,
    color: HOVER_BORDER,
    weight: getWeightForZoom(zoom) + HOVER_WEIGHT_BONUS,
    fillOpacity: 0.9,
  };
}

export function getSelectedCircleStyle(zoom) {
  return {
    fillColor: SELECT_FILL,
    color: SELECT_BORDER,
    weight: getWeightForZoom(zoom) + HOVER_WEIGHT_BONUS,
  };
}

/* ============================================================================
 * HTML / MAP HELPERS
 * ==========================================================================*/

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function removeAllFromMap(map, layers) {
  layers.forEach((layer) => {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  });
}

export function addAllToMap(map, layers) {
  layers.forEach((layer) => {
    if (!map.hasLayer(layer)) {
      map.addLayer(layer);
    }
  });
}

/* ============================================================================
 * RE-EXPORTS
 * ==========================================================================*/

export const getRiskTableColor = getRiskColor;
