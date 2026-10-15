import React from 'react';

const Reports = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)' }}>
            Reports
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7D6C5E' }}>
            Export payroll & attendance
          </p>
        </div>
      </div>

      <div className="dashboard-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px'}}>
        
        <div className="panel" style={{background: '#fff', borderRadius: '10px', border: '1px solid #D1C2AF', padding: '30px', textAlign: 'center'}}>
          <i className="fa-solid fa-file-pdf" style={{fontSize: '44px', color: '#4A2C17', marginBottom: '16px'}}></i>
          <h3 style={{marginBottom: '8px', fontSize: '17px', color: '#1F1A17'}}>Detailed Report</h3>
          <p style={{color: '#6B7280', fontSize: '13px', marginBottom: '20px'}}>Includes attendance, sites, and salary breakdown.</p>
          <button className="btn-primary" style={{width: '100%', padding: '10px 16px', borderRadius: '8px', fontWeight: '700'}}>Download PDF</button>
        </div>

        <div className="panel" style={{background: '#fff', borderRadius: '10px', border: '1px solid #D1C2AF', padding: '30px', textAlign: 'center'}}>
          <i className="fa-solid fa-file-contract" style={{fontSize: '44px', color: '#059669', marginBottom: '16px'}}></i>
          <h3 style={{marginBottom: '8px', fontSize: '17px', color: '#1F1A17'}}>Attendance Report</h3>
          <p style={{color: '#6B7280', fontSize: '13px', marginBottom: '20px'}}>Attendance only, without salary amounts.</p>
          <button className="btn-secondary" style={{width: '100%', padding: '10px 16px', border: '1px solid #D1C2AF', color: '#4A2C17', borderRadius: '8px', background: '#FAF8F5', cursor: 'pointer', fontWeight: '700'}}>Download PDF</button>
        </div>

      </div>
    </main>
  );
};

export default Reports;
