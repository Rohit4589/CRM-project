import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { toTitleCase } from '../utils/autoCapitalize';
import { handleFormKeyDown } from '../utils/formKeyboardNav';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New employee form data
  const [formData, setFormData] = useState({
    empCode: '',
    name: '',
    phone: '',
    password: '',
    role: '',
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
    role: '',
    dailySalary: 1000,
    status: 'Active'
  });

  // Fetch employees from database
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/employees`);
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

    if (formData.dailySalary === '' || formData.dailySalary === undefined || isNaN(Number(formData.dailySalary))) {
      setApiError('Daily wage rate is required');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/employees`, {
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
        role: '',
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
    setShowDeleteConfirm(false);
    const rawEmpCode = emp.empCode || emp.rawCode || String(emp.id || '').replace(/^EMP-/i, '');
    setEditFormData({
      dbId: emp.dbId,
      id: emp.id,
      empCode: rawEmpCode,
      name: emp.name || '',
      phone: emp.rawPhone || emp.phone?.replace('+91 ', '') || '',
      password: emp.password || '',
      role: emp.role || '',
      dailySalary: emp.dailySalary !== undefined ? emp.dailySalary : 1000,
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

    if (editFormData.dailySalary === '' || editFormData.dailySalary === undefined || isNaN(Number(editFormData.dailySalary))) {
      setApiError('Daily wage rate is required');
      setSaving(false);
      return;
    }

    try {
      const targetId = editFormData.dbId || editFormData.id;
      const res = await fetch(`${API_BASE}/employees/${targetId}`, {
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

  // Trigger Custom Delete Confirmation Modal
  const promptDeleteEmployee = () => {
    setApiError('');
    setShowDeleteConfirm(true);
  };

  // Confirm Delete Employee Handler
  const handleConfirmDeleteEmployee = async () => {
    setSaving(true);
    setApiError('');

    try {
      const targetId = editFormData.dbId || editFormData.id;
      const res = await fetch(`${API_BASE}/employees/${targetId}`, {
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
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      setSuccessMessage(`Employee "${editFormData.name}" (${editFormData.id}) was permanently deleted from the database.`);
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
    <main className="dashboard-content" style={{ padding: '24px' }}>

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)' }}>
              Employees
            </h1>
            <span style={{
              background: 'rgba(165, 106, 48, 0.1)', color: 'var(--gold, #A56A30)',
              fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px'
            }}>
              {employees.length}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7D6C5E' }}>
            Staff profiles & daily wages
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '9px 14px 9px 36px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
            />
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setApiError('');
              setShowAddModal(true);
            }}
            style={{ padding: '9px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
          <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '16px' }}></i>
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
          <i className="fa-solid fa-circle-exclamation" style={{ color: '#EF4444', fontSize: '16px' }}></i>
          {apiError}
        </div>
      )}

      {/* Employees Table */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #D1C2AF',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#6B7280' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: 'var(--gold, #A56A30)', marginBottom: '12px' }}></i>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading employees...</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{
                background: '#F3EDE6',
                borderBottom: '1.5px solid #D1C2AF',
                textAlign: 'left',
                color: '#5C4E43',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <th style={{ padding: '12px 16px', width: '13%', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px 16px', width: '21%', textAlign: 'center' }}>Employee</th>
                <th style={{ padding: '12px 16px', width: '15%', textAlign: 'center' }}>Role</th>
                <th style={{ padding: '12px 16px', width: '14%', textAlign: 'center' }}>Daily Wage</th>
                <th style={{ padding: '12px 16px', width: '15%', textAlign: 'center' }}>Login PIN</th>
                <th style={{ padding: '12px 16px', width: '10%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 20px', width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                    <i className="fa-regular fa-folder-open" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {/* 1. Employee ID Badge - Left Aligned */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left' }}>
                      <span style={{
                        background: 'rgba(165, 106, 48, 0.1)',
                        color: 'var(--gold, #A56A30)',
                        border: '1px solid rgba(165, 106, 48, 0.25)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '800',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fa-regular fa-id-badge" style={{ fontSize: '11px' }}></i>
                        {emp.id}
                      </span>
                    </td>

                    {/* 2. Employee Name & Phone - Centered */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{emp.phone || '-'}</div>
                    </td>

                    {/* 3. Role - Centered */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                      {emp.role || '-'}
                    </td>

                    {/* 4. Daily Wage - Centered */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                      ₹{emp.dailySalary?.toLocaleString()}
                    </td>

                    {/* 5. Login Password / PIN - Centered */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
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
                        <i className="fa-solid fa-key" style={{ fontSize: '10px', color: '#D97706' }}></i>
                        {emp.password || '1234'}
                      </span>
                    </td>

                    {/* 6. Status - Centered */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span style={{
                        background: emp.status === 'Active' ? '#ECFDF5' : '#F3F4F6',
                        color: emp.status === 'Active' ? '#065F46' : '#6B7280',
                        padding: '4px 10px',
                        borderRadius: '14px', fontSize: '11px', fontWeight: '700'
                      }}>
                        {emp.status}
                      </span>
                    </td>

                    {/* 7. Action Column with Edit Button - Right Aligned */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(emp)}
                        style={{
                          background: '#FAF8F5',
                          border: '1px solid #D1C2AF',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#7A4518',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#F3EDE6'; e.currentTarget.style.borderColor = '#9A7B56'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                <i className="fa-solid fa-user-plus" style={{ color: 'var(--gold, #A56A30)', marginRight: '8px' }}></i>
                Add New Employee
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: 0
              }}>&times;</button>
            </div>

            <form onSubmit={handleAddEmployee} onKeyDown={handleFormKeyDown}>

              {/* Employee ID (3 or 4 digits) */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Employee ID (3 or 4 digits)
                  </label>
                  <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '11px' }}>
                    Optional (auto-assigned if blank)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px',
                    padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#6B7280'
                  }}>EMP-</span>
                  <input
                    type="text"
                    value={formData.empCode}
                    onChange={(e) => setFormData({ ...formData, empCode: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 105 or 1005"
                    maxLength={4}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB',
                      boxSizing: 'border-box', outline: 'none', fontSize: '14px', fontWeight: '700',
                      letterSpacing: '1px', color: '#111827'
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                  Set a 3-4 digit ID for worker login. If left blank, it will be automatically assigned.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Patil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Mobile Number
                  </label>
                  <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '11px' }}>
                    Optional
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 (Optional)"
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
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                />
              </div>

              {/* Password / PIN Field for Admin to Create */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Login Password / PIN *
                  </label>
                  <span style={{ color: 'var(--gold, #A56A30)', fontWeight: '600', fontSize: '11px' }}>
                    Admin creates password
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAddPassword ? "text" : "password"}
                    placeholder="e.g. 1234 or 4-digit PIN"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>Trade / Role</label>
                    <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '11px' }}>Optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Carpenter, Painter (Optional)"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: toTitleCase(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff', fontSize: '13px' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                  Daily Wage Rate / Per Day Salary (₹) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 1000"
                  value={formData.dailySalary}
                  onChange={(e) => setFormData({ ...formData, dailySalary: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  <i className="fa-solid fa-user-pen" style={{ color: 'var(--gold, #A56A30)', marginRight: '8px' }}></i>
                  Edit Employee ({editFormData.id})
                </h2>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Update details or delete employee from database</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: 0
              }}>&times;</button>
            </div>

            <form onSubmit={handleUpdateEmployee} onKeyDown={handleFormKeyDown}>

              {/* Editable Employee ID (3 or 4 digits) */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Employee ID (3 or 4 digits) *
                  </label>
                  <span style={{ color: 'var(--gold, #A56A30)', fontWeight: '700', fontSize: '11px' }}>
                    Editable Worker Login ID
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px',
                    padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#6B7280'
                  }}>EMP-</span>
                  <input
                    type="text"
                    value={editFormData.empCode}
                    onChange={(e) => setEditFormData({ ...editFormData, empCode: e.target.value.replace(/[^0-9]/g, '') })}
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
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                  💡 Employee can use this 3-4 digit ID (<strong>{editFormData.empCode || '102'}</strong>) and their Password to log in directly.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: toTitleCase(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Mobile Number
                  </label>
                  <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '11px' }}>
                    Optional
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 (Optional)"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                />
              </div>

              {/* Password / PIN in Edit Mode */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                    Login Password / PIN *
                  </label>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '11px' }}>
                    View or reset password
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
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
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                  ℹ️ You can view or reset this employee's password here if they forget it.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ color: '#374151', fontWeight: '600', fontSize: '12px' }}>Trade / Role</label>
                    <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '11px' }}>Optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Carpenter, Painter (Optional)"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: toTitleCase(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff', fontSize: '13px' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
                  Daily Wage Rate / Per Day Salary (₹) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editFormData.dailySalary}
                  onChange={(e) => setEditFormData({ ...editFormData, dailySalary: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px' }}
                  required
                />
              </div>

              {/* Bottom Buttons: Delete (Red) on left, Cancel & Save on right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={promptDeleteEmployee}
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

                <div style={{ display: 'flex', gap: '10px' }}>
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

      {/* ========================================================
          CUSTOM DELETE CONFIRMATION MODAL
         ======================================================== */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1400,
          backdropFilter: 'blur(4px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden', padding: '26px 24px 22px',
            textAlign: 'center', boxSizing: 'border-box'
          }}>
            {/* Warning Icon Badge */}
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%',
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '22px'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              Delete Employee?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280', lineHeight: '1.45' }}>
              Are you sure you want to permanently delete this employee from the database? This action cannot be undone.
            </p>

            {/* Employee Preview Card */}
            <div style={{
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '20px', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {editFormData.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  {editFormData.role || 'Employee'} {editFormData.phone ? `· ${editFormData.phone}` : ''}
                </div>
              </div>
              <span style={{
                background: 'rgba(165, 106, 48, 0.1)', color: 'var(--gold, #A56A30)',
                border: '1px solid rgba(165, 106, 48, 0.25)',
                padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '12px',
                whiteSpace: 'nowrap'
              }}>
                {editFormData.id}
              </span>
            </div>

            {/* Actions: Cancel & Confirm Delete */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '8px',
                  border: '1px solid #D1D5DB', background: '#ffffff',
                  color: '#374151', cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmployee}
                disabled={saving}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '8px',
                  border: 'none', background: '#DC2626', color: '#ffffff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                  opacity: saving ? 0.75 : 1
                }}
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash-can"></i> Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Employees;
