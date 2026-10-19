import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    const handleUnauthorized = () => {
      localStorage.removeItem('recruitx_student_token');
      supabase.auth.signOut().catch(() => {});
      if (alive) setUser(null);
    };

    window.addEventListener('recruitx:unauthorized', handleUnauthorized);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && session?.user) {
        setUser(toStudentUser(session.user));
      }
    });

    const initAuth = async () => {
      try {
        // 1. Try Supabase Auth session
        const { data, error } = await supabase.auth.getUser();
        if (data?.user && !error) {
          if (alive) setUser(toStudentUser(data.user));
          return;
        }
      } catch {
        // Supabase check failed, try local fallback
      }

      // 2. Fall back to local student token
      const localToken = localStorage.getItem('recruitx_student_token');
      if (localToken) {
        try {
          const res = await api.get('/auth/student/me');
          if (alive && res.data?.user) {
            setUser(res.data.user);
            return;
          }
        } catch {
          localStorage.removeItem('recruitx_student_token');
        }
      }

      if (alive) setUser(null);
    };

    initAuth().finally(() => {
      if (alive) setChecking(false);
    });

    return () => {
      alive = false;
      subscription?.unsubscribe?.();
      window.removeEventListener('recruitx:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    // 1. If Supabase is configured, try Supabase Auth first
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        if (!error && data?.user) {
          const nextUser = toStudentUser(data.user);
          setUser(nextUser);
          return nextUser;
        }
        if (error && !error.message?.includes('Invalid login credentials') && !error.message?.includes('invalid_credentials')) {
          // If error is 503 or server unavailable, log and proceed to fallback
          console.warn('Supabase auth returned error, trying backend auth:', error.message);
        } else if (error) {
          // Could be a local student user created via seed or admin
          try {
            const fallbackRes = await api.post('/auth/student/login', {
              email: credentials.email,
              password: credentials.password,
            });
            const token = fallbackRes.data.token;
            const studentUser = fallbackRes.data.user;
            if (token) localStorage.setItem('recruitx_student_token', token);
            setUser(studentUser);
            return studentUser;
          } catch {
            throw error;
          }
        }
      } catch (err) {
        console.warn('Supabase sign-in error, falling back to backend auth:', err.message);
      }
    }

    // 2. Fallback to direct backend student authentication
    const response = await api.post('/auth/student/login', {
      email: credentials.email,
      password: credentials.password,
    });

    const token = response.data.token;
    const studentUser = response.data.user;
    if (token) {
      localStorage.setItem('recruitx_student_token', token);
    }
    setUser(studentUser);
    return studentUser;
  };

  const register = async (payload) => {
    // 1. If Supabase is configured, try Supabase Auth first
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              name: payload.name.trim(),
              registration_number: payload.registrationNumber.trim(),
              role: 'student',
            },
          },
        });
        if (!error && data?.user) {
          if (data.session) {
            setUser(toStudentUser(data.user));
          }
          return { ...data, requiresEmailConfirmation: !data.session };
        }
      } catch (err) {
        console.warn('Supabase auth registration error, falling back to backend:', err.message);
      }
    }

    // 2. Fallback to direct backend student registration
    const response = await api.post('/auth/student/register', {
      name: payload.name,
      email: payload.email,
      registrationNumber: payload.registrationNumber,
      password: payload.password,
    });

    const token = response.data.token;
    const studentUser = response.data.user;
    if (token) {
      localStorage.setItem('recruitx_student_token', token);
    }
    setUser(studentUser);
    return { user: studentUser, session: { access_token: token }, requiresEmailConfirmation: false };
  };

  const logout = async () => {
    localStorage.removeItem('recruitx_student_token');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
    }
    setUser(null);
  };

  const value = useMemo(() => ({ user, checking, login, register, logout, setUser }), [user, checking]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function toStudentUser(authUser) {
  if (!authUser) return null;
  const metadata = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email,
    name: metadata.name || metadata.full_name || authUser.email,
    registrationNumber: metadata.registration_number || metadata.registrationNumber || '',
    role: 'student',
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
