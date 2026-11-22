import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const FestivalModal = ({ isOpen, onClose, onFestivalsUpdated }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Add/Edit state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Custom Delete Confirmation Modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFestivals(selectedYear);
      setError('');
      setSuccessMsg('');
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
      setError('Please provide both Date and Festival Name');
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
        setSuccessMsg(`✓ Updated festival "${formLabel.trim()}" successfully!`);
      } else {
        // Add new
        const res = await fetch(`${API_BASE}/festivals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: formDate, label: formLabel.trim() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Save failed');
        setSuccessMsg(`✓ Added festival "${formLabel.trim()}" successfully!`);
      }

      setFormDate('');
      setFormLabel('');
      setEditingId(null);
      setShowAddForm(false);
      setTimeout(() => setSuccessMsg(''), 4000);
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
    setShowAddForm(true);
    setError('');
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setFormDate('');
    setFormLabel('');
    setShowAddForm(false);
    setError('');
  };

  // Trigger custom delete modal
  const promptDelete = (fest) => {
    setDeleteConfirmTarget(fest);
  };

  // Perform confirmed deletion
  const executeDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      setDeleting(true);
      setError('');
      const res = await fetch(`${API_BASE}/festivals/${deleteConfirmTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`✓ Deleted festival "${deleteConfirmTarget.label}"`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setDeleteConfirmTarget(null);
        await fetchFestivals(selectedYear);
        if (onFestivalsUpdated) onFestivalsUpdated();
      } else {
        setError(data.message || 'Failed to delete festival');
      }
    } catch (err) {
      console.error('Error deleting festival:', err);
      setError('Failed to delete festival due to network error');
    } finally {
      setDeleting(false);
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
    <>
      {/* Main Festival Modal Backdrop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(28, 17, 10, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99990,
        padding: '16px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(74, 44, 23, 0.28)',
          border: '1px solid #EAD8C7',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 24px',
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
                fontSize: '18px',
                boxShadow: '0 4px 10px rgba(74, 44, 23, 0.15)'
              }}>
                <i className="fa-solid fa-champagne-glasses"></i>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#4A2C17' }}>
                  Festival Holidays & Permanent Benefits
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8C5521' }}>
                  Permanent members automatically receive <strong>+1 Extra Hajeri</strong> on these dates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px'
              }}
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Subheader: Year Selector + Action Bar */}
          <div style={{
            padding: '12px 24px',
            borderBottom: '1px solid #F0E6DD',
            background: '#FAF8F5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginRight: '4px' }}>Year:</span>
              {[2025, 2026, 2027, 2028].map(yr => (
                <button
                  key={yr}
                  onClick={() => {
                    setSelectedYear(yr);
                    setEditingId(null);
                    setShowAddForm(false);
                  }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '7px',
                    fontSize: '12.5px',
                    fontWeight: selectedYear === yr ? '800' : '600',
                    border: selectedYear === yr ? '1.5px solid #4A2C17' : '1px solid #DCD4CA',
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

            {!showAddForm && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormDate(`${selectedYear}-01-01`);
                  setFormLabel('');
                  setShowAddForm(true);
                }}
                style={{
                  background: 'var(--gold, #A56A30)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(165, 106, 48, 0.2)'
                }}
              >
                <i className="fa-solid fa-plus"></i> Add Festival
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {/* Feedback Banners */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                marginBottom: '14px',
                border: '1px solid #FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                background: '#ECFDF5',
                color: '#065F46',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                marginBottom: '14px',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Add / Edit Festival Form Card */}
            {showAddForm && (
              <form onSubmit={handleSubmit} style={{
                background: '#FAF4EE',
                border: '1.5px solid #D6B99E',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(74, 44, 23, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#4A2C17' }}>
                    {editingId ? '✏️ Edit Festival Occasion' : '➕ Add Festival / Holiday'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i> Close
                  </button>
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
                        fontWeight: '600',
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
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
                        fontWeight: '600',
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
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
                      {saving ? 'Saving...' : editingId ? 'Update' : '+ Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelForm}
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
                  </div>
                </div>
              </form>
            )}

            {/* Festivals Table */}
            <div style={{
              border: '1.5px solid #EAE3DA',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(74, 44, 23, 0.03)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#FAF8F5', borderBottom: '1.5px solid #EAE3DA' }}>
                    <th style={{ padding: '13px 16px', fontSize: '11.5px', fontWeight: '800', color: '#4A2C17', width: '30%' }}>
                      Date
                    </th>
                    <th style={{ padding: '13px 16px', fontSize: '11.5px', fontWeight: '800', color: '#4A2C17', width: '38%' }}>
                      Festival / Occasion
                    </th>
                    <th style={{ padding: '13px 16px', fontSize: '11.5px', fontWeight: '800', color: '#4A2C17', textAlign: 'center', width: '20%', whiteSpace: 'nowrap' }}>
                      Benefit
                    </th>
                    <th style={{ padding: '13px 16px', fontSize: '11.5px', fontWeight: '800', color: '#4A2C17', textAlign: 'right', width: '12%', whiteSpace: 'nowrap' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px', color: 'var(--gold, #A56A30)' }}></i> Loading festivals...
                      </td>
                    </tr>
                  ) : festivals.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                        No festivals listed for {selectedYear}. Click "+ Add Festival" above to add one!
                      </td>
                    </tr>
                  ) : (
                    festivals.map((f, idx) => (
                      <tr
                        key={f.id}
                        style={{
                          borderBottom: idx !== festivals.length - 1 ? '1px solid #F0EAE4' : 'none',
                          background: editingId === f.id ? '#FEF3C7' : (idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5'),
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                          {formatDateDisplay(f.date)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#4A2C17' }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                            padding: '4px 12px',
                            borderRadius: '14px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(6, 95, 70, 0.06)'
                          }}>
                            <i className="fa-solid fa-gift" style={{ fontSize: '10px' }}></i>
                            +1.0 Hajeri
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleEdit(f)}
                              title="Edit Festival"
                              style={{
                                background: '#F3E8FF',
                                color: '#7E22CE',
                                border: '1px solid #D8B4FE',
                                borderRadius: '6px',
                                padding: '6px 9px',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              onClick={() => promptDelete(f)}
                              title="Delete Festival"
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                borderRadius: '6px',
                                padding: '6px 9px',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
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
            <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
              Total <strong style={{ color: '#4A2C17' }}>{festivals.length}</strong> festivals configured for {selectedYear}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px 22px',
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

      {/* =========================================================================
          CUSTOM DELETE CONFIRMATION MODAL (NEAT, CLEAN, MODERN UI)
          ========================================================================= */}
      {deleteConfirmTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 17, 10, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #FEE2E2',
            textAlign: 'center'
          }}>
            {/* Trash Icon Circle */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 16px auto',
              border: '2px solid #FECACA'
            }}>
              <i className="fa-solid fa-trash-can"></i>
            </div>

            {/* Title */}
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              Delete Festival?
            </h3>

            {/* Message */}
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#4B5563', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: '#111827' }}>"{deleteConfirmTarget.label}"</strong>?
              <br />
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                This holiday and its permanent member bonus will be removed from {selectedYear}.
              </span>
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1.5px solid #D1D5DB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                }}
              >
                {deleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash"></i> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FestivalModal;
