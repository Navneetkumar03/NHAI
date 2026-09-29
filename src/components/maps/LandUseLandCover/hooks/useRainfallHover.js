// // src/components/maps/LandUseLandCover/hooks/useRainfallHover.js
// import { createElement, useCallback, useEffect, useRef } from "react";
// import { renderToStaticMarkup } from "react-dom/server";
// import { CloudRain } from "lucide-react";
// import L from "leaflet";
// import { fetchRainfallValue } from "../../../../services/api/rainfall";

// // How long the cursor must sit still before we hit the API.
// const DEBOUNCE_MS = 250;

// // Skip if the user moves less than this — mousemove fires constantly
// // even for sub-pixel jitter.
// const MIN_MOVE_DEG = 0.0002;

// // Leaflet tooltips take HTML strings, not React components, so we render
// // the lucide CloudRain icon to markup once and reuse it.
// const RAIN_ICON_HTML = renderToStaticMarkup(
//   createElement(CloudRain, {
//     size: 14,
//     color: "#0ea5e9",
//     strokeWidth: 2.25,
//     style: { flexShrink: 0 },
//   })
// );

// const FONT_STACK = "system-ui,-apple-system,'Segoe UI',sans-serif";

// // Compact tooltip: [icon] value ........ [year pill]
// //                  ─────────────────────────────────
// //                  lat, lng
// const buildRainfallTooltipHtml = ({ year, display, lat, lng }) => `
//   <div style="font-family:${FONT_STACK};line-height:1.25;">
//     <div style="display:flex;align-items:center;gap:5px;white-space:nowrap;">
//       ${RAIN_ICON_HTML}
//       <span style="font-size:12px;font-weight:700;color:#1d36c4;">${display}</span>
//       <span style="margin-left:auto;padding:1px 6px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:700;letter-spacing:.03em;">
//         ${year}
//       </span>
//     </div>
//     <div style="margin-top:4px;padding-top:3px;border-top:1px solid #e5e7eb;font-size:9.5px;font-weight:500;color:#6b7280;font-variant-numeric:tabular-nums;white-space:nowrap;">
//       ${lat.toFixed(5)}, ${lng.toFixed(5)}
//     </div>
//   </div>
// `;

// const buildLoadingHtml = ({ lat, lng }) => `
//   <div style="font-family:${FONT_STACK};line-height:1.25;">
//     <div style="display:flex;align-items:center;gap:5px;white-space:nowrap;">
//       ${RAIN_ICON_HTML}
//       <span style="font-size:11px;font-weight:600;color:#6b7280;">Fetching…</span>
//     </div>
//     <div style="margin-top:4px;padding-top:3px;border-top:1px solid #e5e7eb;font-size:9.5px;font-weight:500;color:#6b7280;font-variant-numeric:tabular-nums;white-space:nowrap;">
//       ${lat.toFixed(5)}, ${lng.toFixed(5)}
//     </div>
//   </div>
// `;

// const buildErrorHtml = () => `
//   <div style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:#dc2626;white-space:nowrap;">
//     Rainfall unavailable
//   </div>
// `;

// export function useRainfallHover({
//   mapRef,
//   isMapReadyRef,
//   enabled, // boolean — Rainfall overlay is on
//   year,    // number — currently-selected rainfall year
// }) {
//   // We keep the tooltip instance and a "latest request id" so stale
//   // responses can be dropped when the user moves on.
//   const tooltipRef = useRef(null);
//   const debounceTimerRef = useRef(null);
//   const lastLatLngRef = useRef(null);
//   const requestIdRef = useRef(0);

//   const closeTooltip = useCallback(() => {
//     if (tooltipRef.current) {
//       tooltipRef.current.remove();
//       tooltipRef.current = null;
//     }
//   }, []);

//   const showTooltip = useCallback(
//     (latlng, html) => {
//       const map = mapRef.current;
//       if (!map) return;

//       if (!tooltipRef.current) {
//         // Pane high enough to sit above tiles but below popups
//         if (!map.getPane("rainfallTooltipPane")) {
//           map.createPane("rainfallTooltipPane");
//           map.getPane("rainfallTooltipPane").style.zIndex = 1350;
//           map.getPane("rainfallTooltipPane").style.pointerEvents = "none";
//         }

//         tooltipRef.current = L.tooltip({
//           pane: "rainfallTooltipPane",
//           direction: "top",
//           offset: [0, -12],
//           opacity: 1,
//           className: "rainfall-hover-tooltip",
//           permanent: false,
//         });
//       }

//       tooltipRef.current.setLatLng(latlng).setContent(html).addTo(map);
//     },
//     [mapRef]
//   );

//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map || !isMapReadyRef.current) return;
//     if (!enabled) return;

//     // ---------------------------------------------------------------
//     // The mousemove handler
//     // ---------------------------------------------------------------
//     const handleMouseMove = (e) => {
//       const { lat, lng } = e.latlng;

