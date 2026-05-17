import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ── API base URL ───────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'https://pragati-backend-ixn3.onrender.com/api';

// ── One-time key migration (old builds stored 'token', new builds use 'pragati_token') ──
(function migrateTokenKeys() {
  try {
    const oldToken   = localStorage.getItem('token');
    const oldRefresh = localStorage.getItem('refresh_token');
    if (oldToken && !localStorage.getItem('pragati_token')) {
      localStorage.setItem('pragati_token', oldToken);
      localStorage.removeItem('token');
    }
    if (oldRefresh && !localStorage.getItem('pragati_refresh')) {
      localStorage.setItem('pragati_refresh', oldRefresh);
      localStorage.removeItem('refresh_token');
    }
  } catch {}
})();


// ── Axios: attach JWT to every request ────────────────────────────────────────
axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pragati_token');
  const isAuthRoute = cfg.url?.includes('/auth/login') || cfg.url?.includes('/auth/register');
  if (token && !isAuthRoute) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ── Axios: auto-refresh on 401 ONLY ───────────────────────────────────────────
axios.interceptors.response.use(
  res => res,
  async err => {
    const status = err.response?.status;
    const isAuthRoute = err.config?.url?.includes('/auth/login') ||
                        err.config?.url?.includes('/auth/register') ||
                        err.config?.url?.includes('/auth/refresh');

    if (status === 401 && !isAuthRoute && !err.config._retry) {
      err.config._retry = true;
      try {
        const rt = localStorage.getItem('pragati_refresh');
        if (!rt) {
          localStorage.removeItem('pragati_token');
          localStorage.removeItem('pragati_refresh');
          window.location.href = '/login';
          return Promise.reject(err);
        }
        const { data } = await axios.post(
          `${API}/auth/refresh`,
          { refreshToken: rt },
          { headers: { Authorization: '' } }
        );
        localStorage.setItem('pragati_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('pragati_refresh', data.refreshToken);
        err.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(err.config);
      } catch (refreshErr) {
        localStorage.removeItem('pragati_token');
        localStorage.removeItem('pragati_refresh');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pragati_token');
    if (token) {
      axios.get(`${API}/auth/me`)
        .then(r => setUser(r.data.user))
        .catch(() => {
          localStorage.removeItem('pragati_token');
          localStorage.removeItem('pragati_refresh');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    localStorage.removeItem('pragati_token');
    localStorage.removeItem('pragati_refresh');
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('pragati_token', data.accessToken);
      localStorage.setItem('pragati_refresh', data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(msg);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  // formData is a FormData object (may contain a file).
  // DO NOT set Content-Type manually — axios auto-detects FormData
  // and sets multipart/form-data with the correct boundary.
  const register = async (formData) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, formData);
      localStorage.setItem('pragati_token', data.accessToken);
      localStorage.setItem('pragati_refresh', data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        'Registration failed. Please try again.';
      throw new Error(msg);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('pragati_token');
    localStorage.removeItem('pragati_refresh');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API };