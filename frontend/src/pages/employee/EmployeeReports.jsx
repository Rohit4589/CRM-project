import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const EmployeeReports = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');

  const userId = user?.dbId || user?.id || 2;
  const dailyRate = Number(user?.dailySalary || user?.dailyRate || 1000);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/attendance/employee/${userId}`);
        const data = await res.json();
        if (data.success) {
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Error fetching payslip attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
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
  const totalDeductions = 0;
  const netPayable = grossEarnings - totalDeductions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="dashboard-content" style={{ padding: '24px 28px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Action Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
            My Monthly Payslip & Report
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Official salary certificate issued by Modern Interior Management.
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '500' }}
          >
            <option value="All">All Time Punches</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={handlePrint}
            className="btn-primary" 
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            <i className="fa-solid fa-print"></i> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Official Formatted Payslip Card */}
      <div id="printable-payslip" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '36px 40px',
        border: '1px solid #D1D5DB',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative'
      }}>
        
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--gold, #B9782D)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', background: 'var(--gold, #B9782D)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px'
            }}>
              <i className="fa-solid fa-house"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--navy, #111827)' }}>Modern Interior</h2>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6B7280', fontWeight: '600' }}>Management System</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold, #B9782D)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SALARY PAYSLIP
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginTop: '2px' }}>
              Period: {selectedMonth}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontFamily: 'monospace' }}>
              Generated on: {(() => {
                const d = new Date();
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
              })()}
            </div>
          </div>
        </div>

        {/* Employee Particulars Grid */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '26px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' }}>Employee Name</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{user?.name || user?.fullName || 'Worker'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' }}>Employee ID</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold, #B9782D)', marginTop: '2px' }}>{user?.id || 'EMP-101'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' }}>Designation</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{user?.roleTitle || user?.role || 'Carpenter & Woodwork'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' }}>Registered Mobile</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{user?.mobile || user?.phone || 'N/A'}</div>
          </div>
        </div>

        {/* Attendance & Rate Details */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '12px 18px',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '24px'
        }}>
          <div>
            <span style={{ color: '#6B7280', fontSize: '13px' }}>Total Days Present: </span>
            <strong style={{ color: '#111827', fontSize: '14px' }}>{totalDays.toFixed(1)} Days</strong> ({fullDays} Full + {halfDays} Half)
          </div>
          <div>
            <span style={{ color: '#6B7280', fontSize: '13px' }}>Daily Wage Rate: </span>
            <strong style={{ color: '#111827', fontSize: '14px' }}>₹{dailyRate.toLocaleString('en-IN')} / Day</strong>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#111827', color: '#fff', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Earnings Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 16px', borderLeft: '1px solid #374151' }}>Deductions Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500' }}>
                  Base Daily Wages ({totalDays.toFixed(1)} Days × ₹{dailyRate.toLocaleString('en-IN')})
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', textAlign: 'right' }}>
                  ₹{grossEarnings.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280', borderLeft: '1px solid #E5E7EB' }}>
                  Salary Advances
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#6B7280', textAlign: 'right' }}>
                  ₹{totalDeductions.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ background: '#F9FAFB', fontWeight: '700' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>Total Gross Earnings</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'right', color: '#111827' }}>₹{grossEarnings.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', borderLeft: '1px solid #E5E7EB' }}>Total Deductions</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'right', color: '#6B7280' }}>₹{totalDeductions.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Amount Box */}
        <div style={{
          background: 'rgba(185, 120, 45, 0.08)',
          border: '2px solid rgba(185, 120, 45, 0.3)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '36px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold, #B9782D)', fontWeight: '700' }}>
              NET SALARY PAYABLE
            </div>
            <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>
              Computed dynamically based on logged punch verified days.
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gold, #B9782D)' }}>
            ₹{netPayable.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Footer Authorization */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #D1D5DB' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>System Generated Payslip</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Modern Interior CRM Platform</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '160px', borderBottom: '1px solid #111827', marginBottom: '6px' }}></div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Authorized Signatory</div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Mahendra Sharma (Administrator)</div>
          </div>
        </div>

      </div>

    </main>
  );
};

export default EmployeeReports;
