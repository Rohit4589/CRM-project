import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import { getTranslation } from '../../utils/translations';

const EmployeeSalary = ({ user, onNavigate, lang = 'hi' }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [employeeProfile, setEmployeeProfile] = useState(user || null);

  const t = {
    mySalary: getTranslation(lang, 'mySalary'),
    salarySubtitle: getTranslation(lang, 'salarySubtitle'),
    allMonths: getTranslation(lang, 'allMonths'),
    downloadPayslip: getTranslation(lang, 'downloadPayslip'),
    netSalary: getTranslation(lang, 'netSalary'),
    verifiedCalculated: getTranslation(lang, 'verifiedCalculated'),
    noPunchesLogged: getTranslation(lang, 'noPunchesLogged'),
    dailyWageRate: getTranslation(lang, 'dailyWageRate'),
    totalAttendance: getTranslation(lang, 'totalAttendance'),
    calculationBreakdown: getTranslation(lang, 'calculationBreakdown'),
    daysWorked: getTranslation(lang, 'daysWorked'),
    fullDaysCount: getTranslation(lang, 'fullDaysCount'),
    halfDaysCount: getTranslation(lang, 'halfDaysCount'),
    grossEarned: getTranslation(lang, 'grossEarned'),
    advanceTaken: getTranslation(lang, 'advanceTaken'),
    netPayable: getTranslation(lang, 'netPayable'),
    perDay: getTranslation(lang, 'perDay'),
    days: getTranslation(lang, 'days')
  };

  const userId = user?.dbId || user?.id || 2;

  // Fetch real attendance records and fresh employee profile from DB
  useEffect(() => {
    const fetchSalaryData = async () => {
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
        console.error('Error fetching salary attendance from DB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, [userId]);

  const dailyRate = Number(employeeProfile?.dailySalary || employeeProfile?.dailyRate || user?.dailySalary || user?.dailyRate || 1000);

  const availableMonths = Array.from(new Set(records.map(r => r.monthYear).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (selectedMonth === 'All') return true;
    return r.monthYear === selectedMonth;
  });

  // Only count Approved/Verified records in salary
  const approvedRecords = filteredRecords.filter(r => r.status === 'Approved' || r.status === 'Verified');
  const totalDays = approvedRecords.reduce((sum, r) => sum + (parseFloat(r.dayValue) || 0), 0);
  const fullDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) >= 1.0).length;
  const halfDays = approvedRecords.filter(r => (parseFloat(r.dayValue) || 0) === 0.5).length;
  const grossEarnings = Math.round(totalDays * dailyRate);
  const advanceDeduction = 0;
  const netSalary = grossEarnings - advanceDeduction;

  return (
    <main className="dashboard-content" style={{ padding: 'clamp(12px, 2.5vw, 24px)', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1F1A17' }}>
            {t.mySalary}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#7D6C5E'}}>
            {t.salarySubtitle}
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #D1C2AF', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '600', color: '#1F1A17' }}
          >
            <option value="All">{t.allMonths}</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={() => onNavigate && onNavigate('emp-reports')}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: '#FFFFFF', border: '1.5px solid #D1C2AF',
              color: '#5C3D24', fontWeight: '700', fontSize: '12.5px',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 1px 3px rgba(100, 70, 40, 0.05)'
            }}
          >
            <i className="fa-solid fa-file-invoice" style={{color: '#8C5521'}}></i> {t.downloadPayslip}
          </button>
        </div>
      </div>

      {/* Main Net Pay Highlight Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px 22px',
        marginBottom: '20px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #8C7B6D)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              {selectedMonth === 'All' ? t.netSalary : `${selectedMonth} ${t.netSalary}`}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--coffee-medium, #8C5521)', letterSpacing: '-0.5px' }}>
              ₹{netSalary.toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{
                background: totalDays > 0 ? '#ECFDF5' : '#FAF8F5',
                color: totalDays > 0 ? '#059669' : '#8C7B6D',
                border: totalDays > 0 ? '1px solid #A7F3D0' : '1px solid #D1C2AF',
                padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '700'
              }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                {totalDays > 0 ? t.verifiedCalculated : t.noPunchesLogged}
              </span>
            </div>
          </div>

          <div style={{
            background: '#FAF8F5',
            border: '1.5px solid var(--coffee-border, #D1C2AF)',
            borderRadius: '10px',
            padding: '12px 18px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #8C7B6D)', textTransform: 'uppercase', fontWeight: '700' }}>{t.dailyWageRate}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)' }}>₹{dailyRate.toLocaleString('en-IN')} <span style={{fontSize: '11px', fontWeight: '600', color: '#7D6C5E'}}>{t.perDay}</span></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #8C7B6D)', marginTop: '2px' }}>
              {t.totalAttendance}: <strong style={{color: '#1F1A17'}}>{Number(totalDays.toFixed(2))} {t.days}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Calculation Breakdown */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '18px 20px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '800', color: '#1F1A17', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-calculator" style={{color: 'var(--coffee-medium, #8C5521)'}}></i>
          {t.calculationBreakdown}
        </h3>

        <div style={{ border: '1px solid var(--coffee-border, #D1C2AF)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F3EDE6' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1F1A17', fontSize: '13px' }}>{t.daysWorked}</div>
              <div style={{ fontSize: '11px', color: '#7D6C5E' }}>{fullDays} {t.fullDaysCount} + {halfDays} {t.halfDaysCount}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1F1A17' }}>{(totalDays % 1 === 0 ? totalDays.toFixed(0) : parseFloat(totalDays.toFixed(2)))} {t.days}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F3EDE6' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1F1A17', fontSize: '13px' }}>{t.dailyWageRate}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1F1A17' }}>₹{dailyRate.toLocaleString('en-IN')} {t.perDay}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#FAF8F5', borderBottom: '1px solid #F3EDE6' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1F1A17', fontSize: '13px' }}>{t.grossEarned}</div>
              <div style={{ fontSize: '11px', color: '#7D6C5E' }}>{(totalDays % 1 === 0 ? totalDays.toFixed(0) : parseFloat(totalDays.toFixed(2)))} {t.days} × ₹{dailyRate.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--coffee-medium, #8C5521)' }}>₹{grossEarnings.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F3EDE6' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1F1A17', fontSize: '13px' }}>{t.advanceTaken}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: advanceDeduction > 0 ? '#DC2626' : '#7D6C5E' }}>
              {advanceDeduction > 0 ? `- ₹${advanceDeduction}` : '₹0'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(140, 85, 33, 0.08)' }}>
            <div>
              <div style={{ fontWeight: '800', color: 'var(--coffee-dark, #5C3D24)', fontSize: '14px' }}>{t.netPayable}</div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--coffee-medium, #8C5521)' }}>
              ₹{netSalary.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

    </main>
  );
};

export default EmployeeSalary;
