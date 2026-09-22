import { TILE_LAYER_URL } from "../constants";
import { log, logError } from "../mapUtils";
import { useEffect, useRef } from "react";

export function useLayerSyncEffects({
  activeLayers,
  addFlyoverLayers,
  addLiveSegmentLayer,
  addMovementPointsToMap,
  availableDates,
  diffEndDate,
  diffStartDate,
  dividerLineRef,
  error,
  flyoverEntries,
  flyovers,
  handleFlyoverButtonClick,
  isActive,
  isMapReadyRef,
  isMountedRef,
  layerControlWrapperRef,
  leftLayerRef,
  liveSegmentLayerRef,
  liveSegments,
  loadLiveSegments,
  loading,
  lulcCreatedRef,
  mapContainerRef,
  mapRef,
  movementError,
  movementPoints,
  rightLayerRef,
  selectedLayer,
  setDiffEndDate,
  setDiffStartDate,
  showLULC,
  showSegmentsUI,
  sideBySideRef,
  tagRef,
  updateLayerVisibility,
  updateMovementVisibility,
  yearLeft,
  yearRight,
  zoomControlContainerRef,
}) {
  useEffect(() => {
    if (
      availableDates &&
      availableDates.length > 0 &&
      !diffStartDate &&
      !diffEndDate
    ) {
      setDiffStartDate(availableDates[0]);
      setDiffEndDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates]);

  useEffect(() => {
    if (movementPoints && movementPoints.length > 0) {
      log(`Movement Points loaded: ${movementPoints.length} points`);
      log("Sample point:", movementPoints[0]);
    }

    if (movementError) {
      logError("Movement Points Error:", movementError);
    }

    if (availableDates && availableDates.length > 0) {
      log("Available dates:", availableDates);
    }
  }, [movementPoints, movementError, availableDates]);

  useEffect(() => {
    if (!mapRef.current || !isActive) {
      return;
    }

    if (!movementPoints || movementPoints.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        addMovementPointsToMap(mapRef.current, movementPoints);
      } catch (err) {
        logError("[LULC] Error adding movement points:", err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [movementPoints, isActive, addMovementPointsToMap]);

  useEffect(() => {
    if (!mapRef.current) return;
    updateMovementVisibility();
  }, [selectedLayer, updateMovementVisibility]);

  useEffect(() => {
    if (loading || error) {
      return;
    }

    const zoomEl = zoomControlContainerRef.current;
    const wrapperEl = layerControlWrapperRef.current;

    if (!zoomEl || !wrapperEl) {
      return;
    }

    if (wrapperEl.firstChild !== zoomEl) {
      wrapperEl.insertBefore(zoomEl, wrapperEl.firstChild);
    }
  }, [loading, error]);

  useEffect(() => {
    if (mapRef.current) {
      updateLayerVisibility();
    }
  }, [activeLayers, updateLayerVisibility]);

  useEffect(() => {
    if (!leftLayerRef.current || !rightLayerRef.current) {
      return;
    }

    leftLayerRef.current.setUrl(
      TILE_LAYER_URL.replace("{year}", String(yearLeft)),
    );
    rightLayerRef.current.setUrl(
      TILE_LAYER_URL.replace("{year}", String(yearRight)),
    );
  }, [yearLeft, yearRight]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!lulcCreatedRef.current) {
      return;
    }

    const opacity = showLULC ? 1 : 0;

    leftLayerRef.current?.setOpacity(opacity);
    rightLayerRef.current?.setOpacity(opacity);

    const controlEl = sideBySideRef.current?._container;

    if (controlEl) {
      controlEl.style.opacity = String(opacity);
      controlEl.style.pointerEvents = showLULC ? "auto" : "none";
    }

    if (tagRef.current) {
      tagRef.current.style.opacity = String(opacity);
    }

    if (dividerLineRef.current) {
      dividerLineRef.current.style.opacity = String(opacity);
    }
  }, [showLULC]);

  const hasAutoClickedFirstFlyoverRef = useRef(false);

  useEffect(() => {
    if (hasAutoClickedFirstFlyoverRef.current) return;
    if (!flyoverEntries.length) return;
    if (!activeLayers.includes("linear")) return;

    const first = flyoverEntries[0];
    if (!first || !first.bounds || !first.bounds.isValid()) return;

    hasAutoClickedFirstFlyoverRef.current = true;

    // 🆕 Delay so the map settles before zooming
    const delayMs = 50;

    const timeoutId = setTimeout(() => {
      if (!mapRef.current) return;
      handleFlyoverButtonClick(first);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [flyoverEntries, activeLayers, handleFlyoverButtonClick]);

  useEffect(() => {
    if (!mapRef.current || !isActive) {
      return;
    }

    if (!flyovers || flyovers.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        addFlyoverLayers(mapRef.current);
      } catch (err) {
        logError("[LULC] Error adding flyover layers:", err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [flyovers, isActive, addFlyoverLayers]);

  useEffect(() => {
    if (!isActive || !mapRef.current || !mapContainerRef.current) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      try {
        if (
          mapRef.current &&
          mapContainerRef.current &&
          document.contains(mapContainerRef.current)
        ) {
          mapRef.current.invalidateSize();
        }
      } catch (err) {
        logError("[LULC] Error invalidating size on active:", err);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;
    if (!showSegmentsUI || !liveSegments) return;

    const timeoutId = setTimeout(() => {
      try {
        addLiveSegmentLayer(mapRef.current);
      } catch (err) {
        logError("[LULC] Error adding segment layer:", err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [showSegmentsUI, liveSegments, addLiveSegmentLayer]);

  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;

    if (!activeLayers.includes("linear") && !showSegmentsUI) {
      if (
        liveSegmentLayerRef.current &&
        mapRef.current.hasLayer(liveSegmentLayerRef.current)
      ) {
        mapRef.current.removeLayer(liveSegmentLayerRef.current);
        liveSegmentLayerRef.current = null;
      }
      return;
    }

    if (
      liveSegments &&
      liveSegments.features &&
      liveSegments.features.length > 0
    ) {
      if (
        liveSegmentLayerRef.current &&
        mapRef.current.hasLayer(liveSegmentLayerRef.current)
      ) {
        return;
      }

      const timeoutId = setTimeout(() => {
        try {
          addLiveSegmentLayer(mapRef.current);
        } catch (err) {
          logError("[LULC] Error adding segment layer:", err);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    } else if (showSegmentsUI && !liveSegments) {
      loadLiveSegments().catch((err) => {
        logError("[LULC] Error loading live segments:", err);
      });
    }
  }, [
    showSegmentsUI,
    liveSegments,
    loadLiveSegments,
    addLiveSegmentLayer,
    activeLayers,
  ]);
}