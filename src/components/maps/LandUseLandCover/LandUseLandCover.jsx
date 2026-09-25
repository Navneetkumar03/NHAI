import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { useFlyoverData } from "../../../hooks/useFlyoverData";
import { useMovementPoints } from "../../../hooks/useMovementPoints";
import { useFlyoverSegments } from "../../../hooks/useFlyoverSegments";
import {
  DEFAULT_CENTER,
  RAINFALL_YEARS,
  SOIL_TYPE_COLORS,
  YEARS,
} from "./constants";

import { useSegmentLayer } from "./hooks/useSegmentLayer";
import { useMovementLayer } from "./hooks/useMovementLayer";
import { useDifferenceLayer } from "./hooks/useDifferenceLayer";
import { useFlyoverLayer } from "./hooks/useFlyoverLayer";
import { useLandUseMap } from "./hooks/useLandUseMap";
import { useOverlayLayers } from "./hooks/useOverlayLayers";

import { useLayerControls } from "./hooks/useLayerControls";
import { useFlyoverInteractions } from "./hooks/useFlyoverInteractions";
import { useGeolocation } from "./hooks/useGeolocation";
import { useSoilData } from "./hooks/useSoilData"; // 🆕 restored — feeds the GeoJSON soil-boundary overlay
import { useResponsiveUI } from "./hooks/useResponsiveUI";
import { useLayerSyncEffects } from "./hooks/useLayerSyncEffects";

import { TopControlBar } from "./sections/TopControlBar";
import { MapOverlays } from "./sections/MapOverlays";
import { LAYER_MENU, getOverlay } from "./overlayRegistry";

