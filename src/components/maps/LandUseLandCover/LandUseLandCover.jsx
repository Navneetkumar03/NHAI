import { useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { useFlyoverData } from "../../../hooks/useFlyoverData";
import { useMovementPoints } from "../../../hooks/useMovementPoints";
import { useFlyoverSegments } from "../../../hooks/useFlyoverSegments";
import { DEFAULT_CENTER, YEARS } from "./constants";

import { useSegmentLayer } from "./hooks/useSegmentLayer";
import { useMovementLayer } from "./hooks/useMovementLayer";
import { useDifferenceLayer } from "./hooks/useDifferenceLayer";
import { useLULCLayer } from "./hooks/useLULCLayer";
import { useFlyoverLayer } from "./hooks/useFlyoverLayer";
import { useSoilLayer } from "./hooks/useSoilLayer";
import { useLandUseMap } from "./hooks/useLandUseMap";

import { useLayerControls } from "./hooks/useLayerControls";
import { useFlyoverInteractions } from "./hooks/useFlyoverInteractions";
import { useGeolocation } from "./hooks/useGeolocation";
import { useSoilData } from "./hooks/useSoilData";
import { useResponsiveUI } from "./hooks/useResponsiveUI";
import { useLayerSyncEffects } from "./hooks/useLayerSyncEffects";

import { TopControlBar } from "./sections/TopControlBar";
import { MapOverlays } from "./sections/MapOverlays";

export function LandUseLandCover({
  mapCenter = DEFAULT_CENTER,
  defaultLeftYear = YEARS[0],
  defaultRightYear = YEARS[YEARS.length - 1],
  className = "",
  isActive = true,
}) {
  /* ---------------- Refs --------------- */

  const mapContainerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);

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

  const soilLayerRef = useRef(null);
  const soilDataRef = useRef(null);
  const hasFitSoilBoundsRef = useRef(false);

  const flyoverLayersRef = useRef([]);
  const flyoverMarkersRef = useRef([]);
  const movementMarkersRef = useRef([]);

  // 🆕 Difference-mode circles share the same L.circle / zoom-weight approach
  // as velocity mode, so they're tracked here for both zoom updates and
  // cleanup.
  const diffMarkersRef = useRef([]);

  const selectedMovementMarkerRef = useRef(null);

  const liveSegmentLayerRef = useRef(null);
  const polygonSegmentLayerRef = useRef(null);
  const selectedPolygonLayerRef = useRef(null);
  const segmentHighlightLayerRef = useRef(null);

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

  /* 🆕 GPS refs */
  const userLocationMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const hasAutoCenteredOnUserRef = useRef(false);

  /* ---------------- State ---------------- */
  const [activeFlyoverId, setActiveFlyoverId] = useState(null);

  const [showChart, setShowChart] = useState(false);
  const [selectedPointForChart, setSelectedPointForChart] = useState(null);
  const [selectedDetailForChart, setSelectedDetailForChart] = useState(null);

  const [showDiffChart, setShowDiffChart] = useState(false);
  const [diffPointData, setDiffPointData] = useState(null);
  const [diffDetailData, setDiffDetailData] = useState(null);
  const [diffStartDate, setDiffStartDate] = useState("");
  const [diffEndDate, setDiffEndDate] = useState("");

  const [selectedLayer, setSelectedLayer] = useState("velocity");

  const [yearLeft, setYearLeft] = useState(defaultLeftYear);
  const [yearRight, setYearRight] = useState(defaultRightYear);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDividerReady, setIsDividerReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

  const [activeLayers, setActiveLayers] = useState(["linear", "movement"]);
  const [baseLayer, setBaseLayer] = useState("streets");

  const [showLULC, setShowLULC] = useState(false);
  const [showSoil, setShowSoil] = useState(false);

  const [soilData, setSoilData] = useState(null);
  const [soilLoading, setSoilLoading] = useState(true);
  const [soilError, setSoilError] = useState(null);
  const [taxoValues, setTaxoValues] = useState([]);

  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [segmentData, setSegmentData] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [polygonLoading, setPolygonLoading] = useState(false);
  const [showSegmentTable, setShowSegmentTable] = useState(false);
  const [showSegmentLegend, setShowSegmentLegend] = useState(false);
  const [showLinearLayer, setShowLinearLayer] = useState(false);

  const [showOverview, setShowOverview] = useState(true);
  const [flyoverEntries, setFlyoverEntries] = useState([]);

  /* ---------------- Google Traffic ---------------- */

  const [showTrafficPanel, setShowTrafficPanel] = useState(false);
  const [selectedFlyoverForTraffic, setSelectedFlyoverForTraffic] =
    useState(null);

  /* 🆕 GPS state */
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

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
    polygonSegments,
    segmentStats,
    loading: segmentsLoading,
    error: segmentsError,
    loadLiveSegments,
    loadPolygonSegment,
    loadSegmentStats,
    getVelocityColor: getSegVelocityColor,
  } = useFlyoverSegments();

  const availableLayers = [
    { id: "linear", name: "Assets", color: "#8B5CF6", type: "overlay" },
    // { id: "flyover", name: "Flyover", color: "#3B82F6", type: "overlay" },
    { id: "lulc", name: "LULC", color: "#10B981", type: "overlay" },
    { id: "soil", name: "Soil", color: "#8B5E3C", type: "overlay" },
  ];

  const showDifferenceUI = selectedLayer === "difference";
  const showVelocityUI = selectedLayer === "velocity";
  const showSegmentsUI = activeLayers.includes("linear");

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
  });

  /* ==========================================================================
   * DIFFERENCE-MODE CIRCLES  🆕
   * Uses L.circle (same as velocity) so circles scale with zoom via
   * updateCircleWeights(). Colors come from feature.properties.color.
   * Hover shows a tooltip. Click opens the diff chart.
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
  });

  /* ==========================================================================
   * SIDE-BY-SIDE TILE COMPARISON
   * ========================================================================*/

  const { ensureLULCLayersExist, teardownLULCLayers } = useLULCLayer({
    dividerLineRef,
    hasFitBoundsRef,
    leftLayerRef,
    lulcCreatedRef,
    mapRef,
    rafIdRef,
    rightLayerRef,
    setIsDividerReady,
    sideBySideRef,
    tagRef,
    yearLeft,
    yearRight,
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
    setActiveLayers,
    setBaseLayer,
    setDiffDetailData,
    setDiffPointData,
    setSegmentData,
    setSegmentLoading,
    setSelectedDetailForChart,
    setSelectedLayer,
    setSelectedPointForChart,
    setShowChart,
    setShowDiffChart,
    setShowLULC,
    setShowSoil,
    sideBySideRef,
    streetLayerRef,
  });

  const { handleFlyoverButtonClick } = useFlyoverInteractions({
    activeFlyoverId,
    flyoverBoundsRef,
    mapRef,
    setActiveFlyoverId,
  });

  /* 🆕 Zoom + highlight a single flyover */

  /* ==========================================================================
   * GPS / LOCATE-ME
   * ========================================================================*/
  const { handleLocateMe } = useGeolocation({
    mapRef,
    setGpsError,
    setGpsLoading,
    userAccuracyCircleRef,
    userLocationMarkerRef,
  });

  /* ==========================================================================
   * EFFECTS
   * ========================================================================*/

  useLayerSyncEffects({
    activeLayers,
    addFlyoverLayers,
    addLiveSegmentLayer,
    addMovementPointsToMap,
    availableDates,
    diffEndDate,
    diffStartDate,
    dividerLineRef,
    ensureLULCLayersExist,
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
    teardownLULCLayers,
    updateLayerVisibility,
    updateMovementVisibility,
    yearLeft,
    yearRight,
    zoomControlContainerRef,
  });

  useSoilData({
    setSoilData,
    setSoilError,
    setSoilLoading,
    setTaxoValues,
    soilDataRef,
  });

  useResponsiveUI({
    mapContainerRef,
    mapRef,
    setIsFullscreen,
    setIsMobile,
  });

  /* 🆕 CHANGED: added `.leaflet-bar a` override so the native Leaflet
     zoom control (+/-) matches the reduced size of the FullscreenButton
     and Layers button (28px desktop / 24px mobile) in the same stack.
     Leaflet's own CSS ships a fixed size for these anchors that can't be
     changed via className since they're rendered by Leaflet itself. */

  /* 🆕 Auto-activate the first flyover button once the entries exist, so the
     map zooms to it by default without any user interaction. A small delay
     lets the map finish its initial layout before we call fitBounds. */

  /* ==========================================================================
   * SOIL LAYER
   * ========================================================================*/

  useSoilLayer({
    hasFitSoilBoundsRef,
    isMapReadyRef,
    mapContainerRef,
    mapRef,
    showSoil,
    soilData,
    soilLayerRef,
  });

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
        selectedLayer={selectedLayer}
        setDiffEndDate={setDiffEndDate}
        setDiffStartDate={setDiffStartDate}
        setShowOverview={setShowOverview}
        setShowSegmentTable={setShowSegmentTable}
        setYearLeft={setYearLeft}
        setYearRight={setYearRight}
        showDifferenceUI={showDifferenceUI}
        showLULC={showLULC}
        showOverview={showOverview}
        showSegmentTable={showSegmentTable}
        yearLeft={yearLeft}
        yearRight={yearRight}
      />

      {/* MAP CONTAINER */}
      <div
        className="flex-1 min-h-0 relative rounded-lg overflow-hidden border border-gray-200"
        style={{
          height: isMobile ? "450px" : "100%",
          minHeight: isMobile ? "400px" : "auto",
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
          error={error}
          flyoverButtonsContainerRef={flyoverButtonsContainerRef}
          flyoverEntries={flyoverEntries}
          flyoversLoading={flyoversLoading}
          gpsLoading={gpsLoading}
          handleBaseLayerChange={handleBaseLayerChange}
          handleFlyoverButtonClick={handleFlyoverButtonClick}
          handleLayerToggle={handleLayerToggle}
          handleLocateMe={handleLocateMe}
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
        />
      </div>
    </div>
  );
}

export default LandUseLandCover;
