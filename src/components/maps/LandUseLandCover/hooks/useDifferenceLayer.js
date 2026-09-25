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
  velocityDiff,
  multiPointSelection,
  diffPointDataRef
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
        circle._isMovementSelected = false;

        circle.on("mouseover", function () {
          // Keep the selected point yellow regardless of hover
          if (this._isMovementSelected) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(getHoverCircleStyle(map.getZoom()));
          }

          // 🆕 Tooltip on hover, same pattern as velocity mode
          const tooltipContent = `
            <div style="padding: 2px 6px; font-size: 12px; font-weight: 600; line-height: 1.3;">
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
          if (this._isMovementSelected) {
            this.setStyle(getSelectedCircleStyle(map.getZoom()));
          } else {
            this.setStyle(
              getDiffRestingCircleStyle(this._movementColor, map.getZoom()),
            );
            this._isMovementSelected = false;
          }
          this.closeTooltip();
        });

        circle.on("click", async function () {
          if (multiPointSelection && this._isMovementSelected) {
            this.setStyle(getDiffRestingCircleStyle(this._movementColor, map.getZoom()));
            this._isMovementSelected = false;
            setDiffPointData((prev) => {
              const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
              const next = list.filter((item) => item.properties?.id !== id);
              return next.length > 1 ? next : next[0] || null;
            });
            setDiffDetailData((prev) => {
              const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
              const next = list.filter((item) => item.point?.properties?.id !== id);
              return next.length > 1 ? next : next[0]?.detail || null;
            });
            setShowDiffChart(true);
            return;
          }
          // Toggle off if already selected
          if (!multiPointSelection && selectedMovementMarkerRef.current === this) {
            this.setStyle(
              getDiffRestingCircleStyle(this._movementColor, map.getZoom()),
            );
            selectedMovementMarkerRef.current = null;
            setShowChart(false);
            setShowDiffChart(false);
            return;
          }

          // Restore previous selection to its diff color
          if (!multiPointSelection && selectedMovementMarkerRef.current) {
            const prev = selectedMovementMarkerRef.current;
            prev.setStyle(
              getDiffRestingCircleStyle(prev._movementColor, map.getZoom()),
            );
            prev._isMovementSelected = false;
          }

          // Highlight this one
          selectedMovementMarkerRef.current = this;
          this._isMovementSelected = true;
          this._isMovementSelected = true;
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
                if (multiPointSelection) {
                  setDiffPointData((prev) => {
                    const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
                    return [...list.filter((item) => item.properties?.id !== id), feature];
                  });
                  setDiffDetailData((prev) => {
                    const currentPoints = diffPointDataRef.current;
                    const oldPoints = Array.isArray(currentPoints) ? currentPoints : currentPoints ? [currentPoints] : [];
                    const list = Array.isArray(prev) ? prev : prev ? [{ point: oldPoints[0], detail: prev }].filter((item) => item.point) : [];
                    return [...list.filter((item) => item.point?.properties?.id !== id), { point: feature, detail: detailData }];
                  });
                } else {
                  setDiffPointData(feature);
                  setDiffDetailData(detailData);
                }
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
      multiPointSelection,
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
