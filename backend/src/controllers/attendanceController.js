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

// Calculate day value based on hours:
// >= 11.0 hours (e.g. 11 or 12 hours overtime) => 1.5 Day
// >= 8.0 hours (e.g. 8 or 9 hours standard shift) => 1.0 (Full Day)
// >= 6.0 hours => 0.75 Day
// >= 4.0 hours => 0.50 Day (Half Day)
// >= 2.0 hours => 0.25 Day (Quarter Day)
// < 2.0 hours => 0.0 Day
const calculateDayValue = (hours) => {
  if (hours >= 11.0) return 1.5;
  if (hours >= 8.0) return 1.0;
  if (hours >= 6.0) return 0.75;
  if (hours >= 4.0) return 0.5;
  if (hours >= 2.0) return 0.25;
  return 0.0;
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
      const isBonus = row.inTime === 'GIFT' || row.inTime === 'EXTRA' || row.outTime === 'BONUS' || row.outTime === 'ADDED';
      const displaySiteRef = isBonus 
        ? 'EXTRA' 
        : (row.siteRef || (row.siteId ? `SITE-${String(row.siteId).padStart(3, '0')}` : 'General / Unassigned'));
      const displaySiteName = isBonus 
        ? 'Extra Attendance' 
        : (row.customerName ? `${row.customerName} (${row.siteLocation || ''})` : 'Unassigned Site');
      const displayCustomerName = isBonus ? 'Extra Attendance' : (row.customerName || 'N/A');

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
        siteName: displaySiteName,
        customerName: displayCustomerName,
        siteLocation: row.siteLocation || '',
        attendanceDate: row.attendanceDate,
        inTime: row.inTime || '--:--',
        outTime: row.outTime || '--:--',
        isBonus,
        workHours: Number(row.workHours || 0),
        dayValue: row.dayValue !== null && row.dayValue !== undefined ? Number(row.dayValue) : 0,
        valueText: `${(() => {
          const v = row.dayValue !== null && row.dayValue !== undefined ? Number(row.dayValue) : 0;
          return v % 1 === 0 ? v.toFixed(0) : (v * 2 % 1 === 0 ? v.toFixed(1) : v.toFixed(2));
        })()} Day`,
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
    const overallDayValue = (dayValue !== undefined && dayValue !== null && !isNaN(Number(dayValue))) ? Number(dayValue) : 1.0;
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

// POST /api/attendance/bulk-mark
// Admin marks attendance for multiple employees in a single batch
const bulkMarkAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { date, records, status } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Attendance date is required.' });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance records provided.' });
    }

    await client.query('BEGIN');

    const insertedRows = [];

    for (const rec of records) {
      if (!rec.userId) continue;

      const userId = Number(rec.userId);
      const siteId = rec.siteId ? Number(rec.siteId) : null;
      const inTime = rec.inTime || '09:00 AM';
      const outTime = rec.outTime || '06:00 PM';
      const workHours = (rec.workHours !== undefined && rec.workHours !== null && !isNaN(Number(rec.workHours)))
        ? Number(rec.workHours)
        : calculateHours(inTime, outTime);
      const dayValue = (rec.dayValue !== undefined && rec.dayValue !== null && !isNaN(Number(rec.dayValue)))
        ? Number(rec.dayValue)
        : 1.0;
      const attStatus = rec.status || status || 'Verified';
      const notes = rec.notes || '';

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
        userId,
        siteId,
        date,
        inTime,
        outTime,
        workHours,
        dayValue,
        attStatus,
        notes,
      ];

      const result = await client.query(insertQuery, insertValues);
      insertedRows.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: `Successfully marked attendance for ${insertedRows.length} employee(s)!`,
      count: insertedRows.length,
      records: insertedRows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulkMarkAttendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record bulk attendance',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// PUT /api/attendance/:id
