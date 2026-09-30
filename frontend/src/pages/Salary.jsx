import React from 'react';

const Salary = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Salary Processing</h1>
          <div className="header-actions">
            <select style={{padding: '10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none'}}>
              <option>September 2026</option>
              <option>August 2026</option>
            </select>
            <button className="btn-primary" style={{background: '#28a745'}}>Release All Salaries</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
              <th style={{padding: '10px 0'}}>Employee</th>
              <th style={{padding: '10px 0'}}>Total Attendance</th>
              <th style={{padding: '10px 0'}}>Daily Rate</th>
              <th style={{padding: '10px 0'}}>Gross Amount</th>
              <th style={{padding: '10px 0'}}>Deductions / Adv.</th>
              <th style={{padding: '10px 0'}}>Net Payable</th>
              <th style={{padding: '10px 0'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>Ramesh Kumar</td>
              <td style={{padding: '15px 0'}}>26.5 Days</td>
              <td style={{padding: '15px 0'}}>₹1,000</td>
              <td style={{padding: '15px 0'}}>₹26,500</td>
              <td style={{padding: '15px 0', color: '#d93025'}}>- ₹1,500</td>
              <td style={{padding: '15px 0', fontWeight: 'bold', fontSize: '16px'}}>₹25,000</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Pending Review</span></td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>Suresh Patil</td>
              <td style={{padding: '15px 0'}}>24.0 Days</td>
              <td style={{padding: '15px 0'}}>₹800</td>
              <td style={{padding: '15px 0'}}>₹19,200</td>
              <td style={{padding: '15px 0', color: '#d93025'}}>- ₹0</td>
              <td style={{padding: '15px 0', fontWeight: 'bold', fontSize: '16px'}}>₹19,200</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Released</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Salary;
