import React from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <main className="dashboard-content">
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search employees, projects..." />
              <i className="fa-solid fa-search"></i>
            </div>
            <button className="btn-primary">Generate Report</button>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px'}}>
        <div className="stat-card" style={{background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{color: '#6c757d', fontSize: '14px', marginBottom: '10px'}}>Total Employees</div>
          <div style={{fontSize: '28px', fontWeight: 'bold'}}>124</div>
          <div style={{color: '#28a745', fontSize: '12px', marginTop: '10px'}}><i className="fa-solid fa-arrow-up"></i> +3 this month</div>
        </div>
        <div className="stat-card" style={{background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{color: '#6c757d', fontSize: '14px', marginBottom: '10px'}}>Active Projects</div>
          <div style={{fontSize: '28px', fontWeight: 'bold'}}>18</div>
          <div style={{color: '#28a745', fontSize: '12px', marginTop: '10px'}}><i className="fa-solid fa-arrow-up"></i> +2 this month</div>
        </div>
        <div className="stat-card" style={{background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{color: '#6c757d', fontSize: '14px', marginBottom: '10px'}}>Total Customers</div>
          <div style={{fontSize: '28px', fontWeight: 'bold'}}>45</div>
          <div style={{color: '#28a745', fontSize: '12px', marginTop: '10px'}}><i className="fa-solid fa-arrow-up"></i> +5 this month</div>
        </div>
        <div className="stat-card" style={{background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{color: '#6c757d', fontSize: '14px', marginBottom: '10px'}}>Salary Released (MTD)</div>
          <div style={{fontSize: '28px', fontWeight: 'bold'}}>₹ 4.5L</div>
          <div style={{color: '#6c757d', fontSize: '12px', marginTop: '10px'}}>Next release: 1st of month</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
        
        {/* Active Projects List */}
        <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: 0}}>Active Projects & Sites</h3>
            <button className="btn-secondary" style={{padding: '5px 15px', border: '1px solid #ddd', borderRadius: '5px', background: 'transparent', cursor: 'pointer'}}>View All</button>
          </div>
          
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
                <th style={{padding: '10px 0'}}>Ref No.</th>
                <th style={{padding: '10px 0'}}>Project / Site</th>
                <th style={{padding: '10px 0'}}>Location</th>
                <th style={{padding: '10px 0'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom: '1px solid #eee'}}>
                <td style={{padding: '15px 0', fontWeight: '500'}}>PI-001</td>
                <td style={{padding: '15px 0'}}>Kothrud Kitchen</td>
                <td style={{padding: '15px 0'}}>Kothrud</td>
                <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
              </tr>
              <tr style={{borderBottom: '1px solid #eee'}}>
                <td style={{padding: '15px 0', fontWeight: '500'}}>PI-002</td>
                <td style={{padding: '15px 0'}}>Baner Interior</td>
                <td style={{padding: '15px 0'}}>Baner</td>
                <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
              </tr>
              <tr>
                <td style={{padding: '15px 0', fontWeight: '500'}}>PI-003</td>
                <td style={{padding: '15px 0'}}>Wakad Furniture</td>
                <td style={{padding: '15px 0'}}>Wakad</td>
                <td style={{padding: '15px 0'}}><span style={{background: '#f1f3f4', color: '#5f6368', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Attendance */}
        <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: 0}}>Recent Attendance (GPS + Selfie)</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
              <img src="https://i.pravatar.cc/150?img=11" alt="Selfie" style={{width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover'}} />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold'}}>Ramesh Kumar</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Baner Interior (PI-002)</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: '#1e8e3e', fontWeight: 'bold', fontSize: '14px'}}>IN 09:00 AM</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Within 1 KM</div>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
              <img src="https://i.pravatar.cc/150?img=12" alt="Selfie" style={{width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover'}} />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold'}}>Suresh Patil</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Kothrud Kitchen (PI-001)</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: '#d93025', fontWeight: 'bold', fontSize: '14px'}}>OUT 06:15 PM</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Within 1 KM</div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <img src="https://i.pravatar.cc/150?img=13" alt="Selfie" style={{width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover'}} />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold'}}>Amit Sharma</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Factory</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{color: '#1e8e3e', fontWeight: 'bold', fontSize: '14px'}}>IN 09:10 AM</div>
                <div style={{fontSize: '12px', color: '#6c757d'}}>Factory</div>
              </div>
            </div>
          </div>
          
          <button className="btn-secondary" style={{width: '100%', marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: 'transparent', cursor: 'pointer'}}>View All Logs</button>
        </div>

      </div>
      
    </main>
  );
};

export default Dashboard;
