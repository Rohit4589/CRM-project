require('dotenv').config();
const pool = require('../config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emp_code VARCHAR(50);');
    console.log('emp_code column created or exists.');

    // Initialize existing employees with their 3-digit ID: 102, 112, 114
    await pool.query(`
      UPDATE public.users 
      SET emp_code = (id + 100)::text 
      WHERE role = 'employee' AND (emp_code IS NULL OR emp_code = '');
    `);

    const res = await pool.query('SELECT id, full_name, emp_code, username, mobile, password FROM public.users WHERE role = \'employee\' ORDER BY id ASC;');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
