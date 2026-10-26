import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const FestivalModal = ({ isOpen, onClose, onFestivalsUpdated }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Add/Edit state
  const [formDate, setFormDate] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFestivals(selectedYear);
    }
  }, [isOpen, selectedYear]);

  const fetchFestivals = async (year) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/festivals?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setFestivals(data.festivals || []);
      } else {
        setError(data.message || 'Failed to fetch festivals');
      }
    } catch (err) {
      console.error('Error fetching festivals:', err);
      setError('Network error loading festivals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formDate || !formLabel.trim()) {
      alert('Please provide both Date and Festival Name');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingId) {
        // Edit existing
        const res = await fetch(`${API_BASE}/festivals/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: formDate, label: formLabel.trim() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Update failed');
      } else {
        // Add new
        const res = await fetch(`${API_BASE}/festivals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: formDate, label: formLabel.trim() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Save failed');
      }

      setFormDate('');
      setFormLabel('');
      setEditingId(null);
      await fetchFestivals(selectedYear);
      if (onFestivalsUpdated) onFestivalsUpdated();
    } catch (err) {
      console.error('Error saving festival:', err);
      setError(err.message || 'Failed to save festival');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fest) => {
    setEditingId(fest.id);
    setFormDate(fest.date);
    setFormLabel(fest.label);
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Are you sure you want to delete festival "${label}"?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/festivals/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchFestivals(selectedYear);
        if (onFestivalsUpdated) onFestivalsUpdated();
      } else {
        alert(data.message || 'Failed to delete festival');
      }
    } catch (err) {
      console.error('Error deleting festival:', err);
      alert('Failed to delete festival');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(28, 17, 10, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(74, 44, 23, 0.25)',
        border: '1px solid #EAD8C7',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F0E6DD',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #FAF4EE 0%, #FFFFFF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#4A2C17',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fa-solid fa-champagne-glasses"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#4A2C17' }}>
                Festival Holidays & Permanent Benefits
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8C5521' }}>
                Permanent members automatically receive +1 Extra Hajeri on these festival dates
              </p>
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
              padding: '6px'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Year Selector Tabs */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid #F0E6DD',
          background: '#FAF8F5',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginRight: '6px' }}>Year:</span>
          {[2025, 2026, 2027, 2028].map(yr => (
            <button
              key={yr}
              onClick={() => {
                setSelectedYear(yr);
                setEditingId(null);
              }}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: selectedYear === yr ? '800' : '600',
                border: selectedYear === yr ? '1.5px solid #4A2C17' : '1px solid #E5E7EB',
                background: selectedYear === yr ? '#4A2C17' : '#FFFFFF',
                color: selectedYear === yr ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEF2F2',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #FCA5A5'
            }}>
              {error}
            </div>
          )}

          {/* Add / Edit Festival Form */}
          <form onSubmit={handleSubmit} style={{
            background: '#FAF4EE',
            border: '1.5px dashed #D6B99E',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#4A2C17', marginBottom: '10px' }}>
              {editingId ? '✏️ Edit Festival Occasion' : '➕ Add Festival / Holiday'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', marginBottom: '4px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1C2AF',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', marginBottom: '4px' }}>
                  Occasion Label (e.g. Diwali, Dasera, Eid)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali (Laxmi Pujan)"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1C2AF',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : '+ Add'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormDate('');
                      setFormLabel('');
                    }}
                    style={{
                      padding: '9px 14px',
                      background: '#E5E7EB',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Festivals Table */}
          <div style={{
            border: '1px solid #EAE3DA',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8F5F2', borderBottom: '1.5px solid #EAE3DA' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', color: '#4A2C17', width: '35%' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', color: '#4A2C17', width: '40%' }}>
                    Festival / Occasion
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', color: '#4A2C17', textAlign: 'center' }}>
                    Benefit
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', color: '#4A2C17', textAlign: 'right' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading festivals...
                    </td>
                  </tr>
                ) : festivals.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                      No festivals listed for {selectedYear}. Use the form above to add one!
                    </td>
                  </tr>
                ) : (
                  festivals.map((f, idx) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: idx !== festivals.length - 1 ? '1px solid #F0EAE4' : 'none',
                        background: editingId === f.id ? '#FEF3C7' : (idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5')
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                        {formatDateDisplay(f.date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#4A2C17' }}>
                        {f.label}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800'
                        }}>
                          +1.0 Hajeri
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(f)}
                            title="Edit"
                            style={{
                              background: '#F3E8FF',
                              color: '#7E22CE',
                              border: '1px solid #D8B4FE',
                              borderRadius: '6px',
                              padding: '5px 9px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(f.id, f.label)}
                            title="Delete"
                            style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              padding: '5px 9px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #F0E6DD',
          background: '#FAF8F5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{festivals.length}</strong> festivals configured for {selectedYear}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#FFFFFF',
              border: '1.5px solid #D1C2AF',
              color: '#4A2C17',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
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

export default FestivalModal;
