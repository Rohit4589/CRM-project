import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEmployeeId, setActiveEmployeeId] = useState(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, attRes] = await Promise.all([
          fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/attendance?month=${selectedMonth}`).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (empRes.success) setEmployees(empRes.employees || []);
        if (attRes.success) setAttendanceLogs(attRes.attendance || []);
      } catch (err) {
        console.error('Error fetching salary data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Compute salary per employee based on real attendance
  const salaryRows = employees.map(emp => {
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

  const totalPayroll = salaryRows.reduce((sum, r) => sum + r.netPayable, 0);

  // Active employee for full-page day-wise breakdown view
  const activeEmployee = activeEmployeeId ? salaryRows.find(r => r.id === activeEmployeeId) : null;

  return (
    <main className="dashboard-content" style={{ padding: '24px 30px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* =========================================================================
          VIEW A: INDIVIDUAL EMPLOYEE DAY-WISE SALARY STATEMENT (FULL CONTAINER VIEW)
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
      ) : (
        /* =========================================================================
           VIEW B: MASTER SALARY OVERVIEW TABLE (ALL EMPLOYEES)
           ========================================================================= */
        <div>
          {/* Page Header */}
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
                Monthly Salary Processing
              </h1>
            </div>

            <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                onClick={() => alert(`Total payroll for ${formatMonthName(selectedMonth)} is ₹${totalPayroll.toLocaleString('en-IN')}. Release process ready.`)}
                className="btn-primary"
                style={{
                  padding: '9px 18px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-money-bill-transfer"></i> Process Payroll
              </button>
            </div>
          </div>

          {/* Salary Table (Clean 7 columns, No extra breakdown column) */}
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
                ) : salaryRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                      No active employees found in database.
                    </td>
                  </tr>
                ) : (
                  salaryRows.map((row) => (
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
        </div>
      )}

    </main>
  );
};

export default Salary;