//       // User barely moved — don't restart the debounce, and don't
//       // redraw a tooltip that's already showing for this spot.
//       if (
//         lastLatLngRef.current &&
//         tooltipRef.current &&
//         Math.abs(lat - lastLatLngRef.current.lat) < MIN_MOVE_DEG &&
//         Math.abs(lng - lastLatLngRef.current.lng) < MIN_MOVE_DEG
//       ) {
//         return;
//       }

//       lastLatLngRef.current = e.latlng;

//       // Immediately reflect "loading" so the user sees the cursor is
//       // active even before the response arrives.
//       showTooltip(e.latlng, buildLoadingHtml({ lat, lng }));

//       // Reset the debounce clock
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//       }

//       debounceTimerRef.current = setTimeout(async () => {
//         const point = lastLatLngRef.current;
//         if (!point) return;

//         // Any earlier in-flight call is now irrelevant.
//         const myRequestId = ++requestIdRef.current;

//         try {
//           const data = await fetchRainfallValue({
//             year,
//             lat: point.lat,
//             lon: point.lng,
//           });

//           // A newer mousemove has already started — drop this response.
//           if (myRequestId !== requestIdRef.current) return;

//           // Anchor to the most recent cursor position.
//           const anchor = lastLatLngRef.current || point;

//           // Response shape from /get_rainfall_value:
//           //   { year, latitude, longitude, mm }
//           const mm = data?.mm;

//           const display =
//             mm === null || mm === undefined || Number.isNaN(Number(mm))
//               ? "No data"
//               : `${Number(mm).toFixed(2)} mm`;

//           // Prefer the coordinates the backend echoed back (in case
//           // it snapped to a grid cell); fall back to cursor position.
//           const respLat = Number(data?.latitude ?? anchor.lat);
//           const respLng = Number(data?.longitude ?? anchor.lng);
//           const respYear = data?.year ?? year;

//           showTooltip(
//             anchor,
//             buildRainfallTooltipHtml({
//               year: respYear,
//               display,
//               lat: respLat,
//               lng: respLng,
//             })
//           );
//         } catch (err) {
//           if (myRequestId !== requestIdRef.current) return;

//           const anchor = lastLatLngRef.current || point;
//           showTooltip(anchor, buildErrorHtml());
//         }
//       }, DEBOUNCE_MS);
//     };

//     // Hide tooltip when cursor leaves the map
//     const handleMouseOut = () => {
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//         debounceTimerRef.current = null;
//       }
//       requestIdRef.current++; // invalidate any pending response
//       closeTooltip();
//     };

//     map.on("mousemove", handleMouseMove);
//     map.on("mouseout", handleMouseOut);

//     return () => {
//       map.off("mousemove", handleMouseMove);
//       map.off("mouseout", handleMouseOut);
//       if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
//       requestIdRef.current++;
//       closeTooltip();
//     };
//   }, [mapRef, isMapReadyRef, enabled, year, showTooltip, closeTooltip]);
// }





// src/components/maps/LandUseLandCover/hooks/useRainfallHover.js
import { createElement, useCallback, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CloudRain } from "lucide-react";
import L from "leaflet";
import { fetchRainfallValue } from "../../../../services/api/rainfall";
import {
  loadIndiaBoundary,
  isInsideIndia,
} from "../../../../utils/indiaBoundary";

// How long the cursor must sit still before we hit the API.
const DEBOUNCE_MS = 250;

// Skip if the user moves less than this — mousemove fires constantly
// even for sub-pixel jitter.
const MIN_MOVE_DEG = 0.0002;

// Leaflet tooltips take HTML strings, not React components, so we render
// the lucide CloudRain icon to markup once and reuse it.
const RAIN_ICON_HTML = renderToStaticMarkup(
  createElement(CloudRain, {
    size: 14,
    color: "#0ea5e9",
    strokeWidth: 2.25,
    style: { flexShrink: 0 },
  })
);

const FONT_STACK = "system-ui,-apple-system,'Segoe UI',sans-serif";

// Compact tooltip: [icon] value ........ [year pill]
//                  ─────────────────────────────────
//                  lat, lng
const buildRainfallTooltipHtml = ({ year, display, lat, lng }) => `
  <div style="font-family:${FONT_STACK};line-height:1.25;">
    <div style="display:flex;align-items:center;gap:5px;white-space:nowrap;">
      ${RAIN_ICON_HTML}
      <span style="font-size:12px;font-weight:700;color:#1d36c4;">${display}</span>
      <span style="margin-left:auto;padding:1px 6px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:700;letter-spacing:.03em;">
        ${year}
      </span>
    </div>
    <div style="margin-top:4px;padding-top:3px;border-top:1px solid #e5e7eb;font-size:9.5px;font-weight:500;color:#6b7280;font-variant-numeric:tabular-nums;white-space:nowrap;">
      ${lat.toFixed(5)}, ${lng.toFixed(5)}
    </div>
  </div>
`;

const buildLoadingHtml = ({ lat, lng }) => `
  <div style="font-family:${FONT_STACK};line-height:1.25;">
    <div style="display:flex;align-items:center;gap:5px;white-space:nowrap;">
      ${RAIN_ICON_HTML}
      <span style="font-size:11px;font-weight:600;color:#6b7280;">Fetching…</span>
    </div>
    <div style="margin-top:4px;padding-top:3px;border-top:1px solid #e5e7eb;font-size:9.5px;font-weight:500;color:#6b7280;font-variant-numeric:tabular-nums;white-space:nowrap;">
      ${lat.toFixed(5)}, ${lng.toFixed(5)}
    </div>
  </div>
`;

