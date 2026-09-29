// src/components/maps/LandUseLandCover/hooks/useSoilHover.js
import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { fetchSoilInfo } from "../../../../services/api/soil";
import { SOIL_TYPE_COLORS, DEFAULT_SOIL_COLOR } from "../constants";
import {
  loadIndiaBoundary,
  isInsideIndia,
} from "../../../../utils/indiaBoundary";

const DEBOUNCE_MS = 250;
const MIN_MOVE_DEG = 0.0002;

export function useSoilHover({
  mapRef,
  isMapReadyRef,
  enabled,
}) {
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

  const showTooltip = useCallback((latlng, html) => {
    const map = mapRef.current;
    if (!map) return;

    if (!tooltipRef.current) {
      if (!map.getPane("soilTooltipPane")) {
        map.createPane("soilTooltipPane");
        map.getPane("soilTooltipPane").style.zIndex = 1350;
        map.getPane("soilTooltipPane").style.pointerEvents = "none";
      }

      tooltipRef.current = L.tooltip({
        pane: "soilTooltipPane",
        direction: "top",
        offset: [0, -12],
        opacity: 1,
        className: "soil-hover-tooltip",
        permanent: false,
      });
    }

    tooltipRef.current
      .setLatLng(latlng)
      .setContent(html)
      .addTo(map);
  }, [mapRef]);

  // Kick off the boundary load the first time the overlay turns on.
  // Safe to call repeatedly — the module-level cache dedupes it, and
  // useRainfallHover calling it too still results in exactly one fetch.
  useEffect(() => {
    if (!enabled) return;
    loadIndiaBoundary();
  }, [enabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReadyRef.current) return;
    if (!enabled) return;

    const handleMouseMove = (e) => {
      const { lat, lng } = e.latlng;

      // Gate FIRST — before any tooltip is drawn.
      // null (boundary still loading) also bails, so the user never
      // sees a "Fetching…" flash that then turns into "Outside India".
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

      if (
        lastLatLngRef.current &&
        tooltipRef.current &&
        Math.abs(lat - lastLatLngRef.current.lat) < MIN_MOVE_DEG &&
        Math.abs(lng - lastLatLngRef.current.lng) < MIN_MOVE_DEG
      ) {
        return;
      }

      lastLatLngRef.current = e.latlng;

      showTooltip(e.latlng, `
        <div style="font-size:11px;font-weight:600;color:#1f2937;">
          ${lat.toFixed(5)}, ${lng.toFixed(5)}
          <div style="color:#6b7280;font-weight:500;margin-top:2px;">
            Fetching…
          </div>
        </div>
      `);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const point = lastLatLngRef.current;
        if (!point) return;

        const myRequestId = ++requestIdRef.current;

        try {
          const data = await fetchSoilInfo({
            lat: point.lat,
            lon: point.lng,
          });

          if (myRequestId !== requestIdRef.current) return;

          const anchor = lastLatLngRef.current || point;

          // Response shape:
          //   { status: true, data: [ { objectid, soil_type, description } ] }
          const ok = data?.status === true;
          const soilEntry = Array.isArray(data?.data) ? data.data[0] : null;

          if (!ok || !soilEntry || !soilEntry.soil_type) {
            showTooltip(anchor, `
              <div style="font-size:11px;font-weight:600;color:#64748b;">
                No soil data at this location
              </div>
            `);
            return;
          }

          const soilType = soilEntry.soil_type;
          const description = soilEntry.description || "";

          // Single source of truth — same palette the sidebar
          // legend uses. Falls back to neutral for unknown types.
          const soilColor =
            SOIL_TYPE_COLORS[soilType] || DEFAULT_SOIL_COLOR;

          showTooltip(anchor, `
            <div style="
              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
              min-width:160px;
              max-width:220px;
              padding:2px 2px;
            ">
              

              <div style="
                display:flex;
                align-items:center;
                gap:6px;
                margin-bottom:5px;
              ">
                <span style="
                  display:inline-block;
                  width:11px;height:11px;
                  border-radius:3px;
                  background:${soilColor};
                  border:1px solid rgba(0,0,0,0.15);
                  flex-shrink:0;
                "></span>
                <span style="
                  font-size:13px;
                  font-weight:800;
                  color:#5b21b6;
                  letter-spacing:-0.2px;
                  line-height:1.15;
                ">${soilType}</span>
              </div>

              ${description ? `
                <div style="
                  padding-top:5px;
                  border-top:1px solid #e5e7eb;
                  font-size:10px;
                  font-weight:500;
                  color:#475569;
                  line-height:1.45;
                ">${description}</div>
              ` : ""}

              <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:6px;
                padding-top:5px;
                margin-top:4px;
                border-top:1px solid #e5e7eb;
                font-size:10px;
                font-weight:700;
                color:#7495c2;
                font-family:'SF Mono','Consolas',monospace;
                letter-spacing:0.2px;
              ">
                <span>${anchor.lat.toFixed(5)}, ${anchor.lng.toFixed(5)}</span>
              </div>
            </div>
          `);
        } catch (err) {
          if (myRequestId !== requestIdRef.current) return;

          const anchor = lastLatLngRef.current || point;
          showTooltip(anchor, `
            <div style="font-size:11px;color:#dc2626;font-weight:600;">
              Soil info unavailable
            </div>
          `);
        }
      }, DEBOUNCE_MS);
    };

    const handleMouseOut = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      requestIdRef.current++;
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
  }, [
    mapRef,
    isMapReadyRef,
    enabled,
    showTooltip,
    closeTooltip,
  ]);
}










