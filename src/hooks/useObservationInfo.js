// src/hooks/useObservationInfo.js
import { useState, useEffect } from "react";
import { getObservationDate } from "../services/api/weather";

/**
 * Fetches the observation period metadata once on mount.
 * Powers the ObservationInfo bar on the Dashboard.
 *
 * Returns:
 *   {
 *     info:    { startDate, lastDate, count } | null,
 *     loading: boolean,
 *     error:   string | null,
 *   }
 */
export function useObservationInfo() {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await getObservationDate();
                if (cancelled) return;

                // Backend: { status, data: { start_date, last_date, obs_count } }
                const payload = response?.data ?? response;

                if (payload?.start_date && payload?.last_date) {
                    setInfo({
                        startDate: payload.start_date,
                        lastDate: payload.last_date,
                        count: payload.observation_count ?? 0,
                    });
                } else {
                    setError("Invalid observation date response");
                }
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load observation info");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return { info, loading, error };
}