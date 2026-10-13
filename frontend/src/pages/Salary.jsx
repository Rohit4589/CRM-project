import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config/api';

const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState('employee'); // 'employee' | 'site'
  const [activeEmployeeId, setActiveEmployeeId] = useState(null);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteTableTab, setSiteTableTab] = useState('workers'); // 'workers' | 'attendance'

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatToDMY = (dateStr) => {
    if (!dateStr) return '--';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [y, m] = monthStr.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  // Fetch all required data in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, attRes, siteRes] = await Promise.all([
          fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/attendance?month=${selectedMonth}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/sites`).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (empRes.success) setEmployees(empRes.employees || []);
        if (attRes.success) setAttendanceLogs(attRes.attendance || []);
        if (siteRes.success) setSites(siteRes.sites || []);
      } catch (err) {
        console.error('Error fetching salary & site data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // =========================================================================
  // 1. COMPUTE SALARY PER EMPLOYEE (EMPLOYEE-WISE)
  // =========================================================================
  const salaryRows = useMemo(() => {
    return employees.map(emp => {
      const empAtt = attendanceLogs.filter(a => a.userId === emp.dbId || String(a.empId) === String(emp.id));
      const totalDays = empAtt.reduce((sum, a) => sum + (parseFloat(a.dayValue) || 1.0), 0);
      const dailyRate = Number(emp.dailySalary || 0);
      const grossAmount = Math.round(totalDays * dailyRate);
      const deductions = 0; // Configurable advance / deduction
      const netPayable = grossAmount - deductions;

      return {
        id: emp.id,
        dbId: emp.dbId,
        name: emp.name,
        role: emp.role,
        avatar: emp.avatar,
        totalDays,
        dailyRate,
        grossAmount,
        deductions,
        netPayable,
        status: totalDays > 0 ? 'Ready for Payout' : 'No Punches',
        attendanceLogs: empAtt.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
      };
    });
  }, [employees, attendanceLogs]);

  const totalEmployeePayroll = useMemo(() => {
    return salaryRows.reduce((sum, r) => sum + r.netPayable, 0);
  }, [salaryRows]);

  // Filtered employee rows based on search
  const filteredSalaryRows = useMemo(() => {
    if (!searchQuery.trim()) return salaryRows;
    const q = searchQuery.toLowerCase();
    return salaryRows.filter(r => 
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.role && r.role.toLowerCase().includes(q))
    );
  }, [salaryRows, searchQuery]);

  // =========================================================================
  // 2. COMPUTE SITE-WISE SALARY & LABOR BILLING EXPENSES
  // =========================================================================
  const siteSalaryRows = useMemo(() => {
    const siteMap = new Map();

    // Add registered sites from database
    (sites || []).forEach(s => {
      const sRef = s.siteRef || s.id || `SITE-${String(s.dbId).padStart(3, '0')}`;
      const key = String(s.dbId || sRef);
      siteMap.set(key, {
        id: sRef,
        siteRef: sRef,
        dbId: s.dbId,
        customerName: s.customerName || 'Customer Site',
        location: s.location || '',
        fullAddress: s.fullAddress || '',
        phone: s.phone || '',
        status: s.status || 'Running',
        startDate: s.startDate || '',
        targetDate: s.targetDate || '',
      });
    });

    // Also collect any sites that have attendance records but might not be in sites array
    attendanceLogs.forEach(log => {
      const sRef = log.siteRef || (log.siteId ? `SITE-${String(log.siteId).padStart(3, '0')}` : 'General / Unassigned');
      const key = String(log.siteId || sRef);
      if (!siteMap.has(key)) {
        siteMap.set(key, {
          id: sRef,
          siteRef: sRef,
          dbId: log.siteId || null,
          customerName: log.customerName || 'General / Unassigned',
          location: log.siteLocation || '',
          fullAddress: log.siteLocation || '',
          phone: '',
          status: 'Running',
          startDate: '',
          targetDate: '',
        });
      }
    });

    // Calculate labor breakdown for each site
    const rows = Array.from(siteMap.values()).map(site => {
      // Find all attendance records for this site
      const siteLogs = attendanceLogs.filter(log => {
        if (site.dbId && log.siteId && Number(site.dbId) === Number(log.siteId)) return true;
        if (site.siteRef && log.siteRef && String(site.siteRef).trim().toUpperCase() === String(log.siteRef).trim().toUpperCase()) return true;
        if (site.id && log.siteRef && String(site.id).trim().toUpperCase() === String(log.siteRef).trim().toUpperCase()) return true;
        return false;
      });

      // Group by worker
      const workerMap = new Map();
      siteLogs.forEach(log => {
        const empKey = String(log.userId || log.empId);
        if (!workerMap.has(empKey)) {
          const empObj = employees.find(e => e.dbId === log.userId || String(e.id) === String(log.empId));
          const dailyRate = Number(log.dailyRate || empObj?.dailySalary || 0);
          workerMap.set(empKey, {
            id: log.empId || empObj?.id || `EMP-${log.userId}`,
            userId: log.userId,
            name: log.name || empObj?.name || log.employeeName || 'Unknown Employee',
            role: log.role || empObj?.role || 'Worker',
            dailyRate,
            daysOnSite: 0,
            workHours: 0,
            shiftCount: 0,
            shifts: []
          });
        }
        const w = workerMap.get(empKey);
        const dayVal = parseFloat(log.dayValue) || 1.0;
        w.daysOnSite += dayVal;
        w.workHours += Number(log.workHours || 0);
        w.shiftCount += 1;
        w.shifts.push(log);
      });

      // Calculate total salary per worker on this site
      const workers = Array.from(workerMap.values()).map(w => {
        const totalSalary = Math.round(w.daysOnSite * w.dailyRate);
        return {
          ...w,
          totalSalary,
          shifts: w.shifts.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
        };
      }).sort((a, b) => b.totalSalary - a.totalSalary);

      const totalDays = workers.reduce((sum, w) => sum + w.daysOnSite, 0);
      const totalLaborCost = workers.reduce((sum, w) => sum + w.totalSalary, 0);
      const totalHours = siteLogs.reduce((sum, l) => sum + (Number(l.workHours) || 0), 0);
      const workerCount = workers.length;

      return {
        ...site,
        totalDays,
        totalLaborCost,
        totalHours,
        workerCount,
        workers,
        shifts: siteLogs.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
      };
    });

    // Sort: sites with active work first, then by total labor cost descending
    return rows.sort((a, b) => {
      if (b.totalDays !== a.totalDays) return b.totalDays - a.totalDays;
      return b.totalLaborCost - a.totalLaborCost;
    });
  }, [sites, attendanceLogs, employees]);

  const totalSitePayroll = useMemo(() => {
    return siteSalaryRows.reduce((sum, s) => sum + s.totalLaborCost, 0);
  }, [siteSalaryRows]);

  const totalSiteManDays = useMemo(() => {
    return siteSalaryRows.reduce((sum, s) => sum + s.totalDays, 0);
  }, [siteSalaryRows]);

  const activeSitesCount = useMemo(() => {
    return siteSalaryRows.filter(s => s.totalDays > 0).length;
  }, [siteSalaryRows]);

  // Filtered site rows based on search
  const filteredSiteRows = useMemo(() => {
    if (!searchQuery.trim()) return siteSalaryRows;
    const q = searchQuery.toLowerCase();
    return siteSalaryRows.filter(s => 
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.siteRef && s.siteRef.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q))
    );
  }, [siteSalaryRows, searchQuery]);

  // Active employee or active site for detailed drill-down views
  const activeEmployee = activeEmployeeId ? salaryRows.find(r => r.id === activeEmployeeId) : null;
  const activeSite = activeSiteId ? siteSalaryRows.find(s => s.id === activeSiteId || s.siteRef === activeSiteId || s.dbId === activeSiteId) : null;

  return (
    <main className="dashboard-content" style={{ padding: '24px 30px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* =========================================================================
          VIEW A: INDIVIDUAL EMPLOYEE DAY-WISE SALARY STATEMENT (DRILL-DOWN)
          ========================================================================= */}
      {activeEmployee ? (
        <div>
          {/* Back Button & Top Navigation */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setActiveEmployeeId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold, #B9782D)';
                e.currentTarget.style.color = 'var(--gold, #B9782D)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to All Employees
            </button>

            {/* Employee Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                  {activeEmployee.name} - Day-Wise Salary
                </h1>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--gold, #B9782D)' }}>{activeEmployee.id}</span> · {activeEmployee.role}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                  {formatMonthName(selectedMonth)}
                </span>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-print"></i> Print Statement
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '22px'
          }}>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Logged Shifts</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                {activeEmployee.attendanceLogs.length} Shifts
              </div>
            </div>

            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Total Day Units</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                {activeEmployee.totalDays.toFixed(1)} Days
              </div>
            </div>

            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Daily Wage Rate</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '4px' }}>
                ₹{activeEmployee.dailyRate.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#ECFDF5', padding: '16px 20px', borderRadius: '10px', border: '1px solid #A7F3D0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#065F46', fontWeight: '700', textTransform: 'uppercase' }}>Total Salary Earned</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#065F46', marginTop: '4px' }}>
                ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Full-Page Day-Wise Shifts Table Container */}
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
                  background: '#E2E8F0',
                  borderBottom: '2px solid #94A3B8',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px'
                }}>
                  <th style={{ padding: '14px 18px', width: '14%', textAlign: 'left', fontWeight: '800', color: '#0F172A' }}>Date</th>
                  <th style={{ padding: '14px 18px', width: '24%', textAlign: 'left', fontWeight: '800', color: '#0F172A' }}>Site / Customer</th>
                  <th style={{ padding: '14px 18px', width: '26%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Timings (IN / OUT)</th>
                  <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Work Hours</th>
                  <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Day Value</th>
                  <th style={{ padding: '14px 18px', width: '14%', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>Day Salary</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployee.attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '50px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                      <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '10px', display: 'block' }}></i>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>No attendance records found</div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>No shifts recorded for {activeEmployee.name} in {formatMonthName(selectedMonth)}.</div>
                    </td>
                  </tr>
                ) : (
                  activeEmployee.attendanceLogs.map((log, idx) => {
                    const dayVal = parseFloat(log.dayValue) || 1.0;
                    const daySalary = Math.round(dayVal * activeEmployee.dailyRate);

                    return (
                      <tr key={log.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                          <span style={{ fontWeight: '700', color: '#111827', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {formatToDMY(log.attendanceDate)}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', fontSize: '12px', flexShrink: 0 }}></i>
                            <span>{log.siteRef}: {log.customerName}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280', paddingLeft: '18px', marginTop: '2px' }}>
                            {log.siteLocation || 'Assigned Site'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            <span style={{ background: '#ECFDF5', color: '#065F46', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              IN: {log.inTime}
                            </span>
                            <span style={{ color: '#9CA3AF' }}>→</span>
                            <span style={{ background: log.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2', color: log.outTime === '--:--' ? '#6B7280' : '#DC2626', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              OUT: {log.outTime}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                          {log.workHours > 0 ? `${log.workHours} hrs` : '--'}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{
                            background: dayVal >= 1.0 ? '#ECFDF5' : '#FEF3C7',
                            color: dayVal >= 1.0 ? '#065F46' : '#92400E',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block',
                            whiteSpace: 'nowrap'
                          }}>
                            {dayVal.toFixed(1)} Day
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '800',
                            display: 'inline-block',
                            whiteSpace: 'nowrap'
                          }}>
                            ₹{daySalary.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {activeEmployee.attendanceLogs.length > 0 && (
                <tfoot>
                  <tr style={{
                    background: '#E2E8F0',
                    borderTop: '2px solid #94A3B8',
                    borderBottom: '2px solid #94A3B8',
                    fontWeight: '800'
                  }}>
                    <td style={{ padding: '16px 18px', fontSize: '14px', color: '#0F172A', fontWeight: '800', textAlign: 'left' }} colSpan="3">
                      Total
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '14px', color: '#0F172A', fontWeight: '800', textAlign: 'center' }}>
                      {activeEmployee.attendanceLogs.reduce((sum, l) => sum + (Number(l.workHours) || 0), 0)} hrs
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '14px', color: '#2563EB', fontWeight: '800', textAlign: 'center' }}>
                      {activeEmployee.totalDays.toFixed(1)} Days
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '17px', fontWeight: '800', color: '#059669', textAlign: 'right' }}>
                      ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : activeSite ? (
        /* =========================================================================
            VIEW C: INDIVIDUAL SITE LABOR & BILLING EXPENSE STATEMENT (DRILL-DOWN)
            ========================================================================= */
        <div>
          {/* Back Button & Top Navigation */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setActiveSiteId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold, #B9782D)';
                e.currentTarget.style.color = 'var(--gold, #B9782D)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to All Sites
            </button>

            {/* Site Banner Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(185, 120, 45, 0.12)',
                    color: 'var(--gold, #B9782D)',
                    border: '1px solid rgba(185, 120, 45, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '800',
                    fontFamily: 'monospace'
                  }}>
                    {activeSite.siteRef}
                  </span>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                    {activeSite.customerName} - Project Labor Cost Statement
                  </h1>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span><i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', marginRight: '4px' }}></i>{activeSite.location || activeSite.fullAddress || 'Assigned Location'}</span>
                  <span>•</span>
                  <span>Status: <strong style={{ color: activeSite.status === 'Running' ? '#059669' : '#4B5563' }}>{activeSite.status}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                  {formatMonthName(selectedMonth)}
                </span>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-print"></i> Print Billing Sheet
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards for Site */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ background: '#ECFDF5', padding: '18px 20px', borderRadius: '10px', border: '1.5px solid #A7F3D0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#065F46', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Site Labor Cost (Billing)
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#065F46', marginTop: '6px' }}>
                ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Man-Days Logged
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563EB', marginTop: '6px' }}>
                {activeSite.totalDays.toFixed(1)} Days
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Workers Deployed
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
                {activeSite.workerCount} Employees
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Work Hours
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '6px' }}>
                {activeSite.totalHours} hrs
              </div>
            </div>
          </div>

          {/* Toggle Button for Employee Worked Data vs Day-Wise Attendance */}
          <div style={{
            display: 'inline-flex',
            gap: '8px',
            background: '#F8FAFC',
            padding: '6px 8px',
            borderRadius: '10px',
            border: '1.5px solid #E2E8F0',
            marginBottom: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <button
              type="button"
              onClick={() => setSiteTableTab('workers')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: siteTableTab === 'workers' ? '2px solid var(--navy, #111827)' : '1.5px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease',
                background: siteTableTab === 'workers' ? 'var(--navy, #111827)' : '#FFFFFF',
                color: siteTableTab === 'workers' ? '#FFFFFF' : '#475569',
                boxShadow: siteTableTab === 'workers' ? '0 4px 12px rgba(17, 24, 39, 0.22)' : '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <i className="fa-solid fa-user-tie" style={{ color: siteTableTab === 'workers' ? '#FBBF24' : '#64748B' }}></i>
              <span>Employee Worked Data</span>
              <span style={{
                background: siteTableTab === 'workers' ? '#2563EB' : '#F1F5F9',
                color: siteTableTab === 'workers' ? '#FFFFFF' : '#475569',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800',
                border: siteTableTab === 'workers' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0'
              }}>
                {activeSite.workers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSiteTableTab('attendance')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: siteTableTab === 'attendance' ? '2px solid var(--navy, #111827)' : '1.5px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease',
                background: siteTableTab === 'attendance' ? 'var(--navy, #111827)' : '#FFFFFF',
                color: siteTableTab === 'attendance' ? '#FFFFFF' : '#475569',
                boxShadow: siteTableTab === 'attendance' ? '0 4px 12px rgba(17, 24, 39, 0.22)' : '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <i className="fa-regular fa-calendar-days" style={{ color: siteTableTab === 'attendance' ? '#FBBF24' : '#64748B' }}></i>
              <span>Day-Wise Attendance</span>
              <span style={{
                background: siteTableTab === 'attendance' ? '#2563EB' : '#F1F5F9',
                color: siteTableTab === 'attendance' ? '#FFFFFF' : '#475569',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800',
                border: siteTableTab === 'attendance' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0'
              }}>
                {activeSite.shifts.length}
              </span>
            </button>
          </div>

          {/* TABLE 1: EMPLOYEE LABOR BREAKDOWN ON THIS SITE */}
          {siteTableTab === 'workers' ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                  Employee Labor Breakdown on {activeSite.siteRef}
                </h3>
              </div>

              <div className="panel table-responsive" style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{
                      background: '#E2E8F0',
                      borderBottom: '2px solid #94A3B8',
                      color: '#0F172A',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px'
                    }}>
                      <th style={{ padding: '14px 18px', width: '32%', textAlign: 'left', fontWeight: '800', color: '#0F172A' }}>Employee Details</th>
                      <th style={{ padding: '14px 18px', width: '17%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Days on Site</th>
                      <th style={{ padding: '14px 18px', width: '17%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Daily Wage Rate</th>
                      <th style={{ padding: '14px 18px', width: '20%', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>Total Site Salary</th>
                      <th style={{ padding: '14px 18px', width: '14%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Shifts Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSite.workers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                          <i className="fa-regular fa-folder-open" style={{ fontSize: '28px', color: '#D1D5DB', marginBottom: '8px', display: 'block' }}></i>
                          <div>No employee shifts have been recorded for this site in {formatMonthName(selectedMonth)}.</div>
                        </td>
                      </tr>
                    ) : (
                      activeSite.workers.map((worker) => (
                        <tr key={worker.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{worker.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--gold, #B9782D)' }}>{worker.id}</span> · {worker.role}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              background: '#ECFDF5',
                              color: '#065F46',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              display: 'inline-block'
                            }}>
                              {worker.daysOnSite.toFixed(1)} Days
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                            ₹{worker.dailyRate.toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span style={{
                              background: '#ECFDF5',
                              color: '#065F46',
                              border: '1px solid #A7F3D0',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '800',
                              display: 'inline-block'
                            }}>
                              ₹{worker.totalSalary.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#4B5563' }}>
                            {worker.shiftCount} shifts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {activeSite.workers.length > 0 && (
                    <tfoot>
                      <tr style={{
                        background: '#E2E8F0',
                        borderTop: '2px solid #94A3B8',
                        borderBottom: '2px solid #94A3B8',
                        fontWeight: '800'
                      }}>
                        <td style={{ padding: '16px 18px', fontSize: '14px', color: '#0F172A', fontWeight: '800', textAlign: 'left' }}>
                          Total Project Labor Expense
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '14px', color: '#2563EB', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.totalDays.toFixed(1)} Days
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '12px', color: '#6B7280', fontWeight: '700', textAlign: 'center' }}>
                          Avg: ₹{activeSite.totalDays > 0 ? Math.round(activeSite.totalLaborCost / activeSite.totalDays).toLocaleString('en-IN') : 0}/day
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '18px', fontWeight: '800', color: '#059669', textAlign: 'right' }}>
                          ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.shifts.length} shifts
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            /* TABLE 2: DAY-BY-DAY SHIFT LOGS ON THIS SITE */
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                  Day-Wise Attendance Log for {activeSite.siteRef}
                </h3>
              </div>

              <div className="panel table-responsive" style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{
                      background: '#E2E8F0',
                      borderBottom: '2px solid #94A3B8',
                      color: '#0F172A',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px'
                    }}>
                      <th style={{ padding: '14px 18px', width: '15%', textAlign: 'left', fontWeight: '800', color: '#0F172A' }}>Date</th>
                      <th style={{ padding: '14px 18px', width: '25%', textAlign: 'left', fontWeight: '800', color: '#0F172A' }}>Employee Name</th>
                      <th style={{ padding: '14px 18px', width: '25%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Timings (IN / OUT)</th>
                      <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Work Hours</th>
                      <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#0F172A' }}>Day Value</th>
                      <th style={{ padding: '14px 18px', width: '13%', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>Shift Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSite.shifts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                          No individual punch records found for this site.
                        </td>
                      </tr>
                    ) : (
                      activeSite.shifts.map((log, idx) => {
                        const empObj = employees.find(e => e.dbId === log.userId || String(e.id) === String(log.empId));
                        const rate = Number(log.dailyRate || empObj?.dailySalary || 0);
                        const dayVal = parseFloat(log.dayValue) || 1.0;
                        const shiftCost = Math.round(dayVal * rate);

                        return (
                          <tr key={log.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                              <span style={{ fontWeight: '700', color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>
                                {formatToDMY(log.attendanceDate)}
                              </span>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>
                                {log.employeeName || log.name || empObj?.name || 'Worker'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                <span style={{ fontWeight: '600', color: 'var(--gold, #B9782D)' }}>{log.empId || empObj?.id}</span> · {log.employeeRole || empObj?.role || 'Staff'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                                <span style={{ background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                  IN: {log.inTime}
                                </span>
                                <span style={{ color: '#9CA3AF' }}>→</span>
                                <span style={{ background: log.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2', color: log.outTime === '--:--' ? '#6B7280' : '#DC2626', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                  OUT: {log.outTime}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                              {log.workHours > 0 ? `${log.workHours} hrs` : '--'}
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <span style={{
                                background: dayVal >= 1.0 ? '#ECFDF5' : '#FEF3C7',
                                color: dayVal >= 1.0 ? '#065F46' : '#92400E',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'inline-block'
                              }}>
                                {dayVal.toFixed(1)} Day
                              </span>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                              <span style={{
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '800'
                              }}>
                                ₹{shiftCost.toLocaleString('en-IN')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {activeSite.shifts.length > 0 && (
                    <tfoot>
                      <tr style={{
                        background: '#E2E8F0',
                        borderTop: '2px solid #94A3B8',
                        borderBottom: '2px solid #94A3B8',
                        fontWeight: '800'
                      }}>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800', textAlign: 'left' }} colSpan="3">
                          Total Shifts: {activeSite.shifts.length}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.totalHours} hrs
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#2563EB', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.totalDays.toFixed(1)} Days
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '16px', fontWeight: '800', color: '#059669', textAlign: 'right' }}>
                          ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW B: MASTER OVERVIEW (WITH DUAL-VIEW TOGGLE: EMPLOYEE vs SITE)
            ========================================================================= */
        <div>
          {/* Top Page Header */}
          <div className="page-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '18px'
          }}>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
                Monthly Salary & Project Labor Cost
              </h1>
            </div>

            <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '7px',
                  border: '1px solid #D1D5DB',
                  outline: 'none',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#111827'
                }}
              />

              <button
                onClick={() => {
                  const amt = viewMode === 'employee' ? totalEmployeePayroll : totalSitePayroll;
                  alert(`Total payroll for ${formatMonthName(selectedMonth)} is ₹${amt.toLocaleString('en-IN')}. Release process ready.`);
                }}
                className="btn-primary"
                style={{
                  padding: '9px 18px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-money-bill-transfer"></i> Process Payroll
              </button>
            </div>
          </div>

          {/* =====================================================================
              PRIMARY VIEW SWITCHER TAB BAR (PERSON-WISE vs SITE-WISE)
              ===================================================================== */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
            background: '#F8FAFC',
            padding: '8px 10px',
            borderRadius: '12px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            {/* Left: Tab Switcher Buttons */}
            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setViewMode('employee')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '9px',
                  border: viewMode === 'employee' ? '2px solid var(--navy, #111827)' : '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.18s ease',
                  background: viewMode === 'employee' ? 'var(--navy, #111827)' : '#FFFFFF',
                  color: viewMode === 'employee' ? '#FFFFFF' : '#475569',
                  boxShadow: viewMode === 'employee' ? '0 4px 14px rgba(17, 24, 39, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <i className="fa-solid fa-user-tie" style={{ color: viewMode === 'employee' ? '#FBBF24' : '#64748B', fontSize: '14px' }}></i>
                <span>Person-Wise Salary</span>
                <span style={{
                  background: viewMode === 'employee' ? '#2563EB' : '#F1F5F9',
                  color: viewMode === 'employee' ? '#FFFFFF' : '#475569',
                  padding: '2px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  border: viewMode === 'employee' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0'
                }}>
                  {salaryRows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('site')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '9px',
                  border: viewMode === 'site' ? '2px solid var(--navy, #111827)' : '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.18s ease',
                  background: viewMode === 'site' ? 'var(--navy, #111827)' : '#FFFFFF',
                  color: viewMode === 'site' ? '#FFFFFF' : '#475569',
                  boxShadow: viewMode === 'site' ? '0 4px 14px rgba(17, 24, 39, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <i className="fa-solid fa-location-dot" style={{ color: viewMode === 'site' ? '#FBBF24' : '#64748B', fontSize: '14px' }}></i>
                <span>Site-Wise Project Billing</span>
                <span style={{
                  background: viewMode === 'site' ? '#2563EB' : '#F1F5F9',
                  color: viewMode === 'site' ? '#FFFFFF' : '#475569',
                  padding: '2px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  border: viewMode === 'site' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0'
                }}>
                  {activeSitesCount} Active
                </span>
              </button>
            </div>

            {/* Right: Quick Search Box */}
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder={viewMode === 'employee' ? 'Search employee name, code...' : 'Search site, customer, locality...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 34px',
                  borderRadius: '7px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                fontSize: '12px'
              }}></i>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* KPI Snapshot Cards for Current View */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px'
          }}>
            {viewMode === 'employee' ? (
              <>
                <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Total Payroll</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                    ₹{totalEmployeePayroll.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Total Days Worked</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                    {salaryRows.reduce((sum, r) => sum + r.totalDays, 0).toFixed(1)} Days
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Employees With Punches</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy, #111827)', marginTop: '4px' }}>
                    {salaryRows.filter(r => r.totalDays > 0).length} / {salaryRows.length}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#ECFDF5', padding: '14px 18px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: '800', textTransform: 'uppercase' }}>Total Site Labor Expense</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#065F46', marginTop: '4px' }}>
                    ₹{totalSitePayroll.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Total Project Man-Days</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>
                    {totalSiteManDays.toFixed(1)} Days
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Active Sites with Work</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '4px' }}>
                    {activeSitesCount} Sites
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===================================================================
              SUB-VIEW 1: EMPLOYEE-WISE SALARY TABLE (WHEN viewMode === 'employee')
              =================================================================== */}
          {viewMode === 'employee' ? (
            <div className="panel table-responsive" style={{
              background: '#fff',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{
                    background: '#E2E8F0',
                    borderBottom: '2px solid #94A3B8',
                    color: '#0F172A',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}>
                    <th style={{ padding: '14px 18px', width: '22%', fontWeight: '800', color: '#0F172A' }}>Employee</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#0F172A' }}>Total Days</th>
                    <th style={{ padding: '14px 18px', width: '12%', fontWeight: '800', color: '#0F172A' }}>Daily Rate</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#0F172A' }}>Gross Amount</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#0F172A' }}>Deductions / Adv.</th>
                    <th style={{ padding: '14px 18px', width: '14%', fontWeight: '800', color: '#0F172A' }}>Net Payable</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#0F172A' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '22px', color: 'var(--gold, #B9782D)', marginBottom: '8px' }}></i>
                        <div>Calculating real payroll from attendance...</div>
                      </td>
                    </tr>
                  ) : filteredSalaryRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        No employees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaryRows.map((row) => (
                      <tr 
                        key={row.id} 
                        onClick={() => setActiveEmployeeId(row.id)}
                        title={`Click to open full day-wise salary for ${row.name}`}
                        style={{ 
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{row.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              <span style={{ fontWeight: '600', color: 'var(--gold, #B9782D)' }}>{row.id}</span> · {row.role}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: row.totalDays > 0 ? '#ECFDF5' : '#F3F4F6',
                            color: row.totalDays > 0 ? '#065F46' : '#6B7280',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {row.totalDays.toFixed(1)} Days
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                          ₹{row.dailyRate.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                          ₹{row.grossAmount.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: '#DC2626', fontSize: '13px' }}>
                          - ₹{row.deductions.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: '800', color: 'var(--navy, #111827)', fontSize: '15px' }}>
                          ₹{row.netPayable.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: row.totalDays > 0 ? '#FEF3C7' : '#F3F4F6',
                            color: row.totalDays > 0 ? '#92400E' : '#6B7280',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ===================================================================
                SUB-VIEW 2: SITE-WISE LABOR & BILLING TABLE (WHEN viewMode === 'site')
                =================================================================== */
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
                    background: '#E2E8F0',
                    borderBottom: '2px solid #94A3B8',
                    color: '#0F172A',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}>
                    <th style={{ padding: '14px 18px', width: '25%', fontWeight: '800', color: '#0F172A' }}>Site / Customer Project</th>
                    <th style={{ padding: '14px 18px', width: '14%', fontWeight: '800', color: '#0F172A' }}>Active Workers</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#0F172A' }}>Total Man-Days</th>
                    <th style={{ padding: '14px 18px', width: '12%', fontWeight: '800', color: '#0F172A' }}>Total Hours</th>
                    <th style={{ padding: '14px 18px', width: '18%', fontWeight: '800', color: '#0F172A' }}>Site Labor Cost (Billing)</th>
                    <th style={{ padding: '14px 18px', width: '18%', fontWeight: '800', color: '#0F172A', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '22px', color: 'var(--gold, #B9782D)', marginBottom: '8px' }}></i>
                        <div>Calculating site-wise labor billing expenses...</div>
                      </td>
                    </tr>
                  ) : filteredSiteRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        No sites found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSiteRows.map((site) => (
                      <tr 
                        key={site.id}
                        onClick={() => setActiveSiteId(site.id)}
                        title={`Click to open full project labor breakdown for ${site.customerName}`}
                        style={{ 
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Site Ref & Customer Name */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: 'rgba(185, 120, 45, 0.1)',
                              color: 'var(--gold, #B9782D)',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              letterSpacing: '0.5px',
                              fontFamily: 'monospace'
                            }}>
                              {site.siteRef}
                            </span>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                              {site.customerName}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', paddingLeft: '2px' }}>
                            <i className="fa-solid fa-location-dot" style={{ fontSize: '10px', color: '#9CA3AF', marginRight: '4px' }}></i>
                            {site.location || 'Site Location'}
                          </div>
                        </td>

                        {/* Workers Count */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.workerCount > 0 ? '#EFF6FF' : '#F3F4F6',
                            color: site.workerCount > 0 ? '#2563EB' : '#9CA3AF',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fa-solid fa-users" style={{ fontSize: '11px' }}></i>
                            {site.workerCount} {site.workerCount === 1 ? 'Worker' : 'Workers'}
                          </span>
                        </td>

                        {/* Total Man-Days */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.totalDays > 0 ? '#ECFDF5' : '#F3F4F6',
                            color: site.totalDays > 0 ? '#065F46' : '#9CA3AF',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block'
                          }}>
                            {site.totalDays.toFixed(1)} Days
                          </span>
                        </td>

                        {/* Total Work Hours */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: '600', color: site.totalHours > 0 ? '#374151' : '#9CA3AF', fontSize: '13px' }}>
                          {site.totalHours > 0 ? `${site.totalHours} hrs` : '--'}
                        </td>

                        {/* Total Labor Cost (Billing) */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.totalLaborCost > 0 ? '#ECFDF5' : '#F3F4F6',
                            color: site.totalLaborCost > 0 ? '#065F46' : '#6B7280',
                            border: site.totalLaborCost > 0 ? '1px solid #A7F3D0' : 'none',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '800',
                            display: 'inline-block'
                          }}>
                            ₹{site.totalLaborCost.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSiteId(site.id);
                            }}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gold, #B9782D)';
                              e.currentTarget.style.color = 'var(--gold, #B9782D)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#334155';
                            }}
                          >
                            <span>View Breakdown</span>
                            <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredSiteRows.length > 0 && (
                  <tfoot>
                    <tr style={{
                      background: '#E2E8F0',
                      borderTop: '2px solid #94A3B8',
                      borderBottom: '2px solid #94A3B8',
                      fontWeight: '800'
                    }}>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>
                        Total Project Labor Expense
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>
                        {activeSitesCount} Active Sites
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '14px', color: '#2563EB', fontWeight: '800' }}>
                        {totalSiteManDays.toFixed(1)} Days
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>
                        {filteredSiteRows.reduce((sum, s) => sum + s.totalHours, 0)} hrs
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '17px', fontWeight: '800', color: '#059669' }}>
                        ₹{totalSitePayroll.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '16px 18px', textAlign: 'right', fontSize: '12px', color: '#64748B' }}>
                        All Sites Active
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

    </main>
  );
};

export default Salary;
