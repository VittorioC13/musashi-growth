/**
 * API CLIENT
 *
 * Handles all communication with the backend.
 * Uses axios for HTTP requests.
 */

import axios from 'axios';

// Use relative URL for production, localhost for development
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_URL for use in other files
export { API_URL };

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (email, password) =>
    api.post('/auth/register', { email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Market endpoints
export const markets = {
  list: (params = {}) => api.get('/markets', { params }),
  get: (ticker) => api.get(`/markets/${ticker}`),
  create: (data) => api.post('/markets', data),
};

// Order endpoints
export const orders = {
  create: (data) => api.post('/orders', data),
  list: (params = {}) => api.get('/orders', { params }),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// Portfolio endpoints
export const portfolio = {
  get: () => api.get('/portfolio'),
  history: () => api.get('/portfolio/history'),
};

export default api;
