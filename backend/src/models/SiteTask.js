const pool = require('../config/db');

class SiteTask {
  // Check or initialize site_tasks table
  static async initTable() {
    try {
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
    } catch (err) {
      console.error('Error initializing site_tasks table in Model:', err.message);
    }
  }

  // Find tasks with optional date and siteId filters
  static async find({ date, siteId }) {
    let query = `
      SELECT 
        st.id,
        st.site_id as "siteId",
        TO_CHAR(st.task_date, 'YYYY-MM-DD') as "taskDate",
        st.title,
        st.priority,
        st.assigned_employee_id as "assignedEmployeeId",
        st.assigned_employee_name as "assignedEmployeeName",
        st.due_time as "dueTime",
        st.is_completed as "isCompleted",
        st.completed_at as "completedAt",
        st.created_at as "createdAt",
        s.customer_name as "customerName",
        s.site_ref as "siteRef",
        s.location
      FROM public.site_tasks st
      LEFT JOIN public.sites s ON s.id = st.site_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND st.task_date = $${params.length}`;
    }

    if (siteId) {
      params.push(Number(siteId));
      query += ` AND st.site_id = $${params.length}`;
    }

    query += ` ORDER BY 
      st.is_completed ASC,
      CASE st.priority 
        WHEN 'Urgent' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
        ELSE 5 
      END ASC,
      st.due_time ASC NULLS LAST,
      st.id ASC;`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Create a new task
  static async create({ siteId, taskDate, title, priority, assignedEmployeeId, assignedEmployeeName, dueTime }) {
    const effectiveDate = taskDate || new Date().toISOString().split('T')[0];
    const effectivePriority = priority || 'Medium';

    const insertQuery = `
      INSERT INTO public.site_tasks (
        site_id, task_date, title, priority, assigned_employee_id, assigned_employee_name, due_time, is_completed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING 
        id,
        site_id as "siteId",
        TO_CHAR(task_date, 'YYYY-MM-DD') as "taskDate",
        title,
        priority,
        assigned_employee_id as "assignedEmployeeId",
        assigned_employee_name as "assignedEmployeeName",
        due_time as "dueTime",
        is_completed as "isCompleted",
        created_at as "createdAt";
    `;

    const values = [
      Number(siteId),
      effectiveDate,
      title.trim(),
      effectivePriority,
      assignedEmployeeId ? Number(assignedEmployeeId) : null,
      assignedEmployeeName ? assignedEmployeeName.trim() : null,
      dueTime ? dueTime.trim() : null
    ];

    const result = await pool.query(insertQuery, values);
    return result.rows[0];
  }

  // Toggle complete
  static async toggle(id, isCompleted) {
    const query = `
      UPDATE public.site_tasks
      SET 
        is_completed = $1,
        completed_at = CASE WHEN $1 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id,
        site_id as "siteId",
        TO_CHAR(task_date, 'YYYY-MM-DD') as "taskDate",
        title,
        priority,
        assigned_employee_id as "assignedEmployeeId",
        assigned_employee_name as "assignedEmployeeName",
        due_time as "dueTime",
        is_completed as "isCompleted",
        completed_at as "completedAt";
    `;

    const result = await pool.query(query, [Boolean(isCompleted), Number(id)]);
    return result.rows[0] || null;
  }

