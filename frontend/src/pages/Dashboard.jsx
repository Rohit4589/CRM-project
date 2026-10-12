import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { API_BASE } from '../config/api';

const Dashboard = ({ onNavigate, user }) => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [siteStats, setSiteStats] = useState({ total: 0, active: 0 });
  const [activeSitesList, setActiveSitesList] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [presentMonthPayroll, setPresentMonthPayroll] = useState(0);
  const [presentMonthDays, setPresentMonthDays] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getCurrentMonthStr = () => {
    const d = new Date();
    const yr = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mon}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        const today = getTodayStr();
        const currentMonth = getCurrentMonthStr();

        const [empRes, siteRes, attRes, monthAttRes] = await Promise.all([
          fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/sites`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/attendance?date=${today}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/attendance?month=${currentMonth}`).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (empRes.success) {
          const emps = empRes.employees || [];
          setEmployeeCount(emps.length);
        }

        if (monthAttRes.success) {
          const monthLogs = monthAttRes.attendance || [];
          const totalDays = monthLogs.reduce((sum, log) => sum + (parseFloat(log.dayValue) || 1.0), 0);
          const realPayroll = monthLogs.reduce((sum, log) => {
            const dayVal = parseFloat(log.dayValue) || 1.0;
            const rate = Number(log.dailyRate || 0);
            return sum + Math.round(dayVal * rate);
          }, 0);
          setPresentMonthPayroll(realPayroll);
          setPresentMonthDays(totalDays);
        }

        if (siteRes.success) {
          const sites = siteRes.sites || [];
          const activeList = sites.filter(s => s.status === 'Running');
          setSiteStats({ total: sites.length, active: activeList.length });
          setActiveSitesList(activeList);
        }

        if (attRes.success) {
          setTodayAttendance(attRes.attendance || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const presentCount = todayAttendance.length;
  const absentCount = Math.max(0, employeeCount - presentCount);

  return (
    <main className="dashboard">

      {/* ===== Hero / Welcome ===== */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <h1>{getGreeting()}, {user?.name || 'Administrator'}</h1>
          <p>Here's what's happening across Modern Interior today.</p>
          <div className="dash-date">
            <i className="fa-regular fa-calendar"></i>
            {formatDate()}
          </div>
        </div>
        <div className="dash-hero-actions">
          <button className="btn-primary" onClick={() => onNavigate && onNavigate('attendance')}>
            <i className="fa-solid fa-clipboard-user"></i> Mark Attendance
          </button>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon gold">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Active Sites</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.active}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{ fontSize: '9px' }}></i> Live in Database
            </div>
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Total Sites / Clients</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.total}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{ fontSize: '9px' }}></i> Live in Database
            </div>
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-icon green">
            <i className="fa-solid fa-user-group"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Active Workers</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : employeeCount}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{ fontSize: '9px' }}></i> Registered Employees
            </div>
          </div>
        </div>

        <div 
          className="dash-kpi" 
          onClick={() => onNavigate && onNavigate('salary')} 
          style={{ cursor: 'pointer' }}
          title="Click to view salary details"
        >
          <div className="dash-kpi-icon purple">
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Present Month Payroll</div>
            <div className="dash-kpi-value">
              {loadingStats ? '...' : `₹${presentMonthPayroll.toLocaleString('en-IN')}`}
            </div>
            <div className="dash-kpi-meta success" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '10px' }}></i> Real attendance: {presentMonthDays.toFixed(1)} days
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="dash-quick-actions">
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('sites')}>
          <i className="fa-solid fa-location-dot"></i> Add Site / Customer
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('employees')}>
          <i className="fa-solid fa-user-tie"></i> Add Employee
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('attendance')}>
          <i className="fa-solid fa-clipboard-check"></i> View Attendance
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('salary')}>
          <i className="fa-solid fa-money-bill-wave"></i> Process Salary
        </button>
      </div>

      {/* ===== Main Grid: Sites + Attendance ===== */}
      <div className="dash-grid-main">

        {/* Real Attendance Snapshot (1st - 100% Width) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-clipboard-user"></i> Today's Attendance
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('attendance')}>
              Details
            </button>
          </div>
          <div className="dash-card-body">
            {/* Attendance Summary Counters */}
            <div className="dash-attendance-summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value success">{presentCount}</div>
                <div className="dash-attendance-stat-label">Logged</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value danger">{absentCount}</div>
                <div className="dash-attendance-stat-label">Not Punched</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value info">{employeeCount}</div>
                <div className="dash-attendance-stat-label">Total Workers</div>
              </div>
            </div>

            {/* Recent Check-ins */}
            {todayAttendance.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF' }}>
                <i className="fa-regular fa-calendar-check" style={{ fontSize: '26px', color: '#D1D5DB', marginBottom: '8px' }}></i>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>No attendance punches logged yet today.</div>
                <button
                  onClick={() => onNavigate && onNavigate('attendance')}
                  style={{
                    marginTop: '10px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Mark Attendance
                </button>
              </div>
            ) : (
              <div className="dash-attendance-list">
                {todayAttendance.slice(0, 5).map(log => (
                  <div key={log.id} className="dash-attendance-item">
                    <div className="dash-attendance-info">
                      <div className="dash-attendance-name">{log.name}</div>
                      <div className="dash-attendance-site">{log.siteName || log.siteRef}</div>
                    </div>
                    <div className="dash-attendance-time">
                      <div className="dash-attendance-badge in">
                        <i className="fa-solid fa-arrow-right-to-bracket" style={{ fontSize: '10px' }}></i> {log.inTime}
                      </div>
                      <div className="dash-attendance-loc">{log.valueText}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="dash-card-footer">
            <button className="dash-view-all" onClick={() => onNavigate && onNavigate('attendance')}>
              View All Logs <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
            </button>
          </div>
        </div>

        {/* Real Active Sites (2nd - 100% Width) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-location-dot"></i> Active Sites
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('sites')}>
              View All <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px', marginLeft: '3px' }}></i>
            </button>
          </div>
          <div className="dash-card-body">
            {activeSitesList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>
                <i className="fa-regular fa-folder-open" style={{ fontSize: '28px', color: '#D1D5DB', marginBottom: '8px' }}></i>
                <div>No running sites right now.</div>
              </div>
            ) : (
              <table className="dash-project-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Site Code</th>
                    <th style={{ width: '25%' }}>Customer / Site Name</th>
                    <th style={{ width: '24%' }}>Location</th>
                    <th style={{ width: '22%' }}>Contact Info</th>
                    <th style={{ width: '14%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSitesList.map(site => (
                    <tr key={site.id}>
                      <td>
                        <span style={{
                          background: 'rgba(185, 120, 45, 0.08)',
                          color: 'var(--gold, #B9782D)',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          border: '1px solid rgba(185, 120, 45, 0.2)',
                          letterSpacing: '0.5px',
                          fontFamily: 'monospace'
                        }}>
                          {site.siteRef || site.id}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>
                          {site.customerName}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', fontSize: '11px' }}></i>
                          <span>{site.location || 'Location'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-phone" style={{ fontSize: '10px', color: 'var(--gold, #B9782D)' }}></i>
                          <span>{site.phone || 'N/A'}</span>
                        </div>
                        {site.email && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-envelope" style={{ fontSize: '10px', color: '#9CA3AF' }}></i>
                            <span>{site.email}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="status-badge running">
                          <span className="status-dot"></span> {site.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    </main>
  );
};

export default Dashboard;
