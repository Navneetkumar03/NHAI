import { BASE } from "../constants";
import { useEffect } from "react";

export function useSoilData({
    setSoilData,
    setSoilError,
    setSoilLoading,
    setTaxoValues,
    soilDataRef
}) {
    useEffect(() => {
        let cancelled = false;

        const fetchSoilData = async () => {
            try {
                setSoilLoading(true);
                setSoilError(null);

                const response = await fetch(`${BASE}data/Soil.geojson`);
                if (!response.ok) {
                    throw new Error(`Failed to load soil data: ${response.status}`);
                }

                const data = await response.json();
                if (cancelled) return;

                soilDataRef.current = data;
                setSoilData(data);

                setTaxoValues(
                    Array.from(
                        new Set(
                            (data.features || [])
                                .map((feature) => feature.properties?.S_TAXO)
                                .filter(Boolean),
                        ),
                    ).sort(),
                );
            } catch (err) {
                if (!cancelled) {
                    console.error("[LULC] Error loading soil data:", err);
                    setSoilError(err.message || "Failed to load soil data");
                }
            } finally {
                if (!cancelled) setSoilLoading(false);
            }
        };

        fetchSoilData();

        return () => {
            cancelled = true;
        };
    }, []);
}
