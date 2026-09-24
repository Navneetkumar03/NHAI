
import { BASE_URL, authFetch } from "./client";



// ============================================================
// 🆕 FLYOVER SEGMENT APIs
// ============================================================

/**
 * POST /get_live_segment
 * Fetch live segment data (GeoJSON with LineString geometry)
 * Used for displaying road segments on the map
 */

export const fetchLiveSegments = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/get_live_segment`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching live segments:", error);
    throw error;
  }
};

/**
 * POST /get_polygon_segment
 * Fetch polygon segment data (GeoJSON with Polygon geometry)
 * Can query by ID or location
 *
 * @param {Object} params
 * @param {string} params.type - 'id' or 'location'
 * @param {string} [params.id] - Object ID when type is 'id'
 * @param {number} [params.latitude] - Latitude when type is 'location'
 * @param {number} [params.longitude] - Longitude when type is 'location'
 */

export const fetchPolygonSegment = async ({
  type,
  id = null,
  latitude = null,
  longitude = null,
}) => {
  try {
    let url = `${BASE_URL}/get_polygon_segment?type=${type}`;

    if (type === "id" && id !== null) {
      url += `&id=${id}`;
    } else if (type === "location" && latitude !== null && longitude !== null) {
      url += `&latitude=${latitude}&longitude=${longitude}`;
    }

    const response = await authFetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching polygon segment:", error);
    throw error;
  }
};

/**
 * POST /get_live_segment_stats
 * Fetch live segment statistics (NO geometry)
 * Useful for tables, charts, or data grids
 * Returns: id, name, avg_velocity, point_count
 */

export const fetchLiveSegmentStats = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/get_live_segment_stats`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching live segment stats:", error);
    throw error;
  }
};

