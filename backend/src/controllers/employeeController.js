const pool = require('../config/db');

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        emp_code,
        username, 
        password,
        role, 
        full_name as name, 
        role_title as role, 
        mobile as phone, 
        daily_rate as "dailySalary", 
        status, 
        avatar, 
        site_policy as "sitePolicy", 
        last_site as "lastSite",
        created_at
      FROM public.users
      WHERE role = 'employee'
      ORDER BY id ASC;
    `;

    const result = await pool.query(query);

    const formattedEmployees = result.rows.map((row) => {
      const rawCode = row.emp_code || String(row.id + 100);
      const displayId = rawCode.startsWith('EMP-') ? rawCode : `EMP-${rawCode}`;
      return {
        id: displayId,
        empCode: rawCode.replace(/^EMP-/i, ''),
        dbId: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        phone: row.phone ? (row.phone.startsWith('+91') ? row.phone : `+91 ${row.phone}`) : '',
        rawPhone: row.phone,
        role: row.role || 'Carpenter',
        dailySalary: Number(row.dailySalary || 0),
        sitePolicy: row.sitePolicy || 'Flexible / Self-Pick',
        lastSite: row.lastSite || 'Not yet punched',
        status: row.status || 'Active',
        avatar: row.avatar || `https://i.pravatar.cc/150?img=${(row.id % 50) + 1}`,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedEmployees.length,
      employees: formattedEmployees,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
};

