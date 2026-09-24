
import { BASE_URL, authFetch } from "./client";

export const sendLocationToAPI = async ({ flyoverId, lat, lng }) => {
  const response = await authFetch(`${BASE_URL}/weather/data`, {
    method: "POST",
    body: JSON.stringify({
      id: flyoverId,
      lat: lat,
      lon: lng,
    }),
  });

  const data = await response.json();
  return data;
};

// fetch weather IDW data for a specific date
// export const fetchIDWWeatherData = async (date) => {
//   try {
//     const response = await authFetch(`${BASE_URL}/weather/idw`, {
//       method: "POST",
//       body: JSON.stringify({
//         date: date, // Format: "2026-08-03"
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();

//     return data;
//   } catch (error) {
//     console.error("Error fetching IDW weather data:", error);
//     throw error;
//   }
// };

// api.js - Add new function

export const fetchMonthlyWeatherData = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/rainfall/history`, {
      method: "GET",
    });

    if (!response.ok) {
      const err = new Error(`HTTP error! status: ${response.status}`);
      err.status = response.status; // ← added
      throw err;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching monthly weather data:", error);
    throw error;
  }
};




/* ============================================================
   Observation period metadata
   ============================================================ */

/**
 * POST /get_observation_date
 *
 * Response shape:
 *   {
 *     status: "success",
 *     data: {
 *       start_date: "2025-08-06",
 *       last_date:  "2026-09-01",
 *       obs_count:  33
 *     }
 *   }
 */
export const getObservationDate = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/get_observation_date`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching observation dates:", error);
    throw error;
  }
};