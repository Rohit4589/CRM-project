import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const EmployeeSalary = ({ user, onNavigate }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');

  const userId = user?.dbId || user?.id || 2;
  const dailyRate = Number(user?.dailySalary || user?.dailyRate || 1000);

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/attendance/employee/${userId}`);
        const data = await res.json();
        if (data.success) {
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Error fetching salary attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, [userId]);

  const availableMonths = Array.from(new Set(records.map(r => r.monthYear).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (selectedMonth === 'All') return true;
    return r.monthYear === selectedMonth;
  });

  const totalDays = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.dayValue) || 1.0), 0);
  const fullDays = filteredRecords.filter(r => (parseFloat(r.dayValue) || 0) >= 1.0).length;
  const halfDays = filteredRecords.filter(r => (parseFloat(r.dayValue) || 0) === 0.5).length;
  const grossEarnings = Math.round(totalDays * dailyRate);
  const advanceDeduction = 0;
  const netSalary = grossEarnings - advanceDeduction;

  return (
    <main className="dashboard-content" style={{ padding: '24px 28px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
            My Salary & Earnings
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Employee: <strong>{user?.name || 'Worker'}</strong> ({user?.id || 'EMP-101'}) · Real-time attendance wage statement
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '500' }}
          >
            <option value="All">All Punches</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={() => onNavigate && onNavigate('emp-reports')}
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <i className="fa-solid fa-file-invoice"></i> View Official Payslip
          </button>
        </div>
      </div>

      {/* Main Net Pay Highlight Card */}
      <div style={{
        background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        borderRadius: '14px',
        padding: '26px 28px',
        color: '#fff',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gold-light, #D4993F)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              {selectedMonth === 'All' ? 'Current Logged Net Salary' : `${selectedMonth} Net Salary`}
            </div>
            <div style={{ fontSize: '34px', fontWeight: '800', color: '#F9FAFB', letterSpacing: '-0.5px' }}>
              ₹{netSalary.toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span style={{
                background: totalDays > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                color: totalDays > 0 ? '#34D399' : '#9CA3AF',
                padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
              }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                {totalDays > 0 ? 'Verified & Calculated' : 'No Punches Logged'}
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '14px 20px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' }}>Daily Wage Rate</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gold-light, #D4993F)' }}>₹{dailyRate.toLocaleString('en-IN')} / day</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
              Total Attendance: <strong>{totalDays.toFixed(1)} Days</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Calculation Breakdown */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '22px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
          Real Salary Calculation Breakdown
        </h3>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>Total Days Worked</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{fullDays} Full Days + {halfDays} Half-Days</div>
            </div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{totalDays.toFixed(1)} Days</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>Base Daily Wage Rate</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>Agreed rate from employee profile</div>
            </div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>₹{dailyRate.toLocaleString('en-IN')} / day</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '14px' }}>Gross Earnings</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{totalDays.toFixed(1)} Days × ₹{dailyRate.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#111827' }}>₹{grossEarnings.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>Advances / Deductions</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>None applied</div>
            </div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#DC2626' }}>- ₹{advanceDeduction}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 18px', background: 'var(--gold-bg, rgba(185, 120, 45, 0.08))' }}>
            <div>
              <div style={{ fontWeight: '800', color: 'var(--navy, #111827)', fontSize: '15px' }}>Net Payable Amount</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>Final take-home earnings</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--gold, #B9782D)' }}>
              ₹{netSalary.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

    </main>
  );
};

export default EmployeeSalary;
