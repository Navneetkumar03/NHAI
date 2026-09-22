import { logError } from "../mapUtils";
import { getRiskColor } from "../constants";
import { useCallback, useEffect } from "react";

export function useSegmentLayer({
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
  showSegmentsUI
}) {
  const addPolygonHighlight = useCallback((map, polygonData) => {
    if (
      !polygonData ||
      !polygonData.features ||
      polygonData.features.length === 0
    ) {
      if (
        selectedPolygonLayerRef.current &&
        map.hasLayer(selectedPolygonLayerRef.current)
      ) {
        map.removeLayer(selectedPolygonLayerRef.current);
        selectedPolygonLayerRef.current = null;
      }
      return;
    }

    if (
      selectedPolygonLayerRef.current &&
      map.hasLayer(selectedPolygonLayerRef.current)
    ) {
      map.removeLayer(selectedPolygonLayerRef.current);
    }

    selectedPolygonLayerRef.current = L.geoJSON(polygonData, {
      style: {
        color: "#ff6b6b",
        weight: 4,
        opacity: 1,
        fillColor: "#ff6b6b",
        fillOpacity: 0.3,
        dashArray: "5, 5",
      },
      onEachFeature: (feature, layer) => {
        const props = feature?.properties || {};
        const velocity = props.avg_velocity;

        layer.bindPopup(`
          <div style="padding: 8px; font-family: Arial, sans-serif; min-width: 180px;">
            <h4 style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
              ${props.name || "Unknown Polygon Segment"}
            </h4>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 0; color: #6b7280;">ID:</td>
                <td style="padding: 2px 0; font-weight: 600;">${props.objectid || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #6b7280;">Type:</td>
                <td style="padding: 2px 0; font-weight: 600;">Polygon</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #6b7280;">Velocity:</td>
                <td style="padding: 2px 0; font-weight: 600; color: #2563eb;">
                  ${velocity !== null && velocity !== undefined ? velocity + " mm/yr" : "N/A"}
                </td>
              </tr>
              ${props.insert_at
            ? `
              <tr>
                <td style="padding: 2px 0; color: #6b7280;">Updated:</td>
                <td style="padding: 2px 0; font-weight: 600; font-size: 10px;">${new Date(props.insert_at).toLocaleString()}</td>
              </tr>
              `
            : ""
          }
            </table>
          </div>
        `);
      },
    }).addTo(map);

    selectedPolygonLayerRef.current.setZIndex(450);

    try {
      const bounds = selectedPolygonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.warn("Could not fit to polygon bounds:", err);
    }
  }, []);

  const handleSegmentRowClick = useCallback(
    async (id) => {
      if (!id) return;

      setSelectedSegmentId(id);
      setPolygonLoading(true);

      try {
        const polygonData = await loadPolygonSegment({
          type: "id",
          id: String(id),
        });

        if (
          polygonData &&
          polygonData.features &&
          polygonData.features.length > 0
        ) {
          if (mapRef.current) {
            addPolygonHighlight(mapRef.current, polygonData);
          }
        } else {
          if (mapRef.current) {
            addPolygonHighlight(mapRef.current, null);
          }
        }
      } catch (err) {
        console.error("Error loading polygon segment:", err);
      } finally {
        setPolygonLoading(false);
      }
    },
    [loadPolygonSegment, addPolygonHighlight],
  );

  const addLiveSegmentLayer = useCallback(
    (map) => {
      if (
        !liveSegments ||
        !liveSegments.features ||
        liveSegments.features.length === 0
      ) {
        return;
      }

      if (
        liveSegmentLayerRef.current &&
        map.hasLayer(liveSegmentLayerRef.current)
      ) {
        map.removeLayer(liveSegmentLayerRef.current);
        liveSegmentLayerRef.current = null;
      }




      liveSegmentLayerRef.current = L.geoJSON(liveSegments, {
        style: (feature) => {
          const risk = feature?.properties.risk;
          return {
            color: getRiskColor(risk),
            weight: 7,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          };
        },
        filter: (feature) => {
          return feature?.geometry?.type === "LineString";
        },
        onEachFeature: (feature, layer) => {
          const props = feature?.properties || {};
          const velocity = props.avg_velocity;

          if (feature?.geometry?.type !== "LineString") {
            return;
          }

          // <h4 style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
          //   ${props.flyover || "Unknown Segment"}
          // </h4>

          layer.bindPopup(`
        <div style="padding: 8px; font-family: Arial, sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
            ${props.name || "Unknown Segment"}
          </h4>
          
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; color: #6b7280;">ID:</td>
              <td style="padding: 2px 0; font-weight: 600;">${props.objectid || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #6b7280;">Velocity:</td>
              <td style="padding: 2px 0; font-weight: 600; color: #2563eb;">
                ${velocity !== null && velocity !== undefined ? velocity + " mm/yr" : "N/A"}
              </td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #6b7280;">Risk:</td>
              <td style="padding: 2px 0; font-weight: 600;">${props.risk || "N/A"}</td>
            </tr>
            ${props.insert_at
              ? `
            <tr>
              <td style="padding: 2px 0; color: #6b7280;">Updated:</td>
              <td style="padding: 2px 0; font-weight: 600; font-size: 10px;">${new Date(props.insert_at).toLocaleString()}</td>
            </tr>
            `
              : ""
            }
          </table>
        </div>
      `);

          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({ weight: 9, opacity: 1, color: "#ffff00" });
              layer.openPopup();
            },
            mouseout: (e) => {
              const layer = e.target;
              const risk = feature?.properties?.risk;
              layer.setStyle({
                color: getRiskColor(risk),
                weight: 7,
                opacity: 0.9,
              });
              layer.closePopup();
            },
          });
        },
      }).addTo(map);

      liveSegmentLayerRef.current.setZIndex(400);
    },
    [liveSegments, handleSegmentRowClick],
  );

  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return;
    if (!showSegmentsUI) {
      if (
        liveSegmentLayerRef.current &&
        mapRef.current.hasLayer(liveSegmentLayerRef.current)
      ) {
        mapRef.current.removeLayer(liveSegmentLayerRef.current);
        liveSegmentLayerRef.current = null;
      }
      return;
    }

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
    if (!selectedSegmentId || !showSegmentsUI) {
      if (
        selectedPolygonLayerRef.current &&
        mapRef.current.hasLayer(selectedPolygonLayerRef.current)
      ) {
        mapRef.current.removeLayer(selectedPolygonLayerRef.current);
        selectedPolygonLayerRef.current = null;
      }
      return;
    }
  }, [selectedSegmentId, showSegmentsUI]);

  useEffect(() => {
    if (showSegmentsUI && segmentData.length === 0 && !segmentLoading) {
      setSegmentLoading(true);

      loadSegmentStats().then((data) => {
        if (data) {
          const extractedData = data.map((item) => ({
            id: item?.id || 0,
            name: item?.name || "NH 152 Ambala",
            risk: item?.risk ?? null,
            avg_velocity:
              item?.avg_velocity !== undefined && item?.avg_velocity !== null
                ? parseFloat(item.avg_velocity)
                : null,
            point_count: item?.point_count || 0,
          }));
          setSegmentData(extractedData);
        }
        setSegmentLoading(false);
      });
    }
  }, [showSegmentsUI, segmentData.length, segmentLoading, loadSegmentStats]);

  return { handleSegmentRowClick, addLiveSegmentLayer };
}
