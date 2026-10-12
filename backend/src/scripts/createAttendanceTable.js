require('dotenv').config();
const pool = require('../config/db');

async function createAttendanceTable() {
  try {
    console.log('Creating attendance table in PostgreSQL...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        site_id INTEGER REFERENCES public.sites(id) ON DELETE SET NULL,
        attendance_date DATE NOT NULL,
        in_time VARCHAR(20),
        out_time VARCHAR(20),
        work_hours NUMERIC(4,2) DEFAULT 0,
        day_value NUMERIC(3,2) DEFAULT 1.0,
        status VARCHAR(30) DEFAULT 'Verified',
        in_selfie TEXT,
        out_selfie TEXT,
        in_gps VARCHAR(100),
        out_gps VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
      CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_site ON public.attendance(site_id);
    `);

    console.log('✅ Table "attendance" and its indexes are created or already exist.');

    // Check count
    const res = await pool.query('SELECT count(*) FROM public.attendance;');
    console.log(`Current attendance records: ${res.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating attendance table:', error);
    process.exit(1);
  }
}

createAttendanceTable();
