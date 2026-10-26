require('dotenv').config();
const pool = require('../config/db');

async function run() {
  try {
    await pool.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;
    `);
    console.log('✓ is_permanent column added to public.users table with default FALSE.');

    // Ensure all existing employees have is_permanent set to FALSE (OFF)
    await pool.query(`
      UPDATE public.users 
      SET is_permanent = FALSE 
      WHERE is_permanent IS NULL;
    `);

    const res = await pool.query(`
      SELECT id, full_name, emp_code, is_permanent 
      FROM public.users 
      WHERE role = 'employee' 
      ORDER BY id ASC;
    `);
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
