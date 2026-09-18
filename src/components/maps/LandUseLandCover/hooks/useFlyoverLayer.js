import {
  addAllToMap,
  escapeHtml,
  logError,
  removeAllFromMap,
} from "../mapUtils";
import {
  formatPointName,
  getFlyoverColor,
  getFlyoverDisplayName,
  makeFlyoverIcon,
} from "../../shared/mapHelpers";
import { useCallback } from "react";
import { sendUserActivity } from "../../../../services/api";

export function useFlyoverLayer({
  activeLayers,
  flyoverBoundsRef,
  flyoverLayersRef,
  flyoverMarkersRef,
  flyovers,
  mapRef,
  setActiveFlyoverId,
  setFlyoverEntries,
  setSelectedFlyoverForTraffic,
  setShowChart,
  setShowDiffChart,
  setShowOverview,
  setShowSegmentTable,
  setShowTrafficPanel,
}) {
  const updateLayerVisibility = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    // 🆕 Flyover pins now follow the Assets (linear) toggle instead of the
    // now-hidden Flyover entry.
    if (activeLayers.includes("linear")) {
      addAllToMap(mapRef.current, flyoverLayersRef.current);
      addAllToMap(mapRef.current, flyoverMarkersRef.current);
    } else {
      removeAllFromMap(mapRef.current, flyoverLayersRef.current);
      removeAllFromMap(mapRef.current, flyoverMarkersRef.current);
    }
  }, [activeLayers]);

  const addFlyoverLayers = useCallback(
    (map) => {
      if (!flyovers || flyovers.length === 0) {
        return;
      }

      try {
        requestAnimationFrame(() => {
          removeAllFromMap(map, flyoverLayersRef.current);
          flyoverLayersRef.current = [];
          removeAllFromMap(map, flyoverMarkersRef.current);
          flyoverMarkersRef.current = [];

          // 🆕 Reset per-flyover metadata
          flyoverBoundsRef.current = [];

          // 🆕 Mirror the reset into state so the buttons disappear while rebuilding
          setFlyoverEntries([]);

          flyovers.forEach((flyover, index) => {
            try {
              const color = getFlyoverColor(index);

              // 🆕 Use the same name that appears on the map icon (first named
              // point). Falls back to flyover.name / generic display name.
              const firstPointName =
                flyover.namedPoints && flyover.namedPoints.length > 0
                  ? formatPointName(flyover.namedPoints[0].name)
                  : null;

              // 🆕 Track layers + markers for this specific flyover so we can
              // highlight/zoom only this one.
              const thisFlyover = {
                id: flyover.id ?? index,
                name:
                  firstPointName ||
                  flyover.name ||
                  getFlyoverDisplayName(flyover.type, index),
                color,
                layers: [],
                markers: [],
                bounds: null,
              };

              if (flyover.namedPoints && flyover.namedPoints.length > 0) {
                flyover.namedPoints.forEach((point) => {
                  try {
                    const pointName = formatPointName(point.name);
                    const icon = makeFlyoverIcon({
                      color,
                      labelText: pointName,
                      detailed: false,
                      name: pointName,
                      detailFields: [],
                    });

                    const marker = L.marker(point.latlng, {
                      icon,
                      riseOnHover: true,
                      zIndexOffset: 100,
                    });

                    const popupContent = `
                      <div style="padding: 8px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 4px 0; color: ${escapeHtml(
                      color,
                    )};">
                          ${escapeHtml(pointName)}
                        </h4>
                        ${point.chainage
                        ? `<p style="margin: 2px 0; font-size: 11px;"><strong>Chainage:</strong> ${escapeHtml(
                          point.chainage,
                        )}</p>`
                        : ""
                      }
                        ${point.description
                        ? `<p style="margin: 2px 0; font-size: 11px;"><strong>Type:</strong> ${escapeHtml(
                          point.description,
                        )}</p>`
                        : ""
                      }
                        ${point.length
                        ? `<p style="margin: 2px 0; font-size: 11px;"><strong>Length:</strong> ${escapeHtml(
                          point.length,
                        )}</p>`
                        : ""
                      }
                        ${point.detail
                        ? `<p style="margin: 2px 0; font-size: 11px;"><strong>Structure:</strong> ${escapeHtml(
                          point.detail,
                        )}</p>`
                        : ""
                      }
                      </div>
                    `;

                    marker.bindPopup(popupContent, {
                      maxWidth: 300,
                      autoPan: true,
                    });


                    marker.on("click", () => {
                      // Backend still expects "FLYOVER N" — keep that format for the API call.
                      const backendName = `FLYOVER ${flyover.id ?? index}`;
                      // Friendly name shown on the quick-jump button — used only for the
                      // panel header display.
                      const displayName = thisFlyover.name;
                      sendUserActivity(
                        `Clicked Flyover Point: ${pointName}`,
                        "InfraRisk",
                      );

                      // Close competing right-side panels so they don't stack
                      setShowOverview(false);
                      setShowSegmentTable(false);
                      setShowChart(false);
                      setShowDiffChart(false);
                      setShowTrafficPanel(false);

                      // 🆕 Only open the traffic panel if the "Traffic"
                      // overlay is enabled. When it isn't, the click still
                      // pans/zooms/highlights the flyover (below) — it just
                      // doesn't surface traffic data the user hasn't asked
                      // for.
                      if (activeLayers.includes("traffic")) {
                        // Small delay lets the previous panel unmount cleanly
                        // before the new one mounts in the same slot.
                        setTimeout(() => {
                          setSelectedFlyoverForTraffic({
                            backendName,
                            displayName,
                          });
                          setShowTrafficPanel(true);
                        }, 0);
                      }

                      // Highlight the matching quick-jump button
                      setActiveFlyoverId(flyover.id ?? index);

                      // Pan + zoom to the clicked marker
                      if (mapRef.current) {
                        mapRef.current.panTo(point.latlng);
                        setTimeout(() => {
                          mapRef.current?.setZoom(14);
                        }, 400);
                      }
                    });

                    flyoverMarkersRef.current.push(marker);
                    thisFlyover.markers.push(marker);
                  } catch (err) {
                    logError(
                      `[LULC] Error adding marker for ${point.name}:`,
                      err,
                    );
                  }
                });
              }

              // 🆕 Compute combined bounds for this flyover
              try {
                const group = L.featureGroup([
                  ...thisFlyover.layers,
                  ...thisFlyover.markers,
                ]);
                const b = group.getBounds();
                if (b && b.isValid()) {
                  thisFlyover.bounds = b;
                }
              } catch (err) {
                logError(
                  `[LULC] Could not compute bounds for ${thisFlyover.name}:`,
                  err,
                );
              }

              flyoverBoundsRef.current.push(thisFlyover);
            } catch (err) {
              logError(`[LULC] Error processing flyover ${index}:`, err);
            }
          });

          // 🆕 Mirror the populated ref into state so React re-renders the
          // flyover buttons by default (no user interaction required).
          setFlyoverEntries([...flyoverBoundsRef.current]);

          updateLayerVisibility();

          // 🆕 Force re-render of flyover buttons
          setActiveFlyoverId((prev) => prev);
        });
      } catch (err) {
        logError("[LULC] Error in addFlyoverLayers:", err);
      }
    },
    [flyovers, updateLayerVisibility, activeLayers],
  );

  return { updateLayerVisibility, addFlyoverLayers };
}



