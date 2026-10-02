import React, { useState } from 'react';

const Projects = () => {
  const [showAddModal, setShowAddModal] = useState(false);

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
            <button className="btn-primary" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus"></i> Add Project</button>
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
              <td style={{padding: '15px 0'}}>Kothrud <i className="fa-solid fa-map-location-dot" style={{color: 'var(--primary-blue)'}}></i></td>
              <td style={{padding: '15px 0'}}>01 Sep 2026</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>PI-002</td>
              <td style={{padding: '15px 0'}}>Baner Interior</td>
              <td style={{padding: '15px 0'}}>Priya Sharma</td>
              <td style={{padding: '15px 0'}}>Baner <i className="fa-solid fa-map-location-dot" style={{color: 'var(--primary-blue)'}}></i></td>
              <td style={{padding: '15px 0'}}>15 Sep 2026</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Running</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '30px', borderRadius: '12px', 
            width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.25rem', color: '#333'}}>Add New Project / Site</h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: 0, lineHeight: 1
              }}>&times;</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Reference Number</label>
                  <input type="text" placeholder="e.g. PI-003" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Status</label>
                  <select style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff'
                  }}>
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Project Name</label>
                <input type="text" placeholder="Enter project name" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                }} required />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Select Customer</label>
                <select style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff'
                }}>
                  <option value="">-- Select Customer --</option>
                  <option value="Rahul Deshmukh">Rahul Deshmukh</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                </select>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Site Address</label>
                <textarea placeholder="Enter full site address" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '60px', resize: 'vertical', outline: 'none'
                }} required></textarea>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Map Location (Lat, Lng)</label>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <input type="text" placeholder="Latitude" style={{
                      width: '50%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                    }} />
                    <input type="text" placeholder="Longitude" style={{
                      width: '50%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                    }} />
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Start Date</label>
                  <input type="date" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Expected Completion Date</label>
                  <input type="date" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} />
                </div>
              </div>

              <div style={{marginBottom: '25px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Notes</label>
                <textarea placeholder="Additional notes about the project" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '60px', resize: 'vertical', outline: 'none'
                }}></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#333', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3ba2f2', color: '#fff', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Projects;
