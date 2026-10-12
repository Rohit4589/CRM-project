import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const EmployeeAttendance = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedSelfie, setSelectedSelfie] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user?.dbId || user?.id || 2;

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/attendance/employee/${userId}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
      } else {
        setError(data.message || 'Failed to load records');
      }
    } catch (err) {
      console.error('Error fetching employee attendance:', err);
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

  // Calculate real metrics
  const totalDays = filteredRecords.reduce((acc, r) => acc + (parseFloat(r.dayValue) || 1.0), 0);
  const fullDays = filteredRecords.filter(r => (parseFloat(r.dayValue) || 0) >= 1.0).length;
  const halfDays = filteredRecords.filter(r => (parseFloat(r.dayValue) || 0) === 0.5).length;
  const dailyRate = Number(user?.dailySalary || user?.dailyRate || 1000);
  const estimatedEarned = Math.round(totalDays * dailyRate);

  return (
    <main className="dashboard-content" style={{ padding: '24px 28px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
            My Attendance Record
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Employee: <strong>{user?.name || 'Worker'}</strong> ({user?.id || 'EMP-101'}) · Daily GPS Punch Log
          </p>
        </div>

        <div className="header-actions">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              outline: 'none',
              background: '#fff',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info notice */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#166534'
      }}>
        <i className="fa-solid fa-location-crosshairs" style={{ fontSize: '18px', color: '#16A34A', flexShrink: 0 }}></i>
        <div>
          <strong>Self-Selected Site History:</strong> Each record below indicates the specific site picked by you or verified by admin, tracked against modern GPS site geofences.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Total Logged</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
            {totalDays.toFixed(1)} Days
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Full Days (1.0)</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#16A34A', marginTop: '2px' }}>
            {fullDays}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Half Days (0.5)</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            {halfDays}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Daily Rate</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '2px' }}>
            ₹{dailyRate.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Est. Total Earned</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
            ₹{estimatedEarned.toLocaleString('en-IN')}
          </div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              textAlign: 'left',
              color: '#6B7280',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{ padding: '14px 18px', width: '14%' }}>Date</th>
              <th style={{ padding: '14px 18px', width: '24%' }}>Picked Work Site</th>
              <th style={{ padding: '14px 18px', width: '12%' }}>IN Time</th>
              <th style={{ padding: '14px 18px', width: '12%' }}>OUT Time</th>
              <th style={{ padding: '14px 18px', width: '12%' }}>Attendance</th>
              <th style={{ padding: '14px 18px', width: '12%' }}>Day Salary</th>
              <th style={{ padding: '14px 18px', width: '14%' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', color: 'var(--gold, #B9782D)', marginBottom: '8px' }}></i>
                  <div>Loading your attendance logs...</div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                  <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '10px' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>No attendance records recorded yet</div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    Punch in from your Dashboard or have an Administrator mark your attendance.
                  </p>
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
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px', fontFamily: 'monospace' }}>
                        {formatDMY(rec.rawDate || rec.date)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #B9782D)', fontSize: '13px' }}></i>
                        <span style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>
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
                        ₹{Math.round((parseFloat(rec.dayValue) || 1.0) * dailyRate).toLocaleString('en-IN')}
                      </span>
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
