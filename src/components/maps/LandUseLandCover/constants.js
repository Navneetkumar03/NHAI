import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";

export const BASE = import.meta.env.BASE_URL;











/* ============================================================================
 * CONSTANTS
 * ==========================================================================*/

export const DEBUG = false;

export const YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export const TILE_LAYER_URL =
  "https://mlinfomap.com/nhflyoverapi/tiles/{year}/{z}/{x}/{y}.png";

export const DEFAULT_CENTER = [30.3, 76.7];

export const DEFAULT_ZOOM = 10;

export const MIN_ZOOM = 9;

export const MAX_ZOOM = 20;

export const LULC_FADE_MS = 250;

export const LULC_CLASSES = [
  { color: "#055ac5", label: "Water" },
  { color: "#0b832a", label: "Trees" },
  { color: "#dae04e", label: "Crop" },
  { color: "#f14c40", label: "Builtup" },
  { color: "#ecfff8", label: "Bare Ground" },
  { color: "#99998f", label: "Rangeland" },
];

export const SOIL_TAXO_COLORS = {
  "Fluventic Ustochrepts": "#4CAF50",
  "Natric Ustochrepts": "#FF5722",
  "Typic Haplustalfs": "#C6CE3D",
  "Typic Ustifluvents": "#4472C4",
  "Typic Ustochrepts": "#9C27B0",
  "Udic Ustochrepts": "#26C6DA",
};

export const DEFAULT_SOIL_COLOR = "#9E9E9E";

export const VELOCITY_RANGES = [
  { min: -50, max: -26, color: "#e00f00" },
  { min: -25, max: -16, color: "#FFDF00" },
  { min: -15, max: 19, color: "#ffffff" },
  { min: 20, max: 30, color: "#00FFFF" },
  { min: 31, max: 50, color: "#4B00E0" },
];

// Difference-legend colors (matches backend diff palette)

export const DIFF_COLORS = {
  negative: "#3F53D2",
  neutral: "#D7E1F5",
  positive: "#D23232",
};

export const BASE_ZOOM = 14;

export const BASE_WEIGHT = 1.5;

export const MIN_WEIGHT = 0.5;

export const MAX_WEIGHT = 4;

export const HOVER_WEIGHT_BONUS = 1.5;

export const NEUTRAL_FILL = "#8a0b68";

export const NEUTRAL_BORDER = "#0d0101";

export const VELOCITY_BORDER = "#333";

export const HOVER_FILL = "#ff6b6b";

export const HOVER_BORDER = "#ff0000";

export const SELECT_FILL = "#ffd93d";

export const SELECT_BORDER = "#f59f00";

/* ============================================================================
 * SMALL HELPERS
 * ==========================================================================*/

// export const RISK_LEVELS = [
//   { level: 1, color: "rgb(59,130,246)" },
//   { level: 2, color: "rgb(99,160,240)" },
//   { level: 3, color: "rgb(249,115,22)" },
//   { level: 4, color: "rgb(234,88,12)" },
//   { level: 5, color: "rgb(239,68,68)" },
// ];


export const RISK_LEVELS = [
  { level: 1, color: "rgb(59,130,246)" },
  { level: 2, color: "rgb(99,160,240)" },
  { level: 3, color: "rgb(249,115,22)" },
  { level: 4, color: "rgb(234,88,12)" },
  { level: 5, color: "rgb(239,68,68)" },
];

/* ============================================================================
 * RISK COLOR LOOKUP  — derived from RISK_LEVELS above.
 * ... (as above)
 * ==========================================================================*/

const RISK_COLOR_BY_LEVEL = Object.fromEntries(
  RISK_LEVELS.map((r) => [r.level, r.color]),
);

export function getRiskColor(risk) {
  return RISK_COLOR_BY_LEVEL[Number(risk)] || "#64748b";
}