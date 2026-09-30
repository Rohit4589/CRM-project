import React from 'react';

const Attendance = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Monitoring</h1>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search by name, site..." />
              <i className="fa-solid fa-search"></i>
            </div>
            <input type="date" style={{padding: '10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none'}} defaultValue="2026-09-29" />
            <button className="btn-primary">Finalize Day</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
              <th style={{padding: '10px 0'}}>Employee</th>
              <th style={{padding: '10px 0'}}>Site</th>
              <th style={{padding: '10px 0'}}>IN Time (GPS)</th>
              <th style={{padding: '10px 0'}}>OUT Time (GPS)</th>
              <th style={{padding: '10px 0'}}>Selfie</th>
              <th style={{padding: '10px 0'}}>Attendance Value</th>
              <th style={{padding: '10px 0'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>Ramesh Kumar</td>
              <td style={{padding: '15px 0'}}>PI-002 (Baner)</td>
              <td style={{padding: '15px 0'}}>
                <div style={{color: '#1e8e3e', fontWeight: 'bold'}}>09:00 AM</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Within 1 KM</div>
              </td>
              <td style={{padding: '15px 0'}}>
                <div style={{color: '#d93025', fontWeight: 'bold'}}>06:15 PM</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Within 1 KM</div>
              </td>
              <td style={{padding: '15px 0'}}>
                <img src="https://i.pravatar.cc/150?img=11" alt="IN" style={{width: '30px', height: '30px', borderRadius: '4px', marginRight: '5px'}} />
                <img src="https://i.pravatar.cc/150?img=11" alt="OUT" style={{width: '30px', height: '30px', borderRadius: '4px'}} />
              </td>
              <td style={{padding: '15px 0', fontWeight: 'bold'}}>1.0 Day</td>
              <td style={{padding: '15px 0'}}><button style={{background: 'transparent', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>Edit</button></td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>Suresh Patil</td>
              <td style={{padding: '15px 0'}}>PI-001, PI-002</td>
              <td style={{padding: '15px 0'}}>
                <div style={{color: '#1e8e3e', fontWeight: 'bold'}}>09:10 AM (PI-001)</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Within 1 KM</div>
              </td>
              <td style={{padding: '15px 0'}}>
                <div style={{color: '#d93025', fontWeight: 'bold'}}>--:--</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Missing Punch</div>
              </td>
              <td style={{padding: '15px 0'}}>
                <img src="https://i.pravatar.cc/150?img=12" alt="IN" style={{width: '30px', height: '30px', borderRadius: '4px', marginRight: '5px'}} />
              </td>
              <td style={{padding: '15px 0', fontWeight: 'bold', color: '#d93025'}}>0.5 Day (Error)</td>
              <td style={{padding: '15px 0'}}><button style={{background: '#ffe5e5', color: '#d93025', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>Fix</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Attendance;
