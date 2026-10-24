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
import Estimates from './pages/Estimates';
import ProductsRates from './pages/ProductsRates';
import TodoList from './pages/TodoList';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeSalary from './pages/employee/EmployeeSalary';
import EmployeeReports from './pages/employee/EmployeeReports';

import Login from './pages/Login';
import ChangePinModal from './components/ChangePinModal';
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

  // Always land on Dashboard when opening or refreshing the website
  const [activeTab, setActiveTab] = useState(() => {
    try {
      localStorage.removeItem('mi_crm_tab');
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
  const [showPinModal, setShowPinModal] = useState(false);

  // Helper to store language preference per logged-in account
  const getUserLangKey = (user) => {
    if (!user) return 'mi_crm_lang';
    const uId = user.id || user.dbId || user.username || user.mobile;
    return uId ? `mi_crm_lang_user_${uId}` : 'mi_crm_lang';
  };

  // Multi-language support (defaults to 'en' English as requested)
  const [lang, setLang] = useState(() => {
    try {
      const savedUserStr = localStorage.getItem('mi_crm_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const userSaved = localStorage.getItem(getUserLangKey(u));
        if (userSaved) return userSaved;
      }
      return localStorage.getItem('mi_crm_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // Set lang attribute on root for typography styling
  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.body.setAttribute('data-lang', lang);
  }, [lang]);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mi_crm_lang', newLang);
    if (currentUser) {
      localStorage.setItem(getUserLangKey(currentUser), newLang);
    }
  };

  const [tabParams, setTabParams] = useState({});

  const handleTabChange = (tab, params = {}) => {
    setTabParams(params);
    setActiveTab(tab);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('mi_crm_user', JSON.stringify(user));
    // Restore this user's preferred language, or default to English
    const savedUserLang = localStorage.getItem(getUserLangKey(user)) || 'en';
    setLang(savedUserLang);
    const defaultTab = user.role === 'employee' ? 'emp-dashboard' : 'dashboard';
    setActiveTab(defaultTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('mi_crm_user');
    localStorage.removeItem('mi_crm_tab');
    // Reset back to English default
    setLang('en');
    localStorage.removeItem('mi_crm_lang');
  };

  const renderContent = () => {
    const isEmployee = currentUser?.role === 'employee';

    if (isEmployee) {
      switch (activeTab) {
        case 'emp-dashboard':
          return <EmployeeDashboard user={currentUser} onNavigate={handleTabChange} lang={lang} onLangChange={handleLangChange} />;
        case 'emp-attendance':
          return <EmployeeAttendance user={currentUser} lang={lang} />;
        case 'emp-salary':
          return <EmployeeSalary user={currentUser} onNavigate={handleTabChange} lang={lang} />;
        case 'emp-reports':
          return <EmployeeReports user={currentUser} lang={lang} />;
        default:
          return <EmployeeDashboard user={currentUser} onNavigate={handleTabChange} lang={lang} onLangChange={handleLangChange} />;
      }
    }

    // Admin Panel Routing
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} user={currentUser} lang={lang} />;
      case 'sites':
      case 'customers':
      case 'projects':
        return <Sites onNavigate={handleTabChange} />;
      case 'employees':
        return <Employees />;
      case 'attendance':
        return <Attendance lang={lang} initialDate={tabParams?.date} />;
      case 'salary':
        return <Salary lang={lang} />;
      case 'reports':
        return <Reports />;
      case 'estimates':
        return <Estimates onNavigate={handleTabChange} />;
      case 'todo-list':
        return <TodoList onNavigate={handleTabChange} />;
      case 'products-rates':
        return <ProductsRates onNavigate={handleTabChange} />;
      default:
        return <Dashboard onNavigate={handleTabChange} user={currentUser} lang={lang} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`layout lang-${lang}`} data-lang={lang}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
        lang={lang}
        onOpenChangePin={() => setShowPinModal(true)}
      />
      <div className="main-wrapper">
        <Header 
          onLogout={handleLogout} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          user={currentUser}
          lang={lang}
          onLangChange={handleLangChange}
          onNavigate={handleTabChange}
        />
        {renderContent()}
      </div>

      {/* Global Change Password / PIN Modal */}
      <ChangePinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        user={currentUser}
        lang={lang}
      />
    </div>
  );
}

export default App;
