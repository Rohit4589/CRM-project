import React, { useState } from 'react';

const EmployeeReports = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="dashboard-content" style={{padding: '24px 28px', width: '100%'}}>
      
      {/* Action Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            My Monthly Payslip & Report
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Official salary certificate issued by Modern Interior Management.
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
            onClick={handlePrint}
            className="btn-primary" 
            style={{padding: '8px 18px', fontSize: '13px'}}
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--gold, #B9782D)', paddingBottom: '20px', marginBottom: '24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{
              width: '44px', height: '44px', background: 'var(--gold, #B9782D)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px'
            }}>
              <i className="fa-solid fa-house"></i>
            </div>
            <div>
              <h2 style={{margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--navy, #111827)'}}>Modern Interior</h2>
              <div style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6B7280', fontWeight: '600'}}>Management System</div>
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: '16px', fontWeight: '800', color: 'var(--gold, #B9782D)', textTransform: 'uppercase', letterSpacing: '1px'}}>
              SALARY PAYSLIP
            </div>
            <div style={{fontSize: '13px', fontWeight: '600', color: '#111827', marginTop: '2px'}}>
              For Month: {selectedMonth}
            </div>
            <div style={{fontSize: '11px', color: '#6B7280', marginTop: '2px'}}>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
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
            <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Employee Name</div>
            <div style={{fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px'}}>{user?.fullName || 'Anurag Sharma'}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Employee ID</div>
            <div style={{fontSize: '14px', fontWeight: '700', color: 'var(--gold, #B9782D)', marginTop: '2px'}}>{user?.id || 'EMP-101'}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Designation</div>
            <div style={{fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px'}}>{user?.roleTitle || 'Carpenter & Woodwork'}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Registered Mobile</div>
            <div style={{fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px'}}>{user?.mobile || '9209036661'}</div>
          </div>
        </div>

        {/* Attendance & Rate Details */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '12px 18px',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '24px'
        }}>
          <div>
            <span style={{color: '#6B7280', fontSize: '13px'}}>Total Days Present: </span>
            <strong style={{color: '#111827', fontSize: '14px'}}>26.5 Days</strong> (26 Full + 1 Half-Day)
          </div>
          <div>
            <span style={{color: '#6B7280', fontSize: '13px'}}>Daily Wage Rate: </span>
            <strong style={{color: '#111827', fontSize: '14px'}}>₹1,000 / Day</strong>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div style={{border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#111827', color: '#fff', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase'}}>
                <th style={{padding: '12px 16px'}}>Earnings Description</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Amount</th>
                <th style={{padding: '12px 16px', borderLeft: '1px solid #374151'}}>Deductions Description</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom: '1px solid #E5E7EB'}}>
                <td style={{padding: '14px 16px', fontSize: '13px', fontWeight: '500'}}>
                  Base Daily Wages (26.5 Days × ₹1,000)
                </td>
                <td style={{padding: '14px 16px', fontSize: '13px', fontWeight: '700', textAlign: 'right'}}>
                  ₹26,500
                </td>
                <td style={{padding: '14px 16px', fontSize: '13px', color: '#DC2626', borderLeft: '1px solid #E5E7EB'}}>
                  Salary Advance (Cash Given 15 Sep)
                </td>
                <td style={{padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#DC2626', textAlign: 'right'}}>
                  ₹1,500
                </td>
              </tr>
              <tr style={{borderBottom: '1px solid #E5E7EB'}}>
                <td style={{padding: '14px 16px', fontSize: '13px', color: '#6B7280'}}>Site Overtime / Bonus</td>
                <td style={{padding: '14px 16px', fontSize: '13px', textAlign: 'right', color: '#6B7280'}}>₹0</td>
                <td style={{padding: '14px 16px', fontSize: '13px', color: '#6B7280', borderLeft: '1px solid #E5E7EB'}}>Other Deductions</td>
                <td style={{padding: '14px 16px', fontSize: '13px', textAlign: 'right', color: '#6B7280'}}>₹0</td>
              </tr>
              <tr style={{background: '#F9FAFB', fontWeight: '700'}}>
                <td style={{padding: '12px 16px', fontSize: '13px'}}>Total Gross Earnings</td>
                <td style={{padding: '12px 16px', fontSize: '13px', textAlign: 'right', color: '#111827'}}>₹26,500</td>
                <td style={{padding: '12px 16px', fontSize: '13px', borderLeft: '1px solid #E5E7EB'}}>Total Deductions</td>
                <td style={{padding: '12px 16px', fontSize: '13px', textAlign: 'right', color: '#DC2626'}}>₹1,500</td>
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
            <div style={{fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold, #B9782D)', fontWeight: '700'}}>
              NET SALARY PAYABLE / TRANSFERRED
            </div>
            <div style={{fontSize: '13px', color: '#4B5563', marginTop: '2px'}}>
              Amount in Words: <em>Twenty Five Thousand Indian Rupees Only</em>
            </div>
          </div>
          <div style={{fontSize: '26px', fontWeight: '800', color: 'var(--gold, #B9782D)'}}>
            ₹25,000
          </div>
        </div>

        {/* Signatures */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px'}}>
          <div style={{textAlign: 'center', width: '200px'}}>
            <div style={{borderBottom: '1px solid #9CA3AF', height: '40px', marginBottom: '8px'}}></div>
            <div style={{fontSize: '12px', fontWeight: '600', color: '#4B5563'}}>Employee Signature</div>
            <div style={{fontSize: '11px', color: '#9CA3AF'}}>({user?.name || 'Anurag'})</div>
          </div>
          <div style={{textAlign: 'center', width: '200px'}}>
            <div style={{height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
              <span style={{fontFamily: 'cursive', fontSize: '18px', color: 'var(--gold, #B9782D)'}}>Bryan Maxim</span>
            </div>
            <div style={{borderBottom: '1px solid #9CA3AF', marginBottom: '8px'}}></div>
            <div style={{fontSize: '12px', fontWeight: '600', color: '#4B5563'}}>Authorized Signatory</div>
            <div style={{fontSize: '11px', color: '#9CA3AF'}}>Modern Interior Management</div>
          </div>
        </div>

      </div>

    </main>
  );
};

export default EmployeeReports;
