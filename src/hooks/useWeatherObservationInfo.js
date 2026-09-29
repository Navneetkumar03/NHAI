// src/hooks/weather_observationInfo.js
import { useState, useEffect, useRef } from "react";
import { sendLocationToAPI, getObservationDate } from "../services/api/weatherObsInfo";

/* ============================================================
   useWeather   Fetch weather for a specific target.
 
   ============================================================ */


export function useWeather(target) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!target) {
            setWeather(null);
            setLoading(false);
            setError(null);
            return;
        }

        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        sendLocationToAPI(target)
            .then((response) => {
                if (requestIdRef.current === requestId) setWeather(response);
            })
            .catch((err) => {
                console.error("Failed to load weather:", err);
                if (requestIdRef.current === requestId) {
                    setWeather(null);
                    setError(err.message || "Failed to load weather");
                }
            })
            .finally(() => {
                if (requestIdRef.current === requestId) setLoading(false);
            });
    }, [target?.flyoverId, target?.lat, target?.lng]);

    return { weather, loading, error };
}

/* ============================================================
   useObservationInfo Fetch the observation-period metadata once on mount.
    { status: "success", data: { start_date, last_date, observation_count } }
   ============================================================ */

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

                // Handle both shapes:
                //   { status, data: { start_date, last_date, observation_count } }
                //   { start_date, last_date, observation_count }
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