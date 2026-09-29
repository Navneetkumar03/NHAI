// pages/DashboardPage.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { useFlyoverData } from "../hooks/useFlyoverData";
import {
  useWeather,
  useObservationInfo,
} from "../hooks/useWeatherObservationInfo";
import { getStatsFromFlyovers } from "../utils/geoJsonParser";
import { sendUserActivity } from "../services/api/auth";

import StatsCards from "../components/dashboard/StatsCards";
import FlyoverCard from "../components/dashboard/FlyoverCards";
import WeatherPanel from "../components/dashboard/WeatherPanel";

import { getFlyoverColor } from "../components/maps/shared/mapHelpers";
import ObservationInfo from "../components/dashboard/ObservationInfo";

// Formats an ISO date string ("2025-08-06") for the ObservationInfo bar.
// Renders "6 Aug 2025". Falls back to "—" for null/undefined input.
const formatDisplayDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function DashboardPage() {
  // ===========================================================================
  // LOAD FLYOVER DATA
  // ===========================================================================

  const { flyovers, loading, error } = useFlyoverData();

  // ===========================================================================
  // OBSERVATION INFO
  // ===========================================================================

  const { info: observationInfo } = useObservationInfo();

  // ===========================================================================
  // REFS
  // ===========================================================================

  const flyoverGridRef = useRef(null);
  const flyoverCardRefs = useRef({});

  // ===========================================================================
  // DASHBOARD STATS
  // ===========================================================================

  const stats =
    flyovers.length > 0
      ? getStatsFromFlyovers(flyovers)
      : { total: 0, low: 0, moderate: 0, high: 0 };

  // ===========================================================================
  // ACTIVE FLYOVER / CLICKED LOCATION
  // ===========================================================================

  const [activeId, setActiveId] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);

  // ===========================================================================
  // DETAIL CARD SELECTION
  // ===========================================================================

  const [selectedHighway, setSelectedHighway] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [riskFocusRequest, setRiskFocusRequest] = useState(null);

  // ===========================================================================
  // SET FIRST FLYOVER AS DEFAULT
  // ===========================================================================

  useEffect(() => {
    if (flyovers.length === 0 || activeId !== null) return;

    const firstFlyover = flyovers[0];
    setActiveId(firstFlyover.id);

    const firstPoint = firstFlyover.namedPoints?.[0] || null;
    if (firstPoint) {
      setSelectedHighway(firstFlyover);
      setSelectedPoint(firstPoint);
    } else {
      setSelectedHighway(firstFlyover);
      setSelectedPoint(null);
    }
  }, [flyovers, activeId]);

  // ===========================================================================
  // ACTIVE FLYOVER
  // ===========================================================================

  const activeFlyover = flyovers.find((f) => f.id === activeId);

  // ===========================================================================
  // WEATHER TARGET (single source of truth)
  // ===========================================================================
  //
  // The weather hook refetches whenever the target changes.
  // Priority: clicked location wins over the active flyover's center, because
  // a map click is a more recent, more specific user intent.
  //
  // Deps are primitives, not the whole objects — this prevents the memo from
  // recomputing just because `flyovers` produced a fresh array reference.

  const weatherTarget = useMemo(() => {
    if (clickedLocation) {
      return {
        flyoverId: clickedLocation.id,
        lat: clickedLocation.lat,
        lng: clickedLocation.lng,
      };
    }
    if (activeFlyover) {
      return {
        flyoverId: activeFlyover.id,
        lat: activeFlyover.center[0],
        lng: activeFlyover.center[1],
      };
    }
    return null;
  }, [
    clickedLocation?.id,
    clickedLocation?.lat,
    clickedLocation?.lng,
    activeFlyover?.id,
    activeFlyover?.center?.[0],
    activeFlyover?.center?.[1],
  ]);

  // ===========================================================================
  // WEATHER (hook)
  // ===========================================================================

  const {
    weather,
    loading: weatherLoading,
  } = useWeather(weatherTarget);

  // ===========================================================================
  // MAP CLICK
  // ===========================================================================
  //
  // No more direct API call — this only updates state; useWeather refetches
  // automatically when the derived `weatherTarget` changes.

  const handleMapClick = useCallback(
    (lat, lng, id, point) => {
      setClickedLocation({ id, lat, lng });

      if (id != null) {
        setActiveId(id);

        const clickedHighway = flyovers.find((f) => f.id === id);
        if (clickedHighway) {
          const resolvedPoint =
            point || clickedHighway.namedPoints?.[0] || null;

          if (resolvedPoint) {
            setSelectedPoint(resolvedPoint);
            setSelectedHighway(clickedHighway);
          } else {
            setSelectedHighway(clickedHighway);
            setSelectedPoint(null);
          }
        }
      }
    },
    [flyovers],
  );

  // ===========================================================================
  // SELECT A POINT FROM DETAIL PANEL
  // ===========================================================================

  const handleSelectPoint = useCallback((point, highway) => {
    setSelectedPoint(point);
    setSelectedHighway(highway);
    if (highway?.id != null) setActiveId(highway.id);
  }, []);

  // ===========================================================================
  // SELECT HIGHWAY
  // ===========================================================================

  const handleSelectHighway = useCallback((highway) => {
    setSelectedHighway(highway);
    setSelectedPoint(null);
    if (highway?.id != null) setActiveId(highway.id);
  }, []);

  // ===========================================================================
  // RISK FOCUS (Medium Risk button)
  // ===========================================================================

  const handleRiskClick = useCallback((highway) => {
    if (highway?.id == null) return;

    setActiveId(highway.id);
    setRiskFocusRequest({ flyoverId: highway.id, requestedAt: Date.now() });

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const cardEl = flyoverCardRefs.current[highway.id];
      const target = cardEl || flyoverGridRef.current;
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }, []);

  // ===========================================================================
  // FLYOVER CARD ACTIVATION
  // ===========================================================================

  const handleCardActivate = useCallback((flyover) => {
    const activityName = flyover.namedPoints?.[0]?.name;

    sendUserActivity(`Selected Flyover: ${activityName}`, "Dashboard");
    setActiveId(flyover.id);

    const resolvedPoint = flyover.namedPoints?.[0] || null;
    if (resolvedPoint) {
      setSelectedPoint(resolvedPoint);
      setSelectedHighway(flyover);
    } else {
      setSelectedHighway(flyover);
      setSelectedPoint(null);
    }
  }, []);

  // ===========================================================================
  // VISIBLE FLYOVERS
  // ===========================================================================

  const visibleFlyoverIds = new Set(flyovers.map((f) => f.id));

  // ===========================================================================
  // LOADING / ERROR / EMPTY STATES
  // ===========================================================================

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500 sm:h-12 sm:w-12" />
          <p className="mt-4 text-sm text-gray-600 sm:text-base">
            Loading flyover data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <p className="text-base text-red-500 sm:text-lg">
            Error loading data
          </p>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (flyovers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <p className="text-base text-gray-600 sm:text-lg">
            No flyover data available
          </p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DASHBOARD
  // ===========================================================================

  return (
    <div className="flex h-full flex-col gap-3 px-3 sm:gap-4 sm:px-4 lg:px-0">
      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
          gap-3
          sm:gap-4
          lg:grid
          lg:grid-cols-10
          lg:gap-5
        "
      >
        {/* ===================================================================
            LEFT SECTION
        ==================================================================== */}

        <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-8">
          <StatsCards stats={stats} />

          <ObservationInfo
            startDate={formatDisplayDate(observationInfo?.startDate)}
            endDate={formatDisplayDate(observationInfo?.lastDate)}
            count={observationInfo?.count ?? 0}
          />

          <div
            ref={flyoverGridRef}
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              sm:gap-4
              lg:flex-1
              lg:min-h-0
            "
          >
            {flyovers.map((flyover, index) => (
              <div
                key={flyover.id}
                ref={(el) => {
                  if (el) {
                    flyoverCardRefs.current[flyover.id] = el;
                  } else {
                    delete flyoverCardRefs.current[flyover.id];
                  }
                }}
                className="
                    h-72
                    sm:h-96
                    md:h-104
                    lg:h-full
                    scroll-mt-4
                  "
              >
                <FlyoverCard
                  {...flyover}
                  color={getFlyoverColor(index)}
                  isActive={activeId === flyover.id}
                  onActivate={() => handleCardActivate(flyover)}
                  onMapClick={handleMapClick}
                  markerPosition={
                    clickedLocation?.id === flyover.id ? clickedLocation : null
                  }
                  weather={weather}
                  weatherLoading={weatherLoading}
                  riskFocusRequest={
                    riskFocusRequest?.flyoverId === flyover.id
                      ? riskFocusRequest
                      : null
                  }
                />
              </div>
            ))}
          </div>

          <div
            className="
              mt-1
              flex
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl2
              border
              border-gray-100
              bg-white
              px-3
              py-2
              text-center
              shadow-card
              sm:px-4
              sm:py-2.5
            "
          >
            <p className="text-[10px] font-medium text-gray-500 sm:text-xs">
              Risk status is based on latest satellite analysis and AI
              assessment
            </p>
          </div>
        </div>

        {/* ===================================================================
            RIGHT SECTION
        ==================================================================== */}

        <div className="mt-4 flex flex-col gap-4 lg:col-span-2 lg:mt-0 lg:h-full lg:min-h-0">
          <div className="h-[70vh] min-h-0 lg:h-full lg:flex-1">
            <WeatherPanel
              weather={weather}
              loading={weatherLoading}
              selectedHighway={selectedHighway}
              selectedPoint={selectedPoint}
              flyoverMarkers={flyovers}
              visibleFlyoverIds={visibleFlyoverIds}
              onSelectHighway={handleSelectHighway}
              onSelectPoint={handleSelectPoint}
              onRiskClick={handleRiskClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

