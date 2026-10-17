const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

let supabase;

const getBucket = () => {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    const error = new Error('Supabase Storage is not configured on the backend.');
    error.statusCode = 503;
    throw error;
  }
  if (!supabase) {
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase.storage.from(config.supabase.resumeBucket);
};

module.exports = { getBucket };
