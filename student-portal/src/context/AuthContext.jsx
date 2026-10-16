import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recruitx_student_user') || 'null'); }
    catch { return null; }
  });
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('recruitx_student_token')));

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem('recruitx_student_token');
      localStorage.removeItem('recruitx_student_user');
      setUser(null);
    };
    window.addEventListener('recruitx:unauthorized', clearSession);
    return () => window.removeEventListener('recruitx:unauthorized', clearSession);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('recruitx_student_token')) { setChecking(false); return; }
    api.get('/auth/student/me')
      .then(({ data }) => {
        const nextUser = data.user || data.data || data;
        setUser(nextUser);
        localStorage.setItem('recruitx_student_user', JSON.stringify(nextUser));
      })
      .catch(() => {
        localStorage.removeItem('recruitx_student_token');
        localStorage.removeItem('recruitx_student_user');
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/student/login', credentials);
    if (!data.token) throw new Error('The server did not return a session token.');
    const nextUser = data.user || {};
    localStorage.setItem('recruitx_student_token', data.token);
    localStorage.setItem('recruitx_student_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/student/register', payload);
    if (data.token) {
      const nextUser = data.user || {};
      localStorage.setItem('recruitx_student_token', data.token);
      localStorage.setItem('recruitx_student_user', JSON.stringify(nextUser));
      setUser(nextUser);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('recruitx_student_token');
    localStorage.removeItem('recruitx_student_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, checking, login, register, logout, setUser, errorMessage }), [user, checking]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