export function LandUseLandCover({
  mapCenter = DEFAULT_CENTER,
  defaultLeftYear = YEARS[0],
  defaultRightYear = YEARS[YEARS.length - 1],
  className = "",
  isActive = true,
}) {
  /* ---------------- Refs --------------- */

  console.log("useMovementPoints", useMovementPoints)

  const mapContainerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const mapWrapperRef = useRef(null); // outer map box, used for mobile auto-scroll

  const zoomControlContainerRef = useRef(null);
  const layerControlWrapperRef = useRef(null);

  const mapRef = useRef(null);
  const leftLayerRef = useRef(null);
  const rightLayerRef = useRef(null);
  const sideBySideRef = useRef(null);

  const lulcCreatedRef = useRef(false);

  const streetLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const esriSatelliteLayerRef = useRef(null);

  const flyoverLayersRef = useRef([]);
  const flyoverMarkersRef = useRef([]);
  const movementMarkersRef = useRef([]);

  // Difference-mode circles share the same L.circle / zoom-weight approach
  // as velocity mode, so they're tracked here for both zoom updates and
  // cleanup.
  const diffMarkersRef = useRef([]);

  const selectedMovementMarkerRef = useRef(null);

  const liveSegmentLayerRef = useRef(null);
  const selectedPolygonLayerRef = useRef(null);

  const tagRef = useRef(null);
  const dividerLineRef = useRef(null);
  const rafIdRef = useRef(null);
  const debounceRef = useRef(null);
  const dividerReadyTimeoutRef = useRef(null);

  const resizeObserverRef = useRef(null);

  const isMountedRef = useRef(true);
  const isMapReadyRef = useRef(false);
  const hasFitBoundsRef = useRef(false);

  const flyoverButtonsContainerRef = useRef(null);
  const flyoverBoundsRef = useRef([]); // [{ id, name, bounds, layers, markers }]

  /* GPS refs */
  const userLocationMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);

  // 🆕 Soil-boundary (GeoJSON) layer refs — used only by overlays/soilBoundary.js
  const soilLayerRef = useRef(null);
  const soilDataRef = useRef(null);
  const hasFitSoilBoundsRef = useRef(false);

  /* ---------------- State ---------------- */
  const [activeFlyoverId, setActiveFlyoverId] = useState(null);

  const [showChart, setShowChart] = useState(false);
  const [selectedPointForChart, setSelectedPointForChart] = useState(null);
  const [selectedDetailForChart, setSelectedDetailForChart] = useState(null);
  const [multiPointSelection, setMultiPointSelection] = useState(false);
  const selectedPointForChartRef = useRef(null);
  const diffPointDataRef = useRef(null);

  const [showDiffChart, setShowDiffChart] = useState(false);
  const [diffPointData, setDiffPointData] = useState(null);
  const [diffDetailData, setDiffDetailData] = useState(null);
  selectedPointForChartRef.current = selectedPointForChart;
  diffPointDataRef.current = diffPointData;
  const [diffStartDate, setDiffStartDate] = useState("");
  const [diffEndDate, setDiffEndDate] = useState("");

  const [selectedLayer, setSelectedLayer] = useState("velocity");

  const [yearLeft, setYearLeft] = useState(defaultLeftYear);
  const [yearRight, setYearRight] = useState(defaultRightYear);

  // Rainfall layer's currently-selected year. Defaults to the newest
  // supported year. Changing this while Rainfall is enabled hot-swaps
  // the tile URL via useOverlayLayers' Pass 1.5.
  const [rainfallYear, setRainfallYear] = useState(
    RAINFALL_YEARS[RAINFALL_YEARS.length - 1],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDividerReady, setIsDividerReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

  const [activeLayers, setActiveLayers] = useState(["linear", "movement"]);
  const [baseLayer, setBaseLayer] = useState("streets");

  // 🆕 Soil-boundary (GeoJSON) state — fed by useSoilData below.
  // Kept fully separate from the tile soil layer's taxoValues/soilLoading/
  // soilError so neither layer's code path can disturb the other.
  const [soilBoundaryData, setSoilBoundaryData] = useState(null);
  const [soilBoundaryLoading, setSoilBoundaryLoading] = useState(true);
  const [soilBoundaryError, setSoilBoundaryError] = useState(null);
  const [soilBoundaryTaxoValues, setSoilBoundaryTaxoValues] = useState([]);

  // Soil (tile) is a tile layer — no fetch, no loading state.
  // Legend values come straight from the single source of truth.
  // Kept as constants with the same names so MapOverlays needs no edits
  // for the tile layer's own legend block.
  const taxoValues = Object.keys(SOIL_TYPE_COLORS);
  const soilLoading = false;
  const soilError = null;

  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [segmentData, setSegmentData] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [polygonLoading, setPolygonLoading] = useState(false);
  const [showSegmentTable, setShowSegmentTable] = useState(false);

  const [showOverview, setShowOverview] = useState(true);
  const [flyoverEntries, setFlyoverEntries] = useState([]);

  /* ---------------- Google Traffic ---------------- */

  const [showTrafficPanel, setShowTrafficPanel] = useState(false);
  const [selectedFlyoverForTraffic, setSelectedFlyoverForTraffic] =
    useState(null);

  // Keep the map hidden until the default flyover view has been applied.
  // This prevents the zoomed-out regional view from flashing before the
  // first flyover is selected.
  const [defaultFlyoverViewReady, setDefaultFlyoverViewReady] = useState(false);
  const hasAppliedDefaultFlyoverRef = useRef(false);

  /* ---------------- Data hooks ---------------- */

  const { flyovers, loading: flyoversLoading } = useFlyoverData();

  const {
    points: movementPoints,
    loading: movementLoading,
    error: movementError,
    availableDates,
    selectPoint,
    velocityDiff,
    velocityDiffRange,
    velocityDiffLoading,
    velocityDiffError,
    loadVelocityDiff,
    clearVelocityDiff,
  } = useMovementPoints();

  const {
    liveSegments,
    error: segmentsError,
    loadLiveSegments,
    loadPolygonSegment,
    loadSegmentStats,
  } = useFlyoverSegments();

  const availableLayers = LAYER_MENU;

  const showDifferenceUI = selectedLayer === "difference";
  const showVelocityUI = selectedLayer === "velocity";
  const showSegmentsUI = activeLayers.includes("linear");

  /* ==========================================================================
   * OVERLAY LAYERS (registry-driven)
   * ========================================================================*/

  const {
    enabled,
    toggle: toggleOverlay,
    set: setOverlay,
  } = useOverlayLayers({
    mapRef,
    isMapReadyRef,
    // 🆕 soilBoundaryData drives the retry: overlays/soilBoundary.js's add()
    // returns null until soilDataRef.current is populated, so this effect
    // must re-run once the GeoJSON fetch resolves.
    refreshKey: soilBoundaryData,
    rainfallYear,     // drives the year hot-swap in Pass 1.5
    ctx: {
      dividerLineRef,
      hasFitBoundsRef,
      leftLayerRef,
      lulcCreatedRef,
      rafIdRef,
      rightLayerRef,
      setIsDividerReady,
      sideBySideRef,
      tagRef,
      yearLeft,
      yearRight,
      rainfallYear,   // readable by rainfallOverlay.add()
      // 🆕 needed by overlays/soilBoundary.js's add()/remove()
      soilDataRef,
      soilLayerRef,
      hasFitSoilBoundsRef,
      mapContainerRef,
    },
  });

  const showLULC = enabled.lulc;
  const showSoil = enabled.soil;
  const showSoilBoundary = enabled.soilBoundary; // 🆕
  const showDEM = enabled.dem;

  /* ==========================================================================
   * SEGMENT FUNCTIONS
   * ========================================================================*/

  const { handleSegmentRowClick, addLiveSegmentLayer } = useSegmentLayer({
    isMapReadyRef,
    liveSegmentLayerRef,
    liveSegments,
    loadPolygonSegment,
    loadSegmentStats,
    mapRef,
    segmentData,
    segmentLoading,
    selectedPolygonLayerRef,
    selectedSegmentId,
    setPolygonLoading,
    setSegmentData,
    setSegmentLoading,
    setSelectedSegmentId,
    showSegmentsUI,
  });

  /* ==========================================================================
   * MOVEMENT POINTS (velocity mode)
   * ========================================================================*/

  const {
    updateCircleWeights,
    addMovementPointsToMap,
    updateMovementVisibility,
  } = useMovementLayer({
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
    setShowDiffChart,
    multiPointSelection,
    selectedPointForChartRef,
  });

  /* ==========================================================================
   * DIFFERENCE-MODE CIRCLES
   * ========================================================================*/

  useDifferenceLayer({
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
    diffPointDataRef,
  });

  /* ==========================================================================
   * FLYOVER LAYERS
   * ========================================================================*/

  const { updateLayerVisibility, addFlyoverLayers } = useFlyoverLayer({
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
  });

  /* ==========================================================================
   * UI HANDLERS
   * ========================================================================*/

  const {
    handleLayerChange,
    handleLayerToggle,
    handleBaseLayerChange,
    toggleFullscreen,
  } = useLayerControls({
    activeLayers,
    addFlyoverLayers,
    addLiveSegmentLayer,
    esriSatelliteLayerRef,
    flyoverEntries,
    flyoverLayersRef,
    flyoverMarkersRef,
    flyovers,
    fullscreenContainerRef,
    isMapReadyRef,
    leftLayerRef,
    liveSegmentLayerRef,
    liveSegments,
    loadLiveSegments,
    loadSegmentStats,
    mapRef,
    rightLayerRef,
    satelliteLayerRef,
    selectedPolygonLayerRef,
    setActiveFlyoverId,
    setActiveLayers,
    setBaseLayer,
    setDiffDetailData,
    setDiffPointData,
    setSegmentData,
    setSegmentLoading,
    setSelectedDetailForChart,
    setSelectedFlyoverForTraffic,
    setSelectedLayer,
    setSelectedPointForChart,
    setShowChart,
    setShowDiffChart,
    setShowOverview,
    setShowSegmentTable,
    setShowTrafficPanel,
    sideBySideRef,
    streetLayerRef,
  });

  const handleLayerToggleAdapter = useCallback(
    (id) => {
      const overlay = getOverlay(id);

      // Non-registered controls (for example the experimental rainfall
      // layer) still own their state in the legacy handler.
      if (!overlay) {
        handleLayerToggle(id);
        return;
      }

      // Custom overlays may open a panel or load data, but they must still
      // update registry state. Otherwise `exclusive: true` is never applied.
      if (overlay.custom) {
        handleLayerToggle(id);
      }

      toggleOverlay(id);
    },
    [toggleOverlay, handleLayerToggle],
  );

  // A different exclusive overlay can disable Traffic without invoking its
  // click handler. Close its panel and clear its legacy active flag as well.
  useEffect(() => {
    if (enabled.traffic) return;

    setActiveLayers((layers) => layers.filter((id) => id !== "traffic"));
    setShowTrafficPanel(false);
    setSelectedFlyoverForTraffic(null);
  }, [enabled.traffic]);

  /* ==========================================================================
   * LULC TEARDOWN WHEN TAB INACTIVE
   * Replaces the old useLULCLayer().teardownLULCLayers() call. Turning the
   * LULC overlay off through the registry triggers overlays/lulc.js remove(),
   * which is where the teardown now lives.
   * ========================================================================*/

  useEffect(() => {
    if (isActive) return;
    setOverlay("lulc", false);
  }, [isActive, setOverlay]);

  const { handleFlyoverButtonClick } = useFlyoverInteractions({
    activeFlyoverId,
    flyoverBoundsRef,
    mapRef,
    setActiveFlyoverId,
  });

  /* ==========================================================================
   * GPS / LOCATE-ME
   * ========================================================================*/
  const { handleLocateMe, clearLocation, gpsLoading, gpsError, gpsActive } =
    useGeolocation({
      mapRef,
      userAccuracyCircleRef,
      userLocationMarkerRef,
    });

  /* ==========================================================================
   * SOIL BOUNDARY DATA (GeoJSON) — 🆕 restored
   * Fetches Soil.geojson once on mount and feeds overlays/soilBoundary.js
   * via soilDataRef. Independent of the tile soil layer entirely.
   * ========================================================================*/

  useSoilData({
    setSoilData: setSoilBoundaryData,
    setSoilError: setSoilBoundaryError,
    setSoilLoading: setSoilBoundaryLoading,
    setTaxoValues: setSoilBoundaryTaxoValues,
    soilDataRef,
  });

  /* ==========================================================================
   * EFFECTS
   * ========================================================================*/

  console.log(" points: movementPoints", movementPoints,)
  useLayerSyncEffects({
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
  });

  useResponsiveUI({
    mapContainerRef,
    mapRef,
    setIsFullscreen,
    setIsMobile,
  });

  /* MOBILE: when this page/tab is opened on a phone, automatically scroll
     down to the END of the map, so the bottom edge of the map lines up with
     the bottom of the screen. */
  useEffect(() => {
    if (!isActive) return;
    if (window.innerWidth > 1024) return;

    const t = setTimeout(() => {
      mapWrapperRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 400);

    return () => clearTimeout(t);
  }, [isActive]);

  /* ==========================================================================
   * DEFAULT FLYOVER VIEW
   * ========================================================================*/
  useEffect(() => {
    if (!isActive) {
      hasAppliedDefaultFlyoverRef.current = false;
      setDefaultFlyoverViewReady(false);
      return;
    }

    if (hasAppliedDefaultFlyoverRef.current) return;

    let cancelled = false;
    let retryTimer = null;

    const applyDefaultFlyoverView = () => {
      if (cancelled || hasAppliedDefaultFlyoverRef.current) return;

      const map = mapRef.current;
      const defaultEntry = flyoverEntries[0];

      const boundsEntry = defaultEntry
        ? flyoverBoundsRef.current.find((entry) => entry.id === defaultEntry.id)
        : null;

      if (!isMapReadyRef.current || !map || !defaultEntry || !boundsEntry) {
        retryTimer = window.setTimeout(applyDefaultFlyoverView, 50);
        return;
      }

      map.invalidateSize({ animate: false });
      handleFlyoverButtonClick(defaultEntry);
      setActiveFlyoverId(defaultEntry.id);
      hasAppliedDefaultFlyoverRef.current = true;

      requestAnimationFrame(() => {
        if (!cancelled) {
          setDefaultFlyoverViewReady(true);
        }
      });
    };

    applyDefaultFlyoverView();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [isActive, flyoverEntries, handleFlyoverButtonClick]);

  /* ==========================================================================
   * INITIALIZE MAP
   * ========================================================================*/

  useLandUseMap({
    ResizeObserver,
    addFlyoverLayers,
    debounceRef,
    diffMarkersRef,
    dividerReadyTimeoutRef,
    esriSatelliteLayerRef,
    flyovers,
    // 🆕 restored — useLandUseMap's unmount cleanup nulls these out
    hasFitSoilBoundsRef,
    isMapReadyRef,
    isMountedRef,
    leftLayerRef,
    liveSegmentLayerRef,
    lulcCreatedRef,
    mapCenter,
    mapContainerRef,
    mapRef,
    rafIdRef,
    resizeObserverRef,
    rightLayerRef,
    satelliteLayerRef,
    selectedMovementMarkerRef,
    selectedPolygonLayerRef,
    setError,
    setLoading,
    sideBySideRef,
    // 🆕 restored
    soilDataRef,
    soilLayerRef,
    streetLayerRef,
    updateCircleWeights,
    zoomControlContainerRef,
  });

  /* ==========================================================================
   * RENDER
   * ========================================================================*/

  return (
    <div
      className={`flex flex-col h-full w-full ${className}`}
      ref={fullscreenContainerRef}
      style={{
        background: "#ffffff",
        paddingTop: isFullscreen ? "10px" : "0px",
      }}
    >
      {/* TOP CONTROL BAR */}
      <TopControlBar
        availableDates={availableDates}
        diffEndDate={diffEndDate}
        diffStartDate={diffStartDate}
        handleLayerChange={handleLayerChange}
        rainfallYear={rainfallYear}
        selectedLayer={selectedLayer}
        setDiffEndDate={setDiffEndDate}
        setDiffStartDate={setDiffStartDate}
        setRainfallYear={setRainfallYear}
        setShowOverview={setShowOverview}
        setShowSegmentTable={setShowSegmentTable}
        setYearLeft={setYearLeft}
        setYearRight={setYearRight}
        showDifferenceUI={showDifferenceUI}
        showLULC={showLULC}
        showOverview={showOverview}
        showRainfall={enabled.rainfall}
        showSegmentTable={showSegmentTable}
        yearLeft={yearLeft}
        yearRight={yearRight}
      />

      {/* MAP CONTAINER */}
      <div
        ref={mapWrapperRef}
        className="flex-1 min-h-0 relative rounded-lg overflow-hidden border border-gray-200"
        style={{
          height: isMobile ? "450px" : "100%",
          minHeight: isMobile ? "400px" : "auto",
        }}
      >
        {!defaultFlyoverViewReady && (
          <div className="absolute inset-0 z-[5000] flex items-center justify-center px-4 bg-white">
            <div className="text-center">
              <div
                className="
          mx-auto
          h-10
          w-10
          animate-spin
          rounded-full
          border-b-2
          border-blue-500
          sm:h-12
          sm:w-12
        "
              />

              <p className="mt-4 text-sm text-gray-600 sm:text-base">
                Loading InfraRisk Map...
              </p>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0 transition-none"
          style={{
            opacity: defaultFlyoverViewReady ? 1 : 0,
            visibility: defaultFlyoverViewReady ? "visible" : "hidden",
          }}
        >
          <div ref={mapContainerRef} className="absolute inset-0" />

          <MapOverlays
            activeFlyoverId={activeFlyoverId}
            activeLayers={activeLayers}
            availableLayers={availableLayers}
            baseLayer={baseLayer}
            diffDetailData={diffDetailData}
            diffEndDate={diffEndDate}
            diffPointData={diffPointData}
            diffStartDate={diffStartDate}
            dividerLineRef={dividerLineRef}
            enabled={enabled}
            error={error}
            flyoverButtonsContainerRef={flyoverButtonsContainerRef}
            flyoverEntries={flyoverEntries}
            flyoversLoading={flyoversLoading}
            gpsActive={gpsActive}
            gpsError={gpsError}
            gpsLoading={gpsLoading}
            onClearLocation={clearLocation}
            handleLocateMe={handleLocateMe}
            handleBaseLayerChange={handleBaseLayerChange}
            handleFlyoverButtonClick={handleFlyoverButtonClick}
            handleLayerToggle={handleLayerToggleAdapter}
            handleSegmentRowClick={handleSegmentRowClick}
            isFullscreen={isFullscreen}
            isLayerPanelOpen={isLayerPanelOpen}
            isMobile={isMobile}
            layerControlWrapperRef={layerControlWrapperRef}
            loading={loading}
            movementError={movementError}
            movementLoading={movementLoading}
            segmentData={segmentData}
            segmentLoading={segmentLoading}
            segmentsError={segmentsError}
            selectedDetailForChart={selectedDetailForChart}
            selectedFlyoverForTraffic={selectedFlyoverForTraffic}
            selectedPointForChart={selectedPointForChart}
            selectedSegmentId={selectedSegmentId}
            setDiffDetailData={setDiffDetailData}
            setDiffPointData={setDiffPointData}
            setIsLayerPanelOpen={setIsLayerPanelOpen}
            setSelectedDetailForChart={setSelectedDetailForChart}
            setSelectedFlyoverForTraffic={setSelectedFlyoverForTraffic}
            setSelectedPointForChart={setSelectedPointForChart}
            setShowChart={setShowChart}
            setShowDiffChart={setShowDiffChart}
            setShowOverview={setShowOverview}
            setShowSegmentTable={setShowSegmentTable}
            setShowTrafficPanel={setShowTrafficPanel}
            showChart={showChart}
            multiPointSelection={multiPointSelection}
            setMultiPointSelection={setMultiPointSelection}
            showDiffChart={showDiffChart}
            showDifferenceUI={showDifferenceUI}
            showLULC={showLULC}
            showOverview={showOverview}
            showSegmentTable={showSegmentTable}
            showSegmentsUI={showSegmentsUI}
            showSoil={showSoil}
            showTrafficPanel={showTrafficPanel}
            showVelocityUI={showVelocityUI}
            soilError={soilError}
            soilLoading={soilLoading}
            tagRef={tagRef}
            taxoValues={taxoValues}
            toggleFullscreen={toggleFullscreen}
            velocityDiffError={velocityDiffError}
            velocityDiffLoading={velocityDiffLoading}
            velocityDiffRange={velocityDiffRange}
            yearLeft={yearLeft}
            yearRight={yearRight}
            showDEM={showDEM}
            // 🆕 Soil-boundary (GeoJSON) props — parallel set to the
            // showSoil/soilLoading/soilError/taxoValues props above, but for
            // the restored polygon layer. Requires the matching additions to
            // sections/MapOverlays.jsx discussed separately (new legend
            // block + prop destructuring) for these to actually render.
            showSoilBoundary={showSoilBoundary}
            soilBoundaryLoading={soilBoundaryLoading}
            soilBoundaryError={soilBoundaryError}
            soilBoundaryTaxoValues={soilBoundaryTaxoValues}
          />
        </div>
      </div>
    </div>
  );
}

export default LandUseLandCover;





// import { useCallback, useEffect, useRef, useState } from "react";
// import "leaflet/dist/leaflet.css";
// import "leaflet-side-by-side";
// import { useFlyoverData } from "../../../hooks/useFlyoverData";
// import { useMovementPoints } from "../../../hooks/useMovementPoints";
// import { useFlyoverSegments } from "../../../hooks/useFlyoverSegments";
// import {
//   DEFAULT_CENTER,
//   RAINFALL_YEARS,
//   SOIL_TYPE_COLORS,
//   YEARS,
// } from "./constants";

// import { useSegmentLayer } from "./hooks/useSegmentLayer";
// import { useMovementLayer } from "./hooks/useMovementLayer";
// import { useDifferenceLayer } from "./hooks/useDifferenceLayer";
// import { useFlyoverLayer } from "./hooks/useFlyoverLayer";
// import { useLandUseMap } from "./hooks/useLandUseMap";
// import { useOverlayLayers } from "./hooks/useOverlayLayers";

// import { useLayerControls } from "./hooks/useLayerControls";
// import { useFlyoverInteractions } from "./hooks/useFlyoverInteractions";
// import { useGeolocation } from "./hooks/useGeolocation";
// import { useResponsiveUI } from "./hooks/useResponsiveUI";
// import { useLayerSyncEffects } from "./hooks/useLayerSyncEffects";

// import { TopControlBar } from "./sections/TopControlBar";
// import { MapOverlays } from "./sections/MapOverlays";
// import { LAYER_MENU, getOverlay } from "./overlayRegistry";

// export function LandUseLandCover({
//   mapCenter = DEFAULT_CENTER,
//   defaultLeftYear = YEARS[0],
//   defaultRightYear = YEARS[YEARS.length - 1],
//   className = "",
//   isActive = true,
// }) {
//   /* ---------------- Refs --------------- */

//   const mapContainerRef = useRef(null);
//   const fullscreenContainerRef = useRef(null);
//   const mapWrapperRef = useRef(null); // outer map box, used for mobile auto-scroll

//   const zoomControlContainerRef = useRef(null);
//   const layerControlWrapperRef = useRef(null);

//   const mapRef = useRef(null);
//   const leftLayerRef = useRef(null);
//   const rightLayerRef = useRef(null);
//   const sideBySideRef = useRef(null);

//   const lulcCreatedRef = useRef(false);

//   const streetLayerRef = useRef(null);
//   const satelliteLayerRef = useRef(null);
//   const esriSatelliteLayerRef = useRef(null);

//   const flyoverLayersRef = useRef([]);
//   const flyoverMarkersRef = useRef([]);
//   const movementMarkersRef = useRef([]);

//   // Difference-mode circles share the same L.circle / zoom-weight approach
//   // as velocity mode, so they're tracked here for both zoom updates and
//   // cleanup.
//   const diffMarkersRef = useRef([]);

//   const selectedMovementMarkerRef = useRef(null);

//   const liveSegmentLayerRef = useRef(null);
//   const selectedPolygonLayerRef = useRef(null);

//   const tagRef = useRef(null);
//   const dividerLineRef = useRef(null);
//   const rafIdRef = useRef(null);
//   const debounceRef = useRef(null);
//   const dividerReadyTimeoutRef = useRef(null);

//   const resizeObserverRef = useRef(null);

//   const isMountedRef = useRef(true);
//   const isMapReadyRef = useRef(false);
//   const hasFitBoundsRef = useRef(false);

//   const flyoverButtonsContainerRef = useRef(null);
//   const flyoverBoundsRef = useRef([]); // [{ id, name, bounds, layers, markers }]

//   /* GPS refs */
//   const userLocationMarkerRef = useRef(null);
//   const userAccuracyCircleRef = useRef(null);

//   const soilLayerRef = useRef(null);
//   const soilDataRef = useRef(null);
//   const hasFitSoilBoundsRef = useRef(false);

//   /* ---------------- State ---------------- */
//   const [activeFlyoverId, setActiveFlyoverId] = useState(null);

//   const [showChart, setShowChart] = useState(false);
//   const [selectedPointForChart, setSelectedPointForChart] = useState(null);
//   const [selectedDetailForChart, setSelectedDetailForChart] = useState(null);

//   const [showDiffChart, setShowDiffChart] = useState(false);
//   const [diffPointData, setDiffPointData] = useState(null);
//   const [diffDetailData, setDiffDetailData] = useState(null);
//   const [diffStartDate, setDiffStartDate] = useState("");
//   const [diffEndDate, setDiffEndDate] = useState("");

//   const [selectedLayer, setSelectedLayer] = useState("velocity");

//   const [yearLeft, setYearLeft] = useState(defaultLeftYear);
//   const [yearRight, setYearRight] = useState(defaultRightYear);

//   // Rainfall layer's currently-selected year. Defaults to the newest
//   // supported year. Changing this while Rainfall is enabled hot-swaps
//   // the tile URL via useOverlayLayers' Pass 1.5.
//   const [rainfallYear, setRainfallYear] = useState(
//     RAINFALL_YEARS[RAINFALL_YEARS.length - 1],
//   );

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [isDividerReady, setIsDividerReady] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

//   const [activeLayers, setActiveLayers] = useState(["linear", "movement"]);
//   const [baseLayer, setBaseLayer] = useState("streets");


//   const [soilBoundaryData, setSoilBoundaryData] = useState(null);
//   const [soilBoundaryLoading, setSoilBoundaryLoading] = useState(true);
//   const [soilBoundaryError, setSoilBoundaryError] = useState(null);
//   const [soilBoundaryTaxoValues, setSoilBoundaryTaxoValues] = useState([]);

//   // Soil is now a tile layer — no fetch, no loading state.
//   // Legend values come straight from the single source of truth.
//   // Kept as constants with the same names so MapOverlays needs no edits.
//   const taxoValues = Object.keys(SOIL_TYPE_COLORS);
//   const soilLoading = false;
//   const soilError = null;

//   const [selectedSegmentId, setSelectedSegmentId] = useState(null);
//   const [segmentData, setSegmentData] = useState([]);
//   const [segmentLoading, setSegmentLoading] = useState(false);
//   const [polygonLoading, setPolygonLoading] = useState(false);
//   const [showSegmentTable, setShowSegmentTable] = useState(false);

//   const [showOverview, setShowOverview] = useState(true);
//   const [flyoverEntries, setFlyoverEntries] = useState([]);

//   /* ---------------- Google Traffic ---------------- */

//   const [showTrafficPanel, setShowTrafficPanel] = useState(false);
//   const [selectedFlyoverForTraffic, setSelectedFlyoverForTraffic] =
//     useState(null);

//   // Keep the map hidden until the default flyover view has been applied.
//   // This prevents the zoomed-out regional view from flashing before the
//   // first flyover is selected.
//   const [defaultFlyoverViewReady, setDefaultFlyoverViewReady] = useState(false);
//   const hasAppliedDefaultFlyoverRef = useRef(false);

//   /* ---------------- Data hooks ---------------- */

//   const { flyovers, loading: flyoversLoading } = useFlyoverData();

//   const {
//     points: movementPoints,
//     loading: movementLoading,
//     error: movementError,
//     availableDates,
//     selectPoint,
//     velocityDiff,
//     velocityDiffRange,
//     velocityDiffLoading,
//     velocityDiffError,
//     loadVelocityDiff,
//     clearVelocityDiff,
//   } = useMovementPoints();

//   const {
//     liveSegments,
//     error: segmentsError,
//     loadLiveSegments,
//     loadPolygonSegment,
//     loadSegmentStats,
//   } = useFlyoverSegments();

//   const availableLayers = LAYER_MENU;

//   const showDifferenceUI = selectedLayer === "difference";
//   const showVelocityUI = selectedLayer === "velocity";
//   const showSegmentsUI = activeLayers.includes("linear");

//   /* ==========================================================================
//    * OVERLAY LAYERS (registry-driven)
//    * ========================================================================*/

//   const {
//     enabled,
//     toggle: toggleOverlay,
//     set: setOverlay,
//   } = useOverlayLayers({
//     mapRef,
//     isMapReadyRef,
//     refreshKey: null, // soil is now a tile layer; nothing async to refresh on
//     rainfallYear,     // drives the year hot-swap in Pass 1.5
//     ctx: {
//       dividerLineRef,
//       hasFitBoundsRef,
//       leftLayerRef,
//       lulcCreatedRef,
//       rafIdRef,
//       rightLayerRef,
//       setIsDividerReady,
//       sideBySideRef,
//       tagRef,
//       yearLeft,
//       yearRight,
//       rainfallYear,   // readable by rainfallOverlay.add()
//     },
//   });

//   const showLULC = enabled.lulc;
//   const showSoil = enabled.soil;
//   const showDEM = enabled.dem;

//   /* ==========================================================================
//    * SEGMENT FUNCTIONS
//    * ========================================================================*/

//   const { handleSegmentRowClick, addLiveSegmentLayer } = useSegmentLayer({
//     isMapReadyRef,
//     liveSegmentLayerRef,
//     liveSegments,
//     loadPolygonSegment,
//     loadSegmentStats,
//     mapRef,
//     segmentData,
//     segmentLoading,
//     selectedPolygonLayerRef,
//     selectedSegmentId,
//     setPolygonLoading,
//     setSegmentData,
//     setSegmentLoading,
//     setSelectedSegmentId,
//     showSegmentsUI,
//   });

//   /* ==========================================================================
//    * MOVEMENT POINTS (velocity mode)
//    * ========================================================================*/

//   const {
//     updateCircleWeights,
//     addMovementPointsToMap,
//     updateMovementVisibility,
//   } = useMovementLayer({
//     diffEndDate,
//     diffMarkersRef,
//     diffStartDate,
//     mapRef,
//     movementMarkersRef,
//     selectPoint,
//     selectedLayer,
//     selectedMovementMarkerRef,
//     setDiffDetailData,
//     setDiffPointData,
//     setSelectedDetailForChart,
//     setSelectedPointForChart,
//     setShowChart,
//     setShowDiffChart,
//   });

//   /* ==========================================================================
//    * DIFFERENCE-MODE CIRCLES
//    * ========================================================================*/

//   useDifferenceLayer({
//     clearVelocityDiff,
//     diffEndDate,
//     diffMarkersRef,
//     diffStartDate,
//     isMapReadyRef,
//     loadVelocityDiff,
//     mapRef,
//     selectPoint,
//     selectedLayer,
//     selectedMovementMarkerRef,
//     setDiffDetailData,
//     setDiffPointData,
//     setSelectedDetailForChart,
//     setSelectedPointForChart,
//     setShowChart,
//     setShowDiffChart,
//     updateCircleWeights,
//     velocityDiff,
//   });

//   /* ==========================================================================
//    * FLYOVER LAYERS
//    * ========================================================================*/

//   const { updateLayerVisibility, addFlyoverLayers } = useFlyoverLayer({
//     activeLayers,
//     flyoverBoundsRef,
//     flyoverLayersRef,
//     flyoverMarkersRef,
//     flyovers,
//     mapRef,
//     setActiveFlyoverId,
//     setFlyoverEntries,
//     setSelectedFlyoverForTraffic,
//     setShowChart,
//     setShowDiffChart,
//     setShowOverview,
//     setShowSegmentTable,
//     setShowTrafficPanel,
//   });

//   /* ==========================================================================
//    * UI HANDLERS
//    * ========================================================================*/

//   const {
//     handleLayerChange,
//     handleLayerToggle,
//     handleBaseLayerChange,
//     toggleFullscreen,
//   } = useLayerControls({
//     activeLayers,
//     addFlyoverLayers,
//     addLiveSegmentLayer,
//     esriSatelliteLayerRef,
//     flyoverEntries,
//     flyoverLayersRef,
//     flyoverMarkersRef,
//     flyovers,
//     fullscreenContainerRef,
//     isMapReadyRef,
//     leftLayerRef,
//     liveSegmentLayerRef,
//     liveSegments,
//     loadLiveSegments,
//     loadSegmentStats,
//     mapRef,
//     rightLayerRef,
//     satelliteLayerRef,
//     selectedPolygonLayerRef,
//     setActiveFlyoverId,
//     setActiveLayers,
//     setBaseLayer,
//     setDiffDetailData,
//     setDiffPointData,
//     setSegmentData,
//     setSegmentLoading,
//     setSelectedDetailForChart,
//     setSelectedFlyoverForTraffic,
//     setSelectedLayer,
//     setSelectedPointForChart,
//     setShowChart,
//     setShowDiffChart,
//     setShowOverview,
//     setShowSegmentTable,
//     setShowTrafficPanel,
//     sideBySideRef,
//     streetLayerRef,
//   });

//   const handleLayerToggleAdapter = useCallback(
//     (id) => {
//       const overlay = getOverlay(id);

//       // Non-registered controls (for example the experimental rainfall
//       // layer) still own their state in the legacy handler.
//       if (!overlay) {
//         handleLayerToggle(id);
//         return;
//       }

//       // Custom overlays may open a panel or load data, but they must still
//       // update registry state. Otherwise `exclusive: true` is never applied.
//       if (overlay.custom) {
//         handleLayerToggle(id);
//       }

//       toggleOverlay(id);
//     },
//     [toggleOverlay, handleLayerToggle],
//   );

//   // A different exclusive overlay can disable Traffic without invoking its
//   // click handler. Close its panel and clear its legacy active flag as well.
//   useEffect(() => {
//     if (enabled.traffic) return;

//     setActiveLayers((layers) => layers.filter((id) => id !== "traffic"));
//     setShowTrafficPanel(false);
//     setSelectedFlyoverForTraffic(null);
//   }, [enabled.traffic]);

//   /* ==========================================================================
//    * LULC TEARDOWN WHEN TAB INACTIVE
//    * Replaces the old useLULCLayer().teardownLULCLayers() call. Turning the
//    * LULC overlay off through the registry triggers overlays/lulc.js remove(),
//    * which is where the teardown now lives.
//    * ========================================================================*/

//   useEffect(() => {
//     if (isActive) return;
//     setOverlay("lulc", false);
//   }, [isActive, setOverlay]);

//   const { handleFlyoverButtonClick } = useFlyoverInteractions({
//     activeFlyoverId,
//     flyoverBoundsRef,
//     mapRef,
//     setActiveFlyoverId,
//   });

//   /* ==========================================================================
//    * GPS / LOCATE-ME
//    * ========================================================================*/
//   const { handleLocateMe, clearLocation, gpsLoading, gpsError, gpsActive } =
//     useGeolocation({
//       mapRef,
//       userAccuracyCircleRef,
//       userLocationMarkerRef,
//     });

//   /* ==========================================================================
//    * EFFECTS
//    * ========================================================================*/

//   useLayerSyncEffects({
//     activeLayers,
//     addFlyoverLayers,
//     addLiveSegmentLayer,
//     addMovementPointsToMap,
//     availableDates,
//     diffEndDate,
//     diffStartDate,
//     dividerLineRef,
//     error,
//     flyoverEntries,
//     flyovers,
//     handleFlyoverButtonClick,
//     isActive,
//     isMapReadyRef,
//     isMountedRef,
//     layerControlWrapperRef,
//     leftLayerRef,
//     liveSegmentLayerRef,
//     liveSegments,
//     loadLiveSegments,
//     loading,
//     lulcCreatedRef,
//     mapContainerRef,
//     mapRef,
//     movementError,
//     movementPoints,
//     rightLayerRef,
//     selectedLayer,
//     setDiffEndDate,
//     setDiffStartDate,
//     showLULC,
//     showSegmentsUI,
//     sideBySideRef,
//     tagRef,
//     updateLayerVisibility,
//     updateMovementVisibility,
//     yearLeft,
//     yearRight,
//     zoomControlContainerRef,
//   });

//   useResponsiveUI({
//     mapContainerRef,
//     mapRef,
//     setIsFullscreen,
//     setIsMobile,
//   });

//   /* MOBILE: when this page/tab is opened on a phone, automatically scroll
//      down to the END of the map, so the bottom edge of the map lines up with
//      the bottom of the screen. */
//   useEffect(() => {
//     if (!isActive) return;
//     if (window.innerWidth > 1024) return;

//     const t = setTimeout(() => {
//       mapWrapperRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "end",
//       });
//     }, 400);

//     return () => clearTimeout(t);
//   }, [isActive]);

//   /* ==========================================================================
//    * DEFAULT FLYOVER VIEW
//    * ========================================================================*/
//   useEffect(() => {
//     if (!isActive) {
//       hasAppliedDefaultFlyoverRef.current = false;
//       setDefaultFlyoverViewReady(false);
//       return;
//     }

//     if (hasAppliedDefaultFlyoverRef.current) return;

//     let cancelled = false;
//     let retryTimer = null;

//     const applyDefaultFlyoverView = () => {
//       if (cancelled || hasAppliedDefaultFlyoverRef.current) return;

//       const map = mapRef.current;
//       const defaultEntry = flyoverEntries[0];

//       const boundsEntry = defaultEntry
//         ? flyoverBoundsRef.current.find((entry) => entry.id === defaultEntry.id)
//         : null;

//       if (!isMapReadyRef.current || !map || !defaultEntry || !boundsEntry) {
//         retryTimer = window.setTimeout(applyDefaultFlyoverView, 50);
//         return;
//       }

//       map.invalidateSize({ animate: false });
//       handleFlyoverButtonClick(defaultEntry);
//       setActiveFlyoverId(defaultEntry.id);
//       hasAppliedDefaultFlyoverRef.current = true;

//       requestAnimationFrame(() => {
//         if (!cancelled) {
//           setDefaultFlyoverViewReady(true);
//         }
//       });
//     };

//     applyDefaultFlyoverView();

//     return () => {
//       cancelled = true;
//       if (retryTimer) window.clearTimeout(retryTimer);
//     };
//   }, [isActive, flyoverEntries, handleFlyoverButtonClick]);

//   /* ==========================================================================
//    * INITIALIZE MAP
//    * ========================================================================*/

//   useLandUseMap({
//     ResizeObserver,
//     addFlyoverLayers,
//     debounceRef,
//     diffMarkersRef,
//     dividerReadyTimeoutRef,
//     esriSatelliteLayerRef,
//     flyovers,
//     isMapReadyRef,
//     isMountedRef,
//     leftLayerRef,
//     liveSegmentLayerRef,
//     lulcCreatedRef,
//     mapCenter,
//     mapContainerRef,
//     mapRef,
//     rafIdRef,
//     resizeObserverRef,
//     rightLayerRef,
//     satelliteLayerRef,
//     selectedMovementMarkerRef,
//     selectedPolygonLayerRef,
//     setError,
//     setLoading,
//     sideBySideRef,
//     streetLayerRef,
//     updateCircleWeights,
//     zoomControlContainerRef,
//   });

//   /* ==========================================================================
//    * RENDER
//    * ========================================================================*/

//   return (
//     <div
//       className={`flex flex-col h-full w-full ${className}`}
//       ref={fullscreenContainerRef}
//       style={{
//         background: "#ffffff",
//         paddingTop: isFullscreen ? "10px" : "0px",
//       }}
//     >
//       {/* TOP CONTROL BAR */}
//       <TopControlBar
//         availableDates={availableDates}
//         diffEndDate={diffEndDate}
//         diffStartDate={diffStartDate}
//         handleLayerChange={handleLayerChange}
//         rainfallYear={rainfallYear}
//         selectedLayer={selectedLayer}
//         setDiffEndDate={setDiffEndDate}
//         setDiffStartDate={setDiffStartDate}
//         setRainfallYear={setRainfallYear}
//         setShowOverview={setShowOverview}
//         setShowSegmentTable={setShowSegmentTable}
//         setYearLeft={setYearLeft}
//         setYearRight={setYearRight}
//         showDifferenceUI={showDifferenceUI}
//         showLULC={showLULC}
//         showOverview={showOverview}
//         showRainfall={enabled.rainfall}
//         showSegmentTable={showSegmentTable}
//         yearLeft={yearLeft}
//         yearRight={yearRight}
//       />

//       {/* MAP CONTAINER */}
//       <div
//         ref={mapWrapperRef}
//         className="flex-1 min-h-0 relative rounded-lg overflow-hidden border border-gray-200"
//         style={{
//           height: isMobile ? "450px" : "100%",
//           minHeight: isMobile ? "400px" : "auto",
//         }}
//       >
//         {!defaultFlyoverViewReady && (
//           <div className="absolute inset-0 z-[5000] flex items-center justify-center px-4 bg-white">
//             <div className="text-center">
//               <div
//                 className="
//           mx-auto
//           h-10
//           w-10
//           animate-spin
//           rounded-full
//           border-b-2
//           border-blue-500
//           sm:h-12
//           sm:w-12
//         "
//               />

//               <p className="mt-4 text-sm text-gray-600 sm:text-base">
//                 Loading InfraRisk Map...
//               </p>
//             </div>
//           </div>
//         )}

//         <div
//           className="absolute inset-0 transition-none"
//           style={{
//             opacity: defaultFlyoverViewReady ? 1 : 0,
//             visibility: defaultFlyoverViewReady ? "visible" : "hidden",
//           }}
//         >
//           <div ref={mapContainerRef} className="absolute inset-0" />

//           <MapOverlays
//             activeFlyoverId={activeFlyoverId}
//             activeLayers={activeLayers}
//             availableLayers={availableLayers}
//             baseLayer={baseLayer}
//             diffDetailData={diffDetailData}
//             diffEndDate={diffEndDate}
//             diffPointData={diffPointData}
//             diffStartDate={diffStartDate}
//             dividerLineRef={dividerLineRef}
//             enabled={enabled}
//             error={error}
//             flyoverButtonsContainerRef={flyoverButtonsContainerRef}
//             flyoverEntries={flyoverEntries}
//             flyoversLoading={flyoversLoading}
//             gpsActive={gpsActive}
//             gpsError={gpsError}
//             gpsLoading={gpsLoading}
//             onClearLocation={clearLocation}
//             handleLocateMe={handleLocateMe}
//             handleBaseLayerChange={handleBaseLayerChange}
//             handleFlyoverButtonClick={handleFlyoverButtonClick}
//             handleLayerToggle={handleLayerToggleAdapter}
//             handleSegmentRowClick={handleSegmentRowClick}
//             isFullscreen={isFullscreen}
//             isLayerPanelOpen={isLayerPanelOpen}
//             isMobile={isMobile}
//             layerControlWrapperRef={layerControlWrapperRef}
//             loading={loading}
//             movementError={movementError}
//             movementLoading={movementLoading}
//             segmentData={segmentData}
//             segmentLoading={segmentLoading}
//             segmentsError={segmentsError}
//             selectedDetailForChart={selectedDetailForChart}
//             selectedFlyoverForTraffic={selectedFlyoverForTraffic}
//             selectedPointForChart={selectedPointForChart}
//             selectedSegmentId={selectedSegmentId}
//             setDiffDetailData={setDiffDetailData}
//             setDiffPointData={setDiffPointData}
//             setIsLayerPanelOpen={setIsLayerPanelOpen}
//             setSelectedDetailForChart={setSelectedDetailForChart}
//             setSelectedFlyoverForTraffic={setSelectedFlyoverForTraffic}
//             setSelectedPointForChart={setSelectedPointForChart}
//             setShowChart={setShowChart}
//             setShowDiffChart={setShowDiffChart}
//             setShowOverview={setShowOverview}
//             setShowSegmentTable={setShowSegmentTable}
//             setShowTrafficPanel={setShowTrafficPanel}
//             showChart={showChart}
//             showDiffChart={showDiffChart}
//             showDifferenceUI={showDifferenceUI}
//             showLULC={showLULC}
//             showOverview={showOverview}
//             showSegmentTable={showSegmentTable}
//             showSegmentsUI={showSegmentsUI}
//             showSoil={showSoil}
//             showTrafficPanel={showTrafficPanel}
//             showVelocityUI={showVelocityUI}
//             soilError={soilError}
//             soilLoading={soilLoading}
//             tagRef={tagRef}
//             taxoValues={taxoValues}
//             toggleFullscreen={toggleFullscreen}
//             velocityDiffError={velocityDiffError}
//             velocityDiffLoading={velocityDiffLoading}
//             velocityDiffRange={velocityDiffRange}
//             yearLeft={yearLeft}
//             yearRight={yearRight}
//             showDEM={showDEM}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default LandUseLandCover;






