const pool = require('../config/db');

async function createSiteTasksTable() {
  try {
    console.log('Checking/creating site_tasks table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.site_tasks (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
        task_date DATE NOT NULL DEFAULT CURRENT_DATE,
        title TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
        assigned_employee_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        assigned_employee_name VARCHAR(150),
        due_time VARCHAR(20),
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_site_tasks_site_date ON public.site_tasks(site_id, task_date);
    `);
    console.log('✅ Table "site_tasks" ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating site_tasks table:', err);
    process.exit(1);
  }
}

createSiteTasksTable();
