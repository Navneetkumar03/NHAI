// src/utils/indiaBoundary.js

// const BASE = import.meta.env.BASE_URL;

// const NAMES_GEOJSON_PATH = `${BASE}data/FlyOver_Name.geojson`;

const BOUNDARY_URL = `${import.meta.env.BASE_URL}data/indiaBoundary.json`;

let boundaryPromise = null;   // in-flight or resolved promise
let boundaryRings = null;     // cached flat array of polygon rings
let boundaryBBox = null;      // cached [minLng, minLat, maxLng, maxLat]

/* ------------------------------------------------------------------ *
 * Ray-casting point-in-polygon, standard algorithm.
 * ring: array of [lng, lat] pairs.
 * ------------------------------------------------------------------ */
function pointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

/* ------------------------------------------------------------------ *
 * A point is inside the boundary if it's inside any outer ring AND
 * not inside that ring's holes. The current file has no holes, but
 * the logic handles both shapes.
 * ------------------------------------------------------------------ */
function extractRings(geojson) {
    const rings = [];        // [{ outer: [...], holes: [[...], ...] }]
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];

    const pushRing = (outer, holes = []) => {
        rings.push({ outer, holes });
        for (const [lng, lat] of outer) {
            if (lng < bbox[0]) bbox[0] = lng;
            if (lat < bbox[1]) bbox[1] = lat;
            if (lng > bbox[2]) bbox[2] = lng;
            if (lat > bbox[3]) bbox[3] = lat;
        }
    };

    (geojson.features || []).forEach((feature) => {
        const geom = feature.geometry;
        if (!geom) return;

        if (geom.type === "Polygon") {
            const [outer, ...holes] = geom.coordinates;
            pushRing(outer, holes);
        } else if (geom.type === "MultiPolygon") {
            geom.coordinates.forEach((poly) => {
                const [outer, ...holes] = poly;
                pushRing(outer, holes);
            });
        }
    });

    return { rings, bbox };
}

/* ------------------------------------------------------------------ *
 * Public: load (and cache) the boundary file.
 * Safe to call from multiple hooks — the fetch runs exactly once.
 * ------------------------------------------------------------------ */
export function loadIndiaBoundary() {
    if (!boundaryPromise) {
        boundaryPromise = fetch(BOUNDARY_URL)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load India boundary: ${res.status}`);
                }
                return res.json();
            })
            .then((geojson) => {
                const { rings, bbox } = extractRings(geojson);
                boundaryRings = rings;
                boundaryBBox = bbox;
                return true;
            })
            .catch((err) => {
                console.error("[indiaBoundary] load failed:", err);
                // Reset the promise so a future call can retry. Leave boundaryRings
                // null → isInsideIndia returns null (unknown), and hooks can decide
                // to allow the request rather than block it.
                boundaryPromise = null;
                return false;
            });
    }
    return boundaryPromise;
}

/* ------------------------------------------------------------------ *
 * Public: is a lat/lng inside India?
 *   true  → inside the boundary
 *   false → outside
 *   null  → boundary not loaded yet, OR failed to load
 *
 * Returning null (not false) lets callers decide: block the API call
 * on null (safe default), or allow it (if you'd rather fail open).
 * We fail CLOSED in the hooks.
 * ------------------------------------------------------------------ */
export function isInsideIndia(lat, lon) {
    if (!boundaryRings) return null;

    // Cheap bbox rejection first — the vast majority of "outside" cursor
    // positions (oceans, other countries) bail out here in O(1).
    const [minLng, minLat, maxLng, maxLat] = boundaryBBox;
    if (lon < minLng || lon > maxLng || lat < minLat || lat > maxLat) {
        return false;
    }

    for (const { outer, holes } of boundaryRings) {
        if (!pointInRing(lon, lat, outer)) continue;

        let inHole = false;
        for (const hole of holes) {
            if (pointInRing(lon, lat, hole)) {
                inHole = true;
                break;
            }
        }
        if (!inHole) return true;
    }
    return false;
}








// User opens Add - on Layers → checks Soil.

// enabled.soil flips to true.

// React re - renders useSoilHover with enabled: true.

// The effect fires → loadIndiaBoundary() starts the fetch.

// Meanwhile the soil tile layer also starts loading.

// User moves the mouse over the map for the first time.

// mousemove handler runs → calls isInsideIndia(...)