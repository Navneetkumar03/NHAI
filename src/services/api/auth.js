
import { BASE_URL } from "./client";

export const loginUser = async ({ username, password }) => {
  try {
    const params = new URLSearchParams({ username, password });

    const response = await fetch(`${BASE_URL}/login?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(
        body.detail || `HTTP error! status: ${response.status}`,
      );
      error.status = response.status;
      error.detail = body.detail;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  const token = sessionStorage.getItem("authToken"); // ✅ matches Login.jsx

  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json().catch(() => ({}));
  } finally {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
  }
};

// NOTE: not currently protected by get_current_user on the backend
// (change_password lives in auth_routes, which is public). Left as-is.

export const changePassword = async ({ username, newPassword }) => {
  try {
    const params = new URLSearchParams({
      username,
      new_password: newPassword,
    });

    const response = await fetch(
      `${BASE_URL}/change_password?${params.toString()}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

// NOTE: not currently protected by get_current_user on the backend
// (force_logout lives in auth_routes, which is public). Left as-is.

export const forceLogoutUser = async (username) => {
  try {
    const params = new URLSearchParams({ username });

    const response = await fetch(
      `${BASE_URL}/force_logout?${params.toString()}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json().catch(() => ({}));
  } catch (error) {
    console.error("Error force logging out:", error);
    throw error;
  }
};

export const sendUserActivity = async (activity, tab) => {
  try {
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));

    const activityData = {
      userid: authUser?.userId,
      username: authUser?.username,
      activity,
      tab,
    };
    console.log("*******", activityData)
    const response = await fetch(`${BASE_URL}/activity_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
    if (!response.ok) {
      throw new Error(`Activity API failed: ${response.status}`);
    }

    const data = await response.json();

    return;
  } catch (error) {
    console.error("Failed to send user activity:", error);
  }
};
