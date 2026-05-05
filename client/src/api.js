import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Projects ─────────────────────────────────────────────
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// ─── Tasks ────────────────────────────────────────────────
export const taskAPI = {
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  getAll: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getOne: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`),
  update: (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

// ─── Users ────────────────────────────────────────────────
export const userAPI = {
  search: (query) => api.get('/users', { params: { search: query } }),
};

// ─── Dashboard ────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
