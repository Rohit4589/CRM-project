import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const Attendance = () => {
  // Main data state
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);

  // Filter & Search states
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
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
    } catch {}
    return dateStr;
  };

  const [dateFilter, setDateFilter] = useState(getTodayStr());
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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
    notes: ''
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
    fetchData();
  }, [dateFilter, showAllDates]);

  // Open Add Modal & Reset Form
  const handleOpenAddModal = () => {
    const defaultEmp = employees.length > 0 ? employees[0].dbId : '';
    const defaultSite = sites.length > 0 ? (sites[0].dbId || sites[0].id) : '';

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
      return { ...prev, siteSessions: updated };
    });
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

  // Open Edit Modal
  const handleOpenEditModal = (log) => {
    // Parse time to HH:MM format for <input type="time">
    const parseToTimeInput = (tStr) => {
      if (!tStr || tStr === '--:--') return '09:00';
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

    setEditFormData({
      id: log.id,
      employeeName: log.name,
      empId: log.empId,
      userId: log.userId,
      date: log.attendanceDate,
      siteId: log.siteId || (sites.length > 0 ? (sites[0].dbId || sites[0].id) : ''),
      inTime: parseToTimeInput(log.inTime),
      outTime: parseToTimeInput(log.outTime),
      dayValue: String(log.dayValue || '1.0'),
      dailyRate: Number(log.dailyRate || 1000),
      status: log.status || 'Verified',
      notes: log.notes || ''
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

      const res = await fetch(`${API_BASE}/attendance/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: sId,
          attendanceDate: editFormData.date,
          inTime: formatTimeAmPm(editFormData.inTime),
          outTime: formatTimeAmPm(editFormData.outTime),
          dayValue: parseFloat(editFormData.dayValue) || 1.0,
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

  // Calculate summary stats
  const totalDaysLogged = filteredLogs.reduce((acc, log) => acc + (parseFloat(log.dayValue) || 1.0), 0);
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
          <h1 className="page-title" style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
            Attendance Monitoring & Entry
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Record, verify, and manage daily worker site attendance with multi-site tracking.
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
              border: showAllDates ? '2px solid var(--gold, #B9782D)' : '1px solid #D1D5DB',
              borderRadius: '7px',
              background: showAllDates ? 'var(--gold-bg, rgba(185, 120, 45, 0.12))' : '#fff',
              color: showAllDates ? 'var(--gold, #B9782D)' : '#374151',
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

          <button
            onClick={() => {
              const today = getTodayStr();
              setDateFilter(today);
              setShowAllDates(false);
              fetchData(today, false);
            }}
            style={{
              padding: '9px 14px',
              border: (!showAllDates && dateFilter === getTodayStr()) ? '2px solid #2563EB' : '1px solid #D1D5DB',
              borderRadius: '7px',
              background: (!showAllDates && dateFilter === getTodayStr()) ? '#EFF6FF' : '#fff',
              color: (!showAllDates && dateFilter === getTodayStr()) ? '#2563EB' : '#374151',
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
              border: (!showAllDates && dateFilter !== getTodayStr()) ? '2px solid var(--gold, #B9782D)' : '1px solid #D1D5DB',
              borderRadius: '7px',
              outline: 'none',
              fontSize: '13px',
              background: '#fff',
              fontWeight: '600',
              color: '#111827'
            }}
          />

          <button
            onClick={handleOpenAddModal}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <i className="fa-solid fa-user-plus" style={{ color: 'var(--gold, #B9782D)' }}></i>
            Mark Attendance
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-clipboard-user"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Punches Logged
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
              {filteredLogs.length}
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(5, 150, 105, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Day Units
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
              {totalDaysLogged.toFixed(1)} Days
            </div>
          </div>
        </div>


        <div style={{
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'var(--gold-bg, rgba(185, 120, 45, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold, #B9782D)',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Sites Covered
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '2px' }}>
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
        border: '1px solid #E5E7EB',
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
              placeholder="Search by worker, ID, site, or notes..."
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
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              textAlign: 'left',
              color: '#6B7280',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              <th style={{ padding: '14px 18px', width: '18%' }}>Employee</th>
              <th style={{ padding: '14px 18px', width: '11%' }}>Date</th>
              <th style={{ padding: '14px 18px', width: '21%' }}>Site / Customer</th>
              <th style={{ padding: '14px 18px', width: '17%' }}>Timings (IN / OUT)</th>
              <th style={{ padding: '14px 18px', width: '9%' }}>Work Hours</th>
              <th style={{ padding: '14px 18px', width: '8%' }}>Day Value</th>
              <th style={{ padding: '14px 18px', width: '8%' }}>Day Salary</th>
              <th style={{ padding: '14px 18px', width: '8%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--gold, #B9782D)', marginBottom: '10px' }}></i>
                  <div>Loading attendance records from database...</div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '45px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                  <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '12px' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>No attendance records found</div>
                  <p style={{ margin: '4px 0 16px 0', fontSize: '13px' }}>
                    {showAllDates ? 'No attendance has been logged yet.' : `No attendance recorded for ${formatToDMY(dateFilter)}. Click below to mark attendance or view all logged dates.`}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {/* Employee info */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{log.name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--gold, #B9782D)' }}>{log.empId}</span> · {log.role}
                      </div>
                    </div>
                  </td>

                  {/* Attendance Date (DD-MM-YYYY) */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>
                      {formatToDMY(log.attendanceDate)}
                    </div>
                    {log.notes && (
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontStyle: 'italic' }}>
                        Note: {log.notes}
                      </div>
                    )}
                  </td>

                  {/* Site / Customer */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', fontSize: '12px' }}></i>
                      <span>{log.siteRef}: {log.customerName}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', paddingLeft: '18px' }}>
                      {log.siteLocation || 'Assigned location'}
                    </div>
                  </td>

                  {/* Timings */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        IN: {log.inTime}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>→</span>
                      <span style={{
                        background: log.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2',
                        color: log.outTime === '--:--' ? '#6B7280' : '#DC2626',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        OUT: {log.outTime}
                      </span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                      {log.workHours > 0 ? `${log.workHours} hrs` : '--'}
                    </div>
                  </td>

                  {/* Day Value */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <span style={{
                      background: log.dayValue >= 1.0 ? '#ECFDF5' : '#FEF3C7',
                      color: log.dayValue >= 1.0 ? '#065F46' : '#92400E',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {log.valueText}
                    </span>
                  </td>

                  {/* Day Salary (Amount instead of Verified) */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                    <span style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                      letterSpacing: '0.3px',
                      display: 'inline-block'
                    }}>
                      ₹{Math.round((parseFloat(log.dayValue) || 1.0) * Number(log.dailyRate || 1000)).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenEditModal(log)}
                        title="Edit Attendance"
                        style={{
                          background: '#fff',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square" style={{ color: '#2563EB' }}></i> Edit
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(log.id)}
                        title="Delete Attendance"
                        style={{
                          background: '#fff',
                          border: '1px solid #FCA5A5',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: '#DC2626',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
            maxWidth: '680px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F9FAFB'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--navy, #111827)' }}>
                  Mark Daily Attendance
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                  Select employee, date, and site shifts. Use <strong>[+]</strong> if the worker worked at multiple sites.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            {/* Modal Form Body */}
            <form onSubmit={handleSaveAttendance} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
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
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', marginRight: '6px' }}></i>
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
                            background: 'var(--gold, #B9782D)',
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
                  <select
                    value={formData.dayValue}
                    onChange={(e) => setFormData({ ...formData, dayValue: e.target.value })}
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
                    <option value="1.0">1.0 Full Day</option>
                    <option value="0.5">0.5 Half Day</option>
                    <option value="0.75">0.75 Day</option>
                    <option value="1.25">1.25 Day (Overtime)</option>
                    <option value="1.5">1.5 Day (Overtime)</option>
                    <option value="2.0">2.0 Double Day</option>
                  </select>
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
                      const salary = Math.round((parseFloat(formData.dayValue) || 1.0) * rate);
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
                    background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
                    color: '#fff',
                    border: 'none'
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
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* EDIT ATTENDANCE MODAL */}
      {/* ========================================================== */}
      {showEditModal && (
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--navy, #111827)' }}>
                  Edit Attendance Record
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

            <form onSubmit={handleUpdateAttendance} style={{ padding: '24px' }}>
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
                    value={editFormData.siteId}
                    onChange={(e) => setEditFormData({ ...editFormData, siteId: e.target.value })}
                    required
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#16A34A', marginBottom: '6px' }}>
                    IN Time
                  </label>
                  <input
                    type="time"
                    value={editFormData.inTime}
                    onChange={(e) => setEditFormData({ ...editFormData, inTime: e.target.value })}
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
                    onChange={(e) => setEditFormData({ ...editFormData, outTime: e.target.value })}
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

              {/* Day Value & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Day Value
                  </label>
                  <select
                    value={editFormData.dayValue}
                    onChange={(e) => setEditFormData({ ...editFormData, dayValue: e.target.value })}
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
                    <option value="1.0">1.0 Full Day</option>
                    <option value="0.5">0.5 Half Day</option>
                    <option value="0.75">0.75 Day</option>
                    <option value="1.25">1.25 Day</option>
                    <option value="1.5">1.5 Day</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                    Day Salary of that Day
                  </label>
                  <div style={{
                    width: '100%',
                    padding: '8px 12px',
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
                      const rate = Number(editFormData.dailyRate || 0) || Number(employees.find(e => String(e.dbId || e.id) === String(editFormData.userId))?.dailySalary || 1000);
                      const salary = Math.round((parseFloat(editFormData.dayValue) || 1.0) * rate);
                      return salary.toLocaleString('en-IN');
                    })()}</span>
                    <span style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>
                      ({editFormData.dayValue} Day × ₹{Number(editFormData.dailyRate || 0) || Number(employees.find(e => String(e.dbId || e.id) === String(editFormData.userId))?.dailySalary || 1000)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
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



    </main>
  );
};

export default Attendance;
