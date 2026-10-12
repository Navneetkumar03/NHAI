// src/components/maps/LandUseLandCover/panels/RiskOverviewPanel.jsx
import { useEffect, useState, useRef } from "react";
import { Loader2, AlertTriangle, Table, X } from "lucide-react";
import { fetchRiskInsight } from "../../../../services/api/riskInsight";
/**
 * Formats meters into a compact km / m string.
 *   14811.3 → "14.8 km"
 *   150     → "150 m"
 *   0       → "0 m"
 */
function formatDistance(meters) {
  if (typeof meters !== "number" || !Number.isFinite(meters)) return "—";
  if (meters === 0) return "0 m";
  if (meters >= 1000) return `${Math.ceil(meters / 1000)} km`;
  return `${Math.ceil(meters)} m`;
}

export function RiskOverviewPanel({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    const myRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    fetchRiskInsight()
      .then((response) => {
        if (!isMountedRef.current) return;
        if (myRequestId !== requestIdRef.current) return;

        const ok = response?.status === "success";
        const payload = response?.data ?? null;

        if (!ok || !payload) {
          throw new Error("Invalid response from risk overview API");
        }

        setData(payload);
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        if (myRequestId !== requestIdRef.current) return;

        console.error("Error loading risk overview:", err);
        setError(err.message || "Failed to fetch risk overview");
        setData(null);
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derive display values from whatever we have (or fallback placeholders
  // while loading, so the panel doesn't jump in height).
  const d = data || {};
  const count = (d.segment_count);
  const total = formatDistance(d.total_length_m);
  const low = formatDistance(d.risk_1_2_length_m);
  const medium = formatDistance(d.risk_3_length_m);
  const high = formatDistance(d.risk_4_5_length_m);

  return (
    <div className="absolute top-2 right-3 z-[1500] max-w-[260px] w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden max-[480px]:top-auto max-[480px]:bottom-3 max-[480px]:right-2 max-[480px]:max-w-[145px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 max-[480px]:px-2 max-[480px]:py-1.5">
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 max-[480px]:text-[9px]">
          <Table
            size={14}
            className="max-[480px]:w-3 max-[480px]:h-3 flex-shrink-0"
          />
          <span className="max-[480px]:leading-tight">
            Linear Assets · Risk
          </span>
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <X size={14} className="max-[480px]:w-3 max-[480px]:h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-3 text-xs max-[480px]:px-2 max-[480px]:py-2 max-[480px]:text-[9px]">
        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[11px]">Loading…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 py-3 text-red-600">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span className="text-[11px]">
              Failed to load risk data
            </span>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">
                {count} ({total})
              </span>
            </div>

            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-gray-600 max-[480px]:text-[8px]">
                Low (1-2)
              </span>
              <span className="font-medium text-blue-600">
                {low}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-gray-600 max-[480px]:text-[8px]">
                Medium (3)
              </span>
              <span className="font-medium text-orange-500">
                {medium}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 gap-2">
              <span className="text-gray-600 max-[480px]:text-[8px]">
                High (4-5)
              </span>
              <span className="font-medium text-red-500">
                {high}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RiskOverviewPanel;