// POST /api/employees
const addEmployee = async (req, res) => {
  try {
    const { name, phone, role, dailySalary, status, password, empCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee full name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const cleanName = name.trim();
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    let cleanEmpCode = empCode ? String(empCode).trim().replace(/^EMP-/i, '') : null;
    if (cleanEmpCode) {
      if (!/^\d{3,4}$/.test(cleanEmpCode)) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID must be 3 or 4 digits (e.g. 102 or 1002).',
        });
      }
      const checkCode = await pool.query('SELECT id FROM public.users WHERE emp_code = $1', [cleanEmpCode]);
      if (checkCode.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Employee ID "${cleanEmpCode}" is already assigned to another employee. Please use a unique 3-4 digit ID.`,
        });
      }
    } else {
      const maxCodeRes = await pool.query(`
        SELECT MAX(NULLIF(regexp_replace(emp_code, '[^0-9]', '', 'g'), '')::int) as max_code
        FROM public.users WHERE role = 'employee'
      `);
      const maxVal = maxCodeRes.rows[0]?.max_code || 100;
      cleanEmpCode = String(Math.max(101, maxVal + 1));
    }

    let username = cleanEmpCode || cleanPhone || cleanName.toLowerCase().replace(/\s+/g, '_');
    // Admin-provided password or fallback to last 4 digits
    const userPassword = (password && password.trim()) ? password.trim() : (cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234');

    const cleanRole = (role && role.trim()) || 'Carpenter';
    const cleanSalary = Number(dailySalary) >= 0 ? Number(dailySalary) : 1000;
    const cleanStatus = status || 'Active';
    const randomAvatar = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50) + 1}`;

    const existingCheck = await pool.query('SELECT id FROM public.users WHERE username = $1', [username]);
    if (existingCheck.rows.length > 0) {
      username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const insertQuery = `
      INSERT INTO public.users 
        (username, password, role, full_name, role_title, mobile, daily_rate, status, avatar, site_policy, last_site, emp_code)
      VALUES 
        ($1, $2, 'employee', $3, $4, $5, $6, $7, $8, 'Flexible / Self-Pick', 'Not yet punched', $9)
      RETURNING 
        id, 
        emp_code,
        username, 
        password,
        role, 
        full_name as name, 
        role_title as role, 
        mobile as phone, 
        daily_rate as "dailySalary", 
        status, 
        avatar,
        site_policy as "sitePolicy",
        last_site as "lastSite";
    `;

    const result = await pool.query(insertQuery, [
      username,
      userPassword,
      cleanName,
      cleanRole,
      cleanPhone,
      cleanSalary,
      cleanStatus,
      randomAvatar,
      cleanEmpCode,
    ]);

    const row = result.rows[0];
    let finalCode = row.emp_code;
    if (!finalCode) {
      finalCode = String(row.id + 100);
      await pool.query('UPDATE public.users SET emp_code = $1 WHERE id = $2', [finalCode, row.id]);
    }

    const displayId = finalCode.startsWith('EMP-') ? finalCode : `EMP-${finalCode}`;
    const newEmployee = {
      id: displayId,
      empCode: finalCode.replace(/^EMP-/i, ''),
      dbId: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      phone: row.phone ? `+91 ${row.phone}` : '',
      rawPhone: row.phone,
      role: row.role,
      dailySalary: Number(row.dailySalary),
      sitePolicy: row.sitePolicy,
      lastSite: row.lastSite,
      status: row.status,
      avatar: row.avatar,
    };

    return res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      employee: newEmployee,
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add employee',
      error: error.message,
    });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const rawParam = String(id).trim();
    const cleanParam = rawParam.replace(/^EMP-/i, '');
    let dbId = null;

    // 1. Check if numeric and matches primary key id
    if (/^\d+$/.test(rawParam)) {
      const byId = await pool.query('SELECT id FROM public.users WHERE id = $1 AND role = $2', [parseInt(rawParam, 10), 'employee']);
      if (byId.rows.length > 0) {
        dbId = byId.rows[0].id;
      }
    }

    // 2. If not found by primary key, check emp_code
    if (!dbId) {
      const byCode = await pool.query('SELECT id FROM public.users WHERE (emp_code = $1 OR emp_code = $2) AND role = $3', [rawParam, cleanParam, 'employee']);
      if (byCode.rows.length > 0) {
        dbId = byCode.rows[0].id;
      }
    }

    // 3. Fallback legacy calculation if still not found
    if (!dbId && /^\d+$/.test(cleanParam) && parseInt(cleanParam, 10) > 100) {
      const legacyId = parseInt(cleanParam, 10) - 100;
      const byLegacy = await pool.query('SELECT id FROM public.users WHERE id = $1 AND role = $2', [legacyId, 'employee']);
      if (byLegacy.rows.length > 0) {
        dbId = byLegacy.rows[0].id;
      }
    }

    if (!dbId) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const { name, phone, role, dailySalary, status, password, empCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }

    const cleanName = name.trim();
    const rawDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    const cleanRole = role ? role.trim() : 'Carpenter';
    const cleanSalary = Number(dailySalary) >= 0 ? Number(dailySalary) : 1000;
    const cleanStatus = status || 'Active';
    const newPassword = (password && password.trim()) ? password.trim() : null;
    const cleanEmpCode = empCode ? String(empCode).trim().replace(/^EMP-/i, '') : null;

    if (cleanEmpCode) {
      if (!/^\d{3,4}$/.test(cleanEmpCode)) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID must be 3 or 4 digits (e.g. 102 or 1002).',
        });
      }

      const checkCode = await pool.query('SELECT id FROM public.users WHERE emp_code = $1 AND id <> $2', [cleanEmpCode, dbId]);
      if (checkCode.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Employee ID "${cleanEmpCode}" is already in use by another employee. Please choose a unique ID.`,
        });
      }
    }

    const updateQuery = `
      UPDATE public.users
      SET 
        full_name = $1,
        role_title = $2,
        mobile = $3,
        daily_rate = $4,
        status = $5,
        password = CASE WHEN $6::varchar IS NOT NULL AND $6::varchar <> '' THEN $6::varchar ELSE password END,
        emp_code = CASE WHEN $7::varchar IS NOT NULL AND $7::varchar <> '' THEN $7::varchar ELSE emp_code END
      WHERE id = $8 AND role = 'employee'
      RETURNING 
        id, 
        emp_code,
        username, 
        password,
        role, 
        full_name as name, 
        role_title as role, 
        mobile as phone, 
        daily_rate as "dailySalary", 
        status, 
        avatar,
        site_policy as "sitePolicy",
        last_site as "lastSite";
    `;

    const result = await pool.query(updateQuery, [
      cleanName, 
      cleanRole, 
      cleanPhone, 
      cleanSalary, 
      cleanStatus, 
      newPassword, 
      cleanEmpCode,
      dbId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const row = result.rows[0];
    const rawCode = row.emp_code || String(row.id + 100);
    const displayId = rawCode.startsWith('EMP-') ? rawCode : `EMP-${rawCode}`;

    const updatedEmployee = {
      id: displayId,
      empCode: rawCode.replace(/^EMP-/i, ''),
      dbId: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      phone: row.phone ? (row.phone.startsWith('+91') ? row.phone : `+91 ${row.phone}`) : '',
      rawPhone: row.phone,
      role: row.role,
      dailySalary: Number(row.dailySalary),
      sitePolicy: row.sitePolicy,
      lastSite: row.lastSite,
      status: row.status,
      avatar: row.avatar,
    };

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message,
    });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const rawParam = String(id).trim();
    const cleanParam = rawParam.replace(/^EMP-/i, '');
    let dbId = null;

    if (/^\d+$/.test(rawParam)) {
      const byId = await pool.query('SELECT id FROM public.users WHERE id = $1 AND role = $2', [parseInt(rawParam, 10), 'employee']);
      if (byId.rows.length > 0) {
        dbId = byId.rows[0].id;
      }
    }

    if (!dbId) {
      const byCode = await pool.query('SELECT id FROM public.users WHERE (emp_code = $1 OR emp_code = $2) AND role = $3', [rawParam, cleanParam, 'employee']);
      if (byCode.rows.length > 0) {
        dbId = byCode.rows[0].id;
      }
    }

    if (!dbId && /^\d+$/.test(cleanParam) && parseInt(cleanParam, 10) > 100) {
      const legacyId = parseInt(cleanParam, 10) - 100;
      const byLegacy = await pool.query('SELECT id FROM public.users WHERE id = $1 AND role = $2', [legacyId, 'employee']);
      if (byLegacy.rows.length > 0) {
        dbId = byLegacy.rows[0].id;
      }
    }

    if (!dbId) {
      return res.status(404).json({ success: false, message: 'Employee not found or cannot be deleted' });
    }

    const deleteQuery = `
      DELETE FROM public.users
      WHERE id = $1 AND role = 'employee'
      RETURNING id, full_name as name;
    `;

    const result = await pool.query(deleteQuery, [dbId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found or cannot be deleted' });
    }

    return res.status(200).json({
      success: true,
      message: `Employee "${result.rows[0].name}" deleted successfully`,
      id: dbId,
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message,
    });
  }
};

module.exports = {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};
