import { addAllToMap, escapeHtml, getHoverCircleStyle, getRestingCircleStyle, getSelectedCircleStyle, getWeightForZoom, logError, removeAllFromMap } from "../mapUtils";
import { sendUserActivity } from "../../../../services/api/auth";
import { useCallback } from "react";

export function useMovementLayer({
  diffEndDate,
  diffMarkersRef,
  diffStartDate,
  mapRef,
  movementMarkersRef,
  selectPoint,
  selectedLayer,
  selectedMovementMarkerRef,
  setDiffDetailData,
  setDiffPointData,
  setSelectedDetailForChart,
  setSelectedPointForChart,
  setShowChart,
  setShowDiffChart
}) {
  const updateCircleWeights = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getZoom();
    const weight = getWeightForZoom(zoom);
    movementMarkersRef.current.forEach((marker) => {
      marker.options.weight = weight;
      marker.setStyle({ weight });
    });
    // 🆕 Difference circles also scale with zoom
    diffMarkersRef.current.forEach((marker) => {
      marker.options.weight = weight;
      marker.setStyle({ weight });
    });
  }, []);

  const addMovementPointsToMap = useCallback(
    (map, points) => {
      if (!points || points.length === 0) {
        return;
      }

      removeAllFromMap(map, movementMarkersRef.current);
      movementMarkersRef.current = [];

      selectedMovementMarkerRef.current = null;

      points.forEach((feature) => {
        const { id, longitude, latitude, velocity } = feature.data;

        const circle = L.circle([latitude, longitude], {
          pane: "movementPane",
          radius: 4,
          ...getRestingCircleStyle(selectedLayer, velocity, map.getZoom()),
        });

        circle._movementVelocity = velocity;
        circle._movementId = id;

        circle.on("mouseover", function () {
          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(getHoverCircleStyle(map.getZoom()));
          }
          //  Point ID: ${ escapeHtml(id) } <br />
          if (selectedLayer === "velocity") {
            const tooltipContent = `
                  <div style="padding: 2px 6px; font-size: 12px; font-weight: 600; line-height: 1.3;">
                   
                    Velocity: ${escapeHtml(velocity)} mm/yr
                  </div>
                `;
            this.bindTooltip(tooltipContent, {
              permanent: false,
              direction: "top",
              offset: [0, -10],
              className: "velocity-tooltip",
            }).openTooltip();
          } else {
            this.closeTooltip();
          }
        });

        circle.on("mouseout", function () {
          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(
              getRestingCircleStyle(
                selectedLayer,
                this._movementVelocity,
                map.getZoom(),
              ),
            );
          }

          this.closeTooltip();
        });

        circle.on("click", async function () {
          if (selectedLayer === "none") {
            return;
          }

          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(
              getRestingCircleStyle(
                selectedLayer,
                this._movementVelocity,
                map.getZoom(),
              ),
            );

            selectedMovementMarkerRef.current = null;

            setShowChart(false);
            setShowDiffChart(false);

            return;
          }
          // Capture actual velocity point click
          sendUserActivity(
            `Clicked Velocity Point: ${id} (${velocity} mm/yr)`,
            "InfraRisk",
          );

          if (selectedMovementMarkerRef.current) {
            const previousMarker = selectedMovementMarkerRef.current;

            previousMarker.setStyle(
              getRestingCircleStyle(
                selectedLayer,
                previousMarker._movementVelocity,
                map.getZoom(),
              ),
            );
          }

          selectedMovementMarkerRef.current = this;

          this.setStyle(getSelectedCircleStyle(map.getZoom()));

          try {
            const detailData = await selectPoint(id);

            if (detailData) {
              if (
                selectedLayer === "difference" &&
                diffStartDate &&
                diffEndDate
              ) {
                setDiffPointData(feature);
                setDiffDetailData(detailData);
                setShowDiffChart(true);
              } else {
                setSelectedPointForChart(feature);
                setSelectedDetailForChart(detailData);
                setShowChart(true);
              }
            }
          } catch (err) {
            logError("Error fetching point details:", err);
          }
        });

        movementMarkersRef.current.push(circle);
      });

      // In difference mode, the diff circles (below) replace these — don't
      // attach the velocity-styled circles.
      if (selectedLayer === "velocity") {
        movementMarkersRef.current.forEach((marker) => marker.addTo(map));
        updateCircleWeights();
      }
    },
    [
      selectedLayer,
      selectPoint,
      diffStartDate,
      diffEndDate,
      updateCircleWeights,
    ],
  );

  const updateMovementVisibility = useCallback(() => {
    if (!mapRef.current) return;

    if (selectedLayer === "velocity") {
      addAllToMap(mapRef.current, movementMarkersRef.current);
      removeAllFromMap(mapRef.current, diffMarkersRef.current);
    } else if (selectedLayer === "difference") {
      removeAllFromMap(mapRef.current, movementMarkersRef.current);
      addAllToMap(mapRef.current, diffMarkersRef.current);
    } else {
      removeAllFromMap(mapRef.current, movementMarkersRef.current);
      removeAllFromMap(mapRef.current, diffMarkersRef.current);
    }
  }, [selectedLayer]);

  return { updateCircleWeights, addMovementPointsToMap, updateMovementVisibility };
}
