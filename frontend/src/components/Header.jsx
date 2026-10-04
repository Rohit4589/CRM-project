import React, { useState, useRef, useEffect } from 'react';
import '../styles/Header.css';

const Header = ({ onLogout, onToggleSidebar, user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
              <div className="header-user-name">{user?.name || (isEmployee ? 'Anurag' : 'Bryan Maxim')}</div>
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
                <div style={{fontSize: '11px', color: 'var(--gold-light)'}}>{isEmployee ? 'Employee ID: EMP-101' : 'Admin Role'}</div>
              </div>
              <a href="#" className="header-dropdown-item" onClick={(e) => e.preventDefault()}>
                <i className="fa-regular fa-user"></i> My Profile
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
    </header>
  );
};

export default Header;
