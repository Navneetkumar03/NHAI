// src/components/maps/LandUseLandCover/hooks/useGeolocation.js
import { sendUserActivity } from "../../../../services/api/auth";
import { useCallback, useState } from "react";

export function useGeolocation({
  mapRef,
  userAccuracyCircleRef,
  userLocationMarkerRef,
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  // 🆕 Tracks whether a location fix is currently shown on the map.
  const [gpsActive, setGpsActive] = useState(false);

  /* ------------------------------------------------------------------ *
   * Internal: tear down marker + halo (does NOT touch gpsActive)
   * ------------------------------------------------------------------ */
  const removeLocationLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocationMarkerRef.current) {
      map.removeLayer(userLocationMarkerRef.current);
      userLocationMarkerRef.current = null;
    }
    if (userAccuracyCircleRef.current) {
      map.removeLayer(userAccuracyCircleRef.current);
      userAccuracyCircleRef.current = null;
    }
  }, [mapRef, userLocationMarkerRef, userAccuracyCircleRef]);

  /* ------------------------------------------------------------------ *
   * Public: user clicked the button while GPS was already active
   * ------------------------------------------------------------------ */
  const clearLocation = useCallback(() => {
    removeLocationLayers();
    setGpsActive(false);
    setGpsError(null);
    setGpsLoading(false);
    sendUserActivity("Clicked GPS-Clear-Button", "InfraRisk");
  }, [removeLocationLayers]);

  /* ------------------------------------------------------------------ *
   * Public: user clicked the button to locate
   * ------------------------------------------------------------------ */
  const handleLocateMe = useCallback(() => {
    console.log("=== [GPS] BUTTON CLICKED ===");
    console.log("[GPS] mapRef.current:", mapRef.current);
    console.log("[GPS] isSecureContext:", window.isSecureContext);
    console.log("[GPS] geolocation supported:", "geolocation" in navigator);

    if (!mapRef.current) {
      console.warn("[GPS] mapRef.current is null — map not ready, bailing out.");
      setGpsError("Map is not ready yet. Please wait a moment and try again.");
      setTimeout(() => setGpsError(null), 4000);
      return;
    }

    if (!("geolocation" in navigator)) {
      console.warn("[GPS] navigator.geolocation is unavailable.");
      setGpsError("Geolocation is not supported by this browser.");
      setTimeout(() => setGpsError(null), 4000);
      return;
    }

    if (!window.isSecureContext) {
      console.warn(
        "[GPS] Not a secure context — geolocation will be blocked by the browser.",
      );
      setGpsError("Location requires HTTPS");
      setTimeout(() => setGpsError(null), 5000);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);

        const { latitude, longitude, accuracy } = position.coords;
        const map = mapRef.current;
        if (!map) {
          console.warn("[GPS] Map disappeared before position arrived.");
          return;
        }

        console.log("[GPS] SUCCESS:", { latitude, longitude, accuracy });

        const latlng = [latitude, longitude];

        // Wipe any previous marker / halo before drawing new ones
        removeLocationLayers();

        if (!map.getPane("gpsPane")) {
          map.createPane("gpsPane");
          map.getPane("gpsPane").style.zIndex = 650;
          map.getPane("gpsPane").style.pointerEvents = "none";
        }

        // --- Accuracy halo -------------------------------------------------
        const haloRadius = Math.min(Math.max(accuracy || 30, 10), 2000);

        userAccuracyCircleRef.current = L.circle(latlng, {
          pane: "gpsPane",
          radius: haloRadius,
          color: "#2563eb",
          weight: 1,
          opacity: 0.7,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          interactive: false,
        }).addTo(map);

        // --- Marker --------------------------------------------------------
        const userIcon = L.divIcon({
          className: "gps-user-marker-wrapper",
          html: `
          <div style="
            position: relative;
            width: 26px;
            height: 26px;
          ">
            <span style="
              position:absolute; inset:0;
              border-radius:50%;
              background: rgba(59,130,246,0.45);
              animation: gps-pulse 1.8s ease-out infinite;
            "></span>
            <span style="
              position:absolute;
              top:50%; left:50%;
              width:14px; height:14px;
              margin:-7px 0 0 -7px;
              border-radius:50%;
              background:#2563eb;
              border:2px solid #ffffff;
              box-shadow:0 0 6px rgba(0,0,0,0.45);
            "></span>
          </div>
        `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -13],
        });

        const marker = L.marker(latlng, {
          icon: userIcon,
          pane: "gpsPane",
          zIndexOffset: 2000,
          keyboard: false,
        }).addTo(map);

        userLocationMarkerRef.current = marker;

        // --- Camera --------------------------------------------------------
        const targetZoom =
          accuracy && accuracy > 500
            ? Math.min(map.getZoom(), 13)
            : Math.max(map.getZoom(), 16);

        map.flyTo(latlng, targetZoom, { animate: true, duration: 1.2 });

        setTimeout(() => {
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.openPopup();
          }
        }, 1300);

        // 🆕 Mark as active so the button highlights
        setGpsActive(true);

        sendUserActivity("Clicked GPS-Locate-Button", "InfraRisk");
      },
      (err) => {
        setGpsLoading(false);

        console.warn("[GPS] ERROR:", err.code, err.message);

        let msg = "Unable to get your location.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg =
              "Location permission denied. Enable it in your browser settings and try again.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            msg = "Location request timed out.";
            break;
          default:
            msg = err.message || msg;
        }
        setGpsError(msg);
        setTimeout(() => setGpsError(null), 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, [mapRef, userAccuracyCircleRef, userLocationMarkerRef, removeLocationLayers]);

  // 🆕 Return gpsActive + clearLocation so the button can toggle
  return { handleLocateMe, clearLocation, gpsLoading, gpsError, gpsActive };
}




