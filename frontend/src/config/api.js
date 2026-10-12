// Centralized API configuration supporting both local development and Render production deployment
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_BASE = `${API_BASE_URL}/api`;
