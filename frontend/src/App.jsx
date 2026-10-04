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
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'employee') {
      setActiveTab('emp-dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    const isEmployee = currentUser?.role === 'employee';

    if (isEmployee) {
      switch (activeTab) {
        case 'emp-dashboard':
          return <EmployeeDashboard user={currentUser} onNavigate={setActiveTab} />;
        case 'emp-attendance':
          return <EmployeeAttendance user={currentUser} />;
        case 'emp-salary':
          return <EmployeeSalary user={currentUser} onNavigate={setActiveTab} />;
        case 'emp-reports':
          return <EmployeeReports user={currentUser} />;
        default:
          return <EmployeeDashboard user={currentUser} onNavigate={setActiveTab} />;
      }
    }

    // Admin Panel Routing
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'sites':
      case 'customers':
      case 'projects':
        return <Sites onNavigate={setActiveTab} />;
      case 'employees':
        return <Employees />;
      case 'attendance':
        return <Attendance />;
      case 'salary':
        return <Salary />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
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
