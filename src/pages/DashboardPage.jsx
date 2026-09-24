// pages/DashboardPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";

import { useFlyoverData } from "../hooks/useFlyoverData";
import { useObservationInfo } from "../hooks/useObservationInfo";
import { getStatsFromFlyovers } from "../utils/geoJsonParser";
import { sendLocationToAPI } from "../services/api/weather";
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

  // Ref to the flyover cards grid — used to scroll the map into view on
  // mobile when a risk-focus action is triggered from the details panel.
  const flyoverGridRef = useRef(null);

  // Ref to each individual flyover card wrapper, keyed by flyover id, so we
  // can scroll to the *exact* card that was focused.
  const flyoverCardRefs = useRef({});

  // ===========================================================================
  // DASHBOARD STATS
  // ===========================================================================

  const stats =
    flyovers.length > 0
      ? getStatsFromFlyovers(flyovers)
      : {
        total: 0,
        low: 0,
        moderate: 0,
        high: 0,
      };

  // ===========================================================================
  // ACTIVE FLYOVER
  // ===========================================================================

  const [activeId, setActiveId] = useState(null);

  // Stores the location of the last map click.
  // Only the flyover whose id matches this location
  // displays the clicked marker.
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
    if (flyovers.length === 0 || activeId !== null) {
      return;
    }

    const firstFlyover = flyovers[0];

    // Make first flyover active.
    setActiveId(firstFlyover.id);

    // Automatically select the first
    // named point of the first flyover.
    const firstPoint = firstFlyover.namedPoints?.[0] || null;

    if (firstPoint) {
      setSelectedHighway(firstFlyover);

      setSelectedPoint(firstPoint);
    } else {
      // If the first flyover has no named
      // points, still select the highway.
      setSelectedHighway(firstFlyover);

      setSelectedPoint(null);
    }
  }, [flyovers, activeId]);

  // ===========================================================================
  // ACTIVE FLYOVER
  // ===========================================================================

  const activeFlyover = flyovers.find((f) => f.id === activeId);

  // ===========================================================================
  // WEATHER STATE
  // ===========================================================================

  const [weather, setWeather] = useState(null);

  const [weatherLoading, setWeatherLoading] = useState(false);

  // Prevent initial weather request
  // from running repeatedly.
  const [hasInitialWeatherFetch, setHasInitialWeatherFetch] = useState(false);

  // ===========================================================================
  // INITIAL WEATHER LOAD
  // ===========================================================================
  //
  // Weather is loaded once for the first
  // active flyover.
  // ===========================================================================

  useEffect(() => {
    const loadInitialWeather = async () => {
      if (!activeFlyover || hasInitialWeatherFetch) {
        return;
      }

      setWeatherLoading(true);

      try {
        const response = await sendLocationToAPI({
          flyoverId: activeFlyover.id,

          lat: activeFlyover.center[0],

          lng: activeFlyover.center[1],
        });

        setWeather(response);

        setHasInitialWeatherFetch(true);
      } catch (error) {
        console.error("Failed to load initial weather:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadInitialWeather();
  }, [activeFlyover, hasInitialWeatherFetch]);

  // ===========================================================================
  // MAP CLICK
  // ===========================================================================
  //
  // Called when:
  // 1. A flyover marker is clicked
  // 2. A flyover map area is clicked
  //
  // `point` is the exact point when a marker was clicked.
  // ===========================================================================

  const handleMapClick = useCallback(
    async (lat, lng, id, point) => {
      // Store clicked location.
      setClickedLocation({
        id,
        lat,
        lng,
      });

      // ---------------------------------------------------------------------
      // Change active flyover
      // ---------------------------------------------------------------------

      if (id != null) {
        setActiveId(id);

        const clickedHighway = flyovers.find((f) => f.id === id);

        if (clickedHighway) {
          // If exact marker point exists,
          // use it.
          //
          // Otherwise fall back to the
          // first named point.
          const resolvedPoint =
            point || clickedHighway.namedPoints?.[0] || null;

          if (resolvedPoint) {
            setSelectedPoint(resolvedPoint);

            setSelectedHighway(clickedHighway);
          } else {
            // No named points available.
            setSelectedHighway(clickedHighway);

            setSelectedPoint(null);
          }
        }
      }

      // ---------------------------------------------------------------------
      // Weather for clicked location
      // ---------------------------------------------------------------------

      setWeatherLoading(true);

      try {
        const response = await sendLocationToAPI({
          flyoverId: id,
          lat,
          lng,
        });

        setWeather(response);
      } catch (err) {
        console.error("Failed to load weather:", err);
      } finally {
        setWeatherLoading(false);
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

    // Also make that highway active.
    if (highway?.id != null) {
      setActiveId(highway.id);
    }
  }, []);

  // ===========================================================================
  // SELECT HIGHWAY
  // ===========================================================================

  const handleSelectHighway = useCallback((highway) => {
    setSelectedHighway(highway);

    setSelectedPoint(null);

    // Keep the selected highway
    // highlighted on the dashboard.
    if (highway?.id != null) {
      setActiveId(highway.id);
    }
  }, []);

  // ===========================================================================
  // RISK FOCUS (Medium Risk button)
  // ===========================================================================
  //
  // Triggered from FlyoverDetailsPanel when the user taps
  // "Medium Risk (120 m)". We:
  //   1. Make that flyover active
  //   2. Fire a riskFocusRequest so FlyoverMap fits the segment bounds
  //   3. On mobile, scroll the matching flyover card into view — otherwise
  //      the map fits the segment but the user can't see it (the details
  //      panel sits below the maps on small screens).
  // ===========================================================================

  const handleRiskClick = useCallback((highway) => {
    if (highway?.id == null) return;

    setActiveId(highway.id);
    setRiskFocusRequest({ flyoverId: highway.id, requestedAt: Date.now() });

    // Mobile-only: scroll the focused flyover card into view.
    // lg: breakpoint is 1024px, matching the dashboard's lg:grid layout.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const cardEl = flyoverCardRefs.current[highway.id];
      const target = cardEl || flyoverGridRef.current;

      if (target) {
        // Small delay lets React commit the activeId/riskFocusRequest state
        // so the card is already highlighted when the scroll lands.
        requestAnimationFrame(() => {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    }
  }, []);

  // ===========================================================================
  // FLYOVER CARD ACTIVATION
  // ===========================================================================
  //
  // Clicking anywhere on a FlyoverCard selects
  // that flyover and immediately opens its
  // first named point.
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
  // LOADING STATE
  // ===========================================================================

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-b-2
              border-blue-500
              sm:h-12
              sm:w-12
            "
          />

          <p className="mt-4 text-sm text-gray-600 sm:text-base">
            Loading flyover data...
          </p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================

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

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

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
      {/* ---------------------------------------------------------------------
          ALERT MARQUEE
      ---------------------------------------------------------------------- */}

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
            Maps + Statistics
        ==================================================================== */}

        <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-8">
          {/* -----------------------------------------------------------------
              Statistics
          ------------------------------------------------------------------ */}

          <StatsCards stats={stats} />

          {/* -----------------------------------------------------------------
              Observation information
          ------------------------------------------------------------------ */}

          <ObservationInfo
            startDate={formatDisplayDate(observationInfo?.startDate)}
            endDate={formatDisplayDate(observationInfo?.lastDate)}
            count={observationInfo?.count ?? 0}
          />

          {/* -----------------------------------------------------------------
              Flyover Cards
          ------------------------------------------------------------------ */}

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

          {/* -----------------------------------------------------------------
              Risk Information
          ------------------------------------------------------------------ */}

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
            <p
              className="
                text-[10px]
                font-medium
                text-gray-500
                sm:text-xs
              "
            >
              Risk status is based on latest satellite analysis and AI
              assessment
            </p>
          </div>
        </div>

        {/* ===================================================================
            RIGHT SECTION
            Weather panel (now also renders FlyoverDetailsPanel internally)
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

