const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'clean_plate',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'clean_plate_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  uploadDir: path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
  ai: {
    enabled: process.env.AI_ENABLED === 'true',
    threshold: parseFloat(process.env.AI_THRESHOLD || '0.6'),
  },
};
