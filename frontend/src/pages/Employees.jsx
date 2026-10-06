import React, { useState, useEffect } from 'react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New employee form data
  const [formData, setFormData] = useState({
    empCode: '',
    name: '',
    phone: '',
    password: '',
    role: 'Carpenter',
    dailySalary: 1000,
    status: 'Active'
  });

  // Edit employee form data
  const [editFormData, setEditFormData] = useState({
    dbId: null,
    id: '',
    empCode: '',
    name: '',
    phone: '',
    password: '',
    role: 'Carpenter',
    dailySalary: 1000,
    status: 'Active'
  });

  // Fetch employees from database
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      } else {
        setApiError(data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setApiError('Unable to connect to backend server on port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add Employee Handler
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');

    if (formData.empCode && !/^\d{3,4}$/.test(formData.empCode.trim())) {
      setApiError('Employee ID must be 3 or 4 digits (e.g. 102 or 1002)');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to save employee to database');
        setSaving(false);
        return;
      }

      setEmployees(prev => [...prev, data.employee]);
      setShowAddModal(false);
      setSuccessMessage(`Employee "${data.employee.name}" added successfully! ID: ${data.employee.id} · Login PIN: ${data.employee.password}`);
      setTimeout(() => setSuccessMessage(''), 6000);

      // Reset form
      setFormData({
        empCode: '',
        name: '',
        phone: '',
        password: '',
        role: 'Carpenter',
        dailySalary: 1000,
        status: 'Active'
      });
    } catch (err) {
      console.error('Error adding employee:', err);
      setApiError('Server connection error while adding employee');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp) => {
    setApiError('');
    const rawEmpCode = emp.empCode || emp.rawCode || String(emp.id || '').replace(/^EMP-/i, '');
    setEditFormData({
      dbId: emp.dbId,
      id: emp.id,
      empCode: rawEmpCode,
      name: emp.name || '',
      phone: emp.rawPhone || emp.phone?.replace('+91 ', '') || '',
      password: emp.password || '',
      role: emp.role || 'Carpenter',
      dailySalary: emp.dailySalary || 1000,
      status: emp.status || 'Active'
    });
    setShowEditModal(true);
  };

  // Update Employee Handler
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');

    if (editFormData.empCode && !/^\d{3,4}$/.test(editFormData.empCode.trim())) {
      setApiError('Employee ID must be 3 or 4 digits (e.g. 102 or 1002)');
      setSaving(false);
      return;
    }

    try {
      const targetId = editFormData.dbId || editFormData.id;
      const res = await fetch(`http://localhost:5000/api/employees/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to update employee');
        setSaving(false);
        return;
      }

      // Update in state
      setEmployees(prev => prev.map(emp => (emp.dbId === data.employee.dbId ? data.employee : emp)));
      setShowEditModal(false);
      setSuccessMessage(`Employee "${data.employee.name}" updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating employee:', err);
      setApiError('Server error while updating employee');
    } finally {
      setSaving(false);
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete employee "${editFormData.name}" (${editFormData.id}) from the database?`
    );
    if (!confirmDelete) return;

    setSaving(true);
    setApiError('');

    try {
      const targetId = editFormData.dbId || editFormData.id;
      const res = await fetch(`http://localhost:5000/api/employees/${targetId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || 'Failed to delete employee');
        setSaving(false);
        return;
      }

      // Remove from state
      setEmployees(prev => prev.filter(emp => emp.dbId !== editFormData.dbId));
      setShowEditModal(false);
      setSuccessMessage(`Employee "${editFormData.name}" was permanently deleted from the database.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting employee:', err);
      setApiError('Server error while deleting employee');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = (employees || []).filter(emp => 
    emp && (
      (emp.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (emp.id || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (emp.role || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    )
  );

  return (
    <main className="dashboard-content" style={{padding: '24px'}}>
      
      {/* Page Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <h1 className="page-title" style={{margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
              Employee Management
            </h1>
            <span style={{
              background: 'rgba(185, 120, 45, 0.1)', color: 'var(--gold, #B9782D)', 
              fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px'
            }}>
              {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
            </span>
          </div>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Manage workforce, daily wage rates, and employee details
          </p>
        </div>

        <div className="header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <div className="search-box" style={{position: 'relative'}}>
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
            onClick={() => {
              setApiError('');
              setShowAddModal(true);
            }}
            style={{padding: '9px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'}}
          >
            <i className="fa-solid fa-plus"></i> Add Employee
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div style={{
          background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600'
        }}>
          <i className="fa-solid fa-circle-check" style={{color: '#10B981', fontSize: '16px'}}></i>
          {successMessage}
        </div>
      )}

      {/* Error Banner */}
      {apiError && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px'
        }}>
          <i className="fa-solid fa-circle-exclamation" style={{color: '#EF4444', fontSize: '16px'}}></i>
          {apiError}
        </div>
      )}

      {/* Employees Table */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loading ? (
          <div style={{padding: '50px 20px', textAlign: 'center', color: '#6B7280'}}>
            <i className="fa-solid fa-spinner fa-spin" style={{fontSize: '28px', color: 'var(--gold, #B9782D)', marginBottom: '12px'}}></i>
            <div style={{fontSize: '14px', fontWeight: '600'}}>Loading employees from Supabase database...</div>
          </div>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '650px'}}>
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
                <th style={{padding: '12px 16px'}}>Login PIN / Password</th>
                <th style={{padding: '12px 16px'}}>Status</th>
                <th style={{padding: '12px 16px', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px'}}>
                    <i className="fa-regular fa-folder-open" style={{fontSize: '24px', display: 'block', marginBottom: '8px'}}></i>
                    No employees found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                    {/* Employee Info without image */}
                    <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                      <div style={{fontWeight: '700', color: '#111827', fontSize: '13px'}}>{emp.name}</div>
                      <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>{emp.phone}</div>
                    </td>
                    <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                      <span style={{
                        background: 'rgba(185, 120, 45, 0.1)',
                        color: 'var(--gold, #B9782D)',
                        border: '1px solid rgba(185, 120, 45, 0.25)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '800',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fa-regular fa-id-badge" style={{fontSize: '11px'}}></i>
                        {emp.id}
                      </span>
                    </td>
                    <td style={{padding: '14px 16px', verticalAlign: 'middle', color: '#374151', fontSize: '13px', fontWeight: '500'}}>
                      {emp.role}
                    </td>
                    <td style={{padding: '14px 16px', verticalAlign: 'middle', fontWeight: '700', color: '#111827', fontSize: '13px'}}>
                      ₹{emp.dailySalary?.toLocaleString()}
                    </td>
                    {/* Login Password / PIN */}
                    <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                      <span style={{
                        background: '#FFFBEB',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }} title="Login PIN created for this employee">
                        <i className="fa-solid fa-key" style={{fontSize: '10px', color: '#D97706'}}></i>
                        {emp.password || '1234'}
                      </span>
                    </td>
                    <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                      <span style={{
                        background: emp.status === 'Active' ? '#ECFDF5' : '#F3F4F6', 
                        color: emp.status === 'Active' ? '#065F46' : '#6B7280', 
                        padding: '4px 10px',
                        borderRadius: '14px', fontSize: '11px', fontWeight: '700'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    {/* Action Column with Edit Button */}
                    <td style={{padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center'}}>
                      <button
                        onClick={() => openEditModal(emp)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1E40AF',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================
          ADD EMPLOYEE MODAL
         ======================================================== */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1200,
          backdropFilter: 'blur(3px)', padding: '20px'
        }}>
          <div style={{
            background: '#fff', padding: '28px', borderRadius: '14px', 
            width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                <i className="fa-solid fa-user-plus" style={{color: 'var(--gold, #B9782D)', marginRight: '8px'}}></i>
                Add New Employee
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: 0
              }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddEmployee}>

              {/* Employee ID (3 or 4 digits) */}
              <div style={{marginBottom: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Employee ID (3 or 4 digits)
                  </label>
                  <span style={{color: '#6B7280', fontWeight: 'normal', fontSize: '11px'}}>
                    Optional (auto-assigned if blank)
                  </span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{
                    background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px',
                    padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#6B7280'
                  }}>EMP-</span>
                  <input 
                    type="text" 
                    value={formData.empCode}
                    onChange={(e) => setFormData({...formData, empCode: e.target.value.replace(/[^0-9]/g, '')})}
                    placeholder="e.g. 105 or 1005"
                    maxLength={4}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB',
                      boxSizing: 'border-box', outline: 'none', fontSize: '14px', fontWeight: '700',
                      letterSpacing: '1px', color: '#111827'
                    }} 
                  />
                </div>
                <span style={{fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block'}}>
                  Set a 3-4 digit ID for worker login. If left blank, it will be automatically assigned.
                </span>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Patil" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Mobile Number * (Worker Login ID)
                </label>
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const digits = val.replace(/[^0-9]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      phone: val,
                      // Auto-fill suggested password with last 4 digits if password is empty or was auto-filled
                      password: prev.password ? prev.password : (digits.length >= 4 ? digits.slice(-4) : '')
                    }));
                  }}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              {/* Password / PIN Field for Admin to Create */}
              <div style={{marginBottom: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Login Password / PIN *
                  </label>
                  <span style={{color: 'var(--gold, #B9782D)', fontWeight: '600', fontSize: '11px'}}>
                    Admin creates password
                  </span>
                </div>
                <div style={{position: 'relative'}}>
                  <input 
                    type={showAddPassword ? "text" : "password"} 
                    placeholder="e.g. 1234 or 4-digit PIN" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{
                      width: '100%', 
                      padding: '10px 42px 10px 12px', 
                      borderRadius: '6px', 
                      border: '1px solid #D1D5DB', 
                      boxSizing: 'border-box', 
                      outline: 'none', 
                      fontSize: '13px',
                      letterSpacing: showAddPassword ? '1px' : '2px',
                      fontWeight: '600'
                    }} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', padding: 0
                    }}
                    title={showAddPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fa-regular ${showAddPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span style={{fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block'}}>
                  🔑 Give this password to the employee with their mobile number. They will log in with it, and can change it later.
                </span>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '14px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Trade / Role *</label>
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

              <div style={{marginBottom: '22px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Daily Wage Rate / Per Day Salary (₹) *
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000" 
                  value={formData.dailySalary}
                  onChange={(e) => setFormData({...formData, dailySalary: Number(e.target.value)})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  padding: '9px 18px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                }}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary" 
                  style={{
                    padding: '9px 20px', borderRadius: '6px', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Save Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT / DELETE EMPLOYEE MODAL
         ======================================================== */}
      {showEditModal && (
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
              <div>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                  <i className="fa-solid fa-user-pen" style={{color: 'var(--gold, #B9782D)', marginRight: '8px'}}></i>
                  Edit Employee ({editFormData.id})
                </h2>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>Update details or delete employee from database</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: 0
              }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateEmployee}>

              {/* Editable Employee ID (3 or 4 digits) */}
              <div style={{marginBottom: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Employee ID (3 or 4 digits) *
                  </label>
                  <span style={{color: 'var(--gold, #B9782D)', fontWeight: '700', fontSize: '11px'}}>
                    Editable Worker Login ID
                  </span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{
                    background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px',
                    padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#6B7280'
                  }}>EMP-</span>
                  <input 
                    type="text" 
                    value={editFormData.empCode}
                    onChange={(e) => setEditFormData({...editFormData, empCode: e.target.value.replace(/[^0-9]/g, '')})}
                    placeholder="e.g. 102 or 1002"
                    maxLength={4}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB',
                      boxSizing: 'border-box', outline: 'none', fontSize: '14px', fontWeight: '700',
                      letterSpacing: '1px', color: '#111827'
                    }} 
                    required 
                  />
                </div>
                <span style={{fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block'}}>
                  💡 Employee can use this 3-4 digit ID (<strong>{editFormData.empCode || '102'}</strong>) and their Password to log in directly.
                </span>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Mobile Number *
                </label>
                <input 
                  type="tel" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              {/* Password / PIN in Edit Mode */}
              <div style={{marginBottom: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Login Password / PIN *
                  </label>
                  <span style={{color: '#059669', fontWeight: '600', fontSize: '11px'}}>
                    View or reset password
                  </span>
                </div>
                <div style={{position: 'relative'}}>
                  <input 
                    type={showEditPassword ? "text" : "password"} 
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    placeholder="Enter password"
                    style={{
                      width: '100%', 
                      padding: '10px 42px 10px 12px', 
                      borderRadius: '6px', 
                      border: '1px solid #D1D5DB', 
                      boxSizing: 'border-box', 
                      outline: 'none', 
                      fontSize: '13px',
                      letterSpacing: showEditPassword ? '1px' : '2px',
                      fontWeight: '600'
                    }} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', padding: 0
                    }}
                    title={showEditPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fa-regular ${showEditPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span style={{fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block'}}>
                  ℹ️ You can view or reset this employee's password here if they forget it.
                </span>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '14px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Trade / Role *</label>
                  <input 
                    type="text" 
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                    required 
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>Status</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff', fontSize: '13px'}}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Daily Wage Rate / Per Day Salary (₹) *
                </label>
                <input 
                  type="number" 
                  value={editFormData.dailySalary}
                  onChange={(e) => setEditFormData({...editFormData, dailySalary: Number(e.target.value)})}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'}} 
                  required 
                />
              </div>

              {/* Bottom Buttons: Delete (Red) on left, Cancel & Save on right */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E5E7EB'}}>
                <button 
                  type="button" 
                  onClick={handleDeleteEmployee}
                  disabled={saving}
                  style={{
                    background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626',
                    padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  title="Permanently remove employee from database"
                >
                  <i className="fa-solid fa-trash-can"></i> Delete Employee
                </button>

                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{
                    padding: '9px 18px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                  }}>Cancel</button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn-primary" 
                    style={{
                      padding: '9px 20px', borderRadius: '6px', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Employees;
