import axios from "axios";

/**
 * Pre-configured Axios instance.
 * Uses the backend URL from environment variables.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Handle authentication errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ct_user");
    }
    return Promise.reject(error);
  }
);

export default api;