// Admin updates an attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, siteId, attendanceDate, inTime, outTime, dayValue, status, notes } = req.body;

    const existingRes = await pool.query('SELECT * FROM public.attendance WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const current = existingRes.rows[0];

    const newUserId = userId !== undefined && userId !== null ? Number(userId) : current.user_id;
    const newDate = attendanceDate || current.attendance_date;
    const newSiteId = siteId !== undefined ? (siteId ? Number(siteId) : null) : current.site_id;
    const newInTime = inTime !== undefined ? inTime : current.in_time;
    const newOutTime = outTime !== undefined ? outTime : current.out_time;
    const isGift = newInTime === 'GIFT' || newOutTime === 'BONUS';
    const newHours = isGift ? 0 : calculateHours(newInTime, newOutTime);
    let newDayValue;
    if (dayValue !== undefined && dayValue !== null && !isNaN(Number(dayValue))) {
      newDayValue = Number(dayValue);
    } else if (!isGift && newHours > 0) {
      newDayValue = calculateDayValue(newHours);
    } else {
      newDayValue = current.day_value;
    }
    const newStatus = status || current.status || 'Approved';
    const newNotes = notes !== undefined ? notes : current.notes;

    const updateQuery = `
      UPDATE public.attendance
      SET 
        user_id = $1,
        site_id = $2,
        attendance_date = $3,
        in_time = $4,
        out_time = $5,
        work_hours = $6,
        day_value = $7,
        status = $8,
        notes = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *;
    `;

    const updateRes = await pool.query(updateQuery, [
      newUserId,
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

// POST /api/attendance/bonus
// Admin awards month-end gift/bonus attendance days to an employee
const awardBonusAttendance = async (req, res) => {
  try {
    const { userId, bonusDays, date, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please select an employee' });
    }

    const days = parseFloat(bonusDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid number of bonus days (greater than 0)' });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const bonusNote = notes && notes.trim() 
      ? notes.trim() 
      : `Extra Attendance (+${days} Days)`;

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
      ) VALUES ($1, NULL, $2, 'EXTRA', 'ADDED', 0.0, $3, 'Approved', $4)
      RETURNING *;
    `;

    const insertRes = await pool.query(insertQuery, [
      Number(userId),
      attendanceDate,
      days,
      bonusNote,
    ]);

    const userRes = await pool.query('SELECT full_name, daily_rate FROM public.users WHERE id = $1', [userId]);
    const empName = userRes.rows[0]?.full_name || 'Employee';
    const rate = Number(userRes.rows[0]?.daily_rate || 0);
    const addedSalary = Math.round(days * rate);

    return res.status(201).json({
      success: true,
      message: `Successfully added +${days} Attendance Day(s) to ${empName}! (₹${addedSalary.toLocaleString('en-IN')} added to salary)`,
      record: insertRes.rows[0],
      bonusDays: days,
      addedSalary,
    });
  } catch (error) {
    console.error('Error awarding bonus attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to award bonus attendance',
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
      // Create new Punch IN: day_value=0.0, work_hours=0.0, status='In Progress'
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
          work_hours,
          day_value
        ) VALUES ($1, $2, CURRENT_DATE, $3, '--:--', $4, $5, 'In Progress', 0.0, 0.0)
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
      // Punch OUT: calculate hours, day_value, and mark as 'Pending Approval'
      let targetId = null;
      let inTimeVal = '09:00 AM';

      if (existing.rows.length > 0 && (!existing.rows[0].out_time || existing.rows[0].out_time === '--:--')) {
        targetId = existing.rows[0].id;
        inTimeVal = existing.rows[0].in_time || '09:00 AM';
      }

      if (!targetId) {
        // If no prior punch IN today, create one with punch OUT
        const hours = calculateHours('09:00 AM', nowTime);
        const dayVal = calculateDayValue(hours);
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
          ) VALUES ($1, $2, CURRENT_DATE, '09:00 AM', $3, $4, $5, $6, 'Pending Approval', $7)
          RETURNING *;
        `;
        const insertRes = await pool.query(insertQuery, [
          Number(userId),
          siteId ? Number(siteId) : null,
          nowTime,
          selfie || null,
          gps || 'GPS verified within 500m',
          hours,
          dayVal,
        ]);

        return res.status(200).json({
          success: true,
          punchType: 'OUT',
          outTime: nowTime,
          workHours: hours,
          dayValue: dayVal,
          status: 'Pending Approval',
          record: insertRes.rows[0],
          message: `Punched OUT successfully at ${nowTime} (${hours} hrs, ${dayVal} Day). Sent to Admin for approval.`,
        });
      }

      const hours = calculateHours(inTimeVal, nowTime);
      const dayVal = calculateDayValue(hours);

      const updateQuery = `
        UPDATE public.attendance
        SET 
          out_time = $1,
          out_selfie = $2,
          out_gps = $3,
          work_hours = $4,
          day_value = $5,
          status = 'Pending Approval',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *;
      `;

      const updateRes = await pool.query(updateQuery, [
        nowTime,
        selfie || null,
        gps || 'GPS verified within 500m',
        hours,
        dayVal,
        targetId,
      ]);

      return res.status(200).json({
        success: true,
        punchType: 'OUT',
        outTime: nowTime,
        workHours: hours,
        dayValue: dayVal,
        status: 'Pending Approval',
        record: updateRes.rows[0],
        message: `Punched OUT successfully at ${nowTime} (${hours} hrs, ${dayVal} Day). Sent to Admin for approval.`,
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

    const records = result.rows.map((row) => {
      const dVal = row.dayValue !== null && row.dayValue !== undefined ? Number(row.dayValue) : 0;
      const displayVal = dVal % 1 === 0 ? dVal.toFixed(0) : (dVal * 2 % 1 === 0 ? dVal.toFixed(1) : dVal.toFixed(2));
      const isBonus = row.inTime === 'GIFT' || row.inTime === 'EXTRA' || row.outTime === 'BONUS' || row.outTime === 'ADDED';
      const displaySiteRef = isBonus 
        ? 'EXTRA' 
        : (row.siteRef || (row.siteId ? `SITE-${String(row.siteId).padStart(3, '0')}` : 'General Site'));
      const displaySiteName = isBonus 
        ? 'Extra Attendance' 
        : (row.customerName ? `${row.customerName} (${row.siteLocation || ''})` : 'Assigned Site');
      const displayCustomerName = isBonus ? 'Extra Attendance' : (row.customerName || '');

      return {
        id: row.id,
        date: row.formattedDate,
        rawDate: row.attendanceDate,
        monthYear: row.monthYear,
        siteId: displaySiteRef,
        rawSiteId: row.siteId,
        siteRef: displaySiteRef,
        customerName: displayCustomerName,
        siteLocation: row.siteLocation || '',
        siteName: displaySiteName,
        inTime: isBonus ? 'EXTRA' : (row.inTime || '--:--'),
        outTime: isBonus ? 'ADDED' : (row.outTime || '--:--'),
        workHours: Number(row.workHours || 0),
        inGps: isBonus ? 'N/A (Added by Admin)' : (row.inGps || 'Within 500m'),
        outGps: isBonus ? 'N/A (Added by Admin)' : (row.outGps || (row.outTime ? 'Within 500m' : 'Awaiting punch OUT')),
        selfie: null,
        value: `${displayVal} Day`,
        dayValue: dVal,
        status: row.status || 'Approved',
        notes: row.notes || '',
        isBonus,
      };
    });

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

// POST /api/attendance/:id/approve
// Admin accepts/approves employee attendance punch
const approveAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayValue } = req.body;

    let updateQuery = `
      UPDATE public.attendance
      SET status = 'Approved', updated_at = CURRENT_TIMESTAMP
    `;
    const params = [id];

    if (dayValue !== undefined && dayValue !== null) {
      updateQuery += `, day_value = $2 WHERE id = $1 RETURNING *;`;
      params.push(Number(dayValue));
    } else {
      updateQuery += ` WHERE id = $1 RETURNING *;`;
    }

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance approved successfully! Added to employee worked days and salary.',
      record: result.rows[0],
    });
  } catch (error) {
    console.error('Error approving attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve attendance', error: error.message });
  }
};

