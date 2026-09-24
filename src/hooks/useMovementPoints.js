// src/hooks/useMovementPoints.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMovementPoints, fetchMovementPointById, fetchVelocityDiff } from "../services/api/movement";

export function useMovementPoints() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [selectedPointData, setSelectedPointData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const cacheRef = useRef(new Map());

    // ── NEW: velocity-difference state ──────────────────────────────
    const [velocityDiff, setVelocityDiff] = useState(null);           // { type, features }
    const [velocityDiffRange, setVelocityDiffRange] = useState(null); // { min_diff, max_dif }
    const [velocityDiffLoading, setVelocityDiffLoading] = useState(false);
    const [velocityDiffError, setVelocityDiffError] = useState(null);
    // Cache keyed by `${fromDate}__${toDate}` so re-selecting the same
    // range is instant and we don't hit the API twice for the same data.
    const velocityDiffCacheRef = useRef(new Map());

    // Fetch all points
    const fetchPoints = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMovementPoints();
            setPoints(data.features || []);
            setTotal(data.total || 0);
            setAvailableDates(data.available_dates || []);
            // console.log('📅 Available dates:', data.available_dates);
        } catch (err) {
            setError(err.message || 'Failed to fetch movement points');
            console.error('Error fetching points:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single point detail with timeseries
    const fetchPointDetail = useCallback(async (pointId) => {
        if (cacheRef.current.has(pointId)) {
            const cached = cacheRef.current.get(pointId);
            setSelectedPointData(cached);
            return cached;
        }

        setLoadingDetail(true);
        try {
            const data = await fetchMovementPointById(pointId);
            cacheRef.current.set(pointId, data);
            setSelectedPointData(data);
            return data;
        } catch (err) {
            console.error(`Error fetching point ${pointId}:`, err);
            throw err;
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    // Select a point
    const selectPoint = useCallback(async (pointId) => {
        setSelectedPoint(pointId);
        if (pointId) {
            return await fetchPointDetail(pointId);
        } else {
            setSelectedPointData(null);
            return null;
        }
    }, [fetchPointDetail]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedPoint(null);
        setSelectedPointData(null);
    }, []);

    // Get point by ID
    const getPointById = useCallback((id) => {
        return points.find(p => p.data?.id === id);
    }, [points]);

    // Get filtered points
    const getFilteredPoints = useCallback((filters = {}) => {
        let filtered = [...points];

        if (filters.minVelocity !== undefined) {
            filtered = filtered.filter(p =>
                Math.abs(p.data?.velocity || 0) >= filters.minVelocity
            );
        }

        if (filters.maxVelocity !== undefined) {
            filtered = filtered.filter(p =>
                Math.abs(p.data?.velocity || 0) <= filters.maxVelocity
            );
        }

        if (filters.minCoherence !== undefined) {
            filtered = filtered.filter(p =>
                (p.data?.coherence || 0) >= filters.minCoherence
            );
        }

        return filtered;
    }, [points]);

    // ── NEW: fetch velocity difference between two dates ────────────
    /**
     * Fetch the velocity difference for every movement point between
     * two dates. Populates:
     *  - velocityDiff  → FeatureCollection of points with { diff, color }
     *  - velocityDiffRange → { min_diff, max_dif } for building a legend
     *
     * Safe to call repeatedly — results are cached per (from, to) pair.
     * Passing null/undefined for either date clears the state instead.
     */
    const loadVelocityDiff = useCallback(async (fromDate, toDate) => {
        // Clear case — caller explicitly wants to remove the diff layer
        if (!fromDate || !toDate) {
            setVelocityDiff(null);
            setVelocityDiffRange(null);
            setVelocityDiffError(null);
            setVelocityDiffLoading(false);
            return null;
        }

        const cacheKey = `${fromDate}__${toDate}`;

        // Cache hit — no network round-trip
        if (velocityDiffCacheRef.current.has(cacheKey)) {
            const cached = velocityDiffCacheRef.current.get(cacheKey);
            console.log(
                `%c[2] loadVelocityDiff CACHE HIT  ${cacheKey}  →  ${cached.data?.features?.length ?? 0} features`,
                "color:#9333ea",
            );
            setVelocityDiff(cached.data);
            setVelocityDiffRange(cached.min_max);
            setVelocityDiffError(null);
            setVelocityDiffLoading(false);
            return cached;
        }

        setVelocityDiffLoading(true);
        setVelocityDiffError(null);

        try {
            const response = await fetchVelocityDiff(fromDate, toDate);

            if (response?.status !== 'success' || !response?.data) {
                throw new Error('Invalid response from velocity diff API');
            }

            const payload = {
                data: response.data,
                min_max: response.min_max || null,
            };

            velocityDiffCacheRef.current.set(cacheKey, payload);

            setVelocityDiff(payload.data);
            setVelocityDiffRange(payload.min_max);
            return payload;
        } catch (err) {
            console.error('Error loading velocity difference:', err);
            setVelocityDiffError(
                err.message || 'Failed to fetch velocity difference'
            );
            setVelocityDiff(null);
            setVelocityDiffRange(null);
            return null;
        } finally {
            setVelocityDiffLoading(false);
        }
    }, []);

    // Explicit clear so callers can reset the diff layer without having
    // to remember to pass nulls.
    const clearVelocityDiff = useCallback(() => {
        setVelocityDiff(null);
        setVelocityDiffRange(null);
        setVelocityDiffError(null);
        setVelocityDiffLoading(false);
    }, []);

    // Load data on mount
    useEffect(() => {
        fetchPoints();
    }, [fetchPoints]);

    // console.log("fetched point data is: ", points)
    return {
        points,
        loading,
        error,
        total,
        availableDates,
        selectedPoint,
        selectedPointData,
        loadingDetail,
        fetchPoints,
        selectPoint,
        clearSelection,
        getPointById,
        getFilteredPoints,
        cache: cacheRef.current,

        // NEW — velocity difference
        velocityDiff,
        velocityDiffRange,
        velocityDiffLoading,
        velocityDiffError,
        loadVelocityDiff,
        clearVelocityDiff,
    };
}