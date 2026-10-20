require('dotenv').config();
const pool = require('../config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS project_folder VARCHAR(500);');
    console.log('project_folder column created or verified.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
