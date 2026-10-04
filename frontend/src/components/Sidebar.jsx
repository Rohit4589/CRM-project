import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, user, onLogout }) => {
  const isEmployee = user?.role === 'employee';

  const handleItemClick = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ background: isEmployee ? 'var(--gold)' : 'var(--gold)' }}>
            <i className={`fa-solid ${isEmployee ? 'fa-helmet-safety' : 'fa-house'}`}></i>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Modern Interior</span>
            <span className="sidebar-brand-sub">
              {isEmployee ? 'Worker Portal' : 'Admin Management'}
            </span>
          </div>
          {/* Close button on mobile */}
          <button 
            className="sidebar-mobile-close" 
            onClick={onClose} 
            title="Close menu"
            aria-label="Close navigation"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="sidebar-menu">
          {isEmployee ? (
            /* =========================================
               EMPLOYEE RESTRICTED NAVIGATION
               (Only Attendance, Salary, Reports)
               ========================================= */
            <>
              <div className="menu-group">
                <div className="menu-title">Main</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-dashboard' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-dashboard')}
                >
                  <i className="fa-solid fa-gauge"></i> My Dashboard
                </a>
              </div>

              <div className="menu-group">
                <div className="menu-title">Work & Pay</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-attendance' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-attendance')}
                >
                  <i className="fa-solid fa-clipboard-user"></i> My Attendance
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-salary' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-salary')}
                >
                  <i className="fa-solid fa-money-bill-wave"></i> My Salary
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-reports' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-reports')}
                >
                  <i className="fa-solid fa-file-invoice"></i> My Payslip
                </a>
              </div>
            </>
          ) : (
            /* =========================================
               ADMIN FULL NAVIGATION
               ========================================= */
            <>
              <div className="menu-group">
                <div className="menu-title">Main</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'dashboard')}
                >
                  <i className="fa-solid fa-chart-pie"></i> Dashboard
                </a>
              </div>

              <div className="menu-group">
                <div className="menu-title">Management</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'sites' || activeTab === 'customers' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'sites')}
                >
                  <i className="fa-solid fa-location-dot"></i> Sites / Customers
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'employees' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'employees')}
                >
                  <i className="fa-solid fa-user-tie"></i> Employees
                </a>
              </div>
              
              <div className="menu-group">
                <div className="menu-title">Operations</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'attendance' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'attendance')}
                >
                  <i className="fa-solid fa-clipboard-user"></i> Attendance
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'salary' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'salary')}
                >
                  <i className="fa-solid fa-money-bill-wave"></i> Salary Processing
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'reports')}
                >
                  <i className="fa-solid fa-file-lines"></i> Reports
                </a>
              </div>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button 
            onClick={onLogout}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              color: '#F87171',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
              transition: 'all 0.2s'
            }}
            title="Sign out of account"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Logout</span>
          </button>
          
          <div className="sidebar-footer-text">
            {isEmployee ? (
              <>
                <strong style={{color: '#E5E7EB'}}>Worker Portal: {user?.name || 'Anurag'}</strong><br/>
                ID: {user?.id || 'EMP-101'} · Modern Interior
              </>
            ) : (
              <>
                © 2026 Modern Interior<br/>All rights reserved.
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
