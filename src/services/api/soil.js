// src/services/api/soil.js
import { authFetch } from "./client";

const SOIL_INFO_URL =
    "https://mlinfomap.com/nhflyoverapi/get_soil_info";

/**
 * POST /get_soil_info
 * Returns soil attributes at a specific lat/lon.
 *
 * @param {Object} params
 * @param {number} params.lat
 * @param {number} params.lon
 * @returns {Promise<Object>} the backend payload
 */
export const fetchSoilInfo = async ({ lat, lon }) => {
    try {
        const response = await authFetch(SOIL_INFO_URL, {
            method: "POST",
            body: JSON.stringify({ lat, lon }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching soil info:", error);
        throw error;
    }
};