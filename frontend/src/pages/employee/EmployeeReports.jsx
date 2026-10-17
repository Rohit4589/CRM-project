import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import modernLogo from '../../assets/logo.png';
import { getTranslation } from '../../utils/translations';

const EmployeeReports = ({ user, lang = 'hi' }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [employeeProfile, setEmployeeProfile] = useState(user || null);

  const t = (key) => getTranslation(lang, key);

  const userId = user?.dbId || user?.id || 2;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const [attRes, empRes] = await Promise.all([
          fetch(`${API_BASE}/attendance/employee/${userId}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (attRes.success) {
          setRecords(attRes.records || []);
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
        console.error('Error fetching payslip attendance from DB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userId]);

  const dailyRate = Number(employeeProfile?.dailySalary || employeeProfile?.dailyRate || user?.dailySalary || user?.dailyRate || 1000);

  const availableMonths = Array.from(new Set(records.map(r => r.monthYear).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (selectedMonth === 'All') return true;
    return r.monthYear === selectedMonth;
  });

  // Only count Approved/Verified records in reports
  const approvedRecords = filteredRecords.filter(r => r.status === 'Approved' || r.status === 'Verified');
  const totalDays = approvedRecords.reduce((sum, r) => sum + (parseFloat(r.dayValue) || 0), 0);
  const fullDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) >= 1.0).length;
  const halfDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) === 0.5).length;
  const grossEarnings = Math.round(totalDays * dailyRate);
  const totalDeductions = 0;
  const netPayable = grossEarnings - totalDeductions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="dashboard-content" style={{ 
      padding: 'clamp(12px, 2.5vw, 24px)', 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      
      {/* Action Header */}
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginBottom: '18px' 
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '800', color: '#2B2520' }}>
            {t('myPayslip')}
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#7D6C5E' }}>
            {t('payslipSubtitle')}
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: '8px', 
              border: '1.5px solid #D1D5DB', 
              outline: 'none', 
              background: '#fff', 
              fontSize: '13px', 
              fontWeight: '600',
              color: '#2B2520'
            }}
          >
            <option value="All">{t('allMonths') || 'All Months'}</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={handlePrint}
            className="btn-primary" 
            style={{ 
              padding: '9px 16px', 
              fontSize: '13px',
              borderRadius: '8px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-print"></i> {t('printPayslip')}
          </button>
        </div>
      </div>

      {/* Official Formatted Payslip Card */}
      <div id="printable-payslip" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: 'clamp(16px, 3vw, 36px)',
        border: '1px solid #EAE4DD',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        
        {/* Company Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '2px solid var(--gold, #A56A30)', 
          paddingBottom: '16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={modernLogo} 
              alt="Modern Interior" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold, #A56A30)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('salaryPayslipTitle')}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2B2520', marginTop: '2px' }}>
              {t('period')} <span style={{ fontFamily: 'monospace' }}>{selectedMonth}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontFamily: 'monospace' }}>
              {t('generatedOn')} {(() => {
                const d = new Date();
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
              })()}
            </div>
          </div>
        </div>

        {/* Employee Particulars Grid */}
        <div style={{
          background: '#FAF8F5',
          border: '1px solid #EAE4DD',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#7D6C5E', textTransform: 'uppercase', fontWeight: '700' }}>
              {t('employeeName')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#2B2520', marginTop: '2px' }}>
              {employeeProfile?.name || employeeProfile?.fullName || user?.name || user?.fullName || 'Worker'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#7D6C5E', textTransform: 'uppercase', fontWeight: '700' }}>
              {t('employeeId')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--gold, #A56A30)', marginTop: '2px' }}>
              {employeeProfile?.id || user?.id || (user?.empCode ? `EMP-${user.empCode}` : 'EMP-101')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#7D6C5E', textTransform: 'uppercase', fontWeight: '700' }}>
              {t('designation')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2B2520', marginTop: '2px' }}>
              {employeeProfile?.role || employeeProfile?.roleTitle || user?.roleTitle || user?.role || 'Carpenter'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#7D6C5E', textTransform: 'uppercase', fontWeight: '700' }}>
              {t('registeredMobile')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2B2520', marginTop: '2px' }}>
              {employeeProfile?.phone || user?.mobile || user?.phone || 'N/A'}
            </div>
          </div>
        </div>

        {/* Attendance & Rate Details */}
        <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 16px',
          background: '#fff', 
          border: '1px solid #EAE4DD', 
          borderRadius: '10px', 
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ color: '#7D6C5E', fontSize: '13px' }}>{t('totalDaysPresent')}: </span>
            <strong style={{ color: '#2B2520', fontSize: '14px' }}>{Number(totalDays.toFixed(2))} Days</strong> 
            <span style={{ fontSize: '12px', color: '#7D6C5E', marginLeft: '4px' }}>({fullDays}F + {halfDays}H)</span>
          </div>
          <div>
            <span style={{ color: '#7D6C5E', fontSize: '13px' }}>{t('dailyWageRate')}: </span>
            <strong style={{ color: '#2B2520', fontSize: '14px' }}>₹{dailyRate.toLocaleString('en-IN')} / Day</strong>
          </div>
        </div>

        {/* Earnings & Deductions Table - Mobile horizontally scrollable */}
        <div style={{ 
          border: '1px solid #EAE4DD', 
          borderRadius: '10px', 
          overflowX: 'auto', 
          marginBottom: '20px',
          WebkitOverflowScrolling: 'touch'
        }}>
          <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#4A2C17', color: '#fff', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>{t('earningsDesc')}</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>{t('amount')}</th>
                <th style={{ padding: '12px 14px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>{t('deductionsDesc')}</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #EAE4DD' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500' }}>
                  {t('baseDailyWages')} ({(totalDays % 1 === 0 ? totalDays.toFixed(0) : parseFloat(totalDays.toFixed(2)))} Days × ₹{dailyRate.toLocaleString('en-IN')})
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', textAlign: 'right', color: '#2B2520' }}>
                  ₹{grossEarnings.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#7D6C5E', borderLeft: '1px solid #EAE4DD' }}>
                  {t('salaryAdvances')}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#7D6C5E', textAlign: 'right' }}>
                  ₹{totalDeductions.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ background: '#FAF8F5', fontWeight: '700' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#2B2520' }}>{t('totalGrossEarnings')}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'right', color: '#2B2520' }}>₹{grossEarnings.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', borderLeft: '1px solid #EAE4DD', color: '#7D6C5E' }}>{t('totalDeductions')}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'right', color: '#7D6C5E' }}>₹{totalDeductions.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Amount Box */}
        <div style={{
          background: 'rgba(165, 106, 48, 0.08)',
          border: '1.5px solid rgba(165, 106, 48, 0.35)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '26px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7A4518', fontWeight: '800' }}>
              {t('netSalaryPayable')}
            </div>
            <div style={{ fontSize: '12px', color: '#7D6C5E', marginTop: '2px' }}>
              {t('netPayableNote')}
            </div>
          </div>
          <div style={{ fontSize: 'clamp(24px, 5vw, 30px)', fontWeight: '800', color: '#7A4518' }}>
            ₹{netPayable.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Footer Authorization */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          flexWrap: 'wrap',
          gap: '16px',
          paddingTop: '16px', 
          borderTop: '1px dashed #D1D5DB' 
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>{t('systemGenerated')}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Modern Interior CRM</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '140px', borderBottom: '1px solid #4A2C17', marginBottom: '6px' }}></div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#2B2520' }}>{t('authorizedSignatory')}</div>
            <div style={{ fontSize: '10px', color: '#7D6C5E' }}>Mahendra Sharma</div>
          </div>
        </div>

      </div>

    </main>
  );
};

export default EmployeeReports;
