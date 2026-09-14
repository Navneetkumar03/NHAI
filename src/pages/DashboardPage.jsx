// pages/DashboardPage.jsx

import { useState, useEffect, useCallback } from "react";

import { useFlyoverData } from "../hooks/useFlyoverData";
import { getStatsFromFlyovers } from "../utils/geoJsonParser";
import { sendLocationToAPI } from "../services/api";

import StatsCards from "../components/StatsCards";
import FlyoverCard from "../components/FlyoverCards";
import WeatherPanel from "../components/WeatherPanel";
import AlertMarquee from "../components/AlertMarquess";
import { getFlyoverColor } from "../components/map/mapHelpers";
import ObservationInfo from "../components/ObservationInfo";
import FlyoverDetailsPanel from "../components/map/FlyoverDetailsPanel";

export default function DashboardPage() {
  // ===========================================================================
  // LOAD FLYOVER DATA
  // ===========================================================================

  const { flyovers, loading, error } = useFlyoverData();

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

  // ===========================================================================
  // SET FIRST FLYOVER AS DEFAULT
  // ===========================================================================
  //
  // IMPORTANT:
  // Previously only activeId was set here.
  // Therefore the first flyover became active,
  // but FlyoverDetailsPanel had no selectedPoint
  // and remained hidden.
  //
  // Now the first flyover AND its first named point
  // are selected automatically.
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
  // FLYOVER CARD ACTIVATION
  // ===========================================================================
  //
  // Clicking anywhere on a FlyoverCard selects
  // that flyover and immediately opens its
  // first named point.
  // ===========================================================================

  const handleCardActivate = useCallback((flyover) => {
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div
            className="
              mx-auto
              h-12
              w-12
              animate-spin
              rounded-full
              border-b-2
              border-blue-500
            "
          />

          <p className="mt-4 text-gray-600">Loading flyover data...</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Error loading data</p>

          <p className="mt-2 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  if (flyovers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">No flyover data available</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DASHBOARD
  // ===========================================================================

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ---------------------------------------------------------------------
          ALERT MARQUEE
      ---------------------------------------------------------------------- */}

      {/* 
      <AlertMarquee alerts={alerts} />
      */}

      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
          gap-4
          lg:grid
          lg:grid-cols-10
          lg:gap-5
        "
      >
        {/* ===================================================================
            LEFT SECTION
            Maps + Statistics
        ==================================================================== */}

        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* -----------------------------------------------------------------
              Statistics
          ------------------------------------------------------------------ */}

          <StatsCards stats={stats} />

          {/* -----------------------------------------------------------------
              Observation information
          ------------------------------------------------------------------ */}

          <ObservationInfo
            startDate="6 Aug 2025"
            endDate="1 Sept 2026"
            count={33}
          />

          {/* -----------------------------------------------------------------
              Flyover Cards
          ------------------------------------------------------------------ */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:flex-1
              lg:min-h-0
            "
          >
            {flyovers.map((flyover, index) => (
              <div
                key={flyover.id}
                className="
                    h-80
                    sm:h-96
                    md:h-104
                    lg:h-full
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
              px-4
              py-2.5
              shadow-card
            "
          >
            <span
              className="
                flex
                h-5
                w-5
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-warning/10
              "
            >
              <span className="text-[11px] text-warning">âš ï¸</span>
            </span>

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
            Flyover Details + Weather
        ==================================================================== */}

        <div
          className="
            mt-4
            flex
            h-155
            min-h-0
            flex-col
            gap-4
            lg:col-span-2
            lg:mt-0
            lg:h-full
          "
        >
          {/* -----------------------------------------------------------------
              Flyover Details

              IMPORTANT:
              This is now displayed automatically because
              selectedHighway/selectedPoint are initialized
              when the first flyover loads.
          ------------------------------------------------------------------ */}

          {/* -----------------------------------------------------------------
              Weather
          ------------------------------------------------------------------ */}

          <div className="min-h-0 flex-1">
            <WeatherPanel
              weather={weather}
              loading={weatherLoading}
              selectedHighway={selectedHighway}
              selectedPoint={selectedPoint}
              flyoverMarkers={flyovers}
              visibleFlyoverIds={visibleFlyoverIds}
              onSelectHighway={handleSelectHighway}
              onSelectPoint={handleSelectPoint}
            />
          </div>
        </div>
      </div>
    </div>
  );
}