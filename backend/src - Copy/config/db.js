const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool, types } = require('pg');

// Parse PostgreSQL NUMERIC/DECIMAL (OID 1700) as float numbers instead of strings
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = pool;
