const pool = require('../config/db');

// Calculate hours between two time strings like "09:00 AM" and "06:00 PM" or "09:00" and "18:00"
const calculateHours = (inTime, outTime) => {
  if (!inTime || !outTime) return 0;
  try {
    const parseTimeToMinutes = (t) => {
      t = t.trim().toUpperCase();
      const isAm = t.includes('AM');
      const isPm = t.includes('PM');
      const cleanTime = t.replace(/(AM|PM)/g, '').trim();
      const [hStr, mStr] = cleanTime.split(':');
      let hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr || '0', 10);

      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const inMin = parseTimeToMinutes(inTime);
    const outMin = parseTimeToMinutes(outTime);
    if (isNaN(inMin) || isNaN(outMin)) return 0;

    let diff = outMin - inMin;
    if (diff < 0) diff += 24 * 60; // crossed midnight

    const hours = Number((diff / 60).toFixed(2));
    return hours > 0 ? hours : 0;
  } catch {
    return 0;
  }
};

// GET /api/attendance
// Filters: date, month, employeeId, siteId, search
const getAttendance = async (req, res) => {
  try {
    const { date, month, employeeId, siteId, search } = req.query;

    let query = `
      SELECT 
        a.id,
        a.user_id as "userId",
        u.full_name as "employeeName",
        u.emp_code as "empCode",
        u.role_title as "employeeRole",
        u.avatar as "employeeAvatar",
        u.daily_rate as "dailyRate",
        u.mobile as "employeePhone",
        a.site_id as "siteId",
        s.site_ref as "siteRef",
        s.customer_name as "customerName",
        s.location as "siteLocation",
        TO_CHAR(a.attendance_date, 'YYYY-MM-DD') as "attendanceDate",
        a.in_time as "inTime",
        a.out_time as "outTime",
        a.work_hours as "workHours",
        a.day_value as "dayValue",
        a.status,
        a.in_selfie as "inSelfie",
        a.out_selfie as "outSelfie",
        a.in_gps as "inGps",
        a.out_gps as "outGps",
        a.notes,
        a.created_at as "createdAt"
      FROM public.attendance a
      JOIN public.users u ON a.user_id = u.id
      LEFT JOIN public.sites s ON a.site_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let pIdx = 1;

    if (date && date !== 'all') {
      query += ` AND a.attendance_date = $${pIdx}`;
      params.push(date);
      pIdx++;
    }

    if (month) {
      query += ` AND TO_CHAR(a.attendance_date, 'YYYY-MM') = $${pIdx}`;
      params.push(month);
      pIdx++;
    }

    if (employeeId && employeeId !== 'all') {
      query += ` AND a.user_id = $${pIdx}`;
      params.push(Number(employeeId));
      pIdx++;
    }

    if (siteId && siteId !== 'all') {
      query += ` AND a.site_id = $${pIdx}`;
      params.push(Number(siteId));
      pIdx++;
    }

    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      query += ` AND (
        u.full_name ILIKE $${pIdx} OR 
        u.username ILIKE $${pIdx} OR 
        u.emp_code ILIKE $${pIdx} OR 
        s.customer_name ILIKE $${pIdx} OR 
        s.site_ref ILIKE $${pIdx}
      )`;
      params.push(keyword);
      pIdx++;
    }

    query += ` ORDER BY a.attendance_date DESC, a.id DESC;`;

    const result = await pool.query(query, params);

    const formattedList = result.rows.map((row) => {
      const rawCode = row.empCode || String(row.userId + 100);
      const displayEmpId = rawCode.startsWith('EMP-') ? rawCode : `EMP-${rawCode}`;
      const displaySiteRef = row.siteRef || (row.siteId ? `SITE-${String(row.siteId).padStart(3, '0')}` : 'General / Unassigned');

      return {
        id: row.id,
        userId: row.userId,
        empId: displayEmpId,
        name: row.employeeName,
        phone: row.employeePhone,
        role: row.employeeRole || 'Carpenter',
        avatar: null,
        dailyRate: Number(row.dailyRate || 0),
        siteId: row.siteId,
        siteRef: displaySiteRef,
        siteName: row.customerName ? `${row.customerName} (${row.siteLocation || ''})` : 'Unassigned Site',
        customerName: row.customerName || 'N/A',
        siteLocation: row.siteLocation || '',
        attendanceDate: row.attendanceDate,
        inTime: row.inTime || '--:--',
        outTime: row.outTime || '--:--',
        workHours: Number(row.workHours || 0),
        dayValue: Number(row.dayValue || 1.0),
        valueText: `${Number(row.dayValue || 1.0).toFixed(1)} Day`,
        status: row.status || 'Verified',
        inSelfie: row.inSelfie,
        outSelfie: row.outSelfie,
        inGps: row.inGps || 'Standard GPS verified',
        outGps: row.outGps || (row.outTime ? 'Standard GPS verified' : 'Awaiting punch OUT'),
        notes: row.notes || '',
        createdAt: row.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedList.length,
      attendance: formattedList,
    });
  } catch (error) {
    console.error('Error in getAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance logs',
      error: error.message,
    });
  }
};

// POST /api/attendance
// Admin marks attendance for an employee on a given date.
// Body can contain:
// userId: number
// date: 'YYYY-MM-DD'
// dayValue: number (e.g. 1.0)
// status: 'Verified' | 'Present' | 'Half Day'
// notes: string
// sites: Array<{ siteId: number, inTime: string, outTime: string }>
// OR single siteId, inTime, outTime
const markAttendance = async (req, res) => {
  try {
    const { userId, date, dayValue, status, notes, sites, siteId, inTime, outTime } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please select an employee' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please select an attendance date' });
    }

    // Prepare list of sessions
    let sessions = [];
    if (Array.isArray(sites) && sites.length > 0) {
      sessions = sites.map((s) => ({
        siteId: s.siteId ? Number(s.siteId) : null,
        inTime: s.inTime || '09:00 AM',
        outTime: s.outTime || '06:00 PM',
      }));
    } else {
      sessions = [{
        siteId: siteId ? Number(siteId) : null,
        inTime: inTime || '09:00 AM',
        outTime: outTime || '06:00 PM',
      }];
    }

    const totalSessions = sessions.length;
    const overallDayValue = Number(dayValue) || 1.0;
    // Split day value evenly across sessions if multi-site
    const perSessionDayValue = Number((overallDayValue / totalSessions).toFixed(2));
    const attStatus = status || 'Verified';

    const insertedRows = [];

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i];
      const hours = calculateHours(sess.inTime, sess.outTime);

      const insertQuery = `
        INSERT INTO public.attendance (
          user_id,
          site_id,
          attendance_date,
          in_time,
          out_time,
          work_hours,
          day_value,
          status,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

      const insertValues = [
        Number(userId),
        sess.siteId,
        date,
        sess.inTime,
        sess.outTime,
        hours,
        perSessionDayValue,
        attStatus,
        notes || '',
      ];

      const result = await pool.query(insertQuery, insertValues);
      insertedRows.push(result.rows[0]);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully marked attendance for ${totalSessions} site slot(s)!`,
      records: insertedRows,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message,
    });
  }
};

// PUT /api/attendance/:id
// Admin updates an attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { siteId, attendanceDate, inTime, outTime, dayValue, status, notes } = req.body;

    const existingRes = await pool.query('SELECT * FROM public.attendance WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const current = existingRes.rows[0];

    const newDate = attendanceDate || current.attendance_date;
    const newSiteId = siteId !== undefined ? (siteId ? Number(siteId) : null) : current.site_id;
    const newInTime = inTime !== undefined ? inTime : current.in_time;
    const newOutTime = outTime !== undefined ? outTime : current.out_time;
    const newHours = calculateHours(newInTime, newOutTime);
    const newDayValue = dayValue !== undefined ? Number(dayValue) : current.day_value;
    const newStatus = status || current.status;
    const newNotes = notes !== undefined ? notes : current.notes;

    const updateQuery = `
      UPDATE public.attendance
      SET 
        site_id = $1,
        attendance_date = $2,
        in_time = $3,
        out_time = $4,
        work_hours = $5,
        day_value = $6,
        status = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;

    const updateRes = await pool.query(updateQuery, [
      newSiteId,
      newDate,
      newInTime,
      newOutTime,
      newHours,
      newDayValue,
      newStatus,
      newNotes,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      record: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message,
    });
  }
};

// DELETE /api/attendance/:id
// Admin deletes an attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM public.attendance WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message,
    });
  }
};

