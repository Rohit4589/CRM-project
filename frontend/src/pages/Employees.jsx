import React, { useState } from 'react';

const Employees = () => {
  const [showAddModal, setShowAddModal] = useState(false);

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
            <button className="btn-primary" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus"></i> Add Employee</button>
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

      {/* Add Employee Modal */}
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
              <h2 style={{margin: 0, fontSize: '1.25rem', color: '#333'}}>Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: 0, lineHeight: 1
              }}>&times;</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px'}}>
                <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc'}}>
                  <i className="fa-solid fa-camera" style={{color: '#999', fontSize: '24px'}}></i>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Profile Photo</label>
                  <input type="file" accept="image/*" style={{fontSize: '14px'}} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Employee ID</label>
                  <input type="text" placeholder="e.g. EMP-103" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Status</label>
                  <select style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff'
                  }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Employee Name</label>
                <input type="text" placeholder="Enter full name" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                }} required />
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Mobile Number</label>
                  <input type="tel" placeholder="e.g. +91 9876543210" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Emergency Contact</label>
                  <input type="tel" placeholder="e.g. +91 9123456780" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Joining Date</label>
                  <input type="date" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Designation / Role</label>
                  <input type="text" placeholder="e.g. Carpenter, Painter" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
              </div>

              <div style={{marginBottom: '25px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Daily Salary (₹)</label>
                <input type="number" placeholder="e.g. 1000" min="0" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                }} required />
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#333', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3ba2f2', color: '#fff', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Employees;
