import React, { useState } from 'react';

const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-101',
    name: 'Anurag Sharma',
    phone: '+91 9209036661',
    role: 'Carpenter & Site Specialist',
    dailySalary: 1000,
    sitePolicy: 'Flexible / Self-Pick',
    lastSite: 'SITE-002 (Priya Sharma - Baner)',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: 'EMP-102',
    name: 'Ramesh Kumar',
    phone: '+91 9876543210',
    role: 'Senior Carpenter',
    dailySalary: 1000,
    sitePolicy: 'Flexible / Self-Pick',
    lastSite: 'SITE-002 (Priya Sharma - Baner)',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 'EMP-103',
    name: 'Suresh Patil',
    phone: '+91 9988776655',
    role: 'Wall & Texture Painter',
    dailySalary: 800,
    sitePolicy: 'Flexible / Self-Pick',
    lastSite: 'SITE-001 (Rahul Deshmukh - Kothrud)',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?img=33'
  }
];

const Employees = () => {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New employee form
  const [formData, setFormData] = useState({
    id: `EMP-${INITIAL_EMPLOYEES.length + 101}`,
    name: '',
    phone: '',
    role: 'Carpenter',
    dailySalary: 1000,
    status: 'Active'
  });

  const handleAddEmployee = (e) => {
    e.preventDefault();
    const newEmp = {
      ...formData,
      sitePolicy: 'Flexible / Self-Pick',
      lastSite: 'Not yet punched',
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50) + 1}`
    };
    setEmployees([...employees, newEmp]);
    setShowAddModal(false);
    setFormData({
      id: `EMP-${employees.length + 102}`,
      name: '',
      phone: '',
      role: 'Carpenter',
      dailySalary: 1000,
      status: 'Active'
    });
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="dashboard-content" style={{padding: '24px'}}>
      
      {/* Page Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            Employee Management
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Manage workforce, daily wage rates, and employee credentials
          </p>
        </div>

        <div className="header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{padding: '9px 14px 9px 36px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none'}}
            />
            <i className="fa-solid fa-search" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF'}}></i>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowAddModal(true)}
            style={{padding: '9px 16px', borderRadius: '6px', fontSize: '13px'}}
          >
            <i className="fa-solid fa-plus"></i> Add Employee
          </button>
        </div>
      </div>

      {/* Policy Notification: No admin site assignment */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#1E40AF'
      }}>
        <i className="fa-solid fa-circle-info" style={{fontSize: '18px', color: '#2563EB', flexShrink: 0}}></i>
        <div>
          <strong>No Site Pre-Assignment Required:</strong> In this system, admin does not assign fixed sites to workers. Employees are free to report to any active site and pick that site directly upon punching attendance (with GPS 500m geofence verification).
        </div>
      </div>

      {/* Employees Table */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '750px'}}>
          <thead>
            <tr style={{
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              textAlign: 'left',
              color: '#6B7280',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{padding: '12px 16px'}}>Employee</th>
              <th style={{padding: '12px 16px'}}>ID</th>
              <th style={{padding: '12px 16px'}}>Trade / Role</th>
              <th style={{padding: '12px 16px'}}>Daily Wage</th>
              <th style={{padding: '12px 16px'}}>Site Assignment</th>
              <th style={{padding: '12px 16px'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <img src={emp.avatar} alt={emp.name} style={{width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover'}} />
                    <div>
                      <div style={{fontWeight: '700', color: '#111827', fontSize: '13px'}}>{emp.name}</div>
                      <div style={{fontSize: '12px', color: '#6B7280'}}>{emp.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle', fontWeight: '600', color: 'var(--gold, #B9782D)', fontSize: '13px'}}>
                  {emp.id}
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle', color: '#374151', fontSize: '13px', fontWeight: '500'}}>
                  {emp.role}
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle', fontWeight: '700', color: '#111827', fontSize: '13px'}}>
                  ₹{emp.dailySalary.toLocaleString()}
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    background: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: '700',
                    padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <i className="fa-solid fa-bolt" style={{fontSize: '10px'}}></i> Flexible / Self-Pick
                  </span>
                  <div style={{fontSize: '11px', color: '#6B7280', marginTop: '3px'}}>
                    Last active: <strong>{emp.lastSite}</strong>
                  </div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    background: '#ECFDF5', color: '#065F46', padding: '4px 10px',
                    borderRadius: '14px', fontSize: '11px', fontWeight: '700'
                  }}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1200,
          backdropFilter: 'blur(3px)', padding: '20px'
        }}>
          <div style={{
            background: '#fff', padding: '28px', borderRadius: '14px', 
            width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: 0
              }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              
              <div style={{display: 'flex', gap: '15px', marginBottom: '14px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Employee ID</label>
                  <input 
                    type="text" 
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                    required 
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff', fontSize: '13px'}}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Mobile Number (Login Username)</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 9209036661" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '14px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Trade / Role</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Carpenter, Painter" 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                    required 
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Daily Wage Rate (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1000" 
                    value={formData.dailySalary}
                    onChange={(e) => setFormData({...formData, dailySalary: Number(e.target.value)})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                    required 
                  />
                </div>
              </div>

              {/* Site Assignment Notice */}
              <div style={{
                background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px',
                padding: '12px', marginBottom: '20px', fontSize: '12px', color: '#4B5563'
              }}>
                <div style={{fontWeight: '700', color: '#111827', marginBottom: '2px'}}>Site Allocation: Flexible / Self-Pick</div>
                No manual site assignment required. The employee will choose their active site dynamically when punching in for attendance.
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  padding: '9px 18px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{
                  padding: '9px 20px', borderRadius: '6px', fontSize: '13px'
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
