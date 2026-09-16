import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import {
  Loader2,
  AlertTriangle,
  Layers,
  X,
  Maximize,
  Minimize,
  CircleDot,
  ChevronDown,
  Calendar,
  Table,
  Map,
  Eye,
  EyeOff,
  Navigation,   // 🆕 add this
} from "lucide-react";

export function RiskOverviewPanel({ onClose }) {
  const overviewData = {
    total: { count: 761, distance: "15 km" },
    low: "14 km",
    medium: "150 m",
    high: "0 m",
  };

  return (
    <div className="absolute top-2 right-3 z-[1500] max-w-[260px] w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden max-[480px]:top-auto max-[480px]:bottom-3 max-[480px]:right-2 max-[480px]:max-w-[145px]">
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

      <div className="px-3 py-3 text-xs max-[480px]:px-2 max-[480px]:py-2 max-[480px]:text-[9px]">
        <div className="flex items-center justify-between py-1 gap-2">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-900">
            {overviewData.total.distance}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 gap-2">
          <span className="text-gray-600 max-[480px]:text-[8px]">
            Low (1-2)
          </span>
          <span className="font-medium text-blue-600">{overviewData.low}</span>
        </div>

        <div className="flex items-center justify-between py-1 gap-2">
          <span className="text-gray-600 max-[480px]:text-[8px]">
            Medium (3)
          </span>
          <span className="font-medium text-orange-500">
            {overviewData.medium}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 gap-2">
          <span className="text-gray-600 max-[480px]:text-[8px]">
            High (4-5)
          </span>
          <span className="font-medium text-red-500">{overviewData.high}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/
