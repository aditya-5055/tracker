import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ct_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // ── On mount: validate the session against /api/auth/me ────────────
  useEffect(() => {
    const validateSession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('ct_user', JSON.stringify(data.user));
      } catch {
        // Session invalid / expired — clear everything
        _clearAuth();
      } finally {
        setLoading(false);
      }
    };
    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _persistAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('ct_user', JSON.stringify(userData));
  };

  const _clearAuth = () => {
    setUser(null);
    localStorage.removeItem('ct_user');
  };

  // ── Public auth actions ─────────────────────────────────────────────────
  const login = useCallback((userData) => {
    _persistAuth(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      _clearAuth();
    }
  }, []);

  /**
   * Convenience: sign up via API and log in automatically.
   * Returns { success, error }.
   */
  const signup = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      _persistAuth(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed',
      };
    }
  }, []);

  /**
   * Convenience: sign in via API.
   * Returns { success, error }.
   */
  const loginWithCredentials = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      _persistAuth(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed',
      };
    }
  }, []);

  const updateUser = useCallback(async (data) => {
    try {
      const res = await api.patch('/auth/me', data);
      _persistAuth(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Update failed',
      };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        loginWithCredentials,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
