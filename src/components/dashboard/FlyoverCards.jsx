import { useCallback } from "react";
import FlyoverMap from "../maps/FlyoverMap";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

const riskStyles = {
  low: "bg-gradient-to-r from-emerald-500 to-success",
  moderate: "bg-gradient-to-r from-amber-400 to-warning",
  high: "bg-gradient-to-r from-rose-500 to-danger",
};

const riskLabel = {
  low: "Low Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
};

const riskIcon = {
  low: CheckCircle2,
  moderate: AlertTriangle,
  high: ShieldAlert,
};

export default function FlyoverCard({
  highway,
  riskStatus,
  center,
  points,
  geojson,
  color,
  namedPoints, //  add this
  isActive = false,
  onActivate,
  onMapClick,
  markerPosition,
  weather,
  weatherLoading,
  id,
}) {
  const handleMapClick = useCallback(
    (lat, lng, point) => {
      //console.log(`Map clicked on ${highway}:`, lat, lng);
      if (onMapClick) {
        onMapClick(lat, lng, id, point);
      }
    },
    [onMapClick, id],
  );
  //console.log("Popup render:", { weather, weatherLoading });
  const RiskIcon = riskIcon[riskStatus];

  return (


    // <div
    //   className={`relative rounded-xl2 p-[5px] overflow-hidden cursor-pointer h-full transition-all duration-200 ${isActive
    //     ? "animated-gradient-border shadow-lg"
    //     : "bg-gray-200 ring-2 ring-gray-200 hover:ring-secondary/50 hover:shadow-lg"
    //     }`}
    //   onClick={onActivate}
    // >
    //   <div className="relative rounded-xl2 overflow-hidden shadow-card h-full bg-white">
    //     <div className="w-full h-full">
    //       <FlyoverMap
    //         center={center || [28.6139, 77.229]}
    //         zoom={15}
    //         points={namedPoints || points || []}
    //         geojson={geojson}
    //         riskStatus={riskStatus}
    //         isActive={isActive}
    //         color={color}
    //         markerPosition={markerPosition}
    //         onMapClick={handleMapClick}
    //         weather={markerPosition ? weather : null}
    //         weatherLoading={markerPosition ? weatherLoading : false}
    //       />
    //     </div>

    //     {/* bottom gradient scrim for legibility */}
    //     <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

    //     <span
    //       className={`absolute bottom-2.5 right-2  flex items-center gap-1 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg z-[1000] shadow-md ${riskStyles[riskStatus]}`}
    //     >
    //       <RiskIcon size={12} />
    //       {riskLabel[riskStatus]}
    //     </span>

    //     {isActive && (
    //       <span className="absolute top-0.5 right-10 bg-gradient-to-r from-primary to-secondary text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full z-[1000] shadow-md">
    //         ● Active
    //       </span>
    //     )}
    //   </div>
    // </div>


    <div
      className={`relative rounded-xl2 p-[5px] overflow-hidden cursor-pointer h-full transition-all duration-200 ${isActive
        ? "animated-gradient-border shadow-lg"
        : "bg-gray-200 ring-2 ring-gray-200 hover:ring-secondary/50 hover:shadow-lg"
        }`}
      onClick={onActivate}
    >
      <div className="relative rounded-xl2 overflow-hidden shadow-card h-full bg-white">
        <div className="w-full h-full">
          <FlyoverMap
            center={center || [28.6139, 77.229]}
            zoom={15}
            points={namedPoints || points || []}
            geojson={geojson}
            riskStatus={riskStatus}
            isActive={isActive}
            color={color}
            markerPosition={markerPosition}
            onMapClick={handleMapClick}
            weather={markerPosition ? weather : null}
            weatherLoading={markerPosition ? weatherLoading : false}
          />
        </div>

        {/* bottom gradient scrim for legibility */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        <span
          className={`absolute bottom-2.5 right-2.5 flex items-center gap-1 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg z-[1000] shadow-md ${riskStyles[riskStatus]}`}
        >
          <RiskIcon size={12} />
          {riskLabel[riskStatus]}
        </span>

        {isActive && (
          <span className="absolute top-0.5 right-2 bg-gradient-to-r from-primary to-secondary text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full z-[1000] shadow-md">
            ● Active
          </span>
        )}
      </div>
    </div>

  );
}
