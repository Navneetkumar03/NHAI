
import { BASE_URL, authFetch } from "./client";

export const fetchTrafficData = async (flyoverName, selectedDate = null) => {
  try {
    const response = await authFetch(`${BASE_URL}/traffic/data`, {
      method: "POST",
      body: JSON.stringify({
        name: flyoverName,
        date: selectedDate, // Add date field (null for last 24 hours)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    throw error;
  }
};

// NEW: Fetch available dates for a flyover

export const fetchTrafficDates = async (flyoverName) => {
  try {
    const response = await authFetch(
      `${BASE_URL}/traffic/dates/${flyoverName}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.available_dates || [];
  } catch (error) {
    console.error("Error fetching traffic dates:", error);
    return [];
  }
};

// ============================================================
// 🆕 MOVEMENT POINTS APIs (Only these two endpoints)
// ============================================================

/**
 * GET /points/data
 * Fetch all movement points (lightweight - NO timeseries)
 * Used for map display
 */
