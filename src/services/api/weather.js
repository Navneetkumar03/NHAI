
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

// Fetch traffic data for a specific flyover with optional date filter
