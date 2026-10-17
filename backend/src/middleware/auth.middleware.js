const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifySupabaseAccessToken = async (token) => {
  if (!config.supabase.url || !config.supabase.publishableKey) {
    const error = new Error('Supabase Auth is not configured on the backend.');
    error.statusCode = 503;
    throw error;
  }

  let response;
  try {
    response = await fetch(`${config.supabase.url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: config.supabase.publishableKey,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    const error = new Error('Supabase Auth could not be reached.');
    error.statusCode = 503;
    throw error;
  }

  if (!response.ok) return null;
  const authUser = await response.json();
  const metadata = authUser.user_metadata || {};
  return {
    id: authUser.id,
    sub: authUser.id,
    email: authUser.email,
    name: metadata.name || metadata.full_name || authUser.email,
    registrationNumber: metadata.registration_number || '',
    role: 'student',
  };
};

/**
 * Middleware: Verify JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.role === 'student') {
      return res.status(401).json({ success: false, message: 'Use a Supabase Auth access token.' });
    }
    req.user = { ...decoded, id: decoded.id || decoded.sub };
    next();
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    try {
      const user = await verifySupabaseAccessToken(token);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
      req.user = user;
      return next();
    } catch (verificationError) {
      return res.status(verificationError.statusCode || 503).json({
        success: false,
        message: verificationError.message || 'Could not verify access token.',
      });
    }
  }
};

/**
 * Middleware: Restrict to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
