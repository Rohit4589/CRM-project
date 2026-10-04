import React, { useState } from 'react';

const EmployeeSalary = ({ user, onNavigate }) => {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  return (
    <main className="dashboard-content" style={{padding: '24px 28px', width: '100%'}}>
      
      {/* Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            My Salary & Earnings
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Employee: <strong>{user?.name || 'Anurag'}</strong> ({user?.id || 'EMP-101'}) · Monthly Wage Statement
          </p>
        </div>

        <div className="header-actions">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{padding: '8px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '500'}}
          >
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
          </select>
          <button 
            onClick={() => onNavigate && onNavigate('emp-reports')}
            className="btn-primary" 
            style={{padding: '8px 16px', fontSize: '13px'}}
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
          <div>
            <div style={{fontSize: '11px', color: 'var(--gold-light, #D4993F)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px'}}>
              September 2026 Net Salary
            </div>
            <div style={{fontSize: '34px', fontWeight: '800', color: '#F9FAFB', letterSpacing: '-0.5px'}}>
              ₹25,000
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)', color: '#34D399',
                padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
              }}>
                <i className="fa-solid fa-circle-check" style={{marginRight: '4px'}}></i> Status: Released & Paid
              </span>
              <span style={{color: '#9CA3AF', fontSize: '12px'}}>via Bank Transfer</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '14px 20px',
            textAlign: 'right'
          }}>
            <div style={{fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600'}}>Daily Wage Rate</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: 'var(--gold-light, #D4993F)'}}>₹1,000 / day</div>
            <div style={{fontSize: '11px', color: '#9CA3AF', marginTop: '2px'}}>Total Attendance: <strong>26.5 Days</strong></div>
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
        <h3 style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#111827'}}>
          Salary Calculation Breakdown
        </h3>

        <div style={{border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6'}}>
            <div>
              <div style={{fontWeight: '600', color: '#111827', fontSize: '13px'}}>Total Days Worked</div>
              <div style={{fontSize: '11px', color: '#6B7280'}}>26 Full Days + 1 Half-Day</div>
            </div>
            <div style={{fontWeight: '700', fontSize: '14px', color: '#111827'}}>26.5 Days</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6'}}>
            <div>
              <div style={{fontWeight: '600', color: '#111827', fontSize: '13px'}}>Base Wage Rate</div>
              <div style={{fontSize: '11px', color: '#6B7280'}}>Agreed daily rate as Carpenter</div>
            </div>
            <div style={{fontWeight: '700', fontSize: '14px', color: '#111827'}}>₹1,000 / day</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6'}}>
            <div>
              <div style={{fontWeight: '700', color: '#111827', fontSize: '14px'}}>Gross Earnings</div>
              <div style={{fontSize: '11px', color: '#6B7280'}}>26.5 Days × ₹1,000</div>
            </div>
            <div style={{fontWeight: '800', fontSize: '16px', color: '#111827'}}>₹26,500</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6'}}>
            <div>
              <div style={{fontWeight: '600', color: '#DC2626', fontSize: '13px'}}>Salary Advance Deductions</div>
              <div style={{fontSize: '11px', color: '#6B7280'}}>Advance cash received on 15 Sep 2026</div>
            </div>
            <div style={{fontWeight: '700', fontSize: '14px', color: '#DC2626'}}>- ₹1,500</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', padding: '16px 18px', background: 'rgba(185, 120, 45, 0.08)'}}>
            <div>
              <div style={{fontWeight: '800', color: 'var(--gold, #B9782D)', fontSize: '15px'}}>Net Amount Paid</div>
              <div style={{fontSize: '11px', color: '#6B7280'}}>Credited directly to account</div>
            </div>
            <div style={{fontWeight: '800', fontSize: '20px', color: 'var(--gold, #B9782D)'}}>₹25,000</div>
          </div>
        </div>
      </div>

      {/* Advance Taken History */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '22px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '24px'
      }}>
        <h3 style={{margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#111827'}}>
          Salary Advances & Deductions Log
        </h3>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #E5E7EB', textAlign: 'left', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase'}}>
              <th style={{padding: '10px 0'}}>Date</th>
              <th style={{padding: '10px 0'}}>Type</th>
              <th style={{padding: '10px 0'}}>Reason</th>
              <th style={{padding: '10px 0', textAlign: 'right'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #F3F4F6'}}>
              <td style={{padding: '12px 0', fontSize: '13px', fontWeight: '500'}}>15 Sep 2026</td>
              <td style={{padding: '12px 0', fontSize: '13px'}}><span style={{background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'}}>Advance Cash</span></td>
              <td style={{padding: '12px 0', fontSize: '13px', color: '#4B5563'}}>Emergency household expenses (Approved by Admin)</td>
              <td style={{padding: '12px 0', fontSize: '13px', fontWeight: '700', color: '#DC2626', textAlign: 'right'}}>- ₹1,500</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Past Months History */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '22px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#111827'}}>
          Past Payout History
        </h3>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #E5E7EB', textAlign: 'left', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase'}}>
              <th style={{padding: '10px 0'}}>Month</th>
              <th style={{padding: '10px 0'}}>Attendance</th>
              <th style={{padding: '10px 0'}}>Gross</th>
              <th style={{padding: '10px 0'}}>Deductions</th>
              <th style={{padding: '10px 0'}}>Net Paid</th>
              <th style={{padding: '10px 0', textAlign: 'right'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #F3F4F6'}}>
              <td style={{padding: '12px 0', fontWeight: '600', fontSize: '13px'}}>August 2026</td>
              <td style={{padding: '12px 0', fontSize: '13px'}}>24.0 Days</td>
              <td style={{padding: '12px 0', fontSize: '13px'}}>₹24,000</td>
              <td style={{padding: '12px 0', fontSize: '13px', color: '#6B7280'}}>₹0</td>
              <td style={{padding: '12px 0', fontSize: '13px', fontWeight: '700', color: '#111827'}}>₹24,000</td>
              <td style={{padding: '12px 0', textAlign: 'right'}}><span style={{background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700'}}>Paid</span></td>
            </tr>
            <tr style={{borderBottom: '1px solid #F3F4F6'}}>
              <td style={{padding: '12px 0', fontWeight: '600', fontSize: '13px'}}>July 2026</td>
              <td style={{padding: '12px 0', fontSize: '13px'}}>25.5 Days</td>
              <td style={{padding: '12px 0', fontSize: '13px'}}>₹25,500</td>
              <td style={{padding: '12px 0', fontSize: '13px', color: '#6B7280'}}>₹0</td>
              <td style={{padding: '12px 0', fontSize: '13px', fontWeight: '700', color: '#111827'}}>₹25,500</td>
              <td style={{padding: '12px 0', textAlign: 'right'}}><span style={{background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700'}}>Paid</span></td>
            </tr>
          </tbody>
        </table>
      </div>

    </main>
  );
};

export default EmployeeSalary;
