import React, { useState, useRef, useEffect } from 'react';
import '../styles/Header.css';
import { API_BASE } from '../config/api';
import { getTranslation } from '../utils/translations';

const Header = ({ onLogout, onToggleSidebar, user, lang = 'en', onLangChange, onNavigate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const t = {
    workerPortal: getTranslation(lang, 'workerPortal'),
    logout: getTranslation(lang, 'logout'),
    worker: getTranslation(lang, 'worker'),
    administrator: getTranslation(lang, 'administrator'),
  };

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const isEmployee = user?.role === 'employee';

  const fetchPendingNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const pending = data.data.filter(log => log.status === 'Pending Approval');
        setNotifications(pending);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchPendingNotifications();
    const interval = setInterval(fetchPendingNotifications, 10000);
    const handleAttendanceChange = () => fetchPendingNotifications();
    window.addEventListener('attendance-changed', handleAttendanceChange);
    window.addEventListener('focus', handleAttendanceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('attendance-changed', handleAttendanceChange);
      window.removeEventListener('focus', handleAttendanceChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickApprove = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new Event('attendance-changed'));
      }
    } catch (err) {
      console.error('Error approving notification:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!newPassword.trim()) {
      setPwdError('Please enter a new password/PIN');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPwdError('New passwords do not match. Please verify.');
      return;
    }

    setPwdLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.dbId || user?.id,
          mobile: user?.mobile,
          username: user?.username,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPwdError(data.message || 'Failed to update password');
        setPwdLoading(false);
        return;
      }

      setPwdSuccess('Password changed successfully! Remember this for your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwdSuccess('');
        setShowPasswordModal(false);
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPwdError('Server connection error. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Mobile Hamburger Menu Button */}
        <button 
          className="mobile-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          title="Open Menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        {isEmployee ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="header-portal-badge" style={{
              background: 'rgba(140, 85, 33, 0.1)',
              color: 'var(--coffee-medium, #8C5521)',
              border: '1px solid var(--coffee-border, #D1C2AF)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-helmet-safety"></i>
              <span className="portal-badge-text">{t.workerPortal}</span>
            </span>
          </div>
        ) : (
          <div className="header-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search..." />
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Short & Simple Language Selector for Workers */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: '#FFFFFF',
          border: '1.5px solid var(--coffee-border, #D1C2AF)',
          borderRadius: '8px',
          padding: '4px 8px',
          boxShadow: '0 1px 3px rgba(100, 70, 40, 0.04)'
        }}>
          <i className="fa-solid fa-language" style={{ color: 'var(--coffee-medium, #8C5521)', fontSize: '13px' }}></i>
          <select 
            className="header-lang" 
            aria-label="Select Language"
            value={lang}
            onChange={(e) => onLangChange && onLangChange(e.target.value)}
            style={{
              cursor: 'pointer',
              fontWeight: '800',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--coffee-dark, #5C3D24)',
              fontSize: '12px',
              padding: '2px 0'
            }}
          >
            <option value="hi">हिंदी</option>
            <option value="en">ENG</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div className="header-divider"></div>

        {/* Notification Bell with Badge & Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="header-icon-btn" 
            title="Notifications" 
            aria-label="Notifications"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowDropdown(false);
            }}
            style={{
              position: 'relative',
              background: showNotifDropdown ? '#F3EDE6' : '#FFFFFF',
              borderColor: showNotifDropdown ? 'var(--gold, #A56A30)' : '#D1C2AF'
            }}
          >
            <i 
              className={`fa-${notifications.length > 0 ? 'solid' : 'regular'} fa-bell`} 
              style={{ color: notifications.length > 0 ? 'var(--gold, #A56A30)' : '#4B5563', fontSize: '15px' }}
            ></i>
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '800',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 4px rgba(220,38,38,0.35)'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '360px',
              maxWidth: 'calc(100vw - 32px)',
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
              zIndex: 1500,
              overflow: 'hidden'
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '12px 16px',
                background: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-bell" style={{ color: 'var(--gold, #A56A30)', fontSize: '13px' }}></i>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: '#111827' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <span style={{
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {notifications.length} Pending
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    color: '#9CA3AF',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Notification Items List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6B7280' }}>
                    <i className="fa-regular fa-circle-check" style={{ fontSize: '32px', color: '#10B981', marginBottom: '8px', display: 'block' }}></i>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>All Caught Up!</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                      No pending attendance approval requests.
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const salaryVal = Math.round((parseFloat(notif.dayValue) || 0) * (Number(notif.dailyRate) || 1000));
                    return (
                      <div
                        key={notif.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #F3F4F6',
                          background: '#FEFDFB',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEFDFB'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '700', color: '#111827', fontSize: '12.5px' }}>
                                {notif.employeeName}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#A56A30', fontWeight: '700', background: 'rgba(165,106,48,0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                {notif.empCode || `EMP-${notif.userId}`}
                              </span>
                            </div>

                            <div style={{ fontSize: '11.5px', color: '#4B5563', marginTop: '3px' }}>
                              Punched OUT: <strong>{notif.outTime || '--:--'}</strong> ({notif.valueText || `${notif.dayValue} Day`} · ₹{salaryVal.toLocaleString('en-IN')})
                            </div>

                            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-location-dot" style={{ fontSize: '10px', color: '#A56A30' }}></i>
                              <span>{notif.siteRef}: {notif.customerName || 'Work Site'}</span>
                              <span>·</span>
                              <span>{notif.attendanceDate}</span>
                            </div>
                          </div>

                          {/* Quick Approve Button */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprove(notif.id, e)}
                            title="Quick Approve shift"
                            style={{
                              background: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(5,150,105,0.25)'
                            }}
                          >
                            <i className="fa-solid fa-check"></i> Approve
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div style={{
                padding: '10px 16px',
                background: '#F9FAFB',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown(false);
                    if (onNavigate) onNavigate('attendance');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gold, #A56A30)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Open Attendance Sheet</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="header-divider"></div>

        <div className="header-dropdown" ref={dropdownRef}>
          <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="header-user-info">
              <div className="header-user-name">{user?.name || (isEmployee ? 'Anurag' : 'Mahendra Sharma')}</div>
              <div className="header-user-role">{user?.roleTitle || (isEmployee ? t.worker : t.administrator)}</div>
            </div>
          </div>

          {showDropdown && (
            <div className="header-dropdown-menu">
              <div style={{padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px'}}>
                <div style={{fontSize: '13px', fontWeight: '700', color: '#F9FAFB'}}>{user?.fullName || user?.name}</div>
                <div style={{fontSize: '11px', color: 'var(--gold-light, #C4874A)'}}>
                  {isEmployee ? `ID: ${user?.id || 'EMP'} · ${user?.mobile || ''}` : 'Admin'}
                </div>
              </div>
              <a 
                href="#change-password" 
                className="header-dropdown-item" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setPwdError(''); 
                  setPwdSuccess(''); 
                  setShowPasswordModal(true); 
                  setShowDropdown(false); 
                }}
              >
                <i className="fa-solid fa-key" style={{color: 'var(--gold, #A56A30)'}}></i> Change Password / PIN
              </a>
              <div className="header-dropdown-divider"></div>
              <a href="#" className="header-dropdown-item danger" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t.logout}
              </a>
            </div>
          )}
        </div>

        {/* Directly Visible Logout Button */}
        <button
          onClick={onLogout}
          className="header-logout-btn"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #D1C2AF',
            color: '#5C3D24',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            marginLeft: '4px',
            boxShadow: '0 1px 3px rgba(100, 70, 40, 0.05)'
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.background = '#FAF8F5';
            e.currentTarget.style.borderColor = '#8C5521';
            e.currentTarget.style.color = '#8C5521';
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#D1C2AF';
            e.currentTarget.style.color = '#5C3D24';
          }}
          title={t.logout}
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span className="logout-btn-label">{t.logout}</span>
        </button>
      </div>

      {/* ========================================================
          CHANGE PASSWORD / PIN MODAL
         ======================================================== */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 2000,
          backdropFilter: 'blur(3px)', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '440px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.25)', padding: '26px', boxSizing: 'border-box'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <div>
                <h3 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="fa-solid fa-key" style={{color: 'var(--gold, #A56A30)'}}></i>
                  Change Password / PIN
                </h3>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>
                  {isEmployee ? `Account: ${user?.name} (${user?.mobile || user?.username})` : 'Update your administrator password'}
                </div>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                style={{background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#9CA3AF', padding: 0}}
              >&times;</button>
            </div>

            {/* Success Notification */}
            {pwdSuccess && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <i className="fa-solid fa-circle-check" style={{color: '#10B981'}}></i>
                {pwdSuccess}
              </div>
            )}

            {/* Error Notification */}
            {pwdError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <i className="fa-solid fa-circle-exclamation" style={{color: '#EF4444'}}></i>
                {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Current Password / PIN *
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showCurPass ? "text" : "password"}
                    placeholder="Enter existing password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurPass(!showCurPass)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px'
                    }}
                  >
                    <i className={`fa-regular ${showCurPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  New Password / PIN *
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Enter new password or PIN"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px',
                      letterSpacing: showNewPass ? '0.5px' : '2px', fontWeight: '600'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px'
                    }}
                  >
                    <i className={`fa-regular ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px',
                    letterSpacing: '2px', fontWeight: '600'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: '9px 18px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="btn-primary"
                  style={{
                    padding: '9px 20px', borderRadius: '6px', fontSize: '13px',
                    opacity: pwdLoading ? 0.7 : 1, cursor: pwdLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {pwdLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