const buildErrorHtml = () => `
  <div style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:#dc2626;white-space:nowrap;">
    Rainfall unavailable
  </div>
`;

export function useRainfallHover({
  mapRef,
  isMapReadyRef,
  enabled, // boolean — Rainfall overlay is on
  year,    // number — currently-selected rainfall year
}) {
  // We keep the tooltip instance and a "latest request id" so stale
  // responses can be dropped when the user moves on.
  const tooltipRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastLatLngRef = useRef(null);
  const requestIdRef = useRef(0);

  const closeTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(
    (latlng, html) => {
      const map = mapRef.current;
      if (!map) return;

      if (!tooltipRef.current) {
        // Pane high enough to sit above tiles but below popups
        if (!map.getPane("rainfallTooltipPane")) {
          map.createPane("rainfallTooltipPane");
          map.getPane("rainfallTooltipPane").style.zIndex = 1350;
          map.getPane("rainfallTooltipPane").style.pointerEvents = "none";
        }

        tooltipRef.current = L.tooltip({
          pane: "rainfallTooltipPane",
          direction: "top",
          offset: [0, -12],
          opacity: 1,
          className: "rainfall-hover-tooltip",
          permanent: false,
        });
      }

      tooltipRef.current.setLatLng(latlng).setContent(html).addTo(map);
    },
    [mapRef]
  );

  // Kick off the boundary load the first time the overlay turns on.
  // Safe to call repeatedly — the module-level cache dedupes it, and
  // useSoilHover calling it too still results in exactly one fetch.
  useEffect(() => {
    if (!enabled) return;
    loadIndiaBoundary();
  }, [enabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReadyRef.current) return;
    if (!enabled) return;

    // ---------------------------------------------------------------
    // The mousemove handler
    // ---------------------------------------------------------------
    const handleMouseMove = (e) => {
      const { lat, lng } = e.latlng;

      // Gate FIRST — before any tooltip is drawn.
      // null (boundary still loading) also bails, so the user never
      // sees a "Fetching…" flash that then turns into nothing.
      if (isInsideIndia(lat, lng) !== true) {
        // If a tooltip from a previous (inside-India) hover is still
        // showing, tear it down so the cursor doesn't leave a stale
        // card behind as it crosses the border.
        if (tooltipRef.current) closeTooltip();
        lastLatLngRef.current = null;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        return;
      }

      // User barely moved — don't restart the debounce, and don't
      // redraw a tooltip that's already showing for this spot.
      if (
        lastLatLngRef.current &&
        tooltipRef.current &&
        Math.abs(lat - lastLatLngRef.current.lat) < MIN_MOVE_DEG &&
        Math.abs(lng - lastLatLngRef.current.lng) < MIN_MOVE_DEG
      ) {
        return;
      }

      lastLatLngRef.current = e.latlng;

      // Immediately reflect "loading" so the user sees the cursor is
      // active even before the response arrives.
      showTooltip(e.latlng, buildLoadingHtml({ lat, lng }));

      // Reset the debounce clock
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const point = lastLatLngRef.current;
        if (!point) return;

        // Any earlier in-flight call is now irrelevant.
        const myRequestId = ++requestIdRef.current;

        try {
          const data = await fetchRainfallValue({
            year,
            lat: point.lat,
            lon: point.lng,
          });

          // A newer mousemove has already started — drop this response.
          if (myRequestId !== requestIdRef.current) return;

          // Anchor to the most recent cursor position.
          const anchor = lastLatLngRef.current || point;

          // Response shape from /get_rainfall_value:
          //   { year, latitude, longitude, mm }
          const mm = data?.mm;

          const display =
            mm === null || mm === undefined || Number.isNaN(Number(mm))
              ? "No data"
              : `${Number(mm).toFixed(2)} mm`;

          // Prefer the coordinates the backend echoed back (in case
          // it snapped to a grid cell); fall back to cursor position.
          const respLat = Number(data?.latitude ?? anchor.lat);
          const respLng = Number(data?.longitude ?? anchor.lng);
          const respYear = data?.year ?? year;

          showTooltip(
            anchor,
            buildRainfallTooltipHtml({
              year: respYear,
              display,
              lat: respLat,
              lng: respLng,
            })
          );
        } catch (err) {
          if (myRequestId !== requestIdRef.current) return;

          const anchor = lastLatLngRef.current || point;
          showTooltip(anchor, buildErrorHtml());
        }
      }, DEBOUNCE_MS);
    };

    // Hide tooltip when cursor leaves the map
    const handleMouseOut = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      requestIdRef.current++; // invalidate any pending response
      closeTooltip();
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      requestIdRef.current++;
      closeTooltip();
    };
  }, [mapRef, isMapReadyRef, enabled, year, showTooltip, closeTooltip]);
}