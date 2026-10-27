import axios from 'axios';

// Defaults to relative '/api' in production or whatever is configured via VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Single centralized Axios instance
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 Unauthorized handling & error formatting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Dispatch global auth event so AuthContext updates state
      window.dispatchEvent(new Event('auth:unauthorized'));

      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register';

      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// Service API Methods
// ============================================================================

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const habitsApi = {
  getHabits: (params) => api.get('/habits', { params }),
  getHabitById: (id) => api.get(`/habits/${id}`),
  createHabit: (data) => api.post('/habits', data),
  updateHabit: (id, data) => api.put(`/habits/${id}`, data),
  deleteHabit: (id) => api.delete(`/habits/${id}`),

  // Completions
  markCompleted: (habitId, date) => api.post(`/habits/${habitId}/completions`, { date }),
  undoCompleted: (habitId, date) => api.delete(`/habits/${habitId}/completions/${date}`),
  getCompletions: (habitId, params) => api.get(`/habits/${habitId}/completions`, { params }),

  // Stats
  getHabitStats: (habitId, params) => api.get(`/habits/${habitId}/stats`, { params }),
};

export const statsApi = {
  getTodayOverview: (params) => api.get('/stats/today', { params }),
  getWeeklyStats: (params) => api.get('/stats/weekly', { params }),
  getHeatmapData: (params) => api.get('/stats/heatmap', { params }),
};

export default api;
