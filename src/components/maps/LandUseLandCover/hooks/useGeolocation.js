import { sendUserActivity } from "../../../../services/api/auth";
import { useCallback } from "react";

export function useGeolocation({
  mapRef,
  setGpsError,
  setGpsLoading,
  userAccuracyCircleRef,
  userLocationMarkerRef
}) {
const handleLocateMe = useCallback(() => {
    if (!mapRef.current) return;

    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by this browser.");
      setTimeout(() => setGpsError(null), 4000);
      return;
    }

    // Secure-context guard — geolocation silently misbehaves over plain HTTP
    if (!window.isSecureContext) {
      setGpsError(
        "Location requires HTTPS. Please open this site over https:// or localhost."
      );
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
        if (!map) return;

        const latlng = [latitude, longitude]; // [lat, lng] — correct for Leaflet

        // Wipe any previous marker / halo
        if (userLocationMarkerRef.current) {
          map.removeLayer(userLocationMarkerRef.current);
          userLocationMarkerRef.current = null;
        }
        if (userAccuracyCircleRef.current) {
          map.removeLayer(userAccuracyCircleRef.current);
          userAccuracyCircleRef.current = null;
        }

        // Ensure a dedicated pane exists so GPS always draws on top
        if (!map.getPane("gpsPane")) {
          map.createPane("gpsPane");
          map.getPane("gpsPane").style.zIndex = 650; // above markers (600)
          map.getPane("gpsPane").style.pointerEvents = "none";
        }

        // --- Accuracy halo --------------------------------------------------
        // L.circle radius is METERS. Clamp so a bad IP fix doesn't paint a
        // country-sized disc.
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

        // --- Marker ---------------------------------------------------------
        // Inline styles on every element so this works even if the <style>
        // block below is missing/overridden.
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

        marker.bindPopup(
          `<div style="font-size:12px; font-family:Arial,sans-serif; padding:2px 4px;">
           <strong>You are here</strong><br/>
           Lat: ${latitude.toFixed(5)}<br/>
           Lng: ${longitude.toFixed(5)}<br/>
           Accuracy: ±${Math.round(accuracy)} m
         </div>`
        );

        userLocationMarkerRef.current = marker;

        // --- Camera ---------------------------------------------------------
        // If accuracy is bad, zoom out enough to fit the halo instead of
        // slamming to zoom 16 on a meaningless point.
        const targetZoom =
          accuracy && accuracy > 500
            ? Math.min(map.getZoom(), 13)
            : Math.max(map.getZoom(), 16);

        map.flyTo(latlng, targetZoom, { animate: true, duration: 1.2 });

        // Open popup a moment after the fly settles
        setTimeout(() => {
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.openPopup();
          }
        }, 1300);

        sendUserActivity("Clicked GPS-Locate-Button", "InfraRisk");
      },
      (err) => {
        setGpsLoading(false);

        let msg = "Unable to get your location.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = "Location permission denied.";
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
        setTimeout(() => setGpsError(null), 4000);
      },
      {
        // 🔑 The three biggest fixes for "wrong location":
        enableHighAccuracy: false, // let the browser use Wi-Fi/IP when GPS is absent
        timeout: 15000,            // give it more time than 10 s
        maximumAge: 30000,         // accept a fix up to 30 s old
      }
    );
  }, []);

  return { handleLocateMe };
}