// // src/components/maps/LandUseLandCover/hooks/useSoilHover.js
// import { useCallback, useEffect, useRef } from "react";
// import L from "leaflet";
// import { fetchSoilInfo } from "../../../../services/api/soil";

// import { SOIL_TYPE_COLORS, DEFAULT_SOIL_COLOR } from "../constants";

// const DEBOUNCE_MS = 250;
// const MIN_MOVE_DEG = 0.0002;

// export function useSoilHover({
//     mapRef,
//     isMapReadyRef,
//     enabled,
// }) {
//     const tooltipRef = useRef(null);
//     const debounceTimerRef = useRef(null);
//     const lastLatLngRef = useRef(null);
//     const requestIdRef = useRef(0);

//     const closeTooltip = useCallback(() => {
//         if (tooltipRef.current) {
//             tooltipRef.current.remove();
//             tooltipRef.current = null;
//         }
//     }, []);

//     const showTooltip = useCallback((latlng, html) => {
//         const map = mapRef.current;
//         if (!map) return;

//         if (!tooltipRef.current) {
//             if (!map.getPane("soilTooltipPane")) {
//                 map.createPane("soilTooltipPane");
//                 map.getPane("soilTooltipPane").style.zIndex = 1350;
//                 map.getPane("soilTooltipPane").style.pointerEvents = "none";
//             }

//             tooltipRef.current = L.tooltip({
//                 pane: "soilTooltipPane",
//                 direction: "top",
//                 offset: [0, -12],
//                 opacity: 1,
//                 className: "soil-hover-tooltip",
//                 permanent: false,
//             });
//         }

//         tooltipRef.current
//             .setLatLng(latlng)
//             .setContent(html)
//             .addTo(map);
//     }, [mapRef]);

//     useEffect(() => {
//         const map = mapRef.current;
//         if (!map || !isMapReadyRef.current) return;
//         if (!enabled) return;

//         const handleMouseMove = (e) => {
//             const { lat, lng } = e.latlng;

//             if (
//                 lastLatLngRef.current &&
//                 tooltipRef.current &&
//                 Math.abs(lat - lastLatLngRef.current.lat) < MIN_MOVE_DEG &&
//                 Math.abs(lng - lastLatLngRef.current.lng) < MIN_MOVE_DEG
//             ) {
//                 return;
//             }

//             lastLatLngRef.current = e.latlng;

//             showTooltip(e.latlng, `
//         <div style="font-size:11px;font-weight:600;color:#1f2937;">
//           ${lat.toFixed(5)}, ${lng.toFixed(5)}
//           <div style="color:#6b7280;font-weight:500;margin-top:2px;">
//             Fetching…
//           </div>
//         </div>
//       `);

//             if (debounceTimerRef.current) {
//                 clearTimeout(debounceTimerRef.current);
//             }

//             debounceTimerRef.current = setTimeout(async () => {
//                 const point = lastLatLngRef.current;
//                 if (!point) return;

//                 const myRequestId = ++requestIdRef.current;

//                 try {
//                     const data = await fetchSoilInfo({
//                         lat: point.lat,
//                         lon: point.lng,
//                     });

//                     if (myRequestId !== requestIdRef.current) return;

//                     const anchor = lastLatLngRef.current || point;

