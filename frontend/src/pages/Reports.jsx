import React from 'react';

const Reports = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate PDF Reports</h1>
          <div className="header-actions">
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px'}}>
        
        <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '30px', textAlign: 'center'}}>
          <i className="fa-solid fa-file-pdf" style={{fontSize: '48px', color: '#d93025', marginBottom: '20px'}}></i>
          <h3 style={{marginBottom: '10px'}}>Salary Included PDF</h3>
          <p style={{color: '#6c757d', fontSize: '14px', marginBottom: '20px'}}>Confidential management report containing attendance, site/project, salary and applicable salary components.</p>
          <button className="btn-primary" style={{width: '100%'}}>Generate Report</button>
        </div>

        <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '30px', textAlign: 'center'}}>
          <i className="fa-solid fa-file-contract" style={{fontSize: '48px', color: '#1e8e3e', marginBottom: '20px'}}></i>
          <h3 style={{marginBottom: '10px'}}>Salary Hidden PDF</h3>
          <p style={{color: '#6c757d', fontSize: '14px', marginBottom: '20px'}}>Shareable report containing employee attendance and total attendance only. Salary amounts are excluded.</p>
          <button className="btn-secondary" style={{width: '100%', padding: '10px', border: '1px solid #1e8e3e', color: '#1e8e3e', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontWeight: 'bold'}}>Generate Report</button>
        </div>

      </div>
    </main>
  );
};

export default Reports;
