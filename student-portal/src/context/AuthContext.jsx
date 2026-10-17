import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    const handleUnauthorized = () => { supabase.auth.signOut().catch(() => {}); };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setUser(session?.user ? toStudentUser(session.user) : null);
    });
    window.addEventListener('recruitx:unauthorized', handleUnauthorized);

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!alive) return;
        setUser(error || !data.user ? null : toStudentUser(data.user));
      })
      .catch(() => { if (alive) setUser(null); })
      .finally(() => { if (alive) setChecking(false); });

    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener('recruitx:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    const nextUser = toStudentUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
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
    if (error) throw error;
    if (data.session && data.user) setUser(toStudentUser(data.user));
    return { ...data, requiresEmailConfirmation: !data.session };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
