import axios from 'axios';
import { supabase } from '../supabaseClient.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
      return config;
    }
  } catch {
    // Supabase auth not configured
  }

  const localToken = localStorage.getItem('recruitx_student_token');
  if (localToken) {
    config.headers.Authorization = `Bearer ${localToken}`;
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !location.pathname.startsWith('/login')) {
    window.dispatchEvent(new Event('recruitx:unauthorized'));
  }
  return Promise.reject(error);
});

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.message || error.message || fallback;

export default api;
