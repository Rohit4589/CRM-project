import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { API_BASE } from '../config/api';
import { getTranslation } from '../utils/translations';

const Dashboard = ({ onNavigate, user, lang = 'en' }) => {
  const t = (key) => getTranslation(lang, key);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [siteStats, setSiteStats] = useState({ total: 0, active: 0 });
  const [activeSitesList, setActiveSitesList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [isLatestFallback, setIsLatestFallback] = useState(false);
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

  const formatToDMY = (dateStr) => {
    if (!dateStr) return '--';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const isYesterday = (dStr) => {
    if (!dStr) return false;
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    return yDate.toISOString().split('T')[0] === dStr;
  };

  const getAttendanceLabel = () => {
    if (!isLatestFallback) return t('todayAttendance');
    if (isYesterday(attendanceDate)) {
      return lang === 'hi' ? 'कल की हाजिरी (Yesterday)' : (lang === 'mr' ? 'कालची हजेरी (Yesterday)' : "Yesterday's Attendance");
    }
    return t('lastAttendance') || "Last Day Attendance";
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
          // Only include Approved and Verified records in monthly payroll & days
          const approvedLogs = monthLogs.filter(log => log.status === 'Approved' || log.status === 'Verified');
          const totalDays = approvedLogs.reduce((sum, log) => sum + (parseFloat(log.dayValue) || 0), 0);
          const realPayroll = approvedLogs.reduce((sum, log) => {
            const dayVal = parseFloat(log.dayValue) || 0;
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

        // Attendance snapshot: if today has no records, show the last completed work day's attendance
        if (attRes.success && Array.isArray(attRes.attendance) && attRes.attendance.length > 0) {
          setAttendanceRecords(attRes.attendance);
          setAttendanceDate(today);
          setIsLatestFallback(false);
        } else {
          const latestRes = await fetch(`${API_BASE}/attendance?date=latest`).then(r => r.json()).catch(() => ({ success: false }));
          if (latestRes.success && Array.isArray(latestRes.attendance) && latestRes.attendance.length > 0) {
            setAttendanceRecords(latestRes.attendance);
            setAttendanceDate(latestRes.latestDate || latestRes.filterDate || '');
            setIsLatestFallback(true);
          } else {
            setAttendanceRecords([]);
            setAttendanceDate(today);
            setIsLatestFallback(false);
          }
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
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  const formatDate = () => {
    const locale = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const presentCount = attendanceRecords.length;
  const absentCount = Math.max(0, employeeCount - presentCount);

  return (
    <main className="dashboard">

      {/* ===== Hero / Welcome ===== */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <h1>{getGreeting()}, {user?.name || 'Admin'}</h1>
          <p className="dash-hero-desc" style={{ margin: '3px 0 6px 0' }}>
            {t('dailyOpsOverview')}
          </p>
          <div className="dash-date">
            <i className="fa-regular fa-calendar"></i>
            {formatDate()}
          </div>
        </div>
        <div className="dash-hero-actions">
          <button className="btn-primary" onClick={() => onNavigate && onNavigate('attendance')}>
            <i className="fa-solid fa-clipboard-user"></i> {t('markAttendance')}
          </button>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{t('activeSites')}</span>
          </div>
          <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.active}</div>
          <div className="dash-kpi-meta" style={{ marginTop: '4px' }}>
            {t('runningSitesMeta')}
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{t('clients')}</span>
          </div>
          <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.total}</div>
          <div className="dash-kpi-meta" style={{ marginTop: '4px' }}>
            {t('totalClientsMeta')}
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{t('employees')}</span>
          </div>
          <div className="dash-kpi-value">{loadingStats ? '...' : employeeCount}</div>
          <div className="dash-kpi-meta" style={{ marginTop: '4px' }}>
            {t('registeredStaffMeta')}
          </div>
        </div>

        <div 
          className="dash-kpi clickable" 
          onClick={() => onNavigate && onNavigate('salary')} 
          title="View salary details"
        >
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{t('monthPayroll')}</span>
          </div>
          <div className="dash-kpi-value">
            {loadingStats ? '...' : `₹${presentMonthPayroll.toLocaleString('en-IN')}`}
          </div>
          <div className="dash-kpi-meta success" style={{ color: '#047857', fontWeight: '700', marginTop: '4px' }}>
            {(presentMonthDays % 1 === 0 ? presentMonthDays.toFixed(0) : parseFloat(presentMonthDays.toFixed(2)))} {t('daysLogged')}
          </div>
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="dash-quick-actions">
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('sites')}>
          <i className="fa-solid fa-plus"></i> {t('addSite')}
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('employees')}>
          <i className="fa-solid fa-plus"></i> {t('addEmployee')}
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('attendance')}>
          <i className="fa-solid fa-clipboard-user"></i> {t('attendance')}
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('salary')}>
          <i className="fa-solid fa-money-bill-wave"></i> {t('payroll')}
        </button>
      </div>

      {/* ===== Main Grid: Sites + Attendance ===== */}
      <div className="dash-grid-main">

        {/* Real Attendance Snapshot (1st - 100% Width) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <i className="fa-solid fa-clipboard-user"></i>
              <span>{getAttendanceLabel()}</span>
              {attendanceDate && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isLatestFallback ? '#FEF3C7' : '#ECFDF5',
                  color: isLatestFallback ? '#92400E' : '#065F46',
                  border: isLatestFallback ? '1px solid #FDE68A' : '1px solid #A7F3D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="fa-regular fa-calendar-check" style={{ fontSize: '10px' }}></i>
                  {formatToDMY(attendanceDate)}
                </span>
              )}
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('attendance', { date: attendanceDate })}>
              {t('details')}
            </button>
          </div>
          <div className="dash-card-body">
            {/* Attendance Summary Counters */}
            <div className="dash-attendance-summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value success">{presentCount}</div>
                <div className="dash-attendance-stat-label">{t('present')}</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value danger">{absentCount}</div>
                <div className="dash-attendance-stat-label">{t('absent')}</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value info">{employeeCount}</div>
                <div className="dash-attendance-stat-label">{t('total')}</div>
              </div>
            </div>

            {/* Recent Check-ins */}
            {attendanceRecords.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7D6C5E' }}>
                <i className="fa-regular fa-calendar-check" style={{ fontSize: '26px', color: '#D1C2AF', marginBottom: '8px' }}></i>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{t('noAttendanceToday')}</div>
                <button
                  onClick={() => onNavigate && onNavigate('attendance')}
                  style={{
                    marginTop: '10px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #D1C2AF',
                    background: '#fff',
                    color: '#4A2C17',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('markAttendance')}
                </button>
              </div>
            ) : (
              <div className="dash-attendance-list">
                {attendanceRecords.slice(0, 6).map(log => (
                  <div key={log.id} className="dash-attendance-item">
                    <div className="dash-attendance-info">
                      <div className="dash-attendance-name">{log.name}</div>
                      <div className="dash-attendance-site">{log.siteName || log.customerName || log.siteRef}</div>
                    </div>
                    <div className="dash-attendance-time">
                      <div className="dash-attendance-badge in">
                        <i className="fa-solid fa-clock" style={{ fontSize: '10px' }}></i> {log.valueText || `${log.dayValue} Day`}
                      </div>
                      <div className="dash-attendance-loc" style={{ fontWeight: '700', color: '#065F46' }}>
                        ₹{(Math.round((parseFloat(log.dayValue) || 1) * (Number(log.dailyRate) || 0))).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="dash-card-footer">
            <button className="dash-view-all" onClick={() => onNavigate && onNavigate('attendance', { date: attendanceDate })}>
              {t('viewAll')} <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
            </button>
          </div>
        </div>

        {/* Real Active Sites (2nd - 100% Width) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-location-dot"></i> {t('activeSites')}
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('sites')}>
              {t('viewAll')} <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px', marginLeft: '3px' }}></i>
            </button>
          </div>
          <div className="dash-card-body table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: 0 }}>
            {activeSitesList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#8C7B6D' }}>
                <i className="fa-regular fa-folder-open" style={{ fontSize: '28px', color: '#D1C2AF', marginBottom: '8px' }}></i>
                <div>{t('noActiveSites')}</div>
              </div>
            ) : (
              <table className="dash-project-table" style={{ minWidth: '650px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>{t('codeCol')}</th>
                    <th style={{ width: '25%' }}>{t('siteClientCol')}</th>
                    <th style={{ width: '24%' }}>{t('locationCol')}</th>
                    <th style={{ width: '22%' }}>{t('contactCol')}</th>
                    <th style={{ width: '14%' }}>{t('statusCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSitesList.map(site => (
                    <tr key={site.id}>
                      <td>
                        <span style={{
                          background: 'rgba(165, 106, 48, 0.08)',
                          color: 'var(--gold, #A56A30)',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          border: '1px solid rgba(165, 106, 48, 0.2)',
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
                          <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', fontSize: '11px' }}></i>
                          <span>{site.location || 'Location'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-phone" style={{ fontSize: '10px', color: 'var(--gold, #A56A30)' }}></i>
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
