// src/components/maps/LandUseLandCover/hooks/useOverlayLayers.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logError } from "../mapUtils";
import {
    EXCLUSIVE_IDS,
    INITIAL_ENABLED,
    MANAGED_IDS,
    OVERLAY_REGISTRY,
} from "../overlayRegistry";
import { updateRainfallYear } from "../overlays/rainfall";

/**
 * useOverlayLayers
 * ----------------
 * The single hook that manages every registered overlay.
 *
 * Inputs
 * ------
 * @param {object}   mapRef        Ref to the Leaflet map instance.
 * @param {object}   isMapReadyRef Ref that flips true once the map is ready.
 * @param {object=}  ctx           Extra values overlay `add`/`remove`/`onToggle`
 *                                 need (refs, callbacks). Flattened and
 *                                 merged into the context passed to each
 *                                 overlay function.
 * @param {*}        refreshKey    Optional value; when it changes, the
 *                                 lifecycle effect re-runs. Used by data-
 *                                 backed overlays whose `add` needs to
 *                                 retry once async data arrives.
 * @param {number=}  rainfallYear  Current year for the Rainfall overlay.
 *                                 When this changes while Rainfall is
 *                                 active, Pass 1.5 hot-swaps the tile URL
 *                                 in place (no remove/re-add).
 *
 * Returns
 * -------
 * @returns {{
 *   enabled: Record<string, boolean>,   // { dem: true, soil: false, ... }
 *   isOn:    (id: string) => boolean,   // enabled[id]
 *   toggle:  (id: string) => void,      // flip one, enforce exclusivity
 *   set:     (id: string, want: boolean) => void,
 *   setMany: (patch: Record<string, boolean>) => void,
 * }}
 */