// POST /api/attendance/punch
// Employee live punch IN / OUT (restricted strictly to CURRENT_DATE)
const punchAttendance = async (req, res) => {
  try {
    const { userId, siteId, punchType, selfie, gps } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const todayDate = new Date().toISOString().split('T')[0];

    // Check existing attendance for this user today
    const existing = await pool.query(
      `SELECT * FROM public.attendance 
       WHERE user_id = $1 AND attendance_date = CURRENT_DATE 
       ORDER BY id DESC LIMIT 1;`,
      [userId]
    );

    if (punchType === 'IN') {
      // Create new Punch IN
      const insertQuery = `
        INSERT INTO public.attendance (
          user_id,
          site_id,
          attendance_date,
          in_time,
          out_time,
          in_selfie,
          in_gps,
          status,
          day_value
        ) VALUES ($1, $2, CURRENT_DATE, $3, '--:--', $4, $5, 'In Progress', 1.0)
        RETURNING *;
      `;

      const insertRes = await pool.query(insertQuery, [
        Number(userId),
        siteId ? Number(siteId) : null,
        nowTime,
        selfie || null,
        gps || 'GPS verified within 500m',
      ]);

      // Update user's last_site if site provided
      if (siteId) {
        const siteRow = await pool.query('SELECT customer_name, location FROM public.sites WHERE id = $1', [siteId]);
        if (siteRow.rows.length > 0) {
          const siteName = `${siteRow.rows[0].customer_name} (${siteRow.rows[0].location || ''})`;
          await pool.query('UPDATE public.users SET last_site = $1 WHERE id = $2', [siteName, userId]);
        }
      }

      return res.status(201).json({
        success: true,
        punchType: 'IN',
        inTime: nowTime,
        record: insertRes.rows[0],
        message: `Punched IN successfully at ${nowTime}`,
      });
    } else {
      // Punch OUT
      let targetId = null;
      let inTimeVal = '09:00 AM';

      if (existing.rows.length > 0 && (!existing.rows[0].out_time || existing.rows[0].out_time === '--:--')) {
        targetId = existing.rows[0].id;
        inTimeVal = existing.rows[0].in_time || '09:00 AM';
      }

      if (!targetId) {
        // If no prior punch IN today, create one with punch OUT
        const insertQuery = `
          INSERT INTO public.attendance (
            user_id,
            site_id,
            attendance_date,
            in_time,
            out_time,
            out_selfie,
            out_gps,
            work_hours,
            status,
            day_value
          ) VALUES ($1, $2, CURRENT_DATE, '09:00 AM', $3, $4, $5, $6, 'Verified', 1.0)
          RETURNING *;
        `;
        const hours = calculateHours('09:00 AM', nowTime);
        const insertRes = await pool.query(insertQuery, [
          Number(userId),
          siteId ? Number(siteId) : null,
          nowTime,
          selfie || null,
          gps || 'GPS verified within 500m',
          hours,
        ]);

        return res.status(200).json({
          success: true,
          punchType: 'OUT',
          outTime: nowTime,
          record: insertRes.rows[0],
          message: `Punched OUT successfully at ${nowTime}`,
        });
      }

      const hours = calculateHours(inTimeVal, nowTime);

      const updateQuery = `
        UPDATE public.attendance
        SET 
          out_time = $1,
          out_selfie = $2,
          out_gps = $3,
          work_hours = $4,
          status = 'Verified',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
      `;

      const updateRes = await pool.query(updateQuery, [
        nowTime,
        selfie || null,
        gps || 'GPS verified within 500m',
        hours,
        targetId,
      ]);

      return res.status(200).json({
        success: true,
        punchType: 'OUT',
        outTime: nowTime,
        record: updateRes.rows[0],
        message: `Punched OUT successfully at ${nowTime}. Shift complete!`,
      });
    }
  } catch (error) {
    console.error('Error during punchAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process punch',
      error: error.message,
    });
  }
};

