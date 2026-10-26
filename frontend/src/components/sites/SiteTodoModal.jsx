import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const PRIORITY_COLORS = {
  Urgent: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  High: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Medium: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  Low: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' }
};

const SiteTodoModal = ({ site, onClose, onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskEmployeeId, setNewTaskEmployeeId] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const siteId = site?.id || site?._id;
  const siteRef = site?.siteCode ? `SITE-${site.siteCode}` : (site?.siteRef || `SITE-${siteId}`);

  // Fetch tasks for this site
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
        // Rollback on error
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
    if (!window.confirm('Delete this task?')) return;

    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await fetch(`${API_BASE}/site-tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchTasks();
    }
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(26, 17, 10, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        boxShadow: '0 20px 40px rgba(74, 44, 23, 0.25)',
        border: '1.5px solid #D1C2AF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#FAF8F5',
          borderBottom: '1.5px solid #EAE3DA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(165, 106, 48, 0.12)',
                color: 'var(--gold, #A56A30)',
                padding: '2px 8px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '800',
                fontFamily: 'monospace'
              }}>
                {siteRef}
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                {site?.customerName || 'Site To-Do List'}
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', marginRight: '4px' }}></i>
              {site?.location || 'Project Site'}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '12px 20px',
          background: '#FFF',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#4B5563' }}>
            <span>Work Progress</span>
            <span style={{ color: progressPct === 100 ? '#15803D' : 'var(--gold, #8C5521)' }}>
              {completedCount} of {totalCount} completed ({progressPct}%)
            </span>
          </div>
          <div style={{
            height: '7px',
            background: '#F3EDE6',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#10B981' : 'linear-gradient(90deg, #A56A30, #D97706)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {feedback && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#ECFDF5',
              color: '#065F46',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} style={{
            background: '#FAF8F5',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1.5px solid #EAE3DA',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A2C17', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-plus-circle" style={{ color: 'var(--gold, #A56A30)' }}></i>
              <span>Add Today's Task for {site?.customerName}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="e.g. Install TV unit frame, complete laminate pasting..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1C2AF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={addingTask}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--gold, #4A2C17)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: addingTask ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fa-solid fa-plus"></i>
                <span>{addingTask ? 'Adding...' : 'Add'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#6B7280' }}>
                <span>Priority:</span>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: '1px solid #D1C2AF',
                    fontSize: '11px',
                    background: '#fff',
                    fontWeight: '700'
                  }}
                >
                  <option value="Urgent">🔥 Urgent</option>
                  <option value="High">⚡ High</option>
                  <option value="Medium">📋 Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#6B7280' }}>
                <span>Assignee:</span>
                <select
                  value={newTaskEmployeeId}
                  onChange={(e) => setNewTaskEmployeeId(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: '1px solid #D1C2AF',
                    fontSize: '11px',
                    background: '#fff',
                    fontWeight: '600',
                    maxWidth: '160px'
                  }}
                >
                  <option value="">-- Optional Worker --</option>
                  {employees.map(e => (
                    <option key={e.id || e.dbId} value={e.id || e.dbId}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', color: 'var(--gold, #A56A30)' }}></i>
                <div style={{ marginTop: '6px', fontSize: '13px' }}>Loading tasks...</div>
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', background: '#FAF8F5', borderRadius: '8px', border: '1px dashed #D1C2AF' }}>
                <i className="fa-regular fa-clipboard" style={{ fontSize: '24px', marginBottom: '6px', display: 'block', color: '#D1C2AF' }}></i>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>No tasks created for this site yet.</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>Use the box above to add your first work item.</div>
              </div>
            ) : (
              tasks.map(t => {
                const pColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Medium;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: t.isCompleted ? '#F9FAFB' : '#fff',
                      border: t.isCompleted ? '1px solid #E5E7EB' : '1px solid #D1C2AF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={!!t.isCompleted}
                        onChange={() => handleToggleTask(t)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--gold, #A56A30)' }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: t.isCompleted ? '500' : '700',
                          color: t.isCompleted ? '#9CA3AF' : '#111827',
                          textDecoration: t.isCompleted ? 'line-through' : 'none'
                        }}>
                          {t.title}
                        </div>
                        {t.assignedEmployeeName && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                            <i className="fa-solid fa-user" style={{ fontSize: '10px', marginRight: '4px', color: 'var(--gold, #A56A30)' }}></i>
                            {t.assignedEmployeeName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: pColor.bg,
                        color: pColor.text,
                        border: `1px solid ${pColor.border}`,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}>
                        {t.priority || 'Medium'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(t.id, e)}
                        title="Delete task"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '12px'
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

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#FAF8F5',
          borderTop: '1px solid #EAE3DA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('todo-list');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold, #8C5521)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>View All Sites Checklist</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #D1C2AF',
              background: '#fff',
              color: '#374151',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SiteTodoModal;
