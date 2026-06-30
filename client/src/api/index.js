import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - baseURL points to the Express API (proxied by Vite in dev)
 * - Uses httpOnly cookies for authentication (withCredentials: true)
 * - Handles 401 responses by clearing stale auth state
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Response interceptor: handle auth errors globally ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale user state — the AuthContext effect will handle redirect
      localStorage.removeItem('ct_user');
    }
    return Promise.reject(error);
  }
);

export default api;
