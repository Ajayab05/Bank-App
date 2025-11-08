const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'bankuser',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'bankdb',
  password: process.env.DB_PASSWORD || 'bankpass',
  port: process.env.DB_PORT || 5432
});

module.exports = pool;
