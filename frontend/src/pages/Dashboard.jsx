import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = ({ onNavigate, user }) => {
  const [employeeCount, setEmployeeCount] = useState(null);
  const [siteStats, setSiteStats] = useState({ total: 0, active: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/employees').then(res => res.json()).catch(() => ({ success: false })),
      fetch('http://localhost:5000/api/sites').then(res => res.json()).catch(() => ({ success: false })),
    ]).then(([empData, siteData]) => {
      if (empData.success) {
        setEmployeeCount(empData.count);
      }
      if (siteData.success) {
        const activeCount = siteData.sites.filter(s => s.status === 'Running').length;
        setSiteStats({ total: siteData.count, active: activeCount });
      }
    }).finally(() => setLoadingStats(false));
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format today's date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <main className="dashboard">

      {/* ===== Hero / Welcome ===== */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <h1>{getGreeting()}, {user?.name || 'Mahendra'}</h1>
          <p>Here's what's happening across Modern Interior today.</p>
          <div className="dash-date">
            <i className="fa-regular fa-calendar"></i>
            {formatDate()}
          </div>
        </div>
        <div className="dash-hero-actions">
          <button className="btn-primary">
            <i className="fa-solid fa-file-lines"></i> Generate Report
          </button>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon gold">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Active Sites</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.active}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{fontSize: '9px'}}></i> Live in Database
            </div>
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Total Sites / Clients</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : siteStats.total}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{fontSize: '9px'}}></i> Live in Database
            </div>
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-icon green">
            <i className="fa-solid fa-user-group"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Total Employees</div>
            <div className="dash-kpi-value">{loadingStats ? '...' : (employeeCount ?? 0)}</div>
            <div className="dash-kpi-meta up">
              <i className="fa-solid fa-database" style={{fontSize: '9px'}}></i> Live in Database
            </div>
          </div>
        </div>

        <div className="dash-kpi">
          <div className="dash-kpi-icon purple">
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Salary Released</div>
            <div className="dash-kpi-value">₹4.5L</div>
            <div className="dash-kpi-meta neutral">
              Next release: 1st of month
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="dash-quick-actions">
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('sites')}>
          <i className="fa-solid fa-location-dot"></i> Add Site / Customer
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('employees')}>
          <i className="fa-solid fa-user-tie"></i> Add Employee
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('attendance')}>
          <i className="fa-solid fa-clipboard-check"></i> View Attendance
        </button>
        <button className="dash-quick-btn" onClick={() => onNavigate && onNavigate('reports')}>
          <i className="fa-solid fa-chart-column"></i> Reports
        </button>
      </div>

      {/* ===== Main Grid: Sites + Attendance ===== */}
      <div className="dash-grid-main">

        {/* Active Sites */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-location-dot"></i> Active Sites
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('sites')}>
              View All <i className="fa-solid fa-arrow-right" style={{fontSize: '10px', marginLeft: '3px'}}></i>
            </button>
          </div>
          <div className="dash-card-body">
            <table className="dash-project-table">
              <thead>
                <tr>
                  <th>Site / Customer</th>
                  <th>Location</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="project-name-cell">
                      <span className="project-name">Rahul Deshmukh</span>
                      <span className="project-ref">SITE-001 · Kothrud Kitchen</span>
                    </div>
                  </td>
                  <td>Kothrud</td>
                  <td>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div className="progress-bar-fill gold" style={{width: '72%'}}></div>
                      </div>
                      <span className="progress-percent">72%</span>
                    </div>
                  </td>
                  <td><span className="status-badge running"><span className="status-dot"></span> Running</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="project-name-cell">
                      <span className="project-name">Priya Sharma</span>
                      <span className="project-ref">SITE-002 · Baner Interior</span>
                    </div>
                  </td>
                  <td>Baner</td>
                  <td>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div className="progress-bar-fill gold" style={{width: '45%'}}></div>
                      </div>
                      <span className="progress-percent">45%</span>
                    </div>
                  </td>
                  <td><span className="status-badge running"><span className="status-dot"></span> Running</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="project-name-cell">
                      <span className="project-name">Amit Patel</span>
                      <span className="project-ref">SITE-003 · Wakad</span>
                    </div>
                  </td>
                  <td>Wakad</td>
                  <td>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div className="progress-bar-fill green" style={{width: '100%'}}></div>
                      </div>
                      <span className="progress-percent">100%</span>
                    </div>
                  </td>
                  <td><span className="status-badge completed"><span className="status-dot"></span> Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Snapshot */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-clipboard-user"></i> Today's Attendance
            </div>
            <button className="dash-card-action" onClick={() => onNavigate && onNavigate('attendance')}>
              Details
            </button>
          </div>
          <div className="dash-card-body">
            {/* Attendance Summary Counters */}
            <div className="dash-attendance-summary">
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value success">96</div>
                <div className="dash-attendance-stat-label">Present</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value danger">12</div>
                <div className="dash-attendance-stat-label">Absent</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value warning">8</div>
                <div className="dash-attendance-stat-label">Late</div>
              </div>
              <div className="dash-attendance-stat">
                <div className="dash-attendance-stat-value info">8</div>
                <div className="dash-attendance-stat-label">Leave</div>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="dash-attendance-list">
              <div className="dash-attendance-item">
                <img src="https://i.pravatar.cc/150?img=11" alt="Ramesh" className="dash-attendance-avatar" />
                <div className="dash-attendance-info">
                  <div className="dash-attendance-name">Ramesh Kumar</div>
                  <div className="dash-attendance-site">Baner Interior (PI-002)</div>
                </div>
                <div className="dash-attendance-time">
                  <div className="dash-attendance-badge in">
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{fontSize: '10px'}}></i> IN 09:00 AM
                  </div>
                  <div className="dash-attendance-loc">Within 1 KM</div>
                </div>
              </div>

              <div className="dash-attendance-item">
                <img src="https://i.pravatar.cc/150?img=12" alt="Suresh" className="dash-attendance-avatar" />
                <div className="dash-attendance-info">
                  <div className="dash-attendance-name">Suresh Patil</div>
                  <div className="dash-attendance-site">Kothrud Kitchen (PI-001)</div>
                </div>
                <div className="dash-attendance-time">
                  <div className="dash-attendance-badge out">
                    <i className="fa-solid fa-arrow-right-from-bracket" style={{fontSize: '10px'}}></i> OUT 06:15 PM
                  </div>
                  <div className="dash-attendance-loc">Within 1 KM</div>
                </div>
              </div>

              <div className="dash-attendance-item">
                <img src="https://i.pravatar.cc/150?img=13" alt="Amit" className="dash-attendance-avatar" />
                <div className="dash-attendance-info">
                  <div className="dash-attendance-name">Amit Sharma</div>
                  <div className="dash-attendance-site">Factory</div>
                </div>
                <div className="dash-attendance-time">
                  <div className="dash-attendance-badge in">
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{fontSize: '10px'}}></i> IN 09:10 AM
                  </div>
                  <div className="dash-attendance-loc">Factory</div>
                </div>
              </div>
            </div>
          </div>
          <div className="dash-card-footer">
            <button className="dash-view-all" onClick={() => onNavigate && onNavigate('attendance')}>
              View All Logs <i className="fa-solid fa-arrow-right" style={{fontSize: '10px'}}></i>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Bottom Grid: Activity + Analytics ===== */}
      <div className="dash-grid-bottom">

        {/* Recent Activity */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-clock-rotate-left"></i> Recent Activity
            </div>
          </div>
          <div className="dash-card-body">
            <div className="dash-activity-item">
              <div className="dash-activity-icon green">
                <i className="fa-solid fa-check"></i>
              </div>
              <div className="dash-activity-body">
                <div className="dash-activity-text">
                  <strong>Wakad Site (Amit Patel)</strong> marked as completed
                </div>
                <div className="dash-activity-time">2 hours ago</div>
              </div>
            </div>

            <div className="dash-activity-item">
              <div className="dash-activity-icon gold">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div className="dash-activity-body">
                <div className="dash-activity-text">
                  New site / customer <strong>Priya Sharma</strong> was added
                </div>
                <div className="dash-activity-time">5 hours ago</div>
              </div>
            </div>

            <div className="dash-activity-item">
              <div className="dash-activity-icon blue">
                <i className="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <div className="dash-activity-body">
                <div className="dash-activity-text">
                  Salary released for <strong>Suresh Patil</strong> — ₹19,200
                </div>
                <div className="dash-activity-time">Yesterday</div>
              </div>
            </div>

            <div className="dash-activity-item">
              <div className="dash-activity-icon gold">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div className="dash-activity-body">
                <div className="dash-activity-text">
                  <strong>Baner Site (Priya Sharma)</strong> was created
                </div>
                <div className="dash-activity-time">2 days ago</div>
              </div>
            </div>

            <div className="dash-activity-item">
              <div className="dash-activity-icon green">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div className="dash-activity-body">
                <div className="dash-activity-text">
                  <strong>Ramesh Kumar</strong> checked in at Baner Site
                </div>
                <div className="dash-activity-time">2 days ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Overview (Bar Chart) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <i className="fa-solid fa-chart-column"></i> Monthly Overview
            </div>
          </div>
          <div className="dash-card-body">
            <div className="dash-mini-chart">
              <div className="dash-chart-bars">
                {[
                  { label: 'May', a: 55, b: 40 },
                  { label: 'Jun', a: 60, b: 45 },
                  { label: 'Jul', a: 70, b: 50 },
                  { label: 'Aug', a: 65, b: 48 },
                  { label: 'Sep', a: 80, b: 55 },
                  { label: 'Oct', a: 75, b: 52 },
                ].map((month, i) => (
                  <div className="dash-chart-bar-group" key={i}>
                    <div style={{display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100%'}}>
                      <div className="dash-chart-bar gold" style={{height: `${month.a}%`, width: '12px'}}></div>
                      <div className="dash-chart-bar gold-light" style={{height: `${month.b}%`, width: '12px'}}></div>
                    </div>
                    <div className="dash-chart-bar-label">{month.label}</div>
                  </div>
                ))}
              </div>
              <div className="dash-chart-legend">
                <div className="dash-chart-legend-item">
                  <div className="dash-chart-legend-dot" style={{background: 'var(--gold)'}}></div>
                  Sites
                </div>
                <div className="dash-chart-legend-item">
                  <div className="dash-chart-legend-dot" style={{background: 'var(--gold-border)', border: '1px solid var(--gold-border)'}}></div>
                  Attendance Avg
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
};

export default Dashboard;
