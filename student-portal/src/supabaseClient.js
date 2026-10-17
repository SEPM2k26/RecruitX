import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvnjeulyaefdojtawrge.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseKey.includes('your_') &&
  !supabaseUrl.includes('your-project')
);

export const isSupabaseConfigured = isConfigured;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => {
          throw new Error('Supabase publishable key is not configured yet. Add your publishable/anon key to student-portal/.env.local (from your Supabase dashboard: Project Settings > API).');
        },
        signUp: async () => {
          throw new Error('Supabase publishable key is not configured yet. Add your publishable/anon key to student-portal/.env.local (from your Supabase dashboard: Project Settings > API).');
        },
        signOut: async () => {},
        resetPasswordForEmail: async () => {
          throw new Error('Supabase publishable key is not configured yet. Add your publishable/anon key to student-portal/.env.local.');
        },
      },
    };
