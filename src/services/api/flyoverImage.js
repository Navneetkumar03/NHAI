// src/services/api/flyoverImage.js
import { BASE_URL, authFetch } from "./client";

/**
 * POST /get_flyover_image
 * Returns all flyover imagery as a GeoJSON FeatureCollection of Points.
 *
 * No request body — the endpoint identifies the flyover from the
 * server-side context and returns every image it has.
 *
 * Response shape:
 *   {
 *     status: "success",
 *     data: {
 *       type: "FeatureCollection",
 *       features: [
 *         {
 *           id: "0",
 *           type: "Feature",
 *           properties: {
 *             latitude, longitude,
 *             image_url: "https://...",
 *             date_time: "2026:08:07 15:09:20"
 *           },
 *           geometry: { type: "Point", coordinates: [lng, lat] }
 *         },
 *         ...
 *       ]
 *     }
 *   }
 *
 * @returns {Promise<Object>} the raw backend payload
 */
export const fetchFlyoverImage = async () => {
    try {
        const response = await authFetch(`${BASE_URL}/get_flyover_image`, {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching flyover image:", error);
        throw error;
    }
};