import { log, logError, removeAllFromMap } from "../mapUtils";
import { useCallback } from "react";

export function useLayerControls({
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
  setShowLULC,
  setShowOverview,
  setShowSegmentTable,
  setShowSoil,
  setShowTrafficPanel,
  sideBySideRef,
  streetLayerRef,
}) {
  const handleLayerChange = useCallback((layer) => {
    log("Layer changed to:", layer);
    setSelectedLayer(layer);

    if (layer === "velocity") {
      setActiveLayers((prev) => {
        const next = prev.filter((id) => id !== "difference");
        if (!next.includes("movement")) {
          next.push("movement");
        }
        return next;
      });
      setShowDiffChart(false);
      setDiffPointData(null);
      setDiffDetailData(null);
    } else if (layer === "difference") {
      setActiveLayers((prev) => {
        const next = prev.filter((id) => id !== "movement");
        if (!next.includes("difference")) {
          next.push("difference");
        }
        return next;
      });
    } else if (layer === "none") {
      setActiveLayers((prev) =>
        prev.filter((id) => id !== "movement" && id !== "difference"),
      );
      setShowChart(false);
      setSelectedPointForChart(null);
      setSelectedDetailForChart(null);
      setShowDiffChart(false);
      setDiffPointData(null);
      setDiffDetailData(null);
    }
  }, []);

  const handleLayerToggle = useCallback(
    async (layerId) => {
      if (layerId === "lulc") {
        setShowLULC((prev) => !prev);
        setShowSoil(false);
      } else if (layerId === "soil") {
        setShowSoil((prev) => {
          const next = !prev;
          if (next) {
            setShowChart(false);
            setSelectedPointForChart(null);
            setSelectedDetailForChart(null);
            setShowDiffChart(false);
            setDiffPointData(null);
            setDiffDetailData(null);
          }
          return next;
        });
        setShowLULC(false);
      } else if (layerId === "linear") {
        const isActive = activeLayers.includes("linear");
        if (isActive) {
          setActiveLayers((prev) => prev.filter((id) => id !== "linear"));

          if (
            liveSegmentLayerRef.current &&
            mapRef.current?.hasLayer(liveSegmentLayerRef.current)
          ) {
            mapRef.current.removeLayer(liveSegmentLayerRef.current);
            liveSegmentLayerRef.current = null;
          }
          if (
            selectedPolygonLayerRef.current &&
            mapRef.current?.hasLayer(selectedPolygonLayerRef.current)
          ) {
            mapRef.current.removeLayer(selectedPolygonLayerRef.current);
            selectedPolygonLayerRef.current = null;
          }

          // 🆕 Remove flyover pins when Assets is turned off
          removeAllFromMap(mapRef.current, flyoverLayersRef.current);
          removeAllFromMap(mapRef.current, flyoverMarkersRef.current);
        } else {
          setActiveLayers((prev) => [...prev, "linear"]);

          // 🆕 Add flyover pins when Assets is turned on — same look the
          // old Flyover layer used to give.
          if (mapRef.current && flyovers && flyovers.length > 0) {
            addFlyoverLayers(mapRef.current);
          }

          if (
            !liveSegments ||
            !liveSegments.features ||
            liveSegments.features.length === 0
          ) {
            setSegmentLoading(true);
            try {
              const data = await loadLiveSegments();
              const stats = await loadSegmentStats();

              if (data && data.features && data.features.length > 0) {
                const statsById = new Map(
                  (stats || []).map((s) => [Number(s.id), s]),
                );

                const extractedData = data.features.map((feature) => {
                  const id = parseInt(feature.properties?.objectid) || 0;
                  const stat = statsById.get(id);
                  return {
                    id,
                    name:
                      stat?.name || feature.properties?.name || "NH 152 Ambala",
                    avg_velocity:
                      stat?.avg_velocity ??
                      (feature.properties?.avg_velocity !== undefined
                        ? parseFloat(feature.properties.avg_velocity)
                        : null),
                    point_count: stat?.point_count ?? 0,
                  };
                });
                setSegmentData(extractedData);

                if (mapRef.current && isMapReadyRef.current) {
                  setTimeout(() => {
                    try {
                      addLiveSegmentLayer(mapRef.current);
                    } catch (err) {
                      logError("[LULC] Error adding segment layer:", err);
                    }
                  }, 100);
                }
              }
            } catch (err) {
              console.error("Error loading segments:", err);
            } finally {
              setSegmentLoading(false);
            }
          } else {
            if (mapRef.current && isMapReadyRef.current) {
              setTimeout(() => {
                try {
                  addLiveSegmentLayer(mapRef.current);
                } catch (err) {
                  logError("[LULC] Error adding segment layer:", err);
                }
              }, 100);
            }
          }
        }
      } else if (layerId === "traffic") {
        const turningOn = !activeLayers.includes("traffic");

        setActiveLayers((prev) =>
          prev.includes("traffic")
            ? prev.filter((id) => id !== "traffic")
            : [...prev, "traffic"],
        );

        if (turningOn) {
          // 🆕 Auto-select the first flyover so the panel has something to
          // show. Uses the same shape useFlyoverLayer writes into
          // selectedFlyoverForTraffic, so TrafficAnalysisPanel is none the
          // wiser about who opened it.
          //
          // flyoverEntries is derived from flyoverBoundsRef inside
          // useFlyoverLayer and mirrored into state — it already exists by
          // the time a user can click this checkbox.
          const first = flyoverEntries?.[0];
          if (first) {
            // Compute a backend name the same way useFlyoverLayer does:
            // "FLYOVER " + id
            const backendName = `FLYOVER ${first.id}`;
            const displayName = first.name;

            // Close competing right-side panels first, same pattern as the
            // marker-click path.
            setShowOverview(false);
            setShowSegmentTable(false);
            setShowChart(false);
            setShowDiffChart(false);
            setShowTrafficPanel(false);

            setTimeout(() => {
              setSelectedFlyoverForTraffic({ backendName, displayName });
              setShowTrafficPanel(true);
              setActiveFlyoverId(first.id);
            }, 0);
          } else {
            // No flyovers loaded yet — leave the toggle on, user will pick
            // one when they click a marker.
            console.warn(
              "[LULC] Traffic enabled but no flyoverEntries available yet.",
            );
          }
        } else {
          // Turning traffic OFF — close the panel if it's open, since it's
          // showing data the user no longer wants.
          setShowTrafficPanel(false);
          setSelectedFlyoverForTraffic(null);
        }
      } else {
        setActiveLayers((prev) =>
          prev.includes(layerId)
            ? prev.filter((id) => id !== layerId)
            : [...prev, layerId],
        );
      }
    },
    [
      activeLayers,
      liveSegments,
      loadLiveSegments,
      loadSegmentStats,
      addLiveSegmentLayer,
      flyovers,
      addFlyoverLayers,
      flyoverEntries,
    ],
  );

  const handleBaseLayerChange = useCallback((layerType) => {
    setBaseLayer(layerType);

    if (!mapRef.current) {
      return;
    }

    try {
      if (
        streetLayerRef.current &&
        mapRef.current.hasLayer(streetLayerRef.current)
      ) {
        mapRef.current.removeLayer(streetLayerRef.current);
      }

      if (
        satelliteLayerRef.current &&
        mapRef.current.hasLayer(satelliteLayerRef.current)
      ) {
        mapRef.current.removeLayer(satelliteLayerRef.current);
      }

      if (
        esriSatelliteLayerRef.current &&
        mapRef.current.hasLayer(esriSatelliteLayerRef.current)
      ) {
        mapRef.current.removeLayer(esriSatelliteLayerRef.current);
      }

      if (layerType === "streets" && streetLayerRef.current) {
        mapRef.current.addLayer(streetLayerRef.current);
      } else if (layerType === "satellite" && satelliteLayerRef.current) {
        mapRef.current.addLayer(satelliteLayerRef.current);
      } else if (
        layerType === "esri_satellite" &&
        esriSatelliteLayerRef.current
      ) {
        mapRef.current.addLayer(esriSatelliteLayerRef.current);
      }

      if (
        leftLayerRef.current &&
        mapRef.current.hasLayer(leftLayerRef.current)
      ) {
        leftLayerRef.current.setZIndex(10);
      }

      if (
        rightLayerRef.current &&
        mapRef.current.hasLayer(rightLayerRef.current)
      ) {
        rightLayerRef.current.setZIndex(10);
      }

      if (
        sideBySideRef.current &&
        typeof sideBySideRef.current._updateClip === "function"
      ) {
        sideBySideRef.current._updateClip();
      }
    } catch (err) {
      logError("[LULC] Error switching base layer:", err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      const container = fullscreenContainerRef.current;
      if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch (err) {
      logError("[LULC] Error toggling fullscreen:", err);
    }
  }, []);

  return { handleLayerChange, handleLayerToggle, handleBaseLayerChange, toggleFullscreen };
}







// import { log, logError, removeAllFromMap } from "../mapUtils";
// import { useCallback } from "react";

// export function useLayerControls({
//   activeLayers,
//   addFlyoverLayers,
//   addLiveSegmentLayer,
//   esriSatelliteLayerRef,
//   flyoverLayersRef,
//   flyoverMarkersRef,
//   flyovers,
//   fullscreenContainerRef,
//   isMapReadyRef,
//   leftLayerRef,
//   liveSegmentLayerRef,
//   liveSegments,
//   loadLiveSegments,
//   loadSegmentStats,
//   mapRef,
//   rightLayerRef,
//   satelliteLayerRef,
//   selectedPolygonLayerRef,
//   setActiveLayers,
//   setBaseLayer,
//   setDiffDetailData,
//   setDiffPointData,
//   setSegmentData,
//   setSegmentLoading,
//   setSelectedDetailForChart,
//   setSelectedLayer,
//   setSelectedPointForChart,
//   setShowChart,
//   setShowDiffChart,
//   setShowLULC,
//   setShowSoil,
//   sideBySideRef,
//   streetLayerRef
// }) {
//   const handleLayerChange = useCallback((layer) => {
//     log("Layer changed to:", layer);
//     setSelectedLayer(layer);

//     if (layer === "velocity") {
//       setActiveLayers((prev) => {
//         const next = prev.filter((id) => id !== "difference");
//         if (!next.includes("movement")) {
//           next.push("movement");
//         }
//         return next;
//       });
//       setShowDiffChart(false);
//       setDiffPointData(null);
//       setDiffDetailData(null);
//     } else if (layer === "difference") {
//       setActiveLayers((prev) => {
//         const next = prev.filter((id) => id !== "movement");
//         if (!next.includes("difference")) {
//           next.push("difference");
//         }
//         return next;
//       });
//     } else if (layer === "none") {
//       setActiveLayers((prev) =>
//         prev.filter((id) => id !== "movement" && id !== "difference"),
//       );
//       setShowChart(false);
//       setSelectedPointForChart(null);
//       setSelectedDetailForChart(null);
//       setShowDiffChart(false);
//       setDiffPointData(null);
//       setDiffDetailData(null);
//     }
//   }, []);

//   const handleLayerToggle = useCallback(
//     async (layerId) => {
//       if (layerId === "lulc") {
//         setShowLULC((prev) => !prev);
//         setShowSoil(false);
//       } else if (layerId === "soil") {
//         setShowSoil((prev) => {
//           const next = !prev;
//           if (next) {
//             setShowChart(false);
//             setSelectedPointForChart(null);
//             setSelectedDetailForChart(null);
//             setShowDiffChart(false);
//             setDiffPointData(null);
//             setDiffDetailData(null);
//           }
//           return next;
//         });
//         setShowLULC(false);
//       } else if (layerId === "linear") {
//         const isActive = activeLayers.includes("linear");
//         if (isActive) {
//           setActiveLayers((prev) => prev.filter((id) => id !== "linear"));

//           if (
//             liveSegmentLayerRef.current &&
//             mapRef.current?.hasLayer(liveSegmentLayerRef.current)
//           ) {
//             mapRef.current.removeLayer(liveSegmentLayerRef.current);
//             liveSegmentLayerRef.current = null;
//           }
//           if (
//             selectedPolygonLayerRef.current &&
//             mapRef.current?.hasLayer(selectedPolygonLayerRef.current)
//           ) {
//             mapRef.current.removeLayer(selectedPolygonLayerRef.current);
//             selectedPolygonLayerRef.current = null;
//           }

//           // 🆕 Remove flyover pins when Assets is turned off
//           removeAllFromMap(mapRef.current, flyoverLayersRef.current);
//           removeAllFromMap(mapRef.current, flyoverMarkersRef.current);
//         } else {
//           setActiveLayers((prev) => [...prev, "linear"]);

//           // 🆕 Add flyover pins when Assets is turned on — same look the
//           // old Flyover layer used to give.
//           if (mapRef.current && flyovers && flyovers.length > 0) {
//             addFlyoverLayers(mapRef.current);
//           }

//           if (
//             !liveSegments ||
//             !liveSegments.features ||
//             liveSegments.features.length === 0
//           ) {
//             setSegmentLoading(true);
//             try {
//               const data = await loadLiveSegments();
//               const stats = await loadSegmentStats();

//               if (data && data.features && data.features.length > 0) {
//                 const statsById = new Map(
//                   (stats || []).map((s) => [Number(s.id), s]),
//                 );

//                 const extractedData = data.features.map((feature) => {
//                   const id = parseInt(feature.properties?.objectid) || 0;
//                   const stat = statsById.get(id);
//                   return {
//                     id,
//                     name:
//                       stat?.name || feature.properties?.name || "NH 152 Ambala",
//                     avg_velocity:
//                       stat?.avg_velocity ??
//                       (feature.properties?.avg_velocity !== undefined
//                         ? parseFloat(feature.properties.avg_velocity)
//                         : null),
//                     point_count: stat?.point_count ?? 0,
//                   };
//                 });
//                 setSegmentData(extractedData);

//                 if (mapRef.current && isMapReadyRef.current) {
//                   setTimeout(() => {
//                     try {
//                       addLiveSegmentLayer(mapRef.current);
//                     } catch (err) {
//                       logError("[LULC] Error adding segment layer:", err);
//                     }
//                   }, 100);
//                 }
//               }
//             } catch (err) {
//               console.error("Error loading segments:", err);
//             } finally {
//               setSegmentLoading(false);
//             }
//           } else {
//             if (mapRef.current && isMapReadyRef.current) {
//               setTimeout(() => {
//                 try {
//                   addLiveSegmentLayer(mapRef.current);
//                 } catch (err) {
//                   logError("[LULC] Error adding segment layer:", err);
//                 }
//               }, 100);
//             }
//           }
//         }
//       } else {
//         setActiveLayers((prev) =>
//           prev.includes(layerId)
//             ? prev.filter((id) => id !== layerId)
//             : [...prev, layerId],
//         );
//       }
//     },
//     [
//       activeLayers,
//       liveSegments,
//       loadLiveSegments,
//       loadSegmentStats,
//       addLiveSegmentLayer,
//       flyovers,
//       addFlyoverLayers,
//     ],
//   );

//   const handleBaseLayerChange = useCallback((layerType) => {
//     setBaseLayer(layerType);

//     if (!mapRef.current) {
//       return;
//     }

//     try {
//       if (
//         streetLayerRef.current &&
//         mapRef.current.hasLayer(streetLayerRef.current)
//       ) {
//         mapRef.current.removeLayer(streetLayerRef.current);
//       }

//       if (
//         satelliteLayerRef.current &&
//         mapRef.current.hasLayer(satelliteLayerRef.current)
//       ) {
//         mapRef.current.removeLayer(satelliteLayerRef.current);
//       }

//       if (
//         esriSatelliteLayerRef.current &&
//         mapRef.current.hasLayer(esriSatelliteLayerRef.current)
//       ) {
//         mapRef.current.removeLayer(esriSatelliteLayerRef.current);
//       }

//       if (layerType === "streets" && streetLayerRef.current) {
//         mapRef.current.addLayer(streetLayerRef.current);
//       } else if (layerType === "satellite" && satelliteLayerRef.current) {
//         mapRef.current.addLayer(satelliteLayerRef.current);
//       } else if (
//         layerType === "esri_satellite" &&
//         esriSatelliteLayerRef.current
//       ) {
//         mapRef.current.addLayer(esriSatelliteLayerRef.current);
//       }

//       if (
//         leftLayerRef.current &&
//         mapRef.current.hasLayer(leftLayerRef.current)
//       ) {
//         leftLayerRef.current.setZIndex(10);
//       }

//       if (
//         rightLayerRef.current &&
//         mapRef.current.hasLayer(rightLayerRef.current)
//       ) {
//         rightLayerRef.current.setZIndex(10);
//       }

//       if (
//         sideBySideRef.current &&
//         typeof sideBySideRef.current._updateClip === "function"
//       ) {
//         sideBySideRef.current._updateClip();
//       }
//     } catch (err) {
//       logError("[LULC] Error switching base layer:", err);
//     }
//   }, []);

//   const toggleFullscreen = useCallback(() => {
//     try {
//       const container = fullscreenContainerRef.current;
//       if (!document.fullscreenElement) {
//         container?.requestFullscreen?.();
//       } else {
//         document.exitFullscreen?.();
//       }
//     } catch (err) {
//       logError("[LULC] Error toggling fullscreen:", err);
//     }
//   }, []);

//   return { handleLayerChange, handleLayerToggle, handleBaseLayerChange, toggleFullscreen };
// }