//                     // Response shape:
//                     //   { status: true, data: [ { objectid, soil_type, description } ] }
//                     const ok = data?.status === true;
//                     const soilEntry = Array.isArray(data?.data) ? data.data[0] : null;

//                     // No entry / status false → show a neutral "no data" tooltip.
//                     if (!ok || !soilEntry || !soilEntry.soil_type) {
//                         showTooltip(anchor, `
//               <div style="font-size:11px;font-weight:600;color:#64748b;">
//                 No soil data at this location
//               </div>
//             `);
//                         return;
//                     }

//                     const soilType = soilEntry.soil_type;
//                     const description = soilEntry.description || "";
//                     const objectId = soilEntry.objectid;

//                     // Simple, deterministic color per soil type so the dot matches
//                     // whatever legend palette you already use. Falls back to neutral.

//                     const soilColor = SOIL_TYPE_COLORS[soilType] || DEFAULT_SOIL_COLOR;

//                     showTooltip(anchor, `
//             <div style="
//               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
//               min-width:160px;
//               max-width:220px;
//               padding:2px 2px;
//             ">
//               <!-- Header chip -->
//               <div style="
//                 display:inline-flex;
//                 align-items:center;
//                 gap:4px;
//                 background:linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%);
//                 color:#6d28d9;
//                 font-size:10px;
//                 font-weight:700;
//                 letter-spacing:0.4px;
//                 text-transform:uppercase;
//                 padding:2px 7px;
//                 border-radius:999px;
//                 margin-bottom:6px;
//               ">
//                 <span style="
//                   display:inline-block;
//                   width:5px;height:5px;
//                   border-radius:50%;
//                   background:#7c3aed;
//                 "></span>
//                 Soil
//               </div>

//               <!-- Soil type — hero line, colored swatch + name -->
//               <div style="
//                 display:flex;
//                 align-items:center;
//                 gap:6px;
//                 margin-bottom:5px;
//               ">
//                 <span style="
//                   display:inline-block;
//                   width:11px;height:11px;
//                   border-radius:3px;
//                   background:${soilColor};
//                   border:1px solid rgba(0,0,0,0.15);
//                   flex-shrink:0;
//                 "></span>
//                 <span style="
//                   font-size:13px;
//                   font-weight:800;
//                   color:#5b21b6;
//                   letter-spacing:-0.2px;
//                   line-height:1.15;
//                 ">${soilType}</span>
//               </div>

//               ${description ? `
//                 <!-- Description -->
//                 <div style="
//                   padding-top:5px;
//                   border-top:1px solid #e5e7eb;
//                   font-size:10px;
//                   font-weight:500;
//                   color:#475569;
//                   line-height:1.45;
//                 ">${description}</div>
//               ` : ""}

//               <!-- Footer: coords + id -->
//               <div style="
//                 display:flex;
//                 align-items:center;
//                 justify-content:space-between;
//                 gap:6px;
//                 padding-top:5px;
//                 margin-top:4px;
//                 border-top:1px solid #e5e7eb;
//                 font-size:10px;
//                 font-weight:700;
//                 color:#7495c2;
//                 font-family:'SF Mono','Consolas',monospace;
//                 letter-spacing:0.2px;
//               ">
//                 <span>${anchor.lat.toFixed(5)}, ${anchor.lng.toFixed(5)}</span>

//               </div>
//             </div>
//           `);
//                 } catch (err) {
//                     if (myRequestId !== requestIdRef.current) return;

//                     const anchor = lastLatLngRef.current || point;
//                     showTooltip(anchor, `
//             <div style="font-size:11px;color:#dc2626;font-weight:600;">
//               Soil info unavailable
//             </div>
//           `);
//                 }
//             }, DEBOUNCE_MS);
//         };

//         const handleMouseOut = () => {
//             if (debounceTimerRef.current) {
//                 clearTimeout(debounceTimerRef.current);
//                 debounceTimerRef.current = null;
//             }
//             requestIdRef.current++;
//             closeTooltip();
//         };

//         map.on("mousemove", handleMouseMove);
//         map.on("mouseout", handleMouseOut);

//         return () => {
//             map.off("mousemove", handleMouseMove);
//             map.off("mouseout", handleMouseOut);
//             if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
//             requestIdRef.current++;
//             closeTooltip();
//         };
//     }, [
//         mapRef,
//         isMapReadyRef,
//         enabled,
//         showTooltip,
//         closeTooltip,
//     ]);
// }

