// src/components/maps/LandUseLandCover/overlays/lulc.js
import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    LULC_FADE_MS,
    MAX_ZOOM,
    MIN_ZOOM,
    TILE_LAYER_URL,
} from "../constants";
import { logError } from "../mapUtils";


export const lulcOverlay = {
    id: "lulc",
    name: "LULC",
    color: "#10B981",
    exclusive: true,
    defaultOn: false,
    hasLegend: true,

    add({
        map,
        leftLayerRef,
        rightLayerRef,
        sideBySideRef,
        tagRef,
        dividerLineRef,
        rafIdRef,
        yearLeft,
        yearRight,
        setIsDividerReady,
        hasFitBoundsRef,
        lulcCreatedRef,
    }) {
        if (!map || leftLayerRef?.current) {
            return null;
        }

        const handleDividerMove = () => {
            if (rafIdRef.current) return;
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                if (!sideBySideRef.current) return;
                const px = `${sideBySideRef.current.getPosition()}px`;
                if (tagRef.current) tagRef.current.style.left = px;
                if (dividerLineRef.current) dividerLineRef.current.style.left = px;
            });
        };

        const leftLayer = L.tileLayer(
            TILE_LAYER_URL.replace("{year}", String(yearLeft)),
            {
                tileSize: 256,
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM,
                crossOrigin: true,
                opacity: 1,
                zIndex: 10,
            },
        );

        const rightLayer = L.tileLayer(
            TILE_LAYER_URL.replace("{year}", String(yearRight)),
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

        // The control starts invisible; the fade effect turns it on.
        const controlEl = sideBySide._container;
        if (controlEl) {
            controlEl.style.transition = `opacity ${LULC_FADE_MS}ms ease`;
            controlEl.style.opacity = "0";
            controlEl.style.pointerEvents = "none";
        }


        leftLayerRef.current = leftLayer;
        rightLayerRef.current = rightLayer;
        sideBySideRef.current = sideBySide;
        if (lulcCreatedRef) lulcCreatedRef.current = true;

        requestAnimationFrame(() => requestAnimationFrame(handleDividerMove));

        // Fit to bounds once per session
        if (hasFitBoundsRef && !hasFitBoundsRef.current) {
            const bounds = map.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
                hasFitBoundsRef.current = true;
            }
        }

        // Signal the fade effect that LULC is ready
        if (typeof setIsDividerReady === "function") {
            setIsDividerReady(true);
        }

        // Make the layer visible only after Leaflet has mounted its controls.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            leftLayer.setOpacity(1);
            rightLayer.setOpacity(1);
            if (sideBySide._container) {
                sideBySide._container.style.opacity = "1";
                sideBySide._container.style.pointerEvents = "auto";
            }
            if (tagRef.current) tagRef.current.style.opacity = "1";
            if (dividerLineRef.current) dividerLineRef.current.style.opacity = "1";
        }));

        // Return both layers as an array so remove() can find them.
        return [leftLayer, rightLayer];
    },

    remove(
        {
            map,
            leftLayerRef,
            rightLayerRef,
            sideBySideRef,
            setIsDividerReady,
            lulcCreatedRef,
            tagRef,
            dividerLineRef,
        },
        layers,
    ) {
        if (!map) return;

        // Remove the control first — otherwise it can try to reposition
        // after the tiles are gone.
        if (sideBySideRef.current) {
            try { map.removeControl(sideBySideRef.current); } catch (err) {
                logError("[lulc] error removing sideBySide:", err);
            }
            sideBySideRef.current = null;
        }

        // Remove the tile layers
        const [leftLayer, rightLayer] = Array.isArray(layers) ? layers : [];
        if (leftLayer && map.hasLayer(leftLayer)) map.removeLayer(leftLayer);
        if (rightLayer && map.hasLayer(rightLayer)) map.removeLayer(rightLayer);

        // Null the refs the year-change effect reads
        leftLayerRef.current = null;
        rightLayerRef.current = null;
        if (lulcCreatedRef) lulcCreatedRef.current = false;
        if (tagRef.current) tagRef.current.style.opacity = "0";
        if (dividerLineRef.current) dividerLineRef.current.style.opacity = "0";

        if (typeof setIsDividerReady === "function") {
            setIsDividerReady(false);
        }
    },

    // 🆕 Fly to the default view whenever LULC is turned on.
    onToggle({ map }, want) {
        if (!want) return;
        map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
            animate: true,
            duration: 1.2,
        });
    },
};