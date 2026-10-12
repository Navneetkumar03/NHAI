// src/services/api/flyoverImage.js
import { BASE_URL, authFetch } from "./client";


export const fetchRiskInsight = async () => {
    try {
        const response = await authFetch(`${BASE_URL}/get_risk_insight`, {
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