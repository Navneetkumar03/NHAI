import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from "../constants";
import { logError, removeAllFromMap } from "../mapUtils";
import { useEffect } from "react";

export function useLandUseMap({
  ResizeObserver,
  addFlyoverLayers,
  debounceRef,
  diffMarkersRef,
  dividerReadyTimeoutRef,
  esriSatelliteLayerRef,
  flyovers,
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
  streetLayerRef,
  updateCircleWeights,
  zoomControlContainerRef
}) {
  useEffect(() => {
    isMountedRef.current = true;


    if (mapRef.current || !mapContainerRef.current) {
      return;
    }


    try {
      const map = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
      });



      const streetLayer = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        {
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 25,
          attribution: "",
          zIndex: 1,
        },
      );

      const satelliteLayer = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        {
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 25,
          attribution: "",
          zIndex: 1,
        },
      );

      const esriSatelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
          attribution: "",
          zIndex: 1,
        },
      );

      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;
      esriSatelliteLayerRef.current = esriSatelliteLayer;

      streetLayer.addTo(map);

      L.control
        .attribution({
          position: "bottomright",
          prefix: false,
        })
        .addTo(map);

      mapRef.current = map;
      isMapReadyRef.current = true;

      // soilPane is still required — the soil overlay is now a tile layer
      // (see overlays/soil.js) but it still renders into this pane.
      map.createPane("soilPane");
      map.getPane("soilPane").style.zIndex = 300;
      map.getPane("soilPane").style.pointerEvents = "auto";

      map.createPane("movementPane");
      map.getPane("movementPane").style.zIndex = 550;
      map.getPane("movementPane").style.pointerEvents = "auto";

      map.on("zoomend", updateCircleWeights);

      const popupPane = map.getPane("popupPane");
      const mapPaneEl = map.getPane("mapPane");

      if (popupPane && mapPaneEl && popupPane.parentNode === mapPaneEl) {
        map.getContainer().appendChild(popupPane);
        popupPane.style.pointerEvents = "none";

        const syncPopupPanePosition = () => {
          popupPane.style.transform = mapPaneEl.style.transform;
        };

        map.on("move zoom viewreset", syncPopupPanePosition);
        syncPopupPanePosition();
      }

      if (typeof ResizeObserver !== "undefined") {
        resizeObserverRef.current = new ResizeObserver(() => {
          try {
            if (
              mapRef.current &&
              mapContainerRef.current &&
              document.contains(mapContainerRef.current)
            ) {
              mapRef.current.invalidateSize();
            }
          } catch (err) {
            logError("[LULC] Error in resize observer:", err);
          }
        });
        resizeObserverRef.current.observe(mapContainerRef.current);
      }

      if (flyovers && flyovers.length > 0) {
        setTimeout(() => {
          try {
            addFlyoverLayers(map);
          } catch (err) {
            logError("[LULC] Error adding flyover layers:", err);
          }
        }, 300);
      }

      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }, 200);

      return () => {
        isMountedRef.current = false;

        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        if (dividerReadyTimeoutRef.current) {
          clearTimeout(dividerReadyTimeoutRef.current);
        }

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        resizeObserverRef.current?.disconnect();

        sideBySideRef.current = null;

        // Capture the map once. If it's already null (some other effect ran
        // first, or a previous cleanup already tore it down), still null out
        // the remaining refs so the next mount starts from a clean slate.
        const map = mapRef.current;

        if (!map) {
          leftLayerRef.current = null;
          rightLayerRef.current = null;
          lulcCreatedRef.current = false;
          selectedMovementMarkerRef.current = null;
          isMapReadyRef.current = false;
          return;
        }

        if (
          liveSegmentLayerRef.current &&
          map.hasLayer(liveSegmentLayerRef.current)
        ) {
          map.removeLayer(liveSegmentLayerRef.current);
          liveSegmentLayerRef.current = null;
        }

        if (
          selectedPolygonLayerRef.current &&
          map.hasLayer(selectedPolygonLayerRef.current)
        ) {
          map.removeLayer(selectedPolygonLayerRef.current);
          selectedPolygonLayerRef.current = null;
        }

        // Clear diff circles.
        removeAllFromMap(map, diffMarkersRef.current);
        diffMarkersRef.current = [];

        leftLayerRef.current = null;
        rightLayerRef.current = null;
        lulcCreatedRef.current = false;

        selectedMovementMarkerRef.current = null;

        try {
          map.off("zoomend", updateCircleWeights);
          map.remove();
        } catch (err) {
          logError("[LULC] Error removing map:", err);
        } finally {
          // Clear the ref even if remove() throws — otherwise a half-torn-down
          // map stays referenced and blocks any future initialization.
          mapRef.current = null;
          isMapReadyRef.current = false;
        }
      };
    } catch (err) {
      logError("[LULC] Error initializing map:", err);
      setError("Failed to initialize map. Please try again.");
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
