import { sendUserActivity } from "../../../../services/api/auth";
import { useCallback } from "react";

export function useFlyoverInteractions({
  activeFlyoverId,
  flyoverBoundsRef,
  mapRef,
  setActiveFlyoverId
}) {
const flyoverActivityNames = {
    F1: "1ROB(Chainage 5+362)-Button",
    F2: "2-Flyover-Button",
    F3: "3ROB(Chainage 0+930)-Button",
    F4: "4MNB-Button",
  };

const handleFlyoverButtonClick = useCallback(
    (flyoverEntry) => {
      const map = mapRef.current;
      if (!map || !flyoverEntry) return;

      // Toggle off if the same button is clicked again
      if (activeFlyoverId === flyoverEntry.id) {
        setActiveFlyoverId(null);
        flyoverBoundsRef.current.forEach((f) => {
          f.layers.forEach((layer) => {
            layer.setStyle({
              color: f.color,
              weight: 3,
              opacity: 0.8,
              fillColor: f.color,
              fillOpacity: 0.2,
            });
          });
        });
        return;
      }

      setActiveFlyoverId(flyoverEntry.id);
      // Capture flyover activity
      sendUserActivity(
        flyoverActivityNames[flyoverEntry.flyover] ||
        ` ${flyoverEntry.name}-Button`,
        "InfraRisk",
      );

      flyoverBoundsRef.current.forEach((f) => {
        const isActive = f.id === flyoverEntry.id;
        f.layers.forEach((layer) => {
          layer.setStyle({
            color: isActive ? "#facc15" : f.color,
            weight: isActive ? 6 : 3,
            opacity: isActive ? 1 : 0.8,
            fillColor: isActive ? "#facc15" : f.color,
            fillOpacity: isActive ? 0.35 : 0.2,
          });
        });
        if (isActive) {
          f.layers.forEach((layer) => {
            if (typeof layer.bringToFront === "function") layer.bringToFront();
          });
        }
      });

      // Zoom to the flyover bounds
      if (flyoverEntry.bounds && flyoverEntry.bounds.isValid()) {
        map.fitBounds(flyoverEntry.bounds, {
          padding: [60, 60],
          maxZoom: 18,
          animate: true,
        });
      }
    },
    [activeFlyoverId],
  );

  return { handleFlyoverButtonClick };
}