export function useOverlayLayers({
    mapRef,
    isMapReadyRef,
    ctx = {},
    refreshKey,
    rainfallYear,
}) {
    /* ---------------------------------------------------------------- *
     * State
     * ---------------------------------------------------------------- */

    // { [overlayId]: boolean }  — seeded from the registry's defaultOn
    const [enabled, setEnabled] = useState(() => ({ ...INITIAL_ENABLED }));

    // { [overlayId]: LeafletLayer | null }
    // Not React state — the layer instances are mutable Leaflet objects and
    // putting them in state would cause re-renders for no reason.
    const layersRef = useRef({});

    // Keep ctx in a ref so the effect never needs ctx as a dependency.
    // Overlay functions read the latest ctx at call time.
    const ctxRef = useRef(ctx);
    ctxRef.current = ctx;

    /* ---------------------------------------------------------------- *
     * Public API
     * ---------------------------------------------------------------- */

    const isOn = useCallback((id) => !!enabled[id], [enabled]);

    /**
     * Flip a single overlay. If turning ON and the overlay is exclusive,
     * every other exclusive overlay is turned OFF in the same state update
     * (atomic — no queue, no race).
     */
    const toggle = useCallback((id) => {
        setEnabled((prev) => {
            const want = !prev[id];
            const next = { ...prev, [id]: want };

            if (want && EXCLUSIVE_IDS.includes(id)) {
                for (const other of EXCLUSIVE_IDS) {
                    if (other !== id) next[other] = false;
                }
            }
            return next;
        });
    }, []);

    /** Set one overlay to a specific value. Enforces exclusivity on true. */
    const set = useCallback((id, want) => {
        setEnabled((prev) => {
            if (prev[id] === want) return prev;
            const next = { ...prev, [id]: want };

            if (want && EXCLUSIVE_IDS.includes(id)) {
                for (const other of EXCLUSIVE_IDS) {
                    if (other !== id) next[other] = false;
                }
            }
            return next;
        });
    }, []);

    /** Apply many flags at once (used when restoring state or resetting). */
    const setMany = useCallback((patch) => {
        setEnabled((prev) => ({ ...prev, ...patch }));
    }, []);

    /* ---------------------------------------------------------------- *
     * The one effect that manages every registered overlay's lifecycle
     * ---------------------------------------------------------------- */

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isMapReadyRef.current) return;

        const context = { map, ...ctxRef.current };

        // ============================================================
        // PASS 1 — Leaflet layer lifecycle for MANAGED overlays only
        // ============================================================
        // Iterate the registry in order so dependent overlays (LULC creates
        // panes, Soil assumes a pane exists, etc.) are created in a stable
        // sequence.
        for (const overlay of OVERLAY_REGISTRY) {
            // Custom overlays (Linear, Traffic) have no Leaflet layer of
            // their own — skip them here. Pass 2 below still calls their
            // onToggle.
            if (!MANAGED_IDS.includes(overlay.id)) continue;

            const want = !!enabled[overlay.id];
            const existing = layersRef.current[overlay.id];

            // ---- TURN OFF ----
            if (!want && existing) {
                try {
                    overlay.remove?.(context, existing);
                } catch (err) {
                    logError(`[overlay] remove ${overlay.id} failed:`, err);
                }
                layersRef.current[overlay.id] = null;
                continue;
            }

            // ---- TURN ON ----
            if (want && !existing) {
                try {
                    const layer = overlay.add?.(context) ?? null;
                    layersRef.current[overlay.id] = layer;
                } catch (err) {
                    logError(`[overlay] add ${overlay.id} failed:`, err);
                    layersRef.current[overlay.id] = null;
                }
            }

            // (want && existing)  → already on, nothing to do
            // (!want && !existing) → already off, nothing to do
        }

        // ============================================================
        // PASS 1.5 — Rainfall year hot-swap
        // ============================================================
        // The rainfall tile layer takes a {year} parameter baked into its
        // URL. When the user changes the year in the top bar while the
        // layer is already active, we swap the tile URL in place rather
        // than tearing the layer down and re-adding it.
        //
        // updateRainfallYear is idempotent — it's a no-op if the year
        // hasn't actually changed, so this block is safe to run on every
        // effect cycle.
        const rainfallLayer = layersRef.current["rainfall"];
        if (rainfallLayer && enabled["rainfall"]) {
            try {
                updateRainfallYear(map, rainfallLayer, rainfallYear);
            } catch (err) {
                logError("[overlay] rainfall year swap failed:", err);
            }
        }

        // ============================================================
        // PASS 2 — onToggle for EVERY registered overlay
        // ============================================================
        // Runs for both managed and custom overlays, so a `custom: true`
        // descriptor like Traffic can still react to enable/disable.
        //
        // This lives in its own pass (rather than inline in the branch
        // above) so:
        //   1. It fires exactly once per state change, not once per
        //      add-*or*-remove branch.
        //   2. It fires for custom overlays that never enter pass 1.
        //   3. It runs *after* the Leaflet layer exists or has been
        //      removed, so onToggle can safely read layersRef.
        for (const overlay of OVERLAY_REGISTRY) {
            const want = !!enabled[overlay.id];
            try {
                overlay.onToggle?.(context, want);
            } catch (err) {
                logError(`[overlay] onToggle ${overlay.id} failed:`, err);
            }
        }
        // refreshKey lets data-backed descriptors retry their `add` function when
        // their data arrives (for example Soil after its GeoJSON fetch resolves).
        // rainfallYear is in the deps so Pass 1.5 runs whenever the year changes.
    }, [enabled, mapRef, isMapReadyRef, refreshKey, rainfallYear]);

    /* ---------------------------------------------------------------- *
     * Teardown on unmount — removes every managed Leaflet layer
     * ---------------------------------------------------------------- */

    useEffect(() => {
        return () => {
            const map = mapRef.current;
            if (!map) return;

            const context = { map, ...ctxRef.current };

            for (const overlay of OVERLAY_REGISTRY) {
                if (!MANAGED_IDS.includes(overlay.id)) continue;

                const layer = layersRef.current[overlay.id];
                if (!layer) continue;

                try {
                    overlay.remove?.(context, layer);
                } catch (err) {
                    logError(`[overlay] teardown ${overlay.id} failed:`, err);
                }
                layersRef.current[overlay.id] = null;
            }
        };
        // Intentionally empty deps — run only on unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------------------------------------------------------------- *
     * Return a stable object so consumers can memo on it
     * ---------------------------------------------------------------- */

    return useMemo(
        () => ({ enabled, isOn, toggle, set, setMany }),
        [enabled, isOn, toggle, set, setMany],
    );
}

