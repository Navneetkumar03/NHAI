

export const BASE_URL = import.meta.env.VITE_API_BASE;

// ---------------------------------------------------------
// Shared authenticated fetch wrapper
// Attaches the Bearer token (stored in sessionStorage) to
// every protected API call. If the server responds 401
// (token invalid / session revoked by force_logout or a
// login from another device), clears the stored session
// and redirects to the login page.
// ---------------------------------------------------------

export const authFetch = async (url, options = {}) => {
  const token = sessionStorage.getItem("authToken");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    window.location.href = "/InfraRisk/NH-152/login"; // adjust to your actual login route
  }

  return response;
};

// Send clicked map location to backend
