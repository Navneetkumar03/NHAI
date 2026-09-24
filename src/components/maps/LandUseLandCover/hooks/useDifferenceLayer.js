import { NEUTRAL_FILL } from "../constants";
import { escapeHtml, getDiffRestingCircleStyle, getHoverCircleStyle, getSelectedCircleStyle, logError, removeAllFromMap } from "../mapUtils";
import { useCallback, useEffect } from "react";

export function useDifferenceLayer({
  clearVelocityDiff,
  diffEndDate,
  diffMarkersRef,
  diffStartDate,
  isMapReadyRef,
  loadVelocityDiff,
  mapRef,
  selectPoint,
  selectedLayer,
  selectedMovementMarkerRef,
  setDiffDetailData,
  setDiffPointData,
  setSelectedDetailForChart,
  setSelectedPointForChart,
  setShowChart,
  setShowDiffChart,
  updateCircleWeights,
  velocityDiff
}) {
  const addDiffPointsToMap = useCallback(
    (map, geojsonData) => {
      if (
        !geojsonData ||
        !geojsonData.features ||
        geojsonData.features.length === 0
      ) {
        return;
      }


      const inputCount = geojsonData.features.length;
      console.log(
        `%c[4] addDiffPointsToMap  received ${inputCount} features`,
        "color:#f59e0b",
      );

      // Wipe any previous diff circles
      removeAllFromMap(map, diffMarkersRef.current);
      diffMarkersRef.current = [];

      geojsonData.features.forEach((feature) => {
        const p = feature?.properties || {};
        const lat = p.latitude;
        const lng = p.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") return;

        const id = p.id;
        const velocity = p.velocity;
        const diff = p.diff;
        const color = p.color || NEUTRAL_FILL;

        const circle = L.circle([lat, lng], {
          pane: "movementPane",
          radius: 4,
          ...getDiffRestingCircleStyle(color, map.getZoom()),
        });

        circle._movementVelocity = velocity;
        circle._movementId = id;
        circle._movementDiff = diff;
        circle._movementColor = color;
        circle._movementFeature = feature;

        circle.on("mouseover", function () {
          // Keep the selected point yellow regardless of hover
          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(getHoverCircleStyle(map.getZoom()));
          }

          // 🆕 Tooltip on hover, same pattern as velocity mode
          const tooltipContent = `
            <div style="padding: 2px 6px; font-size: 12px; font-weight: 600; line-height: 1.3;">
              ID: ${escapeHtml(id)} <br />
              Diff: ${escapeHtml(diff)} mm
            </div>
          `;
          this.bindTooltip(tooltipContent, {
            permanent: false,
            direction: "top",
            offset: [0, -10],
            className: "velocity-tooltip",
          }).openTooltip();
        });

        circle.on("mouseout", function () {
          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(
              getDiffRestingCircleStyle(this._movementColor, map.getZoom()),
            );
          }
          this.closeTooltip();
        });

        circle.on("click", async function () {
          // Toggle off if already selected
          if (selectedMovementMarkerRef.current === this) {
            this.setStyle(
              getDiffRestingCircleStyle(this._movementColor, map.getZoom()),
            );
            selectedMovementMarkerRef.current = null;
            setShowChart(false);
            setShowDiffChart(false);
            return;
          }

          // Restore previous selection to its diff color
          if (selectedMovementMarkerRef.current) {
            const prev = selectedMovementMarkerRef.current;
            prev.setStyle(
              getDiffRestingCircleStyle(prev._movementColor, map.getZoom()),
            );
          }

          // Highlight this one
          selectedMovementMarkerRef.current = this;
          this.setStyle(getSelectedCircleStyle(map.getZoom()));

          // 🆕 Open the difference chart for this point
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
            logError("Error fetching diff point details:", err);
          }
        });

        diffMarkersRef.current.push(circle);
      });

      // Attach only if we're currently in difference mode
      if (selectedLayer === "difference") {
        diffMarkersRef.current.forEach((m) => m.addTo(map));
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

  // Fetch + render diff when in Difference mode with valid dates.
  // Tear down and clear when leaving Difference mode.
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;

    if (selectedLayer !== "difference") {
      removeAllFromMap(mapRef.current, diffMarkersRef.current);
      diffMarkersRef.current = [];
      clearVelocityDiff();
      return;
    }

    if (!diffStartDate || !diffEndDate) {
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await loadVelocityDiff(diffStartDate, diffEndDate);
      if (cancelled) return;
      if (!result?.data) return;
      if (!mapRef.current || !isMapReadyRef.current) return;

      console.log(
        `%c[3] useDifferenceLayer  handing  ${result.data.features?.length ?? 0} features to addDiffPointsToMap`,
        "color:#0ea5e9",
      );

      addDiffPointsToMap(mapRef.current, result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedLayer,
    diffStartDate,
    diffEndDate,
    loadVelocityDiff,
    clearVelocityDiff,
    addDiffPointsToMap,
  ]);

  // If the diff data reference changes while still in Difference mode,
  // re-render the circles (e.g. cache hit after switching back).
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;
    if (selectedLayer !== "difference") return;
    if (!velocityDiff) return;

    if (
      diffMarkersRef.current.length === 0 ||
      (diffMarkersRef.current.length > 0 &&
        !mapRef.current.hasLayer(diffMarkersRef.current[0]))
    ) {
      addDiffPointsToMap(mapRef.current, velocityDiff);
    }
  }, [selectedLayer, velocityDiff, addDiffPointsToMap]);
}