  // Update task details
  static async update(id, { title, priority, assignedEmployeeId, assignedEmployeeName, dueTime }) {
    const query = `
      UPDATE public.site_tasks
      SET 
        title = $1,
        priority = COALESCE($2, priority),
        assigned_employee_id = $3,
        assigned_employee_name = $4,
        due_time = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING 
        id,
        site_id as "siteId",
        TO_CHAR(task_date, 'YYYY-MM-DD') as "taskDate",
        title,
        priority,
        assigned_employee_id as "assignedEmployeeId",
        assigned_employee_name as "assignedEmployeeName",
        due_time as "dueTime",
        is_completed as "isCompleted",
        updated_at as "updatedAt";
    `;

    const values = [
      title.trim(),
      priority || 'Medium',
      assignedEmployeeId ? Number(assignedEmployeeId) : null,
      assignedEmployeeName ? assignedEmployeeName.trim() : null,
      dueTime ? dueTime.trim() : null,
      Number(id)
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete task
  static async delete(id) {
    const result = await pool.query('DELETE FROM public.site_tasks WHERE id = $1 RETURNING id;', [Number(id)]);
    return result.rows.length > 0;
  }

  // Transactional batch sync for a site on a given date
  static async syncDayPlan(siteId, taskDate, tasks) {
    const client = await pool.connect();
    try {
      const effectiveDate = taskDate || new Date().toISOString().split('T')[0];
      await client.query('BEGIN');

      // Query all existing tasks for this site so tasks persist across days
      const existingRes = await client.query(
        'SELECT id FROM public.site_tasks WHERE site_id = $1',
        [Number(siteId)]
      );
      const existingIds = existingRes.rows.map(r => r.id);
      const incomingIds = (tasks || []).filter(t => t.id && typeof t.id === 'number').map(t => t.id);

      // Remove deleted tasks
      const toDeleteIds = existingIds.filter(id => !incomingIds.includes(id));
      if (toDeleteIds.length > 0) {
        await client.query('DELETE FROM public.site_tasks WHERE id = ANY($1::int[])', [toDeleteIds]);
      }

      const savedTasks = [];
      for (const t of (tasks || [])) {
        if (!t.title || !t.title.trim()) continue;

        if (t.id && typeof t.id === 'number' && existingIds.includes(t.id)) {
          // Update
          const updRes = await client.query(`
            UPDATE public.site_tasks
            SET 
              title = $1,
              priority = COALESCE($2, 'Medium'),
              assigned_employee_id = $3,
              assigned_employee_name = $4,
              due_time = $5,
              is_completed = $6,
              completed_at = CASE WHEN $6 = TRUE THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE NULL END,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING 
              id,
              site_id as "siteId",
              TO_CHAR(task_date, 'YYYY-MM-DD') as "taskDate",
              title,
              priority,
              assigned_employee_id as "assignedEmployeeId",
              assigned_employee_name as "assignedEmployeeName",
              due_time as "dueTime",
              is_completed as "isCompleted",
              completed_at as "completedAt";
          `, [
            t.title.trim(),
            t.priority || 'Medium',
            t.assignedEmployeeId ? Number(t.assignedEmployeeId) : null,
            t.assignedEmployeeName || null,
            t.dueTime || null,
            Boolean(t.isCompleted),
            t.id
          ]);
          savedTasks.push(updRes.rows[0]);
        } else {
          // Insert
          const insRes = await client.query(`
            INSERT INTO public.site_tasks (
              site_id, task_date, title, priority, assigned_employee_id, assigned_employee_name, due_time, is_completed, completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END)
            RETURNING 
              id,
              site_id as "siteId",
              TO_CHAR(task_date, 'YYYY-MM-DD') as "taskDate",
              title,
              priority,
              assigned_employee_id as "assignedEmployeeId",
              assigned_employee_name as "assignedEmployeeName",
              due_time as "dueTime",
              is_completed as "isCompleted",
              completed_at as "completedAt";
          `, [
            Number(siteId),
            effectiveDate,
            t.title.trim(),
            t.priority || 'Medium',
            t.assignedEmployeeId ? Number(t.assignedEmployeeId) : null,
            t.assignedEmployeeName || null,
            t.dueTime || null,
            Boolean(t.isCompleted)
          ]);
          savedTasks.push(insRes.rows[0]);
        }
      }

      await client.query('COMMIT');
      return savedTasks;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// Auto-run init
SiteTask.initTable();

module.exports = SiteTask;
