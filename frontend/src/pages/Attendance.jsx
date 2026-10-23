import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { getTranslation } from '../utils/translations';
import { EmployeeCombobox, SiteCombobox, DayValueCombobox } from '../components/attendance/AttendanceComboboxes';
import { handleFormKeyDown } from '../utils/formKeyboardNav';

const Attendance = ({ lang = 'en', initialDate = null }) => {
  const t = (key) => getTranslation(lang, key);
  // Main data state
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);

  // Filter & Search states
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const isYesterday = (dStr) => {
    if (!dStr) return false;
    return getYesterdayStr() === dStr;
  };

  const formatToDMY = (dateStr) => {
    if (!dateStr) return '--';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    }
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const yr = d.getFullYear();
        return `${day}-${mon}-${yr}`;
      }
    } catch { }
    return dateStr;
  };

  const formatDays = (val) => {
    const d = Number(val) || 0;
    return d % 1 === 0 ? d.toFixed(0) : String(parseFloat(d.toFixed(2)));
  };

  const calculateHoursAndDayValue = (inTimeStr, outTimeStr) => {
    if (!inTimeStr || !outTimeStr || inTimeStr === '--:--' || outTimeStr === '--:--') {
      return { hours: 0, dayValue: '1.0' };
    }
    try {
      const parseToMin = (t) => {
        t = String(t).trim().toUpperCase();
        const isAm = t.includes('AM');
        const isPm = t.includes('PM');
        const clean = t.replace(/(AM|PM)/g, '').trim();
        const [hStr, mStr] = clean.split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr || '0', 10);
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
        return h * 60 + m;
      };

      const inM = parseToMin(inTimeStr);
      const outM = parseToMin(outTimeStr);
      if (isNaN(inM) || isNaN(outM)) return { hours: 0, dayValue: '1.0' };

      let diff = outM - inM;
      if (diff < 0) diff += 24 * 60;
      const hours = Number((diff / 60).toFixed(2));

      let dVal = '0.0';
      if (hours >= 11.0) dVal = '1.5';
      else if (hours >= 9.5) dVal = '1.25';
      else if (hours >= 8.0) dVal = '1.0';
      else if (hours >= 6.0) dVal = '0.75';
      else if (hours >= 4.0) dVal = '0.5';
      else if (hours >= 2.0) dVal = '0.25';
      else dVal = '0.0';

      return { hours, dayValue: dVal };
    } catch {
      return { hours: 0, dayValue: '1.0' };
    }
  };

  // Parse time to HH:MM format for <input type="time">
  const parseToTimeInput = (tStr) => {
    if (!tStr || tStr === '--:--' || tStr === 'GIFT' || tStr === 'BONUS' || tStr === 'EXTRA' || tStr === 'ADDED') return '09:00';
    try {
      const isPm = tStr.toUpperCase().includes('PM');
      const clean = tStr.replace(/(AM|PM)/gi, '').trim();
      const parts = clean.split(':');
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1] || '0', 10);
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch {
      return '09:00';
    }
  };

  // Format time strings (e.g. 09:00 -> 09:00 AM)
  const formatTimeAmPm = (tStr) => {
    if (!tStr) return '--:--';
    if (tStr.includes('AM') || tStr.includes('PM') || tStr === 'EXTRA' || tStr === 'GIFT' || tStr === 'ADDED' || tStr === 'BONUS') return tStr;
    const parts = tStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${String(displayH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  };

  const [latestDate, setLatestDate] = useState('');
  const [dateFilter, setDateFilter] = useState(initialDate || getTodayStr());
  const [hasAutoSwitched, setHasAutoSwitched] = useState(Boolean(initialDate));
  const [showAllDates, setShowAllDates] = useState(false);
  const [siteFilter, setSiteFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // UI / Status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Group / Date Edit Attendance Modal state
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditDate, setBulkEditDate] = useState(getTodayStr());
  const [bulkEditNewDate, setBulkEditNewDate] = useState(getTodayStr());
  const [bulkEditRows, setBulkEditRows] = useState([]);
  const [bulkEditDeletedIds, setBulkEditDeletedIds] = useState([]);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  // Attendance Mode: 'single' | 'bulk'
  const [attendanceMode, setAttendanceMode] = useState('single');
  const [bulkDate, setBulkDate] = useState(getTodayStr());
  const [bulkDefaultSite, setBulkDefaultSite] = useState('');
  const [bulkRows, setBulkRows] = useState([]);

  // Add Attendance Form State
  const [formData, setFormData] = useState({
    userId: '',
    date: getTodayStr(),
    dayValue: '1.0',
    status: 'Verified',
    notes: '',
    siteSessions: [
      { siteId: '', inTime: '09:00', outTime: '18:00' }
    ]
  });

  // Gift / Bonus Attendance Form State
  const [giftFormData, setGiftFormData] = useState({
    userId: '',
    bonusDays: '4',
    date: getTodayStr(),
    notes: '🎁 Month-End Performance Bonus (+4 Days)'
  });

  // Edit Attendance Form State
  const [editFormData, setEditFormData] = useState({
    id: null,
    employeeName: '',
    empId: '',
    userId: '',
    date: '',
    siteId: '',
    inTime: '09:00',
    outTime: '18:00',
    dayValue: '1.0',
    dailyRate: 1000,
    status: 'Verified',
    notes: '',
    isBonus: false
  });

  // Fetch all initial data
  const fetchData = async (overrideDate, overrideAll) => {
    try {
      setLoading(true);
      setApiError('');

      const useAll = overrideAll !== undefined ? overrideAll : showAllDates;
      const targetDate = overrideDate !== undefined ? overrideDate : dateFilter;
      const attUrl = useAll ? `${API_BASE}/attendance` : `${API_BASE}/attendance?date=${targetDate}`;

      // Fetch employees, sites, and attendance in parallel
      const [empRes, siteRes, attRes] = await Promise.all([
        fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/sites`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(attUrl).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (empRes.success) setEmployees(empRes.employees || []);
      if (siteRes.success) setSites(siteRes.sites || []);

      if (attRes.latestDate) {
        setLatestDate(attRes.latestDate);
      }

      // If user opened attendance with no specific date (defaulted to today),
      // and today has 0 attendance records, but there is a latestDate in DB (e.g. yesterday):
      // automatically show that last day's attendance so the screen is never blank!
      if (!initialDate && !hasAutoSwitched && !overrideDate && overrideAll === undefined && !showAllDates) {
        const logs = attRes.attendance || [];
        if (logs.length === 0 && attRes.latestDate && attRes.latestDate !== targetDate) {
          setHasAutoSwitched(true);
          setDateFilter(attRes.latestDate);
          setBulkEditDate(attRes.latestDate);
          setBulkEditNewDate(attRes.latestDate);
          const latestRes = await fetch(`${API_BASE}/attendance?date=${attRes.latestDate}`).then(r => r.json()).catch(() => ({ success: false }));
          if (latestRes.success && Array.isArray(latestRes.attendance)) {
            setAttendanceLogs(latestRes.attendance);
            setLoading(false);
            return;
          }
        }
      }

      if (attRes.success) setAttendanceLogs(attRes.attendance || []);
      else setAttendanceLogs([]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setApiError('Unable to connect to backend server on port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDate && initialDate !== dateFilter) {
      setDateFilter(initialDate);
      setShowAllDates(false);
      fetchData(initialDate, false);
      return;
    }
    fetchData();
  }, [dateFilter, showAllDates, initialDate]);

  // Open Add Days in Unified Attendance Modal
  const handleOpenGiftModal = (preselectedEmp = null) => {
    const empId = preselectedEmp?.dbId || preselectedEmp?.userId || (employees.length > 0 ? employees[0].dbId : '');
    setGiftFormData({
      userId: empId,
      bonusDays: '4',
      date: dateFilter || getTodayStr(),
      notes: `Extra Attendance (+4 Days)`
    });
    setAttendanceMode('days');
    setApiError('');
    setShowAddModal(true);
  };

  // Save Extra Attendance Days
  const handleSaveGiftAttendance = async (e) => {
    e.preventDefault();
    if (!giftFormData.userId) {
      setApiError('Please select an employee.');
      return;
    }

    const days = parseFloat(giftFormData.bonusDays);
    if (isNaN(days) || days <= 0) {
      setApiError('Please enter a valid number of days (greater than 0).');
      return;
    }

    setSaving(true);
    setApiError('');

    try {
      const res = await fetch(`${API_BASE}/attendance/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(giftFormData.userId),
          bonusDays: days,
          date: giftFormData.date,
          notes: giftFormData.notes
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to add attendance days.');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      setShowGiftModal(false);
      setSuccessMessage(data.message || `Successfully added +${days} attendance days!`);
      setTimeout(() => setSuccessMessage(''), 7000);
      fetchData(giftFormData.date, false);
    } catch (err) {
      console.error('Error adding attendance days:', err);
      setApiError('Server error while adding attendance days.');
    } finally {
      setSaving(false);
    }
  };

  // Open Add Modal & Reset Form (supports 'single' or 'bulk' mode)
  const handleOpenAddModal = (initialMode = 'single') => {
    const defaultEmp = employees.length > 0 ? employees[0].dbId : '';
    const defaultSite = sites.length > 0 ? (sites[0].dbId || sites[0].id) : '';

    setAttendanceMode(initialMode);
    setFormData({
      userId: defaultEmp,
      date: dateFilter || getTodayStr(),
      dayValue: '1.0',
      status: 'Verified',
      notes: '',
      siteSessions: [
        { siteId: defaultSite, inTime: '09:00', outTime: '18:00' }
      ]
    });

    const activeDate = dateFilter || getTodayStr();
    setBulkDate(activeDate);
    setBulkDefaultSite('');
    setBulkRows([
      {
        id: String(Date.now()),
        userId: '',
        siteId: '',
        dayValue: '1.0',
        inTime: '09:00',
        outTime: '18:00',
        dailyRate: 0,
        notes: ''
      }
    ]);

    setApiError('');
    setShowAddModal(true);
  };

  // Add another site slot (+)
  const handleAddSiteSession = () => {
    const defaultSite = sites.length > 0 ? (sites[0].dbId || sites[0].id) : '';
    setFormData(prev => ({
      ...prev,
      siteSessions: [
        ...prev.siteSessions,
        { siteId: defaultSite, inTime: '14:00', outTime: '18:00' }
      ]
    }));
  };

  // Remove site slot (-)
  const handleRemoveSiteSession = (index) => {
    if (formData.siteSessions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      siteSessions: prev.siteSessions.filter((_, i) => i !== index)
    }));
  };

  // Update site slot field
  const handleSessionChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.siteSessions];
      updated[index] = { ...updated[index], [field]: value };

      let totalH = 0;
      updated.forEach(sess => {
        if (sess.inTime && sess.outTime) {
          const { hours } = calculateHoursAndDayValue(sess.inTime, sess.outTime);
          totalH += hours;
        }
      });

      let dVal = '0.0';
      if (totalH >= 11.0) dVal = '1.5';
      else if (totalH >= 9.5) dVal = '1.25';
      else if (totalH >= 8.0) dVal = '1.0';
      else if (totalH >= 6.0) dVal = '0.75';
      else if (totalH >= 4.0) dVal = '0.5';
      else if (totalH >= 2.0) dVal = '0.25';

      return { ...prev, siteSessions: updated, dayValue: dVal };
    });
  };

  // Default shift times for Hajeri / Day Values:
  // 0.5 -> 9:00 AM to 1:00 PM (4 hrs)
  // 1.0 -> 9:00 AM to 6:00 PM (9 hrs)
  // 1.5 -> 9:00 AM to 9:00 PM (12 hrs)
  const getTimeSlotForDayValue = (dValStr) => {
    const val = parseFloat(dValStr);
    if (val === 0.25) return { inTime: '09:00', outTime: '11:00' };
    if (val === 0.5) return { inTime: '09:00', outTime: '13:00' };
    if (val === 0.75) return { inTime: '09:00', outTime: '15:00' };
    if (val === 1.0) return { inTime: '09:00', outTime: '18:00' };
    if (val === 1.25) return { inTime: '09:00', outTime: '19:30' };
    if (val === 1.5) return { inTime: '09:00', outTime: '21:00' };
    if (val === 1.75) return { inTime: '09:00', outTime: '22:30' };
    if (val === 2.0) return { inTime: '09:00', outTime: '23:59' };
    return null;
  };

  // When admin selects Day Value in Mark Attendance Modal, auto-convert shift timings
  const handleAddDayValueChange = (newDayValue) => {
    const slot = getTimeSlotForDayValue(newDayValue);
    setFormData(prev => {
      let updatedSessions = [...prev.siteSessions];
      if (slot && updatedSessions.length > 0) {
        if (updatedSessions.length === 1) {
          updatedSessions[0] = {
            ...updatedSessions[0],
            inTime: slot.inTime,
            outTime: slot.outTime
          };
        } else {
          updatedSessions[updatedSessions.length - 1] = {
            ...updatedSessions[updatedSessions.length - 1],
            outTime: slot.outTime
          };
        }
      }
      return {
        ...prev,
        dayValue: newDayValue,
        siteSessions: updatedSessions
      };
    });
  };

  // When admin selects Day Value in Edit Attendance Modal, auto-convert shift timings
  const handleEditDayValueChange = (newDayValue) => {
    const slot = getTimeSlotForDayValue(newDayValue);
    setEditFormData(prev => ({
      ...prev,
      dayValue: newDayValue,
      ...(slot ? { inTime: slot.inTime, outTime: slot.outTime } : {})
    }));
  };

  // Save new attendance
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!formData.userId) {
      setApiError('Please select an employee.');
      return;
    }

    if (!formData.date) {
      setApiError('Please choose an attendance date.');
      return;
    }

    setSaving(true);
    setApiError('');

    try {
      // Format time strings (e.g. 09:00 -> 09:00 AM)
      const formatTimeAmPm = (tStr) => {
        if (!tStr) return '--:--';
        if (tStr.includes('AM') || tStr.includes('PM')) return tStr;
        const [h, m] = tStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${String(displayH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
      };

      const sitesPayload = formData.siteSessions.map(sess => {
        // Resolve dbId if string
        let sId = sess.siteId;
        const matched = sites.find(s => s.id === sId || s.dbId === sId || s.siteRef === sId);
        if (matched) sId = matched.dbId || matched.id;

        return {
          siteId: sId,
          inTime: formatTimeAmPm(sess.inTime),
          outTime: formatTimeAmPm(sess.outTime)
        };
      });

      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          date: formData.date,
          dayValue: parseFloat(formData.dayValue) || 1.0,
          status: formData.status,
          notes: formData.notes,
          sites: sitesPayload
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to save attendance record.');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      const savedDate = formData.date;
      setDateFilter(savedDate);
      setShowAllDates(false);
      setSuccessMessage(`Attendance saved for ${savedDate}! Displaying records for this date.`);
      setTimeout(() => setSuccessMessage(''), 6000);
      fetchData(savedDate, false);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setApiError('Server error while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Add new empty worker row to bulk grid
  const handleAddBulkRow = () => {
    setBulkRows(prev => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        userId: '',
        siteId: '',
        dayValue: '1.0',
        inTime: '09:00',
        outTime: '18:00',
        dailyRate: 0,
        notes: ''
      }
    ]);
  };

  // Remove a worker row from bulk grid
  const handleRemoveBulkRow = (rowId) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Bulk Grid Keyboard Focus & Navigation helpers
  const focusBulkCell = (rowIdx, colIdx) => {
    const el = document.getElementById(`bulk-cell-${rowIdx}-${colIdx}`);
    if (el) {
      el.focus();
      if (typeof el.select === 'function') {
        el.select();
      }
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleBulkNavigate = (rowIdx, colIdx, direction) => {
    if (direction === 'up') {
      if (rowIdx > 0) {
        focusBulkCell(rowIdx - 1, colIdx);
      }
    } else if (direction === 'down') {
      if (rowIdx < bulkRows.length - 1) {
        focusBulkCell(rowIdx + 1, colIdx);
      }
    } else if (direction === 'left') {
      if (colIdx > 0) {
        focusBulkCell(rowIdx, colIdx - 1);
      }
    } else if (direction === 'right') {
      if (colIdx < 2) {
        focusBulkCell(rowIdx, colIdx + 1);
      }
    }
  };

  const handleBulkEnterNext = (rowIdx, colIdx) => {
    if (colIdx === 0) {
      // From Employee -> Move to Site
      focusBulkCell(rowIdx, 1);
    } else if (colIdx === 1) {
      // From Site -> Move to Day Value
      focusBulkCell(rowIdx, 2);
    } else if (colIdx === 2) {
      // From Day Value (last field!)
      if (rowIdx < bulkRows.length - 1) {
        focusBulkCell(rowIdx + 1, 0);
      } else {
        // Last row! Add a new blank row and focus its employee cell
        handleAddBulkRow();
        setTimeout(() => {
          focusBulkCell(rowIdx + 1, 0);
        }, 50);
      }
    }
  };

  // Pre-load all company employees into the bulk grid
  const handleLoadAllWorkers = () => {
    if (!employees || employees.length === 0) return;
    const defaultSite = bulkDefaultSite || (sites.length > 0 ? (sites[0].dbId || sites[0].id) : '');
    const newRows = employees.map((emp, i) => ({
      id: String(Date.now() + i),
      userId: emp.dbId || emp.id,
      siteId: defaultSite,
      dayValue: '1.0',
      inTime: '09:00',
      outTime: '18:00',
      dailyRate: Number(emp.dailySalary || 0),
      notes: ''
    }));
    setBulkRows(newRows);
  };

  // Update a single field in a bulk row with automatic dayValue <-> timings & salary sync
  const handleBulkRowChange = (rowId, field, value) => {
    setBulkRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;

      if (field === 'userId') {
        const emp = employees.find(e => String(e.dbId || e.id) === String(value));
        const rate = Number(emp?.dailySalary || 0);
        return { ...r, userId: value, dailyRate: rate };
      }

      if (field === 'dayValue') {
        const slot = getTimeSlotForDayValue(value);
        return {
          ...r,
          dayValue: value,
          ...(slot ? { inTime: slot.inTime, outTime: slot.outTime } : {})
        };
      }

      return { ...r, [field]: value };
    }));
  };

  // Apply chosen site to all rows in bulk grid
  const handleApplyDefaultSite = (siteId) => {
    setBulkDefaultSite(siteId);
    setBulkRows(prev => prev.map(r => ({ ...r, siteId })));
  };

  // Apply chosen day value to all rows in bulk grid (with auto-timings conversion)
  const handleApplyDefaultDayValue = (dayVal) => {
    const slot = getTimeSlotForDayValue(dayVal);
    setBulkRows(prev => prev.map(r => ({
      ...r,
      dayValue: dayVal,
      ...(slot ? { inTime: slot.inTime, outTime: slot.outTime } : {})
    })));
  };

  // Save Bulk Attendance to backend API
  const handleSaveBulkAttendance = async (e) => {
    e.preventDefault();
    if (!bulkDate) {
      setApiError('Please select an attendance date.');
      return;
    }

    if (!bulkRows || bulkRows.length === 0) {
      setApiError('Please add at least one employee row.');
      return;
    }

    const emptyEmp = bulkRows.find(r => !r.userId);
    if (emptyEmp) {
      setApiError('Please select a worker for every row, or remove unused rows.');
      return;
    }

    const emptySite = bulkRows.find(r => !r.siteId);
    if (emptySite) {
      setApiError('Please select an assigned site for every row, or remove unused rows.');
      return;
    }

    setSaving(true);
    setApiError('');

    try {
      const formatTimeAmPm = (tStr) => {
        if (!tStr) return '--:--';
        if (tStr.includes('AM') || tStr.includes('PM')) return tStr;
        const [h, m] = tStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${String(displayH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
      };

      // Pre-process bulkRows by userId to apply contractor Hajeri timing rules
      const userRowsMap = new Map();
      bulkRows.forEach(r => {
        const uId = Number(r.userId);
        if (!userRowsMap.has(uId)) userRowsMap.set(uId, []);
        userRowsMap.get(uId).push(r);
      });

      for (const [uId, uRows] of userRowsMap.entries()) {
        if (uRows.length === 2) {
          const v1 = parseFloat(uRows[0].dayValue) || 1.0;
          const v2 = parseFloat(uRows[1].dayValue) || 0.5;

          if (v1 >= 1.0 && v2 <= 0.5) {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '18:00';
            uRows[1].inTime = '18:00';
            uRows[1].outTime = '21:00';
          } else if (v1 <= 0.5 && v2 >= 1.0) {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '13:00';
            uRows[1].inTime = '14:00';
            uRows[1].outTime = '21:00';
          } else if (v1 <= 0.5 && v2 <= 0.5) {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '13:00';
            uRows[1].inTime = '14:00';
            uRows[1].outTime = '18:00';
          } else if (v1 >= 1.0 && v2 >= 1.0) {
            uRows[0].inTime = '06:00';
            uRows[0].outTime = '14:00';
            uRows[1].inTime = '14:00';
            uRows[1].outTime = '21:00';
          }
        } else if (uRows.length === 1) {
          const v = parseFloat(uRows[0].dayValue) || 1.0;
          if (v === 1.5) {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '21:00';
          } else if (v === 2.0) {
            uRows[0].inTime = '06:00';
            uRows[0].outTime = '21:00';
          } else if (v <= 0.5) {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '13:00';
          } else {
            uRows[0].inTime = '09:00';
            uRows[0].outTime = '18:00';
          }
        }
      }

      const records = bulkRows.map(r => {
        const uId = Number(r.userId);
        const dVal = parseFloat(r.dayValue) || 1.0;
        const inTimeVal = r.inTime || '09:00';
        const outTimeVal = r.outTime || '18:00';

        const inTimeStr = formatTimeAmPm(inTimeVal);
        const outTimeStr = formatTimeAmPm(outTimeVal);
        const { hours } = calculateHoursAndDayValue(inTimeVal, outTimeVal);

        let sId = r.siteId;
        const matched = sites.find(s => s.id === sId || s.dbId === sId || s.siteRef === sId);
        if (matched) sId = matched.dbId || matched.id;

        return {
          userId: uId,
          siteId: sId ? Number(sId) : null,
          inTime: inTimeStr,
          outTime: outTimeStr,
          workHours: hours,
          dayValue: dVal,
          status: 'Verified',
          notes: r.notes || ''
        };
      });

      const res = await fetch(`${API_BASE}/attendance/bulk-mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: bulkDate,
          records
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to save bulk attendance.');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      setDateFilter(bulkDate);
      setShowAllDates(false);
      setSuccessMessage(`Successfully saved attendance for ${data.count || records.length} worker(s) on ${bulkDate}!`);
      setTimeout(() => setSuccessMessage(''), 6000);
      fetchData(bulkDate, false);
    } catch (err) {
      console.error('Error in handleSaveBulkAttendance:', err);
      setApiError('Server error while saving bulk attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (log) => {
    // Parse time to HH:MM format for <input type="time">
    const parseToTimeInput = (tStr) => {
      if (!tStr || tStr === '--:--' || tStr === 'GIFT' || tStr === 'BONUS') return '09:00';
      try {
        const isPm = tStr.toUpperCase().includes('PM');
        const clean = tStr.replace(/(AM|PM)/gi, '').trim();
        const parts = clean.split(':');
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || '0', 10);
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } catch {
        return '09:00';
      }
    };

    const isBonusRecord = Boolean(log.isBonus || log.inTime === 'GIFT' || log.outTime === 'BONUS');

    setEditFormData({
      id: log.id,
      employeeName: log.name,
      empId: log.empId,
      userId: log.userId,
      date: log.attendanceDate,
      siteId: log.siteId || (sites.length > 0 ? (sites[0].dbId || sites[0].id) : ''),
      inTime: parseToTimeInput(log.inTime),
      outTime: parseToTimeInput(log.outTime),
      dayValue: String(log.dayValue !== undefined && log.dayValue !== null ? log.dayValue : '1.0'),
      dailyRate: Number(log.dailyRate || 1000),
      status: log.status || 'Approved',
      notes: log.notes || '',
      isBonus: isBonusRecord
    });

    setApiError('');
    setShowEditModal(true);
  };

  // Save Edit Attendance
  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');

    try {
      const formatTimeAmPm = (tStr) => {
        if (!tStr) return '--:--';
        if (tStr.includes('AM') || tStr.includes('PM')) return tStr;
        const [h, m] = tStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${String(displayH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
      };

      let sId = editFormData.siteId;
      const matched = sites.find(s => s.id === sId || s.dbId === sId || s.siteRef === sId);
      if (matched) sId = matched.dbId || matched.id;

      const dVal = parseFloat(editFormData.dayValue);

      const res = await fetch(`${API_BASE}/attendance/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editFormData.userId ? Number(editFormData.userId) : undefined,
          siteId: editFormData.isBonus && !sId ? null : sId,
          attendanceDate: editFormData.date,
          inTime: editFormData.isBonus ? 'GIFT' : formatTimeAmPm(editFormData.inTime),
          outTime: editFormData.isBonus ? 'BONUS' : formatTimeAmPm(editFormData.outTime),
          dayValue: !isNaN(dVal) ? dVal : 1.0,
          status: editFormData.status,
          notes: editFormData.notes
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to update attendance record.');
        setSaving(false);
        return;
      }

      setShowEditModal(false);
      const updatedDate = editFormData.date;
      setDateFilter(updatedDate);
      setShowAllDates(false);
      setSuccessMessage('Attendance entry updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData(updatedDate, false);
    } catch (err) {
      console.error('Error updating attendance:', err);
      setApiError('Server error while updating attendance.');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // Group / Date Edit Attendance Handlers
  // ==========================================================
  const handleOpenBulkEditModal = async (initialDate) => {
    const targetDate = initialDate || dateFilter || getTodayStr();
    setBulkEditDate(targetDate);
    setBulkEditNewDate(targetDate);
    setBulkEditDeletedIds([]);
    setApiError('');
    setShowBulkEditModal(true);
    await loadBulkEditDataForDate(targetDate);
  };

  const loadBulkEditDataForDate = async (targetDate) => {
    try {
      setBulkEditLoading(true);
      const res = await fetch(`${API_BASE}/attendance?date=${targetDate}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.attendance) && data.attendance.length > 0) {
        const rows = data.attendance.map((log) => {
          const emp = employees.find(e => 
            String(e.dbId) === String(log.userId) || 
            String(e.id) === String(log.userId) || 
            String(e.empCode) === String(log.empId) ||
            ((e.name || e.fullName) && log.name && (e.name || e.fullName).trim().toLowerCase() === log.name.trim().toLowerCase())
          );
          const dailyRate = Number(log.dailyRate || emp?.dailySalary || 0);
          const empName = log.name || log.employeeName || (emp ? (emp.name || emp.fullName) : '');
          const site = sites.find(s => 
            String(s.dbId) === String(log.siteId) || 
            String(s.id) === String(log.siteId) || 
            String(s.siteRef) === String(log.siteRef) ||
            ((s.customerName || s.name) && log.customerName && (s.customerName || s.name).trim().toLowerCase() === log.customerName.trim().toLowerCase())
          );
          const siteName = log.customerName || log.siteName || (site ? (site.customerName || site.name) : '');
          return {
            id: log.id,
            userId: String(log.userId || (emp ? (emp.dbId || emp.id) : '')),
            employeeName: empName,
            siteId: String(log.siteId || (site ? (site.dbId || site.id) : '')),
            siteName: siteName,
            dayValue: String(log.dayValue !== undefined && log.dayValue !== null ? log.dayValue : '1.0'),
            dailyRate: dailyRate,
            status: log.status || 'Approved',
            notes: log.notes || ''
          };
        });
        setBulkEditRows(rows);
      } else {
        const defaultSite = sites.length > 0 ? String(sites[0].dbId || sites[0].id) : '';
        const defaultSiteName = sites.length > 0 ? (sites[0].customerName || sites[0].name || '') : '';
        setBulkEditRows([
          {
            id: `new_${Date.now()}`,
            userId: '',
            employeeName: '',
            siteId: defaultSite,
            siteName: defaultSiteName,
            dayValue: '1.0',
            dailyRate: 0,
            status: 'Approved',
            notes: ''
          }
        ]);
      }
    } catch (err) {
      console.error('Error loading attendance for date:', err);
      setApiError(`Failed to load attendance records for ${targetDate}`);
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleBulkEditDateChange = async (newDate) => {
    setBulkEditDate(newDate);
    setBulkEditNewDate(newDate);
    setBulkEditDeletedIds([]);
    await loadBulkEditDataForDate(newDate);
  };

  const handleAddBulkEditRow = () => {
    const defaultSite = sites.length > 0 ? String(sites[0].dbId || sites[0].id) : '';
    const defaultSiteName = sites.length > 0 ? (sites[0].customerName || sites[0].name || '') : '';
    setBulkEditRows(prev => [
      ...prev,
      {
        id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: '',
        employeeName: '',
        siteId: defaultSite,
        siteName: defaultSiteName,
        dayValue: '1.0',
        dailyRate: 0,
        status: 'Approved',
        notes: ''
      }
    ]);
  };

  const handleRemoveBulkEditRow = (rowId) => {
    if (typeof rowId === 'number' || (!String(rowId).startsWith('new_') && !isNaN(Number(rowId)))) {
      setBulkEditDeletedIds(prev => [...prev, Number(rowId)]);
    }
    setBulkEditRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Bulk Edit Grid Keyboard Focus & Navigation helpers
  const focusBulkEditCell = (rowIdx, colIdx) => {
    const el = document.getElementById(`bulkedit-cell-${rowIdx}-${colIdx}`);
    if (el) {
      el.focus();
      if (typeof el.select === 'function') {
        el.select();
      }
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleBulkEditNavigate = (rowIdx, colIdx, direction) => {
    if (direction === 'up') {
      if (rowIdx > 0) {
        focusBulkEditCell(rowIdx - 1, colIdx);
      }
    } else if (direction === 'down') {
      if (rowIdx < bulkEditRows.length - 1) {
        focusBulkEditCell(rowIdx + 1, colIdx);
      }
    } else if (direction === 'left') {
      if (colIdx > 0) {
        focusBulkEditCell(rowIdx, colIdx - 1);
      }
    } else if (direction === 'right') {
      if (colIdx < 3) {
        focusBulkEditCell(rowIdx, colIdx + 1);
      }
    }
  };

  const handleBulkEditEnterNext = (rowIdx, colIdx) => {
    if (colIdx === 0) {
      focusBulkEditCell(rowIdx, 1);
    } else if (colIdx === 1) {
      focusBulkEditCell(rowIdx, 2);
    } else if (colIdx === 2) {
      focusBulkEditCell(rowIdx, 3);
    } else if (colIdx === 3) {
      if (rowIdx < bulkEditRows.length - 1) {
        focusBulkEditCell(rowIdx + 1, 0);
      } else {
        handleAddBulkEditRow();
        setTimeout(() => {
          focusBulkEditCell(rowIdx + 1, 0);
        }, 50);
      }
    }
  };

  const handleBulkEditRowChange = (rowId, field, value) => {
    setBulkEditRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;

      if (field === 'userId') {
        const emp = employees.find(e => String(e.dbId) === String(value) || String(e.id) === String(value) || String(e.empCode) === String(value));
        const rate = Number(emp?.dailySalary || 0);
        const name = emp ? (emp.name || emp.fullName) : '';
        return { ...r, userId: value, employeeName: name, dailyRate: rate };
      }

      if (field === 'siteId') {
        const site = sites.find(s => String(s.dbId) === String(value) || String(s.id) === String(value) || String(s.siteRef) === String(value) || String(s.siteCode) === String(value));
        const sName = site ? (site.customerName || site.name) : '';
        return { ...r, siteId: value, siteName: sName };
      }

      if (field === 'dayValue') {
        return {
          ...r,
          dayValue: value
        };
      }

      return { ...r, [field]: value };
    }));
  };

  const handleSaveBulkEdit = async (e) => {
    e.preventDefault();
    if (!bulkEditDate) {
      setApiError('Please select an attendance date to edit.');
      return;
    }

    if (bulkEditRows.length === 0 && bulkEditDeletedIds.length === 0) {
      setApiError('No attendance records to save.');
      return;
    }

    const emptyWorker = bulkEditRows.find(r => !r.userId);
    if (emptyWorker) {
      setApiError('Please select a worker for every row, or remove unused rows.');
      return;
    }

    setSaving(true);
    setApiError('');

    try {
      const recordsPayload = bulkEditRows.map(r => {
        const dVal = parseFloat(r.dayValue) || 1.0;
        const slot = getTimeSlotForDayValue(r.dayValue);
        const inTimeStr = slot ? formatTimeAmPm(slot.inTime) : '09:00 AM';
        const outTimeStr = slot ? formatTimeAmPm(slot.outTime) : '06:00 PM';
        const { hours } = calculateHoursAndDayValue(slot ? slot.inTime : '09:00', slot ? slot.outTime : '18:00');

        let sId = r.siteId;
        const matched = sites.find(s => s.id === sId || s.dbId === sId || s.siteRef === sId);
        if (matched) sId = matched.dbId || matched.id;

        return {
          id: r.id,
          userId: Number(r.userId),
          siteId: sId ? Number(sId) : null,
          inTime: inTimeStr,
          outTime: outTimeStr,
          workHours: hours,
          dayValue: dVal,
          status: 'Approved',
          notes: r.notes || ''
        };
      });

      const res = await fetch(`${API_BASE}/attendance/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalDate: bulkEditDate,
          newDate: bulkEditNewDate || bulkEditDate,
          records: recordsPayload,
          deletedIds: bulkEditDeletedIds
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to update attendance records.');
        setSaving(false);
        return;
      }

      setShowBulkEditModal(false);
      const finalDate = bulkEditNewDate || bulkEditDate;
      setDateFilter(finalDate);
      setShowAllDates(false);
      setSuccessMessage(data.message || `Successfully updated attendance records for ${finalDate}!`);
      setTimeout(() => setSuccessMessage(''), 6000);
      window.dispatchEvent(new Event('attendance-changed'));
      fetchData(finalDate, false);
    } catch (err) {
      console.error('Error saving bulk edit attendance:', err);
      setApiError('Server error while saving attendance changes.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Attendance
  const handleDeleteAttendance = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to delete attendance record');
        return;
      }

      setAttendanceLogs(prev => prev.filter(log => log.id !== id));
      setDeleteConfirmId(null);
      setSuccessMessage('Attendance record removed successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting attendance:', err);
      alert('Network error while deleting attendance.');
    }
  };

  // Approve Attendance (Accept shift & add to employee worked days and salary)
  const handleApproveAttendance = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Attendance approved successfully! Added to employee worked days & salary.');
        setTimeout(() => setSuccessMessage(''), 6000);
        window.dispatchEvent(new Event('attendance-changed'));
        fetchData();
      } else {
        alert(data.message || 'Failed to approve attendance');
      }
    } catch (err) {
      console.error('Error approving attendance:', err);
      alert('Network error while approving attendance.');
    }
  };

  // Reject Attendance
  const handleRejectAttendance = async (id) => {
    const confirm = window.confirm('Are you sure you want to reject this attendance record?');
    if (!confirm) return;
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Attendance rejected.');
        setTimeout(() => setSuccessMessage(''), 5000);
        window.dispatchEvent(new Event('attendance-changed'));
        fetchData();
      } else {
        alert(data.message || 'Failed to reject attendance');
      }
    } catch (err) {
      console.error('Error rejecting attendance:', err);
      alert('Network error while rejecting attendance.');
    }
  };

  // Bulk Approve all Pending Attendance
  const handleBulkApprove = async () => {
    const pendingIds = filteredLogs.filter(l => l.status === 'Pending Approval').map(l => l.id);
    if (pendingIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/attendance/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: pendingIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || `Successfully approved ${pendingIds.length} attendance records!`);
        setTimeout(() => setSuccessMessage(''), 6000);
        window.dispatchEvent(new Event('attendance-changed'));
        fetchData();
      } else {
        alert(data.message || 'Failed to bulk approve attendance');
      }
    } catch (err) {
      console.error('Error in bulkApprove:', err);
      alert('Network error while approving attendance.');
    }
  };

  // Filter logs locally by search and site filter
  const filteredLogs = attendanceLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (log.name && log.name.toLowerCase().includes(term)) ||
      (log.empId && log.empId.toLowerCase().includes(term)) ||
      (log.siteName && log.siteName.toLowerCase().includes(term)) ||
      (log.siteRef && log.siteRef.toLowerCase().includes(term)) ||
      (log.notes && log.notes.toLowerCase().includes(term));

    const matchesSite = siteFilter === 'All' ||
      String(log.siteId) === String(siteFilter) ||
      log.siteRef === siteFilter;

    return matchesSearch && matchesSite;
  });

  // Pending approval counts
  const pendingLogs = filteredLogs.filter(l => l.status === 'Pending Approval');
  const pendingLogsCount = pendingLogs.length;

  // Calculate summary stats - ONLY count Approved and Verified records in totalDaysLogged
  const approvedLogs = filteredLogs.filter(l => l.status === 'Approved' || l.status === 'Verified');
  const totalDaysLogged = approvedLogs.reduce((acc, log) => acc + (parseFloat(log.dayValue) || 0), 0);
  const uniqueSitesCount = new Set(filteredLogs.map(l => l.siteId).filter(Boolean)).size;

  return (
    <main className="dashboard-content" style={{ padding: '24px 30px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* Toast Alert Messages */}
      {successMessage && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '18px', color: '#059669' }}></i>
          <span>{successMessage}</span>
        </div>
      )}

      {apiError && !showAddModal && !showEditModal && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '18px', color: '#DC2626' }}></i>
          <span>{apiError}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '22px'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)' }}>
            Attendance
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7D6C5E' }}>
            Daily check-ins & shifts
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quick Date Switcher: All Dates, Today, Date Picker */}
          <button
            onClick={() => {
              setShowAllDates(true);
              fetchData(null, true);
            }}
            style={{
              padding: '9px 14px',
              border: showAllDates ? '2px solid var(--gold, #A56A30)' : '1px solid #D1D5DB',
              borderRadius: '7px',
              background: showAllDates ? 'var(--gold-bg, rgba(165, 106, 48, 0.12))' : '#fff',
              color: showAllDates ? 'var(--gold, #A56A30)' : '#374151',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-layer-group"></i> All Dates
          </button>

          {/* Last Attendance Button */}
          <button
            onClick={() => {
              const target = latestDate || getYesterdayStr();
              setDateFilter(target);
              setShowAllDates(false);
              fetchData(target, false);
            }}
            title={latestDate ? `Show last completed attendance from ${formatToDMY(latestDate)}` : 'Show last attendance'}
            style={{
              padding: '9px 14px',
              border: (!showAllDates && (dateFilter === latestDate || (!latestDate && dateFilter === getYesterdayStr()))) ? '2px solid #5C3D24' : '1px solid #D1C2AF',
              borderRadius: '7px',
              background: (!showAllDates && (dateFilter === latestDate || (!latestDate && dateFilter === getYesterdayStr()))) ? '#F3EDE6' : '#fff',
              color: (!showAllDates && (dateFilter === latestDate || (!latestDate && dateFilter === getYesterdayStr()))) ? '#5C3D24' : '#5C4E43',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>
              {latestDate && isYesterday(latestDate) ? 'Yesterday' : 'Last Attendance'}
              {latestDate ? ` (${formatToDMY(latestDate)})` : ''}
            </span>
          </button>

          {/* Today Button */}
          <button
            onClick={() => {
              const today = getTodayStr();
              setDateFilter(today);
              setShowAllDates(false);
              fetchData(today, false);
            }}
            style={{
              padding: '9px 14px',
              border: (!showAllDates && dateFilter === getTodayStr() && (dateFilter !== latestDate || showAllDates)) ? '2px solid #5C3D24' : '1px solid #D1C2AF',
              borderRadius: '7px',
              background: (!showAllDates && dateFilter === getTodayStr() && (dateFilter !== latestDate || showAllDates)) ? '#F3EDE6' : '#fff',
              color: (!showAllDates && dateFilter === getTodayStr() && (dateFilter !== latestDate || showAllDates)) ? '#5C3D24' : '#5C4E43',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-calendar-day"></i> Today
          </button>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setShowAllDates(false);
              fetchData(e.target.value, false);
            }}
            style={{
              padding: '8px 12px',
              border: (!showAllDates && dateFilter !== getTodayStr()) ? '2px solid var(--gold, #A56A30)' : '1px solid #D1C2AF',
              borderRadius: '7px',
              outline: 'none',
              fontSize: '13px',
              background: '#fff',
              fontWeight: '600',
              color: '#111827'
            }}
          />

          <button
            onClick={() => handleOpenAddModal('single')}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'var(--gold, #4A2C17)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(74, 44, 23, 0.28)'
            }}
          >
            <i className="fa-solid fa-plus" style={{ color: '#FFFFFF', fontSize: '13px' }}></i>
            Add Attendance
          </button>

          <button
            onClick={() => handleOpenBulkEditModal()}
            title="Edit all attendance records for a specific date in one group sheet"
            style={{
              padding: '9px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: '#FFFFFF',
              color: 'var(--gold, #4A2C17)',
              border: '1.5px solid var(--gold, #4A2C17)',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(74, 44, 23, 0.12)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--gold, #4A2C17)', fontSize: '13px' }}></i>
            Edit Attendance
          </button>
        </div>
      </div>

      {/* Pending Approval Alert Banner */}
      {pendingLogsCount > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px'
            }}>
              <i className="fa-solid fa-bell"></i>
            </div>
            <div>
              <div style={{ fontWeight: '800', color: '#92400E', fontSize: '14px' }}>
                {pendingLogsCount} {t('pendingApprovalsCount') || 'Attendance Approval Requests Pending'}
              </div>
              <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                Workers have punched OUT. Review below and approve to count into worked days and monthly salary.
              </div>
            </div>
          </div>
          <button
            onClick={handleBulkApprove}
            style={{
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
            }}
          >
            <i className="fa-solid fa-check-double"></i> {t('approveAll') || 'Approve All'} ({pendingLogsCount})
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        {/* Card 1: Logged */}
        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #D1C2AF',
          boxShadow: '0 1px 3px rgba(100, 70, 40, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(74, 44, 23, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold, #4A2C17)',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-clipboard-user"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Logged
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #4A2C17)', marginTop: '2px' }}>
              {filteredLogs.length}
            </div>
          </div>
        </div>

        {/* Card 2: Total Days Approved */}
        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #D1C2AF',
          boxShadow: '0 1px 3px rgba(100, 70, 40, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(74, 44, 23, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold, #4A2C17)',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Days (Approved)
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #4A2C17)', marginTop: '2px' }}>
              {formatDays(totalDaysLogged)} Days
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div style={{
          background: pendingLogsCount > 0 ? '#FFFBEB' : '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: pendingLogsCount > 0 ? '1.5px solid #FCD34D' : '1px solid #D1C2AF',
          boxShadow: '0 1px 3px rgba(100, 70, 40, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: pendingLogsCount > 0 ? '#FEF3C7' : 'rgba(74, 44, 23, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: pendingLogsCount > 0 ? '#D97706' : 'var(--gold, #4A2C17)',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Approval
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: pendingLogsCount > 0 ? '#D97706' : 'var(--gold, #4A2C17)', marginTop: '2px' }}>
              {pendingLogsCount} Requests
            </div>
          </div>
        </div>

        {/* Card 4: Sites */}
        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #D1C2AF',
          boxShadow: '0 1px 3px rgba(100, 70, 40, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(74, 44, 23, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold, #4A2C17)',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sites
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #4A2C17)', marginTop: '2px' }}>
              {uniqueSitesCount} Sites
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '14px 18px',
        border: '1px solid #D1C2AF',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: '7px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF'
            }}></i>
          </div>

          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '7px',
              border: '1px solid #D1D5DB',
              outline: 'none',
              background: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            <option value="All">All Sites & Customers</option>
            {sites.map(s => {
              const sId = s.dbId || s.id;
              const sRef = s.siteRef || s.id;
              return (
                <option key={sId} value={sId}>
                  {sRef}: {s.customerName} ({s.location || 'Location'})
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
          Showing <strong>{filteredLogs.length}</strong> record{filteredLogs.length !== 1 ? 's' : ''}
          {showAllDates ? ' (Across all dates)' : ` for ${formatToDMY(dateFilter)}`}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="panel" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1.5px solid #D1C2AF',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{
              background: '#F3EDE6',
              borderBottom: '1.5px solid #D1C2AF',
              textAlign: 'left',
              color: '#5C4E43',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              <th style={{ padding: '12px 10px', width: '16%' }}>{t('employees') || 'Employee'}</th>
              <th style={{ padding: '12px 6px', width: '9%' }}>{t('dateCol') || 'Date'}</th>
              <th style={{ padding: '12px 6px', width: '15%' }}>{t('siteCol') || 'Site'}</th>
              <th style={{ padding: '12px 6px', width: '14%' }}>Timings</th>
              <th style={{ padding: '12px 4px', width: '6%', textAlign: 'center' }}>Hours</th>
              <th style={{ padding: '12px 4px', width: '8%', textAlign: 'center', whiteSpace: 'nowrap' }}>Day Value</th>
              <th style={{ padding: '12px 4px', width: '8%', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 4px', width: '9%', textAlign: 'center' }}>Day Salary</th>
              <th style={{ padding: '12px 6px', width: '15%', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>{t('actions') || 'Actions'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenGiftModal()}
                    title="Add Attendance Days (+4 Days, etc.)"
                    style={{
                      background: 'var(--gold, #A56A30)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--gold, #A56A30)', marginBottom: '10px' }}></i>
                  <div>Loading attendance records from database...</div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '45px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                  <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '12px' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>No attendance records found</div>
                  <p style={{ margin: '4px 0 16px 0', fontSize: '13px' }}>
                    {showAllDates ? 'No attendance has been logged yet.' : `No attendance recorded for ${formatToDMY(dateFilter)}. Click below to mark attendance or view all logged dates.`}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {latestDate && !showAllDates && dateFilter !== latestDate && (
                      <button
                        onClick={() => {
                          setShowAllDates(false);
                          setDateFilter(latestDate);
                          fetchData(latestDate, false);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: 'var(--gold, #A56A30)',
                          color: '#fff',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-clock-rotate-left"></i> View Last Attendance ({formatToDMY(latestDate)})
                      </button>
                    )}
                    {!showAllDates && (
                      <button
                        onClick={() => {
                          setShowAllDates(true);
                          fetchData(null, true);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: '#fff',
                          border: '1px solid #D1D5DB',
                          color: '#374151'
                        }}
                      >
                        <i className="fa-solid fa-layer-group"></i> View All Dates
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddModal}
                      className="btn-primary"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Mark Attendance Now
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isBonus = Boolean(log.isBonus || log.inTime === 'GIFT' || log.inTime === 'EXTRA' || log.outTime === 'BONUS' || log.outTime === 'ADDED');
                const bonusDays = parseFloat(log.dayValue) || 0;
                const bonusSalary = Math.round(bonusDays * Number(log.dailyRate || 1000));

                return (
                  <tr key={log.id} style={{
                    borderBottom: '1px solid #F3F4F6',
                    background: isBonus
                      ? 'rgba(165, 106, 48, 0.03)'
                      : (log.status === 'Pending Approval' ? 'rgba(254, 243, 199, 0.25)' : 'transparent')
                  }}>
                    {/* Employee info */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{log.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--gold, #A56A30)' }}>{log.empId}</span> · {log.role}
                        </div>
                      </div>
                    </td>

                    {/* Attendance Date (DD-MM-YYYY) */}
                    <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>
                        {formatToDMY(log.attendanceDate)}
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '11px', color: isBonus ? '#8C5521' : '#6B7280', marginTop: '2px', fontStyle: 'italic', fontWeight: isBonus ? '600' : 'normal' }}>
                          {log.notes}
                        </div>
                      )}
                    </td>

                    {/* Site / Customer */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      {isBonus ? (
                        <div>
                          <span style={{
                            background: '#F3EDE6',
                            color: '#8C5521',
                            border: '1px solid #D1C2AF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fa-solid fa-plus" style={{ fontSize: '10px' }}></i>
                            Extra Attendance
                          </span>
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                            Admin Added
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: '#111827',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={`${log.siteRef}: ${log.customerName}`}
                        >
                          <strong style={{ color: 'var(--gold, #A56A30)' }}>{log.siteRef}</strong>: {log.customerName}
                        </div>
                      )}
                    </td>

                    {/* Timings */}
                    <td style={{ padding: '12px 6px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {isBonus ? (
                        <span style={{ color: '#9CA3AF', fontSize: '11.5px', fontStyle: 'italic' }}>
                          Manual Entry
                        </span>
                      ) : (
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1F2937' }}>
                          {log.inTime || '--:--'} - {log.outTime === '--:--' ? 'Working...' : (log.outTime || '--:--')}
                        </div>
                      )}
                    </td>

                    {/* Hours */}
                    <td style={{ padding: '14px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: isBonus ? '#059669' : '#374151' }}>
                        {(() => {
                          if (isBonus) return '--';
                          let h = Number(log.workHours || 0);
                          if (h <= 0 && log.inTime && log.outTime && log.inTime !== '--:--' && log.outTime !== '--:--') {
                            h = calculateHoursAndDayValue(log.inTime, log.outTime).hours;
                          }
                          return h > 0 ? `${h % 1 === 0 ? h : h.toFixed(1)} hrs` : '--';
                        })()}
                      </div>
                    </td>

                    {/* Day Value */}
                    <td style={{ padding: '14px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isBonus ? (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-solid fa-plus" style={{ fontSize: '10px' }}></i>
                          {bonusDays} Day{bonusDays !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{
                          background: log.dayValue >= 1.0 ? '#ECFDF5' : (log.dayValue > 0 ? '#FEF3C7' : '#F3F4F6'),
                          color: log.dayValue >= 1.0 ? '#065F46' : (log.dayValue > 0 ? '#92400E' : '#6B7280'),
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          {log.valueText}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isBonus ? (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-solid fa-circle-check"></i> Approved
                        </span>
                      ) : log.status === 'Pending Approval' ? (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FCD34D',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-regular fa-clock"></i> Pending
                        </span>
                      ) : log.status === 'In Progress' ? (
                        <span style={{
                          background: '#EFF6FF',
                          color: '#1E40AF',
                          border: '1px solid #BFDBFE',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-solid fa-spinner fa-spin"></i> Working
                        </span>
                      ) : log.status === 'Rejected' ? (
                        <span style={{
                          background: '#FEF2F2',
                          color: '#991B1B',
                          border: '1px solid #FECACA',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-solid fa-xmark"></i> Rejected
                        </span>
                      ) : (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          <i className="fa-solid fa-circle-check"></i> Approved
                        </span>
                      )}
                    </td>

                    {/* Day Salary */}
                    <td style={{ padding: '14px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isBonus ? (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1.5px solid #10B981',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          +₹{bonusSalary.toLocaleString('en-IN')}
                        </span>
                      ) : (log.status === 'Approved' || log.status === 'Verified') ? (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          ₹{Math.round((parseFloat(log.dayValue) || 0) * Number(log.dailyRate || 1000)).toLocaleString('en-IN')}
                        </span>
                      ) : log.status === 'Pending Approval' ? (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px dashed #FCD34D',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }} title="Salary will be credited once Approved by Admin">
                          ₹{Math.round((parseFloat(log.dayValue) || 0) * Number(log.dailyRate || 1000)).toLocaleString('en-IN')}
                        </span>
                      ) : log.status === 'In Progress' ? (
                        <span style={{ color: '#6B7280', fontSize: '11px', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                          Working...
                        </span>
                      ) : (
                        <span style={{ color: '#DC2626', fontSize: '11.5px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          ₹0
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 4px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '3px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                        {log.status === 'Pending Approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveAttendance(log.id)}
                              title="Approve Attendance (Add to salary)"
                              style={{
                                background: '#059669',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '4px 7px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 2px rgba(5,150,105,0.25)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <i className="fa-solid fa-check"></i> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectAttendance(log.id)}
                              title="Reject Attendance"
                              style={{
                                background: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '5px',
                                padding: '4px 6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(log)}
                          title="Edit Attendance"
                          style={{
                            background: '#fff',
                            border: '1px solid #D1D5DB',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            color: '#374151',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--gold, #A56A30)' }}></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(log.id)}
                          title="Delete Attendance"
                          style={{
                            background: '#fff',
                            border: '1px solid #FCA5A5',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            color: '#DC2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================== */}
      {/* ADD / MARK ATTENDANCE MODAL (With Multi-Site '+' Slot Feature) */}
      {/* ========================================================== */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: attendanceMode === 'bulk' ? '980px' : (attendanceMode === 'days' ? '480px' : '680px'),
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'max-width 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px 14px 24px',
              borderBottom: '1px solid #E5E7EB',
              background: '#FAF8F5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Row 1: Title, Subtitle and Anchored Top-Right Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1F1A17', letterSpacing: '-0.01em' }}>
                    {attendanceMode === 'bulk'
                      ? 'Bulk Daily Attendance'
                      : (attendanceMode === 'days' ? 'Add Attendance Days' : 'Mark Daily Attendance')}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#5C4E43', lineHeight: '1.4' }}>
                    {attendanceMode === 'bulk'
                      ? 'Mark attendance for multiple workers across sites with auto-calculated daily wages.'
                      : (attendanceMode === 'days'
                        ? 'Award extra or bonus attendance days (+1, +4 days) directly to worker salary.'
                        : 'Select employee, date, and site shifts. Use [+] if the worker worked at multiple sites.')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    lineHeight: '1',
                    color: '#8C7B6D',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1F1A17'; e.currentTarget.style.background = 'rgba(74, 44, 23, 0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8C7B6D'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Row 2: Mode Switcher Tabs (3 Switches: Single, Multiple, Add Days) */}
              <div style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                background: '#EAE3DA',
                borderRadius: '8px',
                padding: '3px',
                gap: '4px',
                maxWidth: '100%',
                overflowX: 'auto'
              }}>
                {/* Switch 1: Single Employee */}
                <button
                  type="button"
                  onClick={() => setAttendanceMode('single')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: attendanceMode === 'single' ? 'var(--gold, #4A2C17)' : 'transparent',
                    color: attendanceMode === 'single' ? '#FFFFFF' : '#5C4E43',
                    boxShadow: attendanceMode === 'single' ? '0 2px 6px rgba(74, 44, 23, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fa-solid fa-user" style={{ color: attendanceMode === 'single' ? '#FFFFFF' : '#8C7B6D' }}></i>
                  Single Employee
                </button>

                {/* Switch 2: Multiple Employees */}
                <button
                  type="button"
                  onClick={() => {
                    if (bulkRows.length === 0) {
                      setBulkRows([{
                        id: String(Date.now()),
                        userId: '',
                        siteId: '',
                        dayValue: formData.dayValue || '1.0',
                        inTime: '09:00',
                        outTime: '18:00',
                        dailyRate: 0,
                        notes: ''
                      }]);
                    }
                    setAttendanceMode('bulk');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: attendanceMode === 'bulk' ? 'var(--gold, #4A2C17)' : 'transparent',
                    color: attendanceMode === 'bulk' ? '#FFFFFF' : '#5C4E43',
                    boxShadow: attendanceMode === 'bulk' ? '0 2px 6px rgba(74, 44, 23, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fa-solid fa-users" style={{ color: attendanceMode === 'bulk' ? '#FFFFFF' : '#8C7B6D' }}></i>
                  Multiple Employees
                </button>

                {/* Switch 3: Add Days */}
                <button
                  type="button"
                  onClick={() => {
                    if (!giftFormData.userId) {
                      const defaultEmp = formData.userId || (employees.length > 0 ? employees[0].dbId : '');
                      setGiftFormData({
                        userId: defaultEmp,
                        bonusDays: '4',
                        date: dateFilter || getTodayStr(),
                        notes: 'Extra Attendance (+4 Days)'
                      });
                    }
                    setAttendanceMode('days');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: attendanceMode === 'days' ? 'var(--gold, #4A2C17)' : 'transparent',
                    color: attendanceMode === 'days' ? '#FFFFFF' : '#5C4E43',
                    boxShadow: attendanceMode === 'days' ? '0 2px 6px rgba(74, 44, 23, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ color: attendanceMode === 'days' ? '#FFFFFF' : '#8C7B6D' }}></i>
                  Add Days
                </button>
              </div>
            </div>

            {/* Modal Form Body - Single Employee Mode */}
            {attendanceMode === 'single' && (
              <form onSubmit={handleSaveAttendance} onKeyDown={handleFormKeyDown} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {apiError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '13px'
                  }}>
                    {apiError}
                  </div>
                )}

                {/* Row 1: Employee & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      Select Employee <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '7px',
                        border: '1px solid #D1D5DB',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    >
                      <option value="" disabled>-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.dbId} value={emp.dbId}>
                          {emp.name} ({emp.id}) · {emp.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      Attendance Date <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '7px',
                        border: '1px solid #D1D5DB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Dynamic Site Sessions Section with '+' Icon */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', marginRight: '6px' }}></i>
                      Site Shifts & Timings
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      Worked on another site today? Click <strong>+</strong>
                    </div>
                  </div>

                  {formData.siteSessions.map((session, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '10px',
                        alignItems: 'center',
                        background: '#fff',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        marginBottom: idx === formData.siteSessions.length - 1 ? '0' : '10px'
                      }}
                    >
                      {/* Site dropdown */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                          Site / Customer {formData.siteSessions.length > 1 ? `#${idx + 1}` : ''}
                        </label>
                        <select
                          value={session.siteId}
                          onChange={(e) => handleSessionChange(idx, 'siteId', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px',
                            outline: 'none',
                            background: '#fff'
                          }}
                        >
                          <option value="" disabled>-- Select Site --</option>
                          {sites.map(s => {
                            const sId = s.dbId || s.id;
                            const sRef = s.siteRef || s.id;
                            return (
                              <option key={sId} value={sId}>
                                {sRef}: {s.customerName} ({s.location || 'Location'})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* In Time */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#16A34A', marginBottom: '4px' }}>
                          IN Time
                        </label>
                        <input
                          type="time"
                          value={session.inTime}
                          onChange={(e) => handleSessionChange(idx, 'inTime', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Out Time */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>
                          OUT Time
                        </label>
                        <input
                          type="time"
                          value={session.outTime}
                          onChange={(e) => handleSessionChange(idx, 'outTime', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Actions (+ or -) */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '16px' }}>
                        {idx === formData.siteSessions.length - 1 && (
                          <button
                            type="button"
                            onClick={handleAddSiteSession}
                            title="Add Another Site for this Day"
                            style={{
                              background: 'var(--gold, #A56A30)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        )}

                        {formData.siteSessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSiteSession(idx)}
                            title="Remove this slot"
                            style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row 3: Day Value & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      Total Day Value
                    </label>
                    <DayValueCombobox
                      value={formData.dayValue}
                      onChange={(newVal) => handleAddDayValueChange(newVal)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                      Day Salary of that Day
                    </label>
                    <div style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #A7F3D0',
                      background: '#ECFDF5',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#065F46',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>₹{(() => {
                        const emp = employees.find(e => String(e.dbId || e.id) === String(formData.userId));
                        const rate = Number(emp?.dailySalary || 0);
                        const dVal = !isNaN(parseFloat(formData.dayValue)) ? parseFloat(formData.dayValue) : 1.0;
                        const salary = Math.round(dVal * rate);
                        return salary.toLocaleString('en-IN');
                      })()}</span>
                      <span style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>
                        {(() => {
                          const emp = employees.find(e => String(e.dbId || e.id) === String(formData.userId));
                          const rate = Number(emp?.dailySalary || 0);
                          return rate > 0 ? `(${formData.dayValue} Day × ₹${rate})` : 'Select worker';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Notes / Site Work Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wardrobe framing work, client verified..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      color: '#374151',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '7px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: 'var(--gold, #4A2C17)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(74, 44, 23, 0.25)'
                    }}
                  >
                    {saving ? (
                      <span><i className="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                    ) : (
                      <span><i className="fa-solid fa-check"></i> Save Attendance</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Form Body - Bulk Multiple Employees Mode */}
            {attendanceMode === 'bulk' && (
              <form onSubmit={handleSaveBulkAttendance} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {apiError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}>
                    {apiError}
                  </div>
                )}

                {/* Bulk Toolbar Strip */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {/* Attendance Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Attendance Date *
                    </label>
                    <input
                      type="date"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      required
                      style={{
                        padding: '7px 11px',
                        borderRadius: '6px',
                        border: '1.5px solid #D1D5DB',
                        fontSize: '13px',
                        fontWeight: '600',
                        outline: 'none',
                        color: '#111827',
                        background: '#fff'
                      }}
                    />
                  </div>

                  {/* Action Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleAddBulkRow}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '7px',
                        border: 'none',
                        background: 'var(--gold, #4A2C17)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(74, 44, 23, 0.25)'
                      }}
                    >
                      <i className="fa-solid fa-plus" style={{ color: '#FFFFFF' }}></i>
                      Add Row
                    </button>
                  </div>
                </div>

                {/* Bulk Employees Table */}
                <div style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  minHeight: '260px',
                  maxHeight: '460px',
                  overflowY: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ background: '#F9FAFB', position: 'sticky', top: 0, zIndex: 2, borderBottom: '1.5px solid #E5E7EB' }}>
                      <tr>
                        <th style={{ padding: '10px 10px', width: '38px', textAlign: 'center', color: '#6B7280', fontWeight: '700' }}>#</th>
                        <th style={{ padding: '10px 12px', width: '260px', color: '#374151', fontWeight: '700' }}>Employee *</th>
                        <th style={{ padding: '10px 12px', width: '280px', color: '#374151', fontWeight: '700' }}>Assigned Site *</th>
                        <th style={{ padding: '10px 12px', width: '180px', color: '#374151', fontWeight: '700' }}>Day Value (Hajeri)</th>
                        <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right', color: '#374151', fontWeight: '700' }}>Day Salary</th>
                        <th style={{ padding: '10px 8px', width: '42px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
                            <i className="fa-solid fa-users" style={{ fontSize: '28px', color: '#D1D5DB', marginBottom: '8px', display: 'block' }}></i>
                            No employees in list. Click <strong>"+ Add Row"</strong> above to add attendance.
                          </td>
                        </tr>
                      ) : (
                        bulkRows.map((row, idx) => {
                          const estSalary = Math.round((parseFloat(row.dayValue) || 0) * (row.dailyRate || 0));
                          return (
                            <tr
                              key={row.id}
                              style={{
                                borderBottom: '1px solid #F3F4F6',
                                background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                              }}
                            >
                              {/* Row Index */}
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#9CA3AF', fontWeight: '600' }}>
                                {idx + 1}
                              </td>

                              {/* Employee Select (Searchable & Editable Combobox) */}
                              <td style={{ padding: '8px 10px', position: 'relative' }}>
                                <EmployeeCombobox
                                  id={`bulk-cell-${idx}-0`}
                                  rowIndex={idx}
                                  colIndex={0}
                                  onNavigate={handleBulkNavigate}
                                  onEnterNext={handleBulkEnterNext}
                                  value={row.userId}
                                  employees={employees}
                                  onChange={(empId, empRate) => {
                                    handleBulkRowChange(row.id, 'userId', empId);
                                  }}
                                  openUpward={idx >= bulkRows.length - 2 && bulkRows.length > 2}
                                />
                              </td>

                              {/* Site Select (Searchable & Editable Combobox) */}
                              <td style={{ padding: '8px 10px', position: 'relative' }}>
                                <SiteCombobox
                                  id={`bulk-cell-${idx}-1`}
                                  rowIndex={idx}
                                  colIndex={1}
                                  onNavigate={handleBulkNavigate}
                                  onEnterNext={handleBulkEnterNext}
                                  value={row.siteId}
                                  sites={sites}
                                  onChange={(siteId) => {
                                    handleBulkRowChange(row.id, 'siteId', siteId);
                                  }}
                                  openUpward={idx >= bulkRows.length - 2 && bulkRows.length > 2}
                                />
                              </td>

                              {/* Day Value (Hajeri) - Searchable, Editable & Presets */}
                              <td style={{ padding: '8px 10px', position: 'relative', width: '175px' }}>
                                <DayValueCombobox
                                  id={`bulk-cell-${idx}-2`}
                                  rowIndex={idx}
                                  colIndex={2}
                                  onNavigate={handleBulkNavigate}
                                  onEnterNext={handleBulkEnterNext}
                                  value={row.dayValue}
                                  onChange={(newVal) => handleBulkRowChange(row.id, 'dayValue', newVal)}
                                  openUpward={idx >= bulkRows.length - 2 && bulkRows.length > 2}
                                />
                              </td>

                              {/* Day Salary (Auto-calculated) */}
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  background: '#F3F4F6',
                                  color: '#111827',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  ₹{estSalary.toLocaleString('en-IN')}
                                </span>
                              </td>

                              {/* Delete Row Action */}
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBulkRow(row.id)}
                                  disabled={bulkRows.length <= 1}
                                  title={bulkRows.length <= 1 ? 'At least one row required' : 'Remove row'}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: bulkRows.length <= 1 ? '#D1D5DB' : '#EF4444',
                                    cursor: bulkRows.length <= 1 ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    padding: '4px 6px'
                                  }}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bulk Summary & Submit Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '4px'
                }}>
                  {/* Summary Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '12px', color: '#4B5563' }}>
                      Workers: <strong style={{ color: '#111827', fontSize: '13px' }}>{bulkRows.length}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563' }}>
                      Total Hajeri: <strong style={{ color: 'var(--gold, #A56A30)', fontSize: '13px' }}>
                        {(() => {
                          const t = bulkRows.reduce((sum, r) => sum + (parseFloat(r.dayValue) || 0), 0);
                          return t % 1 === 0 ? `${t.toFixed(0)} Days` : `${parseFloat(t.toFixed(2))} Days`;
                        })()}
                      </strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563' }}>
                      Total Est. Wages: <strong style={{ color: '#166534', fontSize: '13px' }}>
                        ₹{bulkRows.reduce((sum, r) => sum + Math.round((parseFloat(r.dayValue) || 0) * (r.dailyRate || 0)), 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '7px',
                        border: '1px solid #D1D5DB',
                        background: '#fff',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving || bulkRows.length === 0}
                      className="btn-primary"
                      style={{
                        padding: '9px 22px',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: (saving || bulkRows.length === 0) ? 'not-allowed' : 'pointer',
                        background: 'var(--gold, #4A2C17)',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(74, 44, 23, 0.25)'
                      }}
                    >
                      {saving ? (
                        <span><i className="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                      ) : (
                        <span><i className="fa-solid fa-check" style={{ color: '#FFFFFF' }}></i> Save All Attendance ({bulkRows.length} Workers)</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Form 3: Add Extra Days (Bonus / Overtime Days) */}
            {attendanceMode === 'days' && (
              <form onSubmit={handleSaveGiftAttendance} onKeyDown={handleFormKeyDown} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {apiError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '13px'
                  }}>
                    {apiError}
                  </div>
                )}

                {/* Employee Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Select Employee *
                  </label>
                  <select
                    value={giftFormData.userId}
                    onChange={(e) => setGiftFormData({ ...giftFormData, userId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      fontWeight: '600',
                      color: '#111827'
                    }}
                  >
                    <option value="" disabled>-- Select Worker --</option>
                    {employees.map(e => {
                      const eId = e.dbId || e.id;
                      return (
                        <option key={eId} value={eId}>
                          {e.name} ({e.id}) — ₹{e.dailySalary || 1000}/day
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Attendance Date */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Attendance Date *
                  </label>
                  <input
                    type="date"
                    value={giftFormData.date}
                    onChange={(e) => setGiftFormData({ ...giftFormData, date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Days to Add */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Days to Add (+Days) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      placeholder="e.g. 4"
                      value={giftFormData.bonusDays}
                      onChange={(e) => setGiftFormData({ ...giftFormData, bonusDays: e.target.value })}
                      required
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '7px',
                        border: '1.5px solid #D1D5DB',
                        fontSize: '14px',
                        fontWeight: '700',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Days</span>
                  </div>
                  {(() => {
                    const emp = employees.find(e => String(e.dbId || e.id) === String(giftFormData.userId));
                    const rate = Number(emp?.dailySalary || 0);
                    const days = parseFloat(giftFormData.bonusDays) || 0;
                    if (rate > 0 && days > 0) {
                      return (
                        <div style={{ fontSize: '12.5px', color: 'var(--gold, #4A2C17)', fontWeight: '700', marginTop: '7px' }}>
                          +{days} Days × ₹{rate}/day = +₹{Math.round(days * rate).toLocaleString('en-IN')} added salary
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Notes / Reason */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Notes / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra performance incentive, Sunday work bonus, etc."
                    value={giftFormData.notes}
                    onChange={(e) => setGiftFormData({ ...giftFormData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      color: '#374151',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '7px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: 'var(--gold, #4A2C17)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(74, 44, 23, 0.25)'
                    }}
                  >
                    {saving ? (
                      <span><i className="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                    ) : (
                      <span><i className="fa-solid fa-plus"></i> Add +{giftFormData.bonusDays || 0} Days</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* EDIT ATTENDANCE MODAL (Full Admin Control) */}
      {/* ========================================================== */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F9FAFB'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary, #1F1A17)' }}>
                  {editFormData.isBonus ? 'Edit Extra Attendance Days' : 'Edit Attendance Record'}
                </h3>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                  Worker: <strong>{editFormData.employeeName}</strong> ({editFormData.empId})
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAttendance} onKeyDown={handleFormKeyDown} style={{ padding: '24px' }}>
              {apiError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  {apiError}
                </div>
              )}

              {/* Employee Selector (Reassign if needed) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Employee
                </label>
                <select
                  value={editFormData.userId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const emp = employees.find(empItem => String(empItem.dbId || empItem.id) === String(uId));
                    setEditFormData({
                      ...editFormData,
                      userId: uId,
                      employeeName: emp?.name || editFormData.employeeName,
                      empId: emp?.id || editFormData.empId,
                      dailyRate: Number(emp?.dailySalary || editFormData.dailyRate)
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#fff'
                  }}
                >
                  {employees.map(e => {
                    const eId = e.dbId || e.id;
                    return (
                      <option key={eId} value={eId}>
                        {e.name} ({e.id}) - {e.role} (₹{e.dailySalary || 1000}/day)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date & Site */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Site / Customer
                  </label>
                  <select
                    value={editFormData.siteId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, siteId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    {editFormData.isBonus && (
                      <option value="">🎁 Month-End Gift / Bonus Attendance</option>
                    )}
                    {sites.map(s => {
                      const sId = s.dbId || s.id;
                      const sRef = s.siteRef || s.id;
                      return (
                        <option key={sId} value={sId}>
                          {sRef}: {s.customerName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* IN & OUT Time */}
              {!editFormData.isBonus && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#16A34A', marginBottom: '6px' }}>
                        IN Time
                      </label>
                      <input
                        type="time"
                        value={editFormData.inTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          const calc = calculateHoursAndDayValue(val, editFormData.outTime);
                          setEditFormData(prev => ({
                            ...prev,
                            inTime: val,
                            dayValue: calc.dayValue
                          }));
                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '7px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#DC2626', marginBottom: '6px' }}>
                        OUT Time
                      </label>
                      <input
                        type="time"
                        value={editFormData.outTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          const calc = calculateHoursAndDayValue(editFormData.inTime, val);
                          setEditFormData(prev => ({
                            ...prev,
                            outTime: val,
                            dayValue: calc.dayValue
                          }));
                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '7px',
                          border: '1px solid #D1D5DB',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {editFormData.inTime && editFormData.outTime && (
                    <div style={{
                      margin: '0 0 14px 0',
                      padding: '7px 12px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      <span>
                        <i className="fa-regular fa-clock" style={{ marginRight: '5px' }}></i>
                        Duration: <strong>{calculateHoursAndDayValue(editFormData.inTime, editFormData.outTime).hours} hrs</strong>
                      </span>
                      <span style={{
                        background: '#DCFCE7',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #86EFAC',
                        fontWeight: '700'
                      }}>
                        Auto-assigned: {calculateHoursAndDayValue(editFormData.inTime, editFormData.outTime).dayValue} Day
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Day Value & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Day Value (Working Unit)
                  </label>
                    <DayValueCombobox
                      value={editFormData.dayValue}
                      onChange={(newVal) => handleEditDayValueChange(newVal)}
                    />
                  </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Approval Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      fontWeight: '700',
                      color: editFormData.status === 'Approved' ? '#065F46' : (editFormData.status === 'Pending Approval' ? '#92400E' : '#374151')
                    }}
                  >
                    <option value="Approved">Approved (Counts in salary)</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Day Salary Live Preview */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Calculated Day Salary
                </label>
                <div style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '7px',
                  border: '1px solid #A7F3D0',
                  background: '#ECFDF5',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#065F46',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>₹{(() => {
                    const rate = Number(editFormData.dailyRate || 0) || Number(employees.find(e => String(e.dbId || e.id) === String(editFormData.userId))?.dailySalary || 1000);
                    const dVal = !isNaN(parseFloat(editFormData.dayValue)) ? parseFloat(editFormData.dayValue) : 1.0;
                    const salary = Math.round(dVal * rate);
                    return salary.toLocaleString('en-IN');
                  })()}</span>
                  <span style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>
                    ({editFormData.dayValue} Day × ₹{Number(editFormData.dailyRate || 0) || Number(employees.find(e => String(e.dbId || e.id) === String(editFormData.userId))?.dailySalary || 1000)})
                  </span>
                </div>
              </div>

              {/* Remarks / Notes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '7px',
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Updating...' : 'Update Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ========================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================== */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1500,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 14px auto'
            }}>
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              Delete Attendance Entry?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6B7280' }}>
              This record will be permanently deleted from the database and will impact monthly salary calculations.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '7px',
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAttendance(deleteConfirmId)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '7px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* GROUP / DATE EDIT ATTENDANCE MODAL                         */}
      {/* ========================================================== */}
      {showBulkEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1120px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              background: '#FAF8F5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1F1A17', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--gold, #4A2C17)' }}></i>
                  Edit Attendance by Date
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#5C4E43' }}>
                  Select any date to view and edit all employee attendance records together, adjust sites, hajeri values, or change the attendance date.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#8C7B6D',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#1F1A17'; e.currentTarget.style.background = 'rgba(74, 44, 23, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8C7B6D'; e.currentTarget.style.background = 'transparent'; }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBulkEdit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {apiError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}>
                  {apiError}
                </div>
              )}

              {/* Date Selection & Fast-Tools Strip */}
              <div style={{
                background: '#FAF8F5',
                border: '1.5px solid #EAE0D2',
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  {/* Select Date to Edit */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#4A2C17', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.4px' }}>
                      <i className="fa-solid fa-calendar-day" style={{ marginRight: '5px', color: '#4A2C17' }}></i>
                      1. Select Date to Edit *
                    </label>
                    <input
                      type="date"
                      value={bulkEditDate}
                      onChange={(e) => handleBulkEditDateChange(e.target.value)}
                      required
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1.5px solid #D1C2AF',
                        fontSize: '13px',
                        fontWeight: '700',
                        outline: 'none',
                        color: '#4A2C17',
                        background: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  {/* Move/Shift Date To */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#4A2C17', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.4px' }}>
                      <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '5px', color: '#4A2C17' }}></i>
                      2. Shift Date to (Optional)
                    </label>
                    <input
                      type="date"
                      value={bulkEditNewDate}
                      onChange={(e) => setBulkEditNewDate(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: bulkEditNewDate !== bulkEditDate ? '2px solid #D97706' : '1.5px solid #D1C2AF',
                        fontSize: '13px',
                        fontWeight: '700',
                        outline: 'none',
                        color: bulkEditNewDate !== bulkEditDate ? '#B45309' : '#4A2C17',
                        background: bulkEditNewDate !== bulkEditDate ? '#FEF3C7' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Add Row Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAddBulkEditRow}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '7px',
                      border: 'none',
                      background: 'var(--gold, #4A2C17)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(74, 44, 23, 0.25)'
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Employee Row
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                minHeight: '260px',
                maxHeight: '440px',
                overflowY: 'auto'
              }}>
                {bulkEditLoading ? (
                  <div style={{ padding: '50px 20px', textAlign: 'center', color: '#4A2C17' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '26px', color: '#4A2C17' }}></i>
                    <div style={{ marginTop: '12px', fontWeight: '700', fontSize: '13px' }}>
                      Loading attendance records for {formatToDMY(bulkEditDate)}...
                    </div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ background: '#FAF8F5', position: 'sticky', top: 0, zIndex: 2, borderBottom: '1.5px solid #E5E7EB' }}>
                      <tr>
                        <th style={{ padding: '10px 10px', width: '38px', textAlign: 'center', color: '#4A2C17', fontWeight: '700' }}>#</th>
                        <th style={{ padding: '10px 12px', width: '260px', color: '#4A2C17', fontWeight: '700' }}>Employee *</th>
                        <th style={{ padding: '10px 12px', width: '280px', color: '#4A2C17', fontWeight: '700' }}>Assigned Site *</th>
                        <th style={{ padding: '10px 12px', width: '180px', color: '#4A2C17', fontWeight: '700' }}>Day Value (Hajeri) *</th>
                        <th style={{ padding: '10px 12px', width: '115px', textAlign: 'right', color: '#4A2C17', fontWeight: '700' }}>Day Salary</th>
                        <th style={{ padding: '10px 12px', minWidth: '150px', color: '#4A2C17', fontWeight: '700' }}>Notes</th>
                        <th style={{ padding: '10px 8px', width: '42px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkEditRows.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280' }}>
                            <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '28px', color: '#D1D5DB', marginBottom: '8px', display: 'block' }}></i>
                            No attendance records exist on <strong>{formatToDMY(bulkEditDate)}</strong>.
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={handleAddBulkEditRow}
                                style={{
                                  background: 'var(--gold, #4A2C17)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fa-solid fa-plus"></i> Add First Employee
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        bulkEditRows.map((row, idx) => {
                          const estSalary = Math.round((parseFloat(row.dayValue) || 0) * (row.dailyRate || 0));
                          return (
                            <tr
                              key={row.id}
                              style={{
                                borderBottom: '1px solid #F3F4F6',
                                background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                              }}
                            >
                              {/* Row Index */}
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#9CA3AF', fontWeight: '600' }}>
                                {idx + 1}
                              </td>

                              {/* Employee Select */}
                              <td style={{ padding: '8px 10px', position: 'relative' }}>
                                <EmployeeCombobox
                                  id={`bulkedit-cell-${idx}-0`}
                                  rowIndex={idx}
                                  colIndex={0}
                                  onNavigate={handleBulkEditNavigate}
                                  onEnterNext={handleBulkEditEnterNext}
                                  value={row.userId}
                                  employees={employees}
                                  fallbackText={row.employeeName}
                                  onChange={(empId, empRate) => {
                                    handleBulkEditRowChange(row.id, 'userId', empId);
                                  }}
                                  openUpward={idx >= bulkEditRows.length - 2 && bulkEditRows.length > 2}
                                />
                              </td>

                              {/* Site Select */}
                              <td style={{ padding: '8px 10px', position: 'relative' }}>
                                <SiteCombobox
                                  id={`bulkedit-cell-${idx}-1`}
                                  rowIndex={idx}
                                  colIndex={1}
                                  onNavigate={handleBulkEditNavigate}
                                  onEnterNext={handleBulkEditEnterNext}
                                  value={row.siteId}
                                  sites={sites}
                                  fallbackText={row.siteName}
                                  onChange={(siteId) => {
                                    handleBulkEditRowChange(row.id, 'siteId', siteId);
                                  }}
                                  openUpward={idx >= bulkEditRows.length - 2 && bulkEditRows.length > 2}
                                />
                              </td>

                              {/* Day Value (Hajeri) */}
                              <td style={{ padding: '8px 8px', position: 'relative' }}>
                                <DayValueCombobox
                                  id={`bulkedit-cell-${idx}-2`}
                                  rowIndex={idx}
                                  colIndex={2}
                                  onNavigate={handleBulkEditNavigate}
                                  onEnterNext={handleBulkEditEnterNext}
                                  value={row.dayValue}
                                  onChange={(newVal) => handleBulkEditRowChange(row.id, 'dayValue', newVal)}
                                  openUpward={idx >= bulkEditRows.length - 2 && bulkEditRows.length > 2}
                                />
                              </td>

                              {/* Day Salary */}
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  background: '#ECFDF5',
                                  color: '#065F46',
                                  fontSize: '12px',
                                  fontWeight: '800'
                                }}>
                                  ₹{estSalary.toLocaleString('en-IN')}
                                </span>
                              </td>

                              {/* Notes */}
                              <td style={{ padding: '8px 8px' }}>
                                <input
                                  id={`bulkedit-cell-${idx}-3`}
                                  type="text"
                                  placeholder="Work details..."
                                  value={row.notes}
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' && idx > 0) {
                                      e.preventDefault();
                                      focusBulkEditCell(idx - 1, 3);
                                    } else if (e.key === 'ArrowDown' && idx < bulkEditRows.length - 1) {
                                      e.preventDefault();
                                      focusBulkEditCell(idx + 1, 3);
                                    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                                      e.preventDefault();
                                      focusBulkEditCell(idx, 2);
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleBulkEditEnterNext(idx, 3);
                                    }
                                  }}
                                  onChange={(e) => handleBulkEditRowChange(row.id, 'notes', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '5px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #D1D5DB',
                                    fontSize: '11.5px'
                                  }}
                                />
                              </td>

                              {/* Delete Row Action */}
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBulkEditRow(row.id)}
                                  title="Delete this attendance record"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '4px 6px'
                                  }}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Summary & Save Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: '#FAF8F5',
                border: '1px solid #EAE0D2',
                borderRadius: '10px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Summary Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12px', color: '#4B5563' }}>
                    Workers: <strong style={{ color: '#4A2C17', fontSize: '13px' }}>{bulkEditRows.length}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#4B5563' }}>
                    Total Day Value: <strong style={{ color: '#047857', fontSize: '13px' }}>
                      {bulkEditRows.reduce((acc, r) => acc + (parseFloat(r.dayValue) || 0), 0).toFixed(2)} Days
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#4B5563' }}>
                    Total Wages: <strong style={{ color: '#B45309', fontSize: '13px' }}>
                      ₹{bulkEditRows.reduce((acc, r) => acc + Math.round((parseFloat(r.dayValue) || 0) * (r.dailyRate || 0)), 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  {bulkEditDeletedIds.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '700' }}>
                      ({bulkEditDeletedIds.length} record(s) queued for deletion)
                    </div>
                  )}
                </div>

                {/* Submit / Cancel Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBulkEditModal(false)}
                    disabled={saving}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || bulkEditLoading}
                    style={{
                      padding: '9px 22px',
                      borderRadius: '7px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: (saving || bulkEditLoading) ? 'not-allowed' : 'pointer',
                      background: 'var(--gold, #4A2C17)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(74, 44, 23, 0.25)'
                    }}
                  >
                    {saving ? (
                      <span><i className="fa-solid fa-spinner fa-spin"></i> Saving All Changes...</span>
                    ) : (
                      <span><i className="fa-solid fa-check"></i> Save All Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Attendance;
