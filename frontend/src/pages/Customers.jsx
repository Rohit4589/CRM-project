import React, { useState } from 'react';

const Customers = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <main className="dashboard-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Management</h1>
          <div className="header-actions">
            <div className="search-box">
              <input type="text" placeholder="Search customers..." />
              <i className="fa-solid fa-search"></i>
            </div>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus"></i> Add Customer</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #eee', textAlign: 'left', color: '#6c757d'}}>
              <th style={{padding: '10px 0'}}>Customer ID</th>
              <th style={{padding: '10px 0'}}>Name</th>
              <th style={{padding: '10px 0'}}>Mobile</th>
              <th style={{padding: '10px 0'}}>Email</th>
              <th style={{padding: '10px 0'}}>Status</th>
              <th style={{padding: '10px 0'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>CUST-001</td>
              <td style={{padding: '15px 0'}}>Rahul Deshmukh</td>
              <td style={{padding: '15px 0'}}>+91 9876543210</td>
              <td style={{padding: '15px 0'}}>rahul.d@email.com</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Active</span></td>
              <td style={{padding: '15px 0'}}>
                <div style={{display: 'flex', gap: '10px', color: '#6c757d'}}>
                  <i className="fa-solid fa-eye" style={{cursor: 'pointer'}}></i>
                  <i className="fa-solid fa-pen" style={{cursor: 'pointer'}}></i>
                </div>
              </td>
            </tr>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '15px 0', fontWeight: '500'}}>CUST-002</td>
              <td style={{padding: '15px 0'}}>Priya Sharma</td>
              <td style={{padding: '15px 0'}}>+91 9988776655</td>
              <td style={{padding: '15px 0'}}>priya.s@email.com</td>
              <td style={{padding: '15px 0'}}><span style={{background: '#e6f4ea', color: '#1e8e3e', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>Active</span></td>
              <td style={{padding: '15px 0'}}>
                <div style={{display: 'flex', gap: '10px', color: '#6c757d'}}>
                  <i className="fa-solid fa-eye" style={{cursor: 'pointer'}}></i>
                  <i className="fa-solid fa-pen" style={{cursor: 'pointer'}}></i>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '30px', borderRadius: '12px', 
            width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.25rem', color: '#333'}}>Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: 0, lineHeight: 1
              }}>&times;</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Full Name</label>
                <input type="text" placeholder="Enter customer name" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                }} required />
              </div>
              
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Mobile Number</label>
                  <input type="tel" placeholder="Enter mobile number" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Email Address</label>
                  <input type="email" placeholder="Enter email address" style={{
                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none'
                  }} />
                </div>
              </div>
              
              <div style={{marginBottom: '25px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#555', fontWeight: '500', fontSize: '0.9rem'}}>Address</label>
                <textarea placeholder="Enter address (optional)" style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', outline: 'none'
                }}></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#333', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3ba2f2', color: '#fff', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s'
                }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Customers;
