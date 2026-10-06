import React, { useState, useRef, useEffect } from 'react';
import '../styles/Header.css';

const Header = ({ onLogout, onToggleSidebar, user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
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
            <span style={{
              background: 'rgba(185, 120, 45, 0.15)',
              color: 'var(--gold-light, #D4993F)',
              border: '1px solid rgba(185, 120, 45, 0.3)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-helmet-safety"></i> Worker Portal
            </span>
          </div>
        ) : (
          <div className="header-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search employees, sites, customers..." />
          </div>
        )}
      </div>

      <div className="header-right">
        <select className="header-lang" aria-label="Select Language">
          <option value="en">EN</option>
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
        </select>

        <div className="header-divider"></div>

        <button className="header-icon-btn" title="Notifications" aria-label="Notifications">
          <i className="fa-regular fa-bell"></i>
          <span className="header-notification-dot"></span>
        </button>

        <div className="header-divider"></div>

        <div className="header-dropdown" ref={dropdownRef}>
          <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="header-user-info">
              <div className="header-user-name">{user?.name || (isEmployee ? 'Anurag' : 'Mahendra Sharma')}</div>
              <div className="header-user-role">{user?.roleTitle || (isEmployee ? 'Carpenter' : 'Administrator')}</div>
            </div>
            <img 
              src={user?.avatar || (isEmployee ? 'https://i.pravatar.cc/150?img=12' : 'https://i.pravatar.cc/150?img=11')} 
              alt={user?.name || 'User'} 
              className="header-avatar" 
            />
          </div>

          {showDropdown && (
            <div className="header-dropdown-menu">
              <div style={{padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px'}}>
                <div style={{fontSize: '13px', fontWeight: '700', color: '#F9FAFB'}}>{user?.fullName || user?.name}</div>
                <div style={{fontSize: '11px', color: 'var(--gold-light)'}}>
                  {isEmployee ? `ID: ${user?.id || 'EMP'} · Mobile: ${user?.mobile || ''}` : 'Administrator'}
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
                <i className="fa-solid fa-key" style={{color: 'var(--gold, #B9782D)'}}></i> Change Password / PIN
              </a>
              <div className="header-dropdown-divider"></div>
              <a href="#" className="header-dropdown-item danger" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
              </a>
            </div>
          )}
        </div>

        {/* Directly Visible Logout Button */}
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            marginLeft: '6px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
          title="Sign out of account"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Logout</span>
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
                  <i className="fa-solid fa-key" style={{color: 'var(--gold, #B9782D)'}}></i>
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

