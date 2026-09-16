import { AlertTriangle, Layers, Loader2, Navigation, Table, X } from "lucide-react";
import { FullscreenButton } from "../controls/FullscreenButton";
import { LULCLegend } from "../legends/LULCLegend";
import { LULC_FADE_MS } from "../constants";
import MovementDiffChart from "../../../charts/MovementDiffChart";
import MovementPointsChart from "../../../charts/MovementPointsChart";
import { RiskLegend } from "../legends/RiskLegend";
import { RiskOverviewPanel } from "../panels/RiskOverviewPanel";
import { SegmentTable } from "../panels/SegmentTable";
import { SoilLegend } from "../legends/SoilLegend";
import TrafficAnalysisPanel from "../../../traffic/TrafficAnalysisPanel";
import { VelocityDiffLegend } from "../legends/VelocityDiffLegend";
import { VelocityLegend } from "../legends/VelocityLegend";

export function MapOverlays({
  activeFlyoverId,
  activeLayers,
  availableLayers,
  baseLayer,
  diffDetailData,
  diffEndDate,
  diffPointData,
  diffStartDate,
  dividerLineRef,
  error,
  flyoverButtonsContainerRef,
  flyoverEntries,
  flyoversLoading,
  gpsLoading,
  handleBaseLayerChange,
  handleFlyoverButtonClick,
  handleLayerToggle,
  handleLocateMe,
  handleSegmentRowClick,
  isFullscreen,
  isLayerPanelOpen,
  isMobile,
  layerControlWrapperRef,
  loading,
  movementError,
  movementLoading,
  segmentData,
  segmentLoading,
  segmentsError,
  selectedDetailForChart,
  selectedFlyoverForTraffic,
  selectedPointForChart,
  selectedSegmentId,
  setDiffDetailData,
  setDiffPointData,
  setIsLayerPanelOpen,
  setSelectedDetailForChart,
  setSelectedFlyoverForTraffic,
  setSelectedPointForChart,
  setShowChart,
  setShowDiffChart,
  setShowOverview,
  setShowSegmentTable,
  setShowTrafficPanel,
  showChart,
  showDiffChart,
  showDifferenceUI,
  showLULC,
  showOverview,
  showSegmentTable,
  showSegmentsUI,
  showSoil,
  showTrafficPanel,
  showVelocityUI,
  soilError,
  soilLoading,
  tagRef,
  taxoValues,
  toggleFullscreen,
  velocityDiffError,
  velocityDiffLoading,
  velocityDiffRange,
  yearLeft,
  yearRight
}) {
  return (
    <>
      {/* LEGENDS */}
      
      {!loading && !error && !soilError && (
                <>
                  {!showSoil && showLULC && <LULCLegend />}
                  {!showSoil && showVelocityUI && <VelocityLegend />}
                  {!showSoil && showDifferenceUI && velocityDiffRange && (
                    <VelocityDiffLegend range={velocityDiffRange} />
                  )}
                  {showSoil && !soilLoading && <SoilLegend taxoValues={taxoValues} />}
                  {showSegmentTable && <RiskLegend />}
                </>
              )}
      
      {/* LAYER BUTTON + PANEL (Zoom control is inserted as firstChild via
                  the layerControlWrapperRef effect, so the stacking order ends
                  up: Zoom In/Out → Fullscreen → Layers, per TL request.) */}
      
      {!loading && !error && (
                <div
                  ref={layerControlWrapperRef}
                  className="absolute top-2 left-2 z-[1500] flex flex-col items-start gap-1 max-[480px]:gap-0.5"
                >
                  <FullscreenButton
                    isFullscreen={isFullscreen}
                    onToggle={toggleFullscreen}
                  />
      
                  {/* 🆕 GPS Locate-Me button */}
                  <button
                    onClick={handleLocateMe}
                    title="Show my location"
                    disabled={gpsLoading}
                    className={`
          flex items-center justify-center
          w-[22px] h-[22px]
          max-[480px]:w-[18px] max-[480px]:h-[18px]
          bg-white
          rounded-[4px]
          border-2
          transition-all duration-200
          hover:bg-gray-50
          border-gray-400 text-gray-700 hover:border-gray-500
          focus:outline-none focus:ring-0
          leaflet-bar
          ${gpsLoading ? "opacity-70 cursor-wait" : ""}
        `}
                    style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.1)" }}
                    aria-label="Show my location"
                  >
                    {gpsLoading ? (
                      <Loader2
                        size={13}
                        className="animate-spin max-[480px]:w-2.5 max-[480px]:h-2.5"
                      />
                    ) : (
                      <Navigation
                        size={13}
                        className="max-[480px]:w-2.5 max-[480px]:h-2.5"
                      />
                    )}
                  </button>
      
      
                  {/* Layer button + panel */}
                  <div className="relative">
                    <button
                      onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
                      title="Layer Control"
                      className={`
          flex items-center justify-center
          w-[22px] h-[22px]
          max-[480px]:w-[18px] max-[480px]:h-[18px]
          bg-white
          rounded-[4px]
          border-2
          transition-all duration-200
          hover:bg-gray-50
          ${isLayerPanelOpen
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-400 text-gray-700 hover:border-gray-500"
                        }
          focus:outline-none
          focus:ring-0
          leaflet-bar
        `}
                      style={{
                        boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
                      }}
                      aria-label="Toggle layer control"
                    >
                      <Layers
                        size={13}
                        className="max-[480px]:w-2.5 max-[480px]:h-2.5"
                      />
                    </button>
      
                    {isLayerPanelOpen && (
                      <div
                        className="
                  absolute top-0 left-full ml-2
                  bg-white
                  rounded-[4px]
                  border-2 border-gray-300
                  p-3
                  min-w-[140px]
                  max-w-[200px]
                  max-[480px]:min-w-[140px]
                  max-[480px]:max-w-[190px]
                  max-[480px]:p-2
                  shadow-lg
                "
                        style={{
                          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-200">
                          <h3 className="text-xs font-semibold text-gray-700 max-[500px]:text-[10px] whitespace-nowrap">
                            Add-on Layer
                          </h3>
                          <button
                            onClick={() => setIsLayerPanelOpen(false)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all duration-200"
                          >
                            <X
                              size={16}
                              strokeWidth={3}
                              className="max-[480px]:w-3.5 max-[480px]:h-3.5"
                            />
                          </button>
                        </div>
      
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 max-[480px]:text-[9px]">
                            Overlays
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {availableLayers.map((layer) => (
                              <label
                                key={layer.id}
                                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors max-[480px]:text-[10px] max-[480px]:gap-1.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    layer.id === "lulc"
                                      ? showLULC
                                      : layer.id === "soil"
                                        ? showSoil
                                        : layer.id === "linear"
                                          ? activeLayers.includes("linear")
                                          : activeLayers.includes(layer.id)
                                  }
                                  onChange={() => handleLayerToggle(layer.id)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer max-[480px]:w-3 max-[480px]:h-3"
                                />
                                <span className="whitespace-nowrap">
                                  {layer.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
      
                        <div className="mt-2 pt-1 border-t border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 max-[480px]:text-[9px]">
                            Base Map
                          </p>
                          <div className="flex flex-col gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors max-[480px]:text-[10px] max-[480px]:gap-1.5">
                              <input
                                type="radio"
                                name="baseLayer"
                                checked={baseLayer === "streets"}
                                onChange={() => handleBaseLayerChange("streets")}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer max-[480px]:w-3 max-[480px]:h-3"
                              />
                              <span className="whitespace-nowrap">Streets</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors max-[480px]:text-[10px] max-[480px]:gap-1.5">
                              <input
                                type="radio"
                                name="baseLayer"
                                checked={baseLayer === "satellite"}
                                onChange={() => handleBaseLayerChange("satellite")}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer max-[480px]:w-3 max-[480px]:h-3"
                              />
                              <span className="whitespace-nowrap">
                                Google Satellite
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors max-[480px]:text-[10px] max-[480px]:gap-1.5">
                              <input
                                type="radio"
                                name="baseLayer"
                                checked={baseLayer === "esri_satellite"}
                                onChange={() =>
                                  handleBaseLayerChange("esri_satellite")
                                }
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer max-[480px]:w-3 max-[480px]:h-3"
                              />
                              <span className="whitespace-nowrap">Satellite</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
      
      
                </div>
              )}
      
      {/* Flyover quick-jump buttons — top row on desktop, 2-column grid
                  on mobile (per TL: keep them at the top like desktop, but wrap
                  into 2 buttons per row below 480px instead of a horizontal
                  scroll or single vertical column). */}
      
      {!loading &&
                !error &&
                activeLayers.includes("linear") &&
                flyoverEntries.length > 0 && (
                  <div
                    ref={flyoverButtonsContainerRef}
                    className="absolute top-2 left-10 right-14 z-[1500] flex flex-row items-center gap-1.5 overflow-x-auto max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:gap-1 max-[480px]:overflow-visible"
                    style={{ pointerEvents: "auto" }}
                  >
                    {flyoverEntries.map((f) => {
                      const isActive = activeFlyoverId === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => handleFlyoverButtonClick(f)}
                          title={f.name}
                          className={`
                    flex items-center gap-2
                    h-[28px]
                    max-[480px]:h-[22px]
                    w-auto
                    min-w-[80px]
                    max-w-[160px]
                    max-[480px]:w-full
                    max-[480px]:min-w-0
                    max-[480px]:max-w-none
                    px-2
                    max-[480px]:px-1
                    rounded-[4px]
                    border-2
                    flex-shrink-0
                    transition-all duration-200
                    focus:outline-none
                    focus:ring-0
                    leaflet-bar
                    ${isActive
                              ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                              : "border-gray-400 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50"
                            }
                  `}
                          style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.1)" }}
                          aria-label={`Zoom to ${f.name}`}
                        >
                          <span
                            className="w-2.5 h-2.5 max-[480px]:w-2 max-[480px]:h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: f.color }}
                          />
                          <span className="text-[10px] max-[480px]:text-[9px] font-semibold truncate text-left min-w-0">
                            {f.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
      
      {/* SEGMENT / LINEAR TABLE OVERLAY */}
      
      {showSegmentsUI && showSegmentTable && (
                <div
                  className=" absolute top-2 right-3 z-[1500]
            max-w-[260px] w-full max-h-[320px]
            bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200
            overflow-hidden
      
            max-[480px]:top-auto
            max-[480px]:bottom-14
            max-[480px]:right-2
            max-[480px]:left-auto
            max-[480px]:w-auto
            max-[480px]:max-w-[220px]
            max-[480px]:max-h-[220px]"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <Table size={14} />
                      Linear (
                      {/* {segmentData.filter((d) => d.avg_velocity !== null).length}{" "} */}
                      active observations)
                    </span>
                    <button
                      onClick={() => setShowSegmentTable(false)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <SegmentTable
                    data={segmentData}
                    onRowClick={handleSegmentRowClick}
                    selectedId={selectedSegmentId}
                    loading={segmentLoading}
                  />
                </div>
              )}
      
      {/* RiskOverviewPanel: bottom-right on mobile (matching the corner
                  LULC/Soil/Risk legends use), top-right on desktop. If it ever
                  needs to coexist on mobile with those legends, consider adding
                  a conditional bottom offset the same way the flyover row's
                  lift was explored earlier. */}
      
      {showOverview && (
                <RiskOverviewPanel onClose={() => setShowOverview(false)} />
              )}
      
      {/* Traffic Analysis Panel — right-side overlay */}
      
      {showTrafficPanel && (
                <div
                  className="absolute top-2 right-2 z-[1500]"
                  style={{
                    width: isMobile ? "min(92vw, 380px)" : "400px",
                    height: isMobile ? "auto" : "calc(100% - 1rem)",
                    maxHeight: isMobile ? "500px" : "calc(100% - 1rem)",
                    display: "flex",
                    overflow: "visible",
                    overscrollBehavior: "contain",
                    pointerEvents: "auto",
                  }}
                >
                  {/* <TrafficAnalysisPanel
                    selectedFlyoverForTraffic={selectedFlyoverForTraffic}
                    onClose={() => {
                      setShowTrafficPanel(false);
                      setSelectedFlyoverForTraffic(null);
                    }}
                    isMobile={isMobile}
                  /> */}
      
                  <TrafficAnalysisPanel
                    selectedFlyoverForTraffic={selectedFlyoverForTraffic?.backendName || null}
                    displayName={selectedFlyoverForTraffic?.displayName || null}
                    onClose={() => {
                      setShowTrafficPanel(false);
                      setSelectedFlyoverForTraffic(null);
                    }}
                    isMobile={isMobile}
                  />
                </div>
              )}
      
      {/* Risk Overview Panel — only when traffic panel is closed */}
      
      {showOverview && !showTrafficPanel && (
                <RiskOverviewPanel onClose={() => setShowOverview(false)} />
              )}
      
      {/* LULC DIVIDER TAG */}
      
      <div
                ref={tagRef}
                className="absolute bottom-4 pointer-events-none max-[480px]:bottom-2"
                style={{
                  left: "0px",
                  transform: "translateX(-50%)",
                  opacity: 0,
                  transition: `opacity ${LULC_FADE_MS}ms ease`,
                  zIndex: 400,
                }}
              >
                <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg max-[480px]:text-[10px] max-[480px]:px-2 max-[480px]:py-1">
                  <span>{yearLeft}</span>
                  <span className="text-gray-400">|</span>
                  <span>{yearRight}</span>
                </div>
              </div>
      
      {/* LULC DIVIDER LINE */}
      
      <div
                ref={dividerLineRef}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: "0px",
                  width: "2px",
                  background: "rgba(59, 130, 246, 0.5)",
                  transform: "translateX(-50%)",
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
                  opacity: 0,
                  transition: `opacity ${LULC_FADE_MS}ms ease`,
                  zIndex: 399,
                }}
              />
      
      {/* LOADING */}
      
      {(loading ||
                flyoversLoading ||
                movementLoading ||
                (showSoil && soilLoading) ||
                (showSegmentsUI && segmentLoading) ||
                (showDifferenceUI && velocityDiffLoading)) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[500]">
                    <div className="flex flex-col items-center gap-2 bg-white px-5 py-4 rounded-xl shadow-lg border border-gray-200 max-[480px]:px-3 max-[480px]:py-3">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin max-[480px]:w-6 max-[480px]:h-6" />
                      <p className="text-xs text-gray-500 max-[480px]:text-[10px] text-center">
                        {loading
                          ? "Initializing map..."
                          : showSoil && soilLoading
                            ? "Loading soil data..."
                            : movementLoading
                              ? "Loading movement points..."
                              : showDifferenceUI && velocityDiffLoading
                                ? "Loading velocity difference..."
                                : showSegmentsUI && segmentLoading
                                  ? "Loading segment data..."
                                  : "Loading flyover data..."}
                      </p>
                    </div>
                  </div>
                )}
      
      {/* ERROR */}
      
      {(error ||
                movementError ||
                soilError ||
                segmentsError.live ||
                (showDifferenceUI && velocityDiffError)) && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg max-w-md max-[480px]:text-xs max-[480px]:px-3 max-[480px]:py-2 max-[480px]:max-w-[90%]">
                    <AlertTriangle
                      size={16}
                      className="flex-shrink-0 max-[480px]:w-3.5 max-[480px]:h-3.5"
                    />
                    <span>
                      {error ||
                        movementError ||
                        soilError ||
                        segmentsError.live ||
                        (showDifferenceUI && velocityDiffError)}
                    </span>
                  </div>
                )}
      
      {/* MOVEMENT CHART */}
      
      {showChart && selectedPointForChart && selectedDetailForChart && (
                <MovementPointsChart
                  pointData={selectedPointForChart}
                  detailData={selectedDetailForChart}
                  onClose={() => {
                    setShowChart(false);
                    setSelectedPointForChart(null);
                    setSelectedDetailForChart(null);
                  }}
                />
              )}
      
      {/* DIFFERENCE CHART */}
      
      {showDiffChart && diffPointData && diffDetailData && (
                <MovementDiffChart
                  pointData={diffPointData}
                  detailData={diffDetailData}
                  startDate={diffStartDate}
                  endDate={diffEndDate}
                  onClose={() => {
                    setShowDiffChart(false);
                    setDiffPointData(null);
                    setDiffDetailData(null);
                  }}
                />
              )}
    </>
  );
}
