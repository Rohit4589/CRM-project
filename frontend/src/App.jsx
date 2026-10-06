import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import Reports from './pages/Reports';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeSalary from './pages/employee/EmployeeSalary';
import EmployeeReports from './pages/employee/EmployeeReports';

import Login from './pages/Login';
import './index.css';

function App() {
  // Restore logged-in user from localStorage on refresh
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('mi_crm_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      if (parsed && typeof parsed === 'object' && (parsed.role === 'admin' || parsed.role === 'employee')) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Restore active tab from localStorage on refresh
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem('mi_crm_tab');
      if (savedTab) return savedTab;
      const savedUser = localStorage.getItem('mi_crm_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed?.role === 'employee' ? 'emp-dashboard' : 'dashboard';
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('mi_crm_tab', tab);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('mi_crm_user', JSON.stringify(user));
    const defaultTab = user.role === 'employee' ? 'emp-dashboard' : 'dashboard';
    setActiveTab(defaultTab);
    localStorage.setItem('mi_crm_tab', defaultTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('mi_crm_user');
    localStorage.removeItem('mi_crm_tab');
  };

  const renderContent = () => {
    const isEmployee = currentUser?.role === 'employee';

    if (isEmployee) {
      switch (activeTab) {
        case 'emp-dashboard':
          return <EmployeeDashboard user={currentUser} onNavigate={handleTabChange} />;
        case 'emp-attendance':
          return <EmployeeAttendance user={currentUser} />;
        case 'emp-salary':
          return <EmployeeSalary user={currentUser} onNavigate={handleTabChange} />;
        case 'emp-reports':
          return <EmployeeReports user={currentUser} />;
        default:
          return <EmployeeDashboard user={currentUser} onNavigate={handleTabChange} />;
      }
    }

    // Admin Panel Routing
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} user={currentUser} />;
      case 'sites':
      case 'customers':
      case 'projects':
        return <Sites onNavigate={handleTabChange} />;
      case 'employees':
        return <Employees />;
      case 'attendance':
        return <Attendance />;
      case 'salary':
        return <Salary />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={handleTabChange} user={currentUser} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-wrapper">
        <Header 
          onLogout={handleLogout} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          user={currentUser}
        />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
