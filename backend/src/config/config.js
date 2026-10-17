require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'local_development_secret_change_me');

if (nodeEnv === 'production' && (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_here')) {
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv,
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminClientUrl: process.env.ADMIN_CLIENT_URL || 'http://localhost:5174',
  studentClientUrl: process.env.STUDENT_CLIENT_URL || 'http://localhost:5173',
  recruiterClientUrl: process.env.RECRUITER_CLIENT_URL || 'http://localhost:5175',
  dataMode: 'in-memory',
};
