import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const PRIORITY_CONFIG = {
  Urgent: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '🔥' },
  High: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: '⚡' },
  Medium: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: '📋' },
  Low: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', icon: '☕' }
};

const SiteTodoContentArea = ({ site, onBack, onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // Add task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskEmployeeId, setNewTaskEmployeeId] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const siteId = site?.dbId || site?.id;
  const siteRef = site?.siteCode ? `SITE-${site.siteCode}` : (site?.siteRef || `SITE-${siteId}`);

  // Fetch tasks for this site only
  const fetchTasks = async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/site-tasks?siteId=${siteId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Error fetching site tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown
  useEffect(() => {
    fetchTasks();

    fetch(`${API_BASE}/employees`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.employees)) {
          setEmployees(d.employees);
        }
      })
      .catch(() => {});
  }, [siteId]);

  // Toggle task status
  const handleToggleTask = async (task) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t)));

      const res = await fetch(`${API_BASE}/site-tasks/${task.id}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!data.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      fetchTasks();
    }
  };

  // Add task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setAddingTask(true);
      const emp = employees.find(e => String(e.id || e.dbId) === String(newTaskEmployeeId));
      const todayDate = new Date().toISOString().split('T')[0];

      const res = await fetch(`${API_BASE}/site-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          taskDate: todayDate,
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          assignedEmployeeId: emp ? (emp.id || emp.dbId) : null,
          assignedEmployeeName: emp ? emp.name : null,
          dueTime: ''
        })
      });

      const data = await res.json();
      if (data.success && data.task) {
        setTasks(prev => [data.task, ...prev]);
        setNewTaskTitle('');
        setNewTaskPriority('Medium');
        setNewTaskEmployeeId('');
        setFeedback({ type: 'success', msg: 'Task added successfully' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(data.message || 'Failed to add task');
      }
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Error connecting to server to add task');
    } finally {
      setAddingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await fetch(`${API_BASE}/site-tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchTasks();
    }
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.filter(t => !t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'pending') return !t.isCompleted;
    if (taskFilter === 'completed') return t.isCompleted;
    return true;
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Navigation & Header Card */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1.5px solid #EAE3DA',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(74, 44, 23, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Back Button & Site Identity Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                background: '#FAF8F5',
                border: '1.5px solid #D1C2AF',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#4A2C17',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4A2C17';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#4A2C17';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FAF8F5';
                e.currentTarget.style.color = '#4A2C17';
                e.currentTarget.style.borderColor = '#D1C2AF';
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Back to All Customers</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'rgba(165, 106, 48, 0.12)',
                color: 'var(--gold, #A56A30)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '800',
                fontFamily: 'monospace'
              }}>
                {siteRef}
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                  {site?.customerName || 'Customer Project'} — To-Do List
                </h2>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', marginRight: '4px' }}></i>
                    {site?.location || site?.fullAddress || 'Site Location'}
                  </span>
                  {site?.status && (
                    <span>
                      <strong style={{ color: site?.status === 'Running' ? '#16A34A' : '#6B7280' }}>● {site.status}</strong>
                    </span>
                  )}
                  {site?.phone && (
                    <span>
                      <i className="fa-solid fa-phone" style={{ color: 'var(--gold, #A56A30)', marginRight: '4px' }}></i>
                      {site.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('todo-list')}
              style={{
                background: '#fff',
                border: '1px solid #D1C2AF',
                borderRadius: '7px',
                padding: '6px 12px',
                color: 'var(--gold, #8C5521)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Open Master All-Sites Board</span>
            </button>
          )}
        </div>

        {/* Work Progress Bar */}
        <div style={{
          background: '#FAF8F5',
          borderRadius: '8px',
          padding: '12px 16px',
          border: '1px solid #EAE3DA',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', fontWeight: '700', color: '#374151' }}>
            <span>Work Execution Progress</span>
            <span style={{ color: progressPct === 100 ? '#15803D' : 'var(--gold, #8C5521)' }}>
              {completedCount} of {totalCount} tasks completed ({progressPct}%)
            </span>
          </div>
          <div style={{
            height: '8px',
            background: '#EAE3DA',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#10B981' : 'linear-gradient(90deg, #A56A30, #D97706)',
              transition: 'width 0.35s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Add Form, Right Task List */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1.5px solid #EAE3DA',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(74, 44, 23, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#ECFDF5',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-check"></i>
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Add Task Form Directly in Content Area */}
        <form onSubmit={handleAddTask} style={{
          background: '#FAF8F5',
          padding: '16px',
          borderRadius: '10px',
          border: '1.5px solid #EAE3DA',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#4A2C17', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-plus" style={{ color: 'var(--gold, #A56A30)' }}></i>
            <span>Add Work Task for {site?.customerName}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. Laminate pressing on master bedroom wardrobe, TV unit wiring..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              style={{
                flex: '1 1 320px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #D1C2AF',
                fontSize: '13.5px',
                outline: 'none',
                background: '#fff'
              }}
            />

            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1C2AF',
                fontSize: '13px',
                background: '#fff',
                fontWeight: '700',
                color: '#374151',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Urgent">🔥 Urgent Priority</option>
              <option value="High">⚡ High Priority</option>
              <option value="Medium">📋 Medium Priority</option>
              <option value="Low">☕ Low Priority</option>
            </select>

            <select
              value={newTaskEmployeeId}
              onChange={(e) => setNewTaskEmployeeId(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1C2AF',
                fontSize: '13px',
                background: '#fff',
                fontWeight: '600',
                color: '#374151',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              <option value="">-- Assign Worker (Optional) --</option>
              {employees.map(emp => (
                <option key={emp.id || emp.dbId} value={emp.id || emp.dbId}>
                  {emp.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={addingTask}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--gold, #4A2C17)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: addingTask ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(74, 44, 23, 0.2)'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>{addingTask ? 'Adding...' : 'Add Task'}</span>
            </button>
          </div>
        </form>

        {/* Task Filter Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1.5px solid #EAE3DA',
          paddingBottom: '8px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTaskFilter('all')}
              style={{
                background: taskFilter === 'all' ? '#4A2C17' : '#FAF8F5',
                color: taskFilter === 'all' ? '#fff' : '#4B5563',
                border: '1px solid #D1C2AF',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              All Tasks ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter('pending')}
              style={{
                background: taskFilter === 'pending' ? '#4A2C17' : '#FAF8F5',
                color: taskFilter === 'pending' ? '#fff' : '#4B5563',
                border: '1px solid #D1C2AF',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter('completed')}
              style={{
                background: taskFilter === 'completed' ? '#4A2C17' : '#FAF8F5',
                color: taskFilter === 'completed' ? '#fff' : '#4B5563',
                border: '1px solid #D1C2AF',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Completed ({completedCount})
            </button>
          </div>

          <span style={{ fontSize: '11.5px', color: '#6B7280', fontStyle: 'italic' }}>
            Click task or checkbox to toggle status
          </span>
        </div>

        {/* Task Checklist Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--gold, #A56A30)' }}></i>
              <div style={{ marginTop: '8px', fontSize: '13.5px', fontWeight: '600' }}>Loading tasks for {site?.customerName}...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9CA3AF',
              background: '#FAF8F5',
              borderRadius: '10px',
              border: '1px dashed #D1C2AF'
            }}>
              <i className="fa-regular fa-clipboard" style={{ fontSize: '32px', marginBottom: '8px', display: 'block', color: '#D1C2AF' }}></i>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4B5563' }}>
                {taskFilter === 'completed' ? 'No completed tasks yet.' : (taskFilter === 'pending' ? 'All tasks are completed! 🎉' : `No tasks created for ${site?.customerName} yet.`)}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Use the form above to add your first work item for this order.</div>
            </div>
          ) : (
            filteredTasks.map(task => {
              const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: task.isCompleted ? '#F9FAFB' : '#fff',
                    border: task.isCompleted ? '1px solid #E5E7EB' : '1.5px solid #EAE3DA',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: task.isCompleted ? 'none' : '0 2px 4px rgba(74, 44, 23, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    if (!task.isCompleted) {
                      e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                      e.currentTarget.style.backgroundColor = '#FAF8F5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!task.isCompleted) {
                      e.currentTarget.style.borderColor = '#EAE3DA';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {/* Left: Checkbox & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={!!task.isCompleted}
                      onChange={() => handleToggleTask(task)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--gold, #A56A30)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '13.5px',
                        fontWeight: task.isCompleted ? '500' : '700',
                        color: task.isCompleted ? '#9CA3AF' : '#111827',
                        textDecoration: task.isCompleted ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      {task.assignedEmployeeName && (
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                          <i className="fa-solid fa-user-check" style={{ fontSize: '10px', marginRight: '4px', color: 'var(--gold, #A56A30)' }}></i>
                          Assigned to: <strong>{task.assignedEmployeeName}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Priority Badge & Delete Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      background: pConfig.bg,
                      color: pConfig.text,
                      border: `1px solid ${pConfig.border}`,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      {pConfig.icon} {task.priority || 'Medium'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      title="Delete task"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '6px',
                        fontSize: '13px',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#DC2626';
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};

export default SiteTodoContentArea;