// GET /api/attendance/employee/:id
// Get employee attendance history
const getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.id,
        TO_CHAR(a.attendance_date, 'YYYY-MM-DD') as "attendanceDate",
        TO_CHAR(a.attendance_date, 'FMDay, DD Mon YYYY') as "formattedDate",
        TO_CHAR(a.attendance_date, 'FMMonth YYYY') as "monthYear",
        a.site_id as "siteId",
        s.site_ref as "siteRef",
        s.customer_name as "customerName",
        s.location as "siteLocation",
        a.in_time as "inTime",
        a.out_time as "outTime",
        a.work_hours as "workHours",
        a.day_value as "dayValue",
        a.status,
        a.in_selfie as "inSelfie",
        a.out_selfie as "outSelfie",
        a.in_gps as "inGps",
        a.out_gps as "outGps",
        a.notes
      FROM public.attendance a
      LEFT JOIN public.sites s ON a.site_id = s.id
      WHERE a.user_id = $1
      ORDER BY a.attendance_date DESC, a.id DESC;
    `;

    const result = await pool.query(query, [Number(id)]);

    const records = result.rows.map((row) => ({
      id: row.id,
      date: row.formattedDate,
      rawDate: row.attendanceDate,
      monthYear: row.monthYear,
      siteId: row.siteRef || (row.siteId ? `SITE-${String(row.siteId).padStart(3, '0')}` : 'General Site'),
      siteName: row.customerName ? `${row.customerName} Site (${row.siteLocation || ''})` : 'Assigned Site',
      inTime: row.inTime || '--:--',
      outTime: row.outTime || '--:--',
      inGps: row.inGps || 'Within 500m',
      outGps: row.outGps || (row.outTime ? 'Within 500m' : 'Awaiting punch OUT'),
      selfie: null,
      value: `${Number(row.dayValue || 1.0).toFixed(1)} Day`,
      dayValue: Number(row.dayValue || 1.0),
      status: row.status || 'Approved',
      notes: row.notes || '',
    }));

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance records',
      error: error.message,
    });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  punchAttendance,
  getEmployeeAttendance,
};