// POST /api/attendance/:id/reject
// Admin rejects employee attendance punch
const rejectAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE public.attendance
       SET status = 'Rejected', day_value = 0.0, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *;`,
      [id, notes || 'Rejected by Admin']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance rejected',
      record: result.rows[0],
    });
  } catch (error) {
    console.error('Error rejecting attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject attendance', error: error.message });
  }
};

// POST /api/attendance/bulk-approve
// Admin approves all pending attendance records
const bulkApproveAttendance = async (req, res) => {
  try {
    const { ids, date } = req.body;

    let query = `
      UPDATE public.attendance
      SET status = 'Approved', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'Pending Approval'
    `;
    const params = [];

    if (Array.isArray(ids) && ids.length > 0) {
      query += ` AND id = ANY($1::int[]) RETURNING *;`;
      params.push(ids.map(Number));
    } else if (date) {
      query += ` AND attendance_date = $1 RETURNING *;`;
      params.push(date);
    } else {
      query += ` RETURNING *;`;
    }

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: `Successfully approved ${result.rows.length} attendance record(s)!`,
      count: result.rows.length,
      records: result.rows,
    });
  } catch (error) {
    console.error('Error in bulkApproveAttendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk approve attendance', error: error.message });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  punchAttendance,
  getEmployeeAttendance,
  approveAttendance,
  rejectAttendance,
  bulkApproveAttendance,
  awardBonusAttendance,
  bulkMarkAttendance,
};
