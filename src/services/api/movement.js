
import { BASE_URL, authFetch } from "./client";

export const fetchMovementPoints = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/points/data`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movement points:", error);
    throw error;
  }
};

/**
 * GET /points/data/{point_id}
 * Fetch single point with timeseries (detailed data)
 * Used when user clicks on a point
 */

export const fetchMovementPointById = async (pointId) => {
  try {
    const response = await authFetch(`${BASE_URL}/points/data/${pointId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching point ${pointId}:`, error);
    throw error;
  }
};

//  POST /get_velocity_diff?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
//  Fetch the velocity difference for every movement point between two dates

export const fetchVelocityDiff = async (fromDate, toDate) => {
  try {
    const params = new URLSearchParams({
      from_date: fromDate,
      to_date: toDate,
    });

    const response = await authFetch(
      `${BASE_URL}/get_velocity_diff?${params.toString()}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching velocity difference:", error);
    throw error;
  }
};

// ============================================================
// 🆕 FLYOVER SEGMENT APIs
// ============================================================

/**
 * POST /get_live_segment
 * Fetch live segment data (GeoJSON with LineString geometry)
 * Used for displaying road segments on the map
 */
