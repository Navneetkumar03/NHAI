import { LULC_FADE_MS, MAX_ZOOM, MIN_ZOOM, TILE_LAYER_URL } from "../constants";
import { useCallback } from "react";

export function useLULCLayer({
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
  yearRight
}) {
const handleDividerMove = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!sideBySideRef.current) {
        return;
      }
      const pos = sideBySideRef.current.getPosition();
      const px = `${pos}px`;
      if (tagRef.current) {
        tagRef.current.style.left = px;
      }
      if (dividerLineRef.current) {
        dividerLineRef.current.style.left = px;
      }
    });
  }, []);

  const ensureLULCLayersExist = useCallback(() => {
    if (!mapRef.current || lulcCreatedRef.current) {
      return;
    }

    const map = mapRef.current;

    const leftLayer = L.tileLayer(TILE_LAYER_URL.replace("{year}", yearLeft), {
      tileSize: 256,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      crossOrigin: true,
      opacity: 0,
      zIndex: 10,
    });

    const rightLayer = L.tileLayer(
      TILE_LAYER_URL.replace("{year}", yearRight),
      {
        tileSize: 256,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        crossOrigin: true,
        opacity: 0,
        zIndex: 10,
      },
    );

    leftLayer.addTo(map);
    rightLayer.addTo(map);

    const sideBySide = L.control
      .sideBySide([leftLayer], [rightLayer])
      .addTo(map);

    sideBySide.setPosition(0.5);
    sideBySide.on("dividermove", handleDividerMove);

    const controlEl = sideBySide._container;

    if (controlEl) {
      controlEl.style.transition = `opacity ${LULC_FADE_MS}ms ease`;
      controlEl.style.opacity = "0";
      controlEl.style.pointerEvents = "none";
    }

    leftLayerRef.current = leftLayer;
    rightLayerRef.current = rightLayer;
    sideBySideRef.current = sideBySide;
    lulcCreatedRef.current = true;

    requestAnimationFrame(() => requestAnimationFrame(handleDividerMove));

    if (!hasFitBoundsRef.current) {
      const bounds = map.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
        hasFitBoundsRef.current = true;
      }
    }

    setIsDividerReady(true);
  }, [yearLeft, yearRight, handleDividerMove]);

  const teardownLULCLayers = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    if (sideBySideRef.current) {
      mapRef.current.removeControl(sideBySideRef.current);
      sideBySideRef.current = null;
    }

    if (leftLayerRef.current && mapRef.current.hasLayer(leftLayerRef.current)) {
      mapRef.current.removeLayer(leftLayerRef.current);
    }

    if (
      rightLayerRef.current &&
      mapRef.current.hasLayer(rightLayerRef.current)
    ) {
      mapRef.current.removeLayer(rightLayerRef.current);
    }

    leftLayerRef.current = null;
    rightLayerRef.current = null;
    lulcCreatedRef.current = false;
    setIsDividerReady(false);
  }, []);

  return { ensureLULCLayersExist, teardownLULCLayers };
}
