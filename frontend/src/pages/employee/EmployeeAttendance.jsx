import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import { getTranslation } from '../../utils/translations';

const EmployeeAttendance = ({ user, lang = 'hi' }) => {
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedSelfie, setSelectedSelfie] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeProfile, setEmployeeProfile] = useState(user || null);

  const t = {
    myAttendance: getTranslation(lang, 'myAttendance'),
    attendanceSubtitle: getTranslation(lang, 'attendanceSubtitle'),
    allMonths: getTranslation(lang, 'allMonths'),
    totalDays: getTranslation(lang, 'totalDays'),
    fullDays: getTranslation(lang, 'fullDays'),
    halfDays: getTranslation(lang, 'halfDays'),
    dailyRate: getTranslation(lang, 'dailyRate'),
    totalEarned: getTranslation(lang, 'totalEarned'),
    dateCol: getTranslation(lang, 'dateCol'),
    siteCol: getTranslation(lang, 'siteCol'),
    inTimeCol: getTranslation(lang, 'inTimeCol'),
    outTimeCol: getTranslation(lang, 'outTimeCol'),
    statusCol: getTranslation(lang, 'statusCol'),
    salaryCol: getTranslation(lang, 'salaryCol'),
    notesCol: getTranslation(lang, 'notesCol'),
    noRecordsFound: getTranslation(lang, 'noRecordsFound'),
    loadingRecords: getTranslation(lang, 'loadingRecords'),
    days: getTranslation(lang, 'days')
  };

  const userId = user?.dbId || user?.id || 2;

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const [attRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/attendance/employee/${userId}`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (attRes.success) {
        setRecords(attRes.records || []);
      } else {
        setError(attRes.message || 'Failed to load records');
      }

      if (empRes.success && empRes.employees) {
        const matched = empRes.employees.find(e => 
          String(e.dbId) === String(userId) || 
          String(e.id) === String(user?.id) || 
          (user?.mobile && e.phone === user?.mobile)
        );
        if (matched) setEmployeeProfile(prev => ({ ...prev, ...matched }));
      }
    } catch (err) {
      console.error('Error fetching employee attendance from DB:', err);
      setError('Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  // Months available in records
  const availableMonths = Array.from(new Set(records.map(r => r.monthYear).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (selectedMonth === 'All') return true;
    return r.monthYear === selectedMonth;
  });

  // Calculate real metrics - only count Approved/Verified records
  const approvedRecords = filteredRecords.filter(r => r.status === 'Approved' || r.status === 'Verified');
  const totalDays = approvedRecords.reduce((acc, r) => acc + (parseFloat(r.dayValue) || 0), 0);
  const fullDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) >= 1.0).length;
  const halfDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) === 0.5).length;
  const dailyRate = Number(employeeProfile?.dailySalary || employeeProfile?.dailyRate || user?.dailySalary || user?.dailyRate || 1000);
  const estimatedEarned = Math.round(totalDays * dailyRate);

  return (
    <main className="dashboard-content" style={{ padding: 'clamp(12px, 2.5vw, 24px)', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1F1A17' }}>
            {t.myAttendance}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#7D6C5E' }}>
            {t.attendanceSubtitle}
          </p>
        </div>

        <div className="header-actions">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #D1C2AF',
              outline: 'none',
              background: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1F1A17'
            }}
          >
            <option value="All">{t.allMonths}</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards (Admin Dashboard Palette) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--coffee-border, #D1C2AF)', boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)' }}>
          <div style={{ fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.totalDays}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', marginTop: '2px' }}>
            {Number(totalDays.toFixed(2))} {t.days}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--coffee-border, #D1C2AF)', boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)' }}>
          <div style={{ fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.fullDays}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
            {fullDays}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--coffee-border, #D1C2AF)', boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)' }}>
          <div style={{ fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.halfDays}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            {halfDays}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--coffee-border, #D1C2AF)', boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)' }}>
          <div style={{ fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.dailyRate}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--coffee-medium, #8C5521)', marginTop: '2px' }}>
            ₹{dailyRate.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--coffee-border, #D1C2AF)', boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)' }}>
          <div style={{ fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.totalEarned}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
            ₹{estimatedEarned.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="panel table-responsive" style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{
              background: '#FAF8F5',
              borderBottom: '1px solid var(--coffee-border, #D1C2AF)',
              textAlign: 'left',
              color: '#5C3D24',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{ padding: '12px 16px', width: '14%' }}>{t.dateCol}</th>
              <th style={{ padding: '12px 16px', width: '26%' }}>{t.siteCol}</th>
              <th style={{ padding: '12px 16px', width: '12%' }}>{t.inTimeCol}</th>
              <th style={{ padding: '12px 16px', width: '12%' }}>{t.outTimeCol}</th>
              <th style={{ padding: '12px 16px', width: '12%' }}>{t.statusCol}</th>
              <th style={{ padding: '12px 16px', width: '12%' }}>{t.salaryCol}</th>
              <th style={{ padding: '12px 16px', width: '12%' }}>{t.notesCol}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', color: 'var(--coffee-medium, #8C5521)', marginBottom: '8px' }}></i>
                  <div>{t.loadingRecords}</div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                  <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '10px' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#4B5563' }}>{t.noRecordsFound}</div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const formatDMY = (dStr) => {
                  if (!dStr) return '--';
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
                    const [y, m, d] = dStr.split('-');
                    return `${d}-${m}-${y}`;
                  }
                  return dStr;
                };

                return (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: '700', color: '#2B2520', fontSize: '13px', fontFamily: 'monospace' }}>
                        {formatDMY(rec.rawDate || rec.date)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', fontSize: '13px' }}></i>
                        <span style={{ fontSize: '13px', color: '#2B2520', fontWeight: '600' }}>
                          {rec.siteId}: {rec.siteName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        {rec.inTime}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        background: rec.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2',
                        color: rec.outTime === '--:--' ? '#6B7280' : '#DC2626',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        {rec.outTime}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        background: rec.dayValue >= 1.0 ? '#ECFDF5' : '#FEF3C7',
                        color: rec.dayValue >= 1.0 ? '#065F46' : '#92400E',
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {rec.value}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      {rec.status === 'Approved' || rec.status === 'Verified' ? (
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
                          ₹{Math.round((parseFloat(rec.dayValue) || 0) * dailyRate).toLocaleString('en-IN')}
                        </span>
                      ) : rec.status === 'Pending Approval' ? (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px dashed #FCD34D',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-block'
                        }}>
                          ₹{Math.round((parseFloat(rec.dayValue) || 0) * dailyRate).toLocaleString('en-IN')} (Pending)
                        </span>
                      ) : rec.status === 'In Progress' ? (
                        <span style={{ color: '#6B7280', fontSize: '11.5px', fontStyle: 'italic' }}>
                          Working...
                        </span>
                      ) : (
                        <span style={{ color: '#DC2626', fontSize: '12px', fontWeight: '700' }}>
                          ₹0
                        </span>
                      )}
                    </td>
                  <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12px', color: '#6B7280' }}>
                    {rec.notes || '--'}
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

    </main>
  );
};

export default EmployeeAttendance;
