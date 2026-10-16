import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recruitx_student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !location.pathname.startsWith('/login')) {
    localStorage.removeItem('recruitx_student_token');
    localStorage.removeItem('recruitx_student_user');
    window.dispatchEvent(new Event('recruitx:unauthorized'));
  }
  return Promise.reject(error);
});

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.message || error.message || fallback;

export default api;
