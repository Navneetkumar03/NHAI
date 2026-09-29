// src/services/api/rainfall.js
import { authFetch } from "./client";

const RAINFALL_VALUE_URL =
    "https://mlinfomap.com/nhflyoverapi/get_rainfall_value";

/**
 * POST /get_rainfall_value
 * Returns the rainfall value at a specific lat/lon for a given year.
 *
 * @param {Object} params
 * @param {number} params.year  e.g. 2024
 * @param {number} params.lat
 * @param {number} params.lon
 * @returns {Promise<Object>} the backend payload
 */
export const fetchRainfallValue = async ({ year, lat, lon }) => {
    try {
        const response = await authFetch(RAINFALL_VALUE_URL, {
            method: "POST",
            body: JSON.stringify({ year, lat, lon }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching rainfall value:", error);
        throw error;
    }
};