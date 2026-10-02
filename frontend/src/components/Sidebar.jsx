import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span style={{fontSize: '18px', display: 'flex', flexDirection: 'column'}}>
          <strong>Modern Interior</strong>
          <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Management System</span>
        </span>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-group">
          <div className="menu-title">Main</div>
          <a href="#" className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <i className="fa-solid fa-chart-pie" style={{marginRight: '8px', width: '20px'}}></i> Dashboard
          </a>
        </div>

        <div className="menu-group">
          <div className="menu-title">Management</div>
          <a href="#" className={`menu-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('customers'); }}>
            <i className="fa-solid fa-users" style={{marginRight: '8px', width: '20px'}}></i> Customers
          </a>
          <a href="#" className={`menu-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('projects'); }}>
            <i className="fa-solid fa-building" style={{marginRight: '8px', width: '20px'}}></i> Projects & Sites
          </a>
          <a href="#" className={`menu-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('employees'); }}>
            <i className="fa-solid fa-user-tie" style={{marginRight: '8px', width: '20px'}}></i> Employees
          </a>
        </div>
        
        <div className="menu-group">
          <div className="menu-title">Operations</div>
          <a href="#" className={`menu-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('attendance'); }}>
            <i className="fa-solid fa-clipboard-user" style={{marginRight: '8px', width: '20px'}}></i> Attendance
          </a>
          <a href="#" className={`menu-item ${activeTab === 'salary' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('salary'); }}>
            <i className="fa-solid fa-money-bill-wave" style={{marginRight: '8px', width: '20px'}}></i> Salary Processing
          </a>
          <a href="#" className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>
            <i className="fa-solid fa-file-pdf" style={{marginRight: '8px', width: '20px'}}></i> Reports
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
