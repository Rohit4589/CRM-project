import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import '../styles/TodoList.css';

const TodoList = ({ onNavigate }) => {
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Completed'

  // Selected Date for planning (defaults to current date YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Today's friendly display date
  const selectedDateFormatted = new Date(selectedDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Live database tasks list for the selected date
  // All tasks: [ { id, siteId, taskDate, title, priority, assignedEmployeeId, assignedEmployeeName, dueTime, isCompleted } ]
  const [allTasks, setAllTasks] = useState([]);

  // Currently opened site in Modal popup
  const [activeSite, setActiveSite] = useState(null);

  // Staged tasks in modal (allows editing, adding, and reviewing before "Save Today's Plan")
  const [modalTasks, setModalTasks] = useState([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [toastNotice, setToastNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  // New task form fields
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskEmployeeId, setNewTaskEmployeeId] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [formError, setFormError] = useState('');

  // Editing state inside modal
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 1. Fetch sites and employees once on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [sitesRes, empRes] = await Promise.all([
          fetch(`${API_BASE}/sites`),
          fetch(`${API_BASE}/employees`)
        ]);

        const sitesData = await sitesRes.json();
        const empData = await empRes.json();

        if (sitesData.success && sitesData.sites) {
          setSites(sitesData.sites);
        }
        if (empData.success && empData.employees) {
          setEmployees(empData.employees);
        }
      } catch (err) {
        console.error('Error fetching sites/employees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Fetch tasks for selectedDate from backend database
  const fetchTasksForDate = async (dateStr) => {
    try {
      const res = await fetch(`${API_BASE}/site-tasks?date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.tasks) {
        setAllTasks(data.tasks);
      }
    } catch (err) {
      console.error('Error fetching site tasks from database:', err);
    }
  };

  useEffect(() => {
    fetchTasksForDate(selectedDate);
  }, [selectedDate]);

  // Support ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeSite) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSite]);

  // Open popup for a site
  const openSiteModal = (site) => {
    setActiveSite(site);
    const siteRawId = Number(site.dbId || site.id);
    const existing = allTasks.filter(t => Number(t.siteId) === siteRawId);
    setModalTasks(existing.map(t => ({ ...t })));
    setNewTaskTitle('');
    setNewTaskPriority('Medium');
    setNewTaskEmployeeId('');
    setNewTaskDueTime('');
    setFormError('');
    setToastNotice(null);
    setEditingTaskId(null);
  };

  // Close popup
  const closeModal = () => {
    setActiveSite(null);
    setModalTasks([]);
    setFormError('');
    setToastNotice(null);
  };

  // Helper: Get tasks for a site from allTasks
  const getTasksForSite = (site) => {
    const siteRawId = Number(site.dbId || site.id);
    return allTasks.filter(t => Number(t.siteId) === siteRawId);
  };

  // Direct toggle task completion in the table
  const handleToggleTableTask = async (task, e) => {
    if (e) e.stopPropagation();
    const newStatus = !task.isCompleted;

    // Optimistic UI update
    setAllTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: newStatus } : t));

    try {
      const res = await fetch(`${API_BASE}/site-tasks/${task.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        fetchTasksForDate(selectedDate);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      fetchTasksForDate(selectedDate);
    }
  };

  // Add Task to modal staged list
  const handleAddTaskToModal = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    const cleanTitle = newTaskTitle.trim();
    if (!cleanTitle) {
      setFormError('Please enter a task description.');
      return;
    }

    // Check duplicate in modal list
    const isDuplicate = modalTasks.some(
      t => t.title.toLowerCase().trim() === cleanTitle.toLowerCase()
    );
    if (isDuplicate) {
      setFormError('This task is already in the checklist for today.');
      return;
    }

    // Find assigned employee name
    let assignedName = '';
    if (newTaskEmployeeId) {
      const foundEmp = employees.find(emp => String(emp.dbId || emp.id) === String(newTaskEmployeeId));
      assignedName = foundEmp ? foundEmp.name : '';
    }

    const newTaskObj = {
      id: 'staged_' + Date.now(),
      siteId: Number(activeSite.dbId || activeSite.id),
      taskDate: selectedDate,
      title: cleanTitle,
      priority: newTaskPriority,
      assignedEmployeeId: newTaskEmployeeId ? Number(newTaskEmployeeId) : null,
      assignedEmployeeName: assignedName,
      dueTime: newTaskDueTime.trim() || null,
      isCompleted: false
    };

    setModalTasks(prev => [...prev, newTaskObj]);
    setNewTaskTitle('');
    setNewTaskPriority('Medium');
    setNewTaskEmployeeId('');
    setNewTaskDueTime('');
  };

  // Toggle task inside modal
  const handleToggleModalTask = (taskId) => {
    setModalTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    ));
  };

  // Start inline editing task
  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Save inline edit
  const handleSaveEdit = (taskId) => {
    if (!editingTitle.trim()) return;
    setModalTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, title: editingTitle.trim() } : t
    ));
    setEditingTaskId(null);
    setEditingTitle('');
  };

  // Delete task from modal staged list
  const handleDeleteModalTask = (taskId) => {
    setModalTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Save Today's Plan button (Batch save to PostgreSQL DB)
  const handleSavePlan = async () => {
    if (!activeSite) return;
    setSavingPlan(true);
    setToastNotice(null);

    const siteRawId = Number(activeSite.dbId || activeSite.id);

    try {
      const res = await fetch(`${API_BASE}/site-tasks/batch-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: siteRawId,
          taskDate: selectedDate,
          tasks: modalTasks
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastNotice({ type: 'success', text: "Today's plan saved successfully to database!" });
        // Refresh master tasks list
        await fetchTasksForDate(selectedDate);
        setTimeout(() => {
          closeModal();
        }, 800);
      } else {
        setToastNotice({ type: 'error', text: data.message || 'Failed to save tasks' });
      }
    } catch (err) {
      console.error('Error saving site tasks plan:', err);
      setToastNotice({ type: 'error', text: 'Server connection error while saving tasks' });
    } finally {
      setSavingPlan(false);
    }
  };

  // Filter sites
  const filteredSites = sites.filter(site => {
    const nameMatch = (site.customerName || site.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const codeMatch = String(site.siteCode || site.siteRef || site.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const locMatch = (site.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (site.phone || '').includes(searchTerm);

    if (!nameMatch && !codeMatch && !locMatch && !phoneMatch) return false;

    const siteTasks = getTasksForSite(site);
    const total = siteTasks.length;
    const completed = siteTasks.filter(t => t.isCompleted).length;
    const isCompleted = total > 0 && completed === total;
    const isActive = total > 0 && completed < total;

    if (statusFilter === 'Active') return isActive;
    if (statusFilter === 'Completed') return isCompleted;

    return true;
  });

  // Calculate overall metrics for selected date
  const totalSitesCount = sites.length;
  let totalTasksCount = allTasks.length;
  let doneTasksCount = allTasks.filter(t => t.isCompleted).length;
  let pendingTasksCount = totalTasksCount - doneTasksCount;

  // Modal Progress Metrics
  const modalTotal = modalTasks.length;
  const modalDone = modalTasks.filter(t => t.isCompleted).length;
  const modalProgressPct = modalTotal > 0 ? Math.round((modalDone / modalTotal) * 100) : 0;

  return (
    <div className="todo-page">
      {/* Page Header */}
      <div className="todo-header-container">
        <div className="todo-title-row">
          <div className="todo-icon-badge">
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h1 className="todo-page-title">Daily Site To-Do List & Work Planner</h1>
            <p className="todo-page-subtitle">
              Plan and assign today's tasks for each active site. Click <strong style={{ color: 'var(--gold, #4A2C17)' }}>+ Work</strong> to open the planner.
            </p>
          </div>
        </div>

        <div className="today-badge-pill">
          <i className="fa-regular fa-calendar-days"></i>
          <span>Schedule Date:</span>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            title="Change plan date"
          />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="todo-stats-row">
        <div className="todo-stat-card">
          <div className="todo-stat-icon sites">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div className="todo-stat-info">
            <h4>Active Sites</h4>
            <div className="stat-number">{totalSitesCount}</div>
          </div>
        </div>

        <div className="todo-stat-card">
          <div className="todo-stat-icon pending">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="todo-stat-info">
            <h4>Pending Tasks ({selectedDateFormatted})</h4>
            <div className="stat-number">{pendingTasksCount}</div>
          </div>
        </div>

        <div className="todo-stat-card">
          <div className="todo-stat-icon completed">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="todo-stat-info">
            <h4>Work Completed</h4>
            <div className="stat-number">{doneTasksCount} / {totalTasksCount}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="todo-controls-bar">
        <div className="todo-search-wrapper">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text"
            className="todo-search-input"
            placeholder="Search site by customer name, site code (e.g. 001), or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="todo-task-filter-pills">
          <button 
            className={`todo-filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All Sites ({sites.length})
          </button>
          <button 
            className={`todo-filter-btn ${statusFilter === 'Active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Active')}
          >
            Work In Progress
          </button>
          <button 
            className={`todo-filter-btn ${statusFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Sites Directory Table */}
      <div className="todo-employees-card">
        <div className="todo-table-responsive">
          <table className="todo-table">
            <thead>
              <tr>
                <th style={{ width: '130px', textAlign: 'center' }}>Daily Plan</th>
                <th>Site Code</th>
                <th>Client / Site</th>
                <th>Today's Scheduled Tasks Checklist</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8C7B6D' }}>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Loading sites and tasks...
                  </td>
                </tr>
              ) : filteredSites.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8C7B6D' }}>
                    No matching project sites found.
                  </td>
                </tr>
              ) : (
                filteredSites.map(site => {
                  const siteTasksList = getTasksForSite(site);
                  const completed = siteTasksList.filter(t => t.isCompleted).length;
                  const total = siteTasksList.length;
                  const allDone = total > 0 && completed === total;

                  const siteRefCode = site.siteCode 
                    ? `SITE-${site.siteCode}` 
                    : (site.siteRef || `SITE-${String(site.id).padStart(3, '0')}`);

                  return (
                    <tr key={site.id}>
                      {/* Compact Clean + Work Button */}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-clean-plus"
                          onClick={() => openSiteModal(site)}
                          title={`Plan today's work for ${site.customerName || 'Site'}`}
                        >
                          <i className="fa-solid fa-plus"></i>
                          <span>Work</span>
                        </button>
                      </td>

                      {/* Site Code */}
                      <td>
                        <span className="site-code-badge">
                          {siteRefCode}
                        </span>
                      </td>

                      {/* Client / Site */}
                      <td>
                        <div className="site-profile-col">
                          <div className="site-icon-avatar">
                            <i className="fa-solid fa-building-user"></i>
                          </div>
                          <div>
                            <div className="site-client-title">{site.customerName || site.clientName || 'Valued Client'}</div>
                            <div className="site-location-sub">
                              <i className="fa-solid fa-location-dot" style={{ fontSize: '10px', marginRight: '4px' }}></i>
                              {site.location || 'Pune Site'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Interactive Task Checklist Preview */}
                      <td>
                        {siteTasksList.length === 0 ? (
                          <span 
                            style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', cursor: 'pointer' }}
                            onClick={() => openSiteModal(site)}
                          >
                            + No tasks planned for today. Click to plan work...
                          </span>
                        ) : (
                          <div className="interactive-tasks-wrap">
                            {siteTasksList.slice(0, 3).map(t => (
                              <div 
                                key={t.id} 
                                className={`interactive-task-item ${t.isCompleted ? 'done' : ''}`}
                                onClick={(e) => handleToggleTableTask(t, e)}
                                title={t.isCompleted ? "Click to reopen" : "Click to mark completed"}
                              >
                                <div className="inline-checkbox">
                                  {t.isCompleted && <i className="fa-solid fa-check"></i>}
                                </div>
                                <span className="task-title-inline">{t.title}</span>
                              </div>
                            ))}

                            {siteTasksList.length > 3 && (
                              <span 
                                className="more-tasks-link"
                                onClick={() => openSiteModal(site)}
                              >
                                +{siteTasksList.length - 3} more tasks →
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ textAlign: 'center' }}>
                        {total === 0 ? (
                          <span className="status-pill none">
                            <i className="fa-regular fa-calendar"></i> 0 Tasks
                          </span>
                        ) : allDone ? (
                          <span className="status-pill completed">
                            <i className="fa-solid fa-circle-check"></i> {completed}/{total} Done
                          </span>
                        ) : (
                          <span className="status-pill active">
                            <i className="fa-solid fa-hammer"></i> {completed}/{total} Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          REDESIGNED DAILY SITE TO-DO & WORK PLANNER POPUP
          ========================================================= */}
      {activeSite && (
        <div className="task-modal-backdrop" onClick={closeModal}>
          <div className="task-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            
            {/* 1. Site Header */}
            <div className="task-modal-header">
              <div className="task-modal-header-left">
                <div className="task-modal-avatar">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h3 className="task-modal-title">
                    <span>{activeSite.customerName || activeSite.clientName || 'Project Site'}</span>
                    <span className="task-modal-id-pill">
                      {activeSite.siteCode ? `SITE-${activeSite.siteCode}` : (activeSite.siteRef || `SITE-${activeSite.id}`)}
                    </span>
                  </h3>
                  <div className="task-modal-sub">
                    <span>
                      <i className="fa-solid fa-map-pin" style={{ color: 'var(--coffee-medium, #8C5521)' }}></i>
                      {activeSite.location || 'Pune Project'}
                    </span>
                    <span>·</span>
                    <span>
                      <i className="fa-regular fa-calendar" style={{ color: 'var(--coffee-medium, #8C5521)' }}></i>
                      {selectedDateFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                className="task-modal-close-btn" 
                onClick={closeModal}
                title="Close popup (Esc)"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* 4. Progress Tracking Bar */}
            <div className="task-modal-progress-bar-wrap">
              <div className="task-progress-meta">
                <span>Task Execution Progress</span>
                <span>{modalDone} of {modalTotal} tasks completed ({modalProgressPct}%)</span>
              </div>
              <div className="task-progress-track">
                <div 
                  className={`task-progress-fill ${modalTotal > 0 && modalDone === modalTotal ? 'all-done' : ''}`}
                  style={{ width: `${modalProgressPct}%` }}
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="task-modal-body">
              {/* Toast Feedback Notice */}
              {toastNotice && (
                <div className={`task-toast-notice ${toastNotice.type}`}>
                  <i className={toastNotice.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i>
                  <span>{toastNotice.text}</span>
                </div>
              )}

              {/* 2. Add Today's Work Form */}
              <div className="task-add-card">
                <div className="task-add-card-header">
                  <i className="fa-solid fa-plus-circle"></i>
                  <span>Add Today's Work</span>
                </div>

                <form onSubmit={handleAddTaskToModal}>
                  {/* Primary Task Input Row */}
                  <div className="task-primary-input-row">
                    <input 
                      type="text"
                      className="task-main-input"
                      placeholder="e.g. Install TV unit carcass, fix false ceiling channel..."
                      value={newTaskTitle}
                      onChange={(e) => {
                        setNewTaskTitle(e.target.value);
                        if (formError) setFormError('');
                      }}
                      autoFocus
                    />
                    <button type="submit" className="btn-add-prominent">
                      <i className="fa-solid fa-plus"></i>
                      <span>Add Task</span>
                    </button>
                  </div>

                  {/* Secondary Optional Fields: Priority, Assigned Employee, Due Time */}
                  <div className="task-secondary-fields-row">
                    <div className="task-field-group">
                      <label className="task-field-label">
                        <i className="fa-solid fa-flag"></i> Priority
                      </label>
                      <select 
                        className="task-select"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>

                    <div className="task-field-group">
                      <label className="task-field-label">
                        <i className="fa-solid fa-user-check"></i> Assign Staff (Optional)
                      </label>
                      <select 
                        className="task-select"
                        value={newTaskEmployeeId}
                        onChange={(e) => setNewTaskEmployeeId(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {employees.map(emp => (
                          <option key={emp.dbId || emp.id} value={emp.dbId || emp.id}>
                            {emp.name} {emp.empCode ? `(EMP-${emp.empCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="task-field-group">
                      <label className="task-field-label">
                        <i className="fa-regular fa-clock"></i> Due Time
                      </label>
                      <input 
                        type="time"
                        className="task-time-input"
                        value={newTaskDueTime}
                        onChange={(e) => setNewTaskDueTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Validation Error Feedback */}
                  {formError && (
                    <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '5px' }}></i>
                      {formError}
                    </div>
                  )}
                </form>
              </div>

              {/* 3. Today's Work Checklist Section */}
              <div className="task-list-section-header">
                <h4>Today's Work Checklist ({modalTotal})</h4>
                <span>{modalDone} Finished</span>
              </div>

              <div className="task-cards-list">
                {modalTotal === 0 ? (
                  <div className="task-modal-empty-state">
                    <i className="fa-solid fa-clipboard-check"></i>
                    <h5>No tasks planned yet</h5>
                    <p>Enter the work to be done on this site today above and click + Add Task.</p>
                  </div>
                ) : (
                  modalTasks.map(task => {
                    const isEditing = editingTaskId === task.id;
                    const priorityClass = (task.priority || 'medium').toLowerCase();

                    return (
                      <div 
                        key={task.id} 
                        className={`task-row-card ${task.isCompleted ? 'completed' : ''}`}
                      >
                        <div className="task-card-content-left">
                          {/* Completion Checkbox */}
                          <div 
                            className="task-checkbox-custom"
                            onClick={() => handleToggleModalTask(task.id)}
                            title={task.isCompleted ? "Mark pending" : "Mark completed"}
                          >
                            {task.isCompleted && <i className="fa-solid fa-check"></i>}
                          </div>

                          <div className="task-card-details">
                            {/* Task Description / Inline Edit */}
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input 
                                  type="text"
                                  className="task-inline-edit-input"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(task.id);
                                    if (e.key === 'Escape') setEditingTaskId(null);
                                  }}
                                />
                                <button 
                                  className="btn-modal-save-green" 
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                  onClick={() => handleSaveEdit(task.id)}
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <span 
                                className="task-title-text"
                                onClick={() => handleToggleModalTask(task.id)}
                                style={{ cursor: 'pointer' }}
                              >
                                {task.title}
                              </span>
                            )}

                            {/* Meta Info: Priority, Staff, Due Time */}
                            <div className="task-meta-chips">
                              <span className={`priority-pill ${priorityClass}`}>
                                {task.priority || 'Medium'}
                              </span>

                              {task.assignedEmployeeName && (
                                <span className="task-meta-chip">
                                  <i className="fa-solid fa-user-gear"></i>
                                  <span>{task.assignedEmployeeName}</span>
                                </span>
                              )}

                              {task.dueTime && (
                                <span className="task-meta-chip">
                                  <i className="fa-regular fa-clock"></i>
                                  <span>{task.dueTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Edit and Delete Actions */}
                        <div className="task-card-actions">
                          {!isEditing && (
                            <button 
                              className="btn-task-action"
                              onClick={() => handleStartEdit(task)}
                              title="Edit task description"
                            >
                              <i className="fa-regular fa-pen-to-square"></i>
                            </button>
                          )}
                          <button 
                            className="btn-task-action delete"
                            onClick={() => handleDeleteModalTask(task.id)}
                            title="Delete task"
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5. Footer Actions */}
            <div className="task-modal-footer">
              <div className="task-modal-footer-summary">
                {modalDone} of {modalTotal} tasks completed for today
              </div>

              <div className="task-modal-footer-buttons">
                <button 
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeModal}
                  disabled={savingPlan}
                >
                  Cancel
                </button>

                <button 
                  type="button"
                  className="btn-modal-save-green"
                  onClick={handleSavePlan}
                  disabled={savingPlan}
                >
                  {savingPlan ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Saving Plan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Save Today's Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TodoList;
