import React from 'react';

const Employees = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search employees..." />
              <i className="fa-solid fa-search"></i>
            </div>
            <button className="btn-primary"><i className="fa-solid fa-plus"></i> Add Employee</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
              <th style={{padding: '10px 0'}}>Employee</th>
              <th style={{padding: '10px 0'}}>ID</th>
              <th style={{padding: '10px 0'}}>Role</th>
              <th style={{padding: '10px 0'}}>Daily Salary</th>
              <th style={{padding: '10px 0'}}>Assigned Sites</th>
              <th style={{padding: '10px 0'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <img src="https://i.pravatar.cc/150?img=11" alt="Profile" style={{width: '35px', height: '35px', borderRadius: '50%'}} />
                  <div>
                    <div style={{fontWeight: 'bold'}}>Ramesh Kumar</div>
                    <div style={{fontSize: '12px', color: '#6c757d'}}>+91 9876543210</div>
                  </div>
                </div>
              </td>
              <td style={{padding: '15px 0', fontWeight: '500'}}>EMP-101</td>
              <td style={{padding: '15px 0'}}>Carpenter</td>
              <td style={{padding: '15px 0'}}>₹1,000</td>
              <td style={{padding: '15px 0'}}>PI-002 (Baner)</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Active</span></td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <img src="https://i.pravatar.cc/150?img=12" alt="Profile" style={{width: '35px', height: '35px', borderRadius: '50%'}} />
                  <div>
                    <div style={{fontWeight: 'bold'}}>Suresh Patil</div>
                    <div style={{fontSize: '12px', color: '#6c757d'}}>+91 9988776655</div>
                  </div>
                </div>
              </td>
              <td style={{padding: '15px 0', fontWeight: '500'}}>EMP-102</td>
              <td style={{padding: '15px 0'}}>Painter</td>
              <td style={{padding: '15px 0'}}>₹800</td>
              <td style={{padding: '15px 0'}}>PI-001, Factory</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Employees;
