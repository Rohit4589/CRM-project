import React from 'react';
import '../styles/Sidebar.css';
import modernLogo from '../assets/logo.png';
import { getTranslation } from '../utils/translations';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, user, onLogout, lang = 'en', onOpenChangePin, onOpenFestivals }) => {
  const isEmployee = user?.role === 'employee';

  const t = {
    dashboard: getTranslation(lang, 'dashboard'),
    attendance: getTranslation(lang, 'attendance'),
    salary: getTranslation(lang, 'salary'),
    payslip: getTranslation(lang, 'payslip'),
    main: getTranslation(lang, 'main'),
    workAndPay: getTranslation(lang, 'workAndPay'),
    logout: getTranslation(lang, 'logout'),
    worker: getTranslation(lang, 'worker'),
    changePin: getTranslation(lang, 'changePin'),
    management: getTranslation(lang, 'management'),
    operations: getTranslation(lang, 'operations'),
    sites: getTranslation(lang, 'sites'),
    employees: getTranslation(lang, 'employees'),
    reports: getTranslation(lang, 'reports'),
    estimates: getTranslation(lang, 'estimates'),
    todoList: getTranslation(lang, 'todoList'),
    productsRates: getTranslation(lang, 'productsRates'),
  };

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
          <div 
            className="sidebar-brand-inner"
            onClick={(e) => handleItemClick(e, isEmployee ? 'emp-dashboard' : 'dashboard')}
            style={{ cursor: 'pointer' }}
            title="Go to Dashboard"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleItemClick(e, isEmployee ? 'emp-dashboard' : 'dashboard');
              }
            }}
          >
            <div className="sidebar-logo-wrap">
              <img 
                src={modernLogo} 
                alt="Modern Interior" 
                className="sidebar-logo-img" 
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              />
            </div>
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
               (Only Attendance, Salary, Reports, Change PIN)
               ========================================= */
            <>
              <div className="menu-group">
                <div className="menu-title">{t.main}</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-dashboard' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-dashboard')}
                >
                  <i className="fa-solid fa-gauge"></i> {t.dashboard}
                </a>
              </div>

              <div className="menu-group">
                <div className="menu-title">{t.workAndPay}</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-attendance' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-attendance')}
                >
                  <i className="fa-solid fa-clipboard-user"></i> {t.attendance}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-salary' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-salary')}
                >
                  <i className="fa-solid fa-money-bill-wave"></i> {t.salary}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'emp-reports' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'emp-reports')}
                >
                  <i className="fa-solid fa-file-invoice"></i> {t.payslip}
                </a>
                <a 
                  href="#" 
                  className="menu-item" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenChangePin) onOpenChangePin();
                    if (onClose) onClose();
                  }}
                >
                  <i className="fa-solid fa-key" style={{ color: 'var(--gold, #A56A30)' }}></i> {t.changePin}
                </a>
              </div>
            </>
          ) : (
            /* =========================================
               ADMIN FULL NAVIGATION
               ========================================= */
            <>
              <div className="menu-group">
                <div className="menu-title">{t.main}</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'dashboard')}
                >
                  <i className="fa-solid fa-chart-pie"></i> {t.dashboard}
                </a>
              </div>

              <div className="menu-group">
                <div className="menu-title">{t.management}</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'sites' || activeTab === 'customers' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'sites')}
                >
                  <i className="fa-solid fa-users"></i> {t.sites}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'employees' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'employees')}
                >
                  <i className="fa-solid fa-user-tie"></i> {t.employees}
                </a>
              </div>
              
              <div className="menu-group">
                <div className="menu-title">{t.operations}</div>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'attendance' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'attendance')}
                >
                  <i className="fa-solid fa-clipboard-user"></i> {t.attendance}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'salary' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'salary')}
                >
                  <i className="fa-solid fa-money-bill-wave"></i> {t.salary}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'estimates' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'estimates')}
                >
                  <i className="fa-solid fa-file-invoice-dollar"></i> {t.estimates}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'todo-list' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'todo-list')}
                >
                  <i className="fa-solid fa-list-check"></i> {t.todoList || 'To-Do List'}
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeTab === 'products-rates' ? 'active' : ''}`} 
                  onClick={(e) => handleItemClick(e, 'products-rates')}
                >
                  <i className="fa-solid fa-tags"></i> {t.productsRates}
                </a>
                <a 
                  href="#" 
                  className="menu-item" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenFestivals) onOpenFestivals();
                    if (onClose) onClose();
                  }}
                  title="Manage Festival Holidays & Benefits"
                >
                  <i className="fa-solid fa-champagne-glasses" style={{ color: 'var(--gold, #A56A30)' }}></i> Festivals & Holidays
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
              background: '#FFFFFF',
              border: '1.5px solid #D1C2AF',
              color: '#5C3D24',
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
              boxShadow: '0 1px 3px rgba(100, 70, 40, 0.05)',
              transition: 'all 0.2s'
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
            <span>{t.logout}</span>
          </button>
          
          <div className="sidebar-footer-text">
            {isEmployee ? (
              <>
                <strong style={{color: '#2B2520'}}>{t.worker}: {user?.name || 'Anurag'}</strong><br/>
                ID: {user?.id || 'EMP-101'}
              </>
            ) : (
              <>
                © 2026 Modern Interior
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
