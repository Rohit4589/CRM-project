const pool = require('../config/db');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Query user by username, mobile, or Employee ID (e.g. 102 or EMP-102)
    const cleanIdWithoutPrefix = cleanUser.replace(/^emp-?/i, '');
    const query = `
      SELECT id, username, role, full_name, role_title, mobile, daily_rate, avatar, emp_code
      FROM public.users
      WHERE (
        LOWER(username) = $1 
        OR mobile = $1 
        OR emp_code = $1 
        OR LOWER(emp_code) = $1
        OR emp_code = $3
        OR ('EMP-' || emp_code) = UPPER($1)
        OR (role = 'employee' AND id::text = $3)
      ) AND password = $2
      LIMIT 1;
    `;

    const result = await pool.query(query, [cleanUser, cleanPass, cleanIdWithoutPrefix]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID, Mobile Number, or Password',
      });
    }

    const row = result.rows[0];
    const rawCode = row.emp_code || String(row.id + 100);
    const displayId = row.role === 'admin' 
      ? `ADMIN-${String(row.id).padStart(2, '0')}` 
      : (rawCode.startsWith('EMP-') ? rawCode : `EMP-${rawCode}`);

    // Format user object for frontend consumption
    const user = {
      id: displayId,
      empCode: rawCode.replace(/^EMP-/i, ''),
      dbId: row.id,
      username: row.username,
      role: row.role,
      name: row.role === 'admin' ? row.full_name : row.full_name.split(' ')[0],
      fullName: row.full_name,
      roleTitle: row.role_title,
      mobile: row.mobile,
      dailyRate: Number(row.daily_rate || 0),
      avatar: row.avatar,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { userId, dbId, username, mobile, currentPassword, newPassword } = req.body;

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New password or PIN is required',
      });
    }

    let userQuery = '';
    let queryParam = null;

    if (dbId) {
      userQuery = 'SELECT id, password, full_name FROM public.users WHERE id = $1';
      queryParam = parseInt(dbId, 10);
    } else if (userId) {
      const rawDigits = parseInt(String(userId).replace(/[^0-9]/g, ''), 10);
      userQuery = 'SELECT id, password, full_name FROM public.users WHERE id = $1';
      queryParam = rawDigits;
    } else if (mobile) {
      const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
      userQuery = 'SELECT id, password, full_name FROM public.users WHERE mobile = $1';
      queryParam = cleanMobile;
    } else if (username) {
      userQuery = 'SELECT id, password, full_name FROM public.users WHERE LOWER(username) = LOWER($1) OR mobile = $1';
      queryParam = username.trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'User identifier is required',
      });
    }

    const checkRes = await pool.query(userQuery, [queryParam]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const targetUser = checkRes.rows[0];

    // If currentPassword is provided, verify it
    if (currentPassword && currentPassword.trim() !== targetUser.password) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match. Please verify and try again.',
      });
    }

    // Update password in DB
    const cleanNewPass = newPassword.trim();
    await pool.query('UPDATE public.users SET password = $1 WHERE id = $2', [cleanNewPass, targetUser.id]);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully! You can now use your new password to log in.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  changePassword,
};

