import React from 'react';

const Projects = () => {
  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects & Sites</h1>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search projects..." />
              <i className="fa-solid fa-search"></i>
            </div>
            <button className="btn-primary"><i className="fa-solid fa-plus"></i> Add Project</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
              <th style={{padding: '10px 0'}}>Ref No.</th>
              <th style={{padding: '10px 0'}}>Project / Site</th>
              <th style={{padding: '10px 0'}}>Customer</th>
              <th style={{padding: '10px 0'}}>Location</th>
              <th style={{padding: '10px 0'}}>Start Date</th>
              <th style={{padding: '10px 0'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>PI-001</td>
              <td style={{padding: '15px 0'}}>Kothrud Kitchen</td>
              <td style={{padding: '15px 0'}}>Rahul Deshmukh</td>
              <td style={{padding: '15px 0'}}>Kothrud <i className="fa-solid fa-map-location-dot" style={{color: '#primary-blue'}}></i></td>
              <td style={{padding: '15px 0'}}>01 Sep 2026</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>PI-002</td>
              <td style={{padding: '15px 0'}}>Baner Interior</td>
              <td style={{padding: '15px 0'}}>Priya Sharma</td>
              <td style={{padding: '15px 0'}}>Baner <i className="fa-solid fa-map-location-dot" style={{color: '#primary-blue'}}></i></td>
              <td style={{padding: '15px 0'}}>15 Sep 2026</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Projects;
