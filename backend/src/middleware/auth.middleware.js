const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifySupabaseAccessToken = async (token) => {
  if (!config.supabase.url || !config.supabase.publishableKey) {
    return null;
  }

  try {
    const response = await fetch(`${config.supabase.url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: config.supabase.publishableKey,
        Authorization: `Bearer ${token}`,
      },
    });

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
  } catch {
    return null;
  }
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

  // 1. Try local JWT verification (for both admin and student tokens)
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { ...decoded, id: decoded.id || decoded.sub };
    return next();
  } catch {
    // 2. If not a local token, try Supabase Auth token
    try {
      const user = await verifySupabaseAccessToken(token);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Ignored - fall through to 401
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token. Please sign in.',
    });
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
