import React, { useState, useEffect } from 'react';

const EstimateTable = ({
  estimates = [],
  loading = false,
  onView,
  onEdit,
  onRevision,
  onDownload,
  onShare,
  onDelete,
  onStatusChange
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (loading) {
    return (
      <div className="estimate-table-card" style={{ padding: '40px', textAlign: 'center', color: '#7A6F66' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
        <p>Loading estimates...</p>
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="estimate-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <i className="fa-solid fa-file-invoice" style={{ fontSize: '40px', color: '#DCD4CA', marginBottom: '14px' }}></i>
        <h3 style={{ fontSize: '16px', color: '#2B2520', margin: '0 0 6px 0' }}>No Estimates Found in this Folder</h3>
        <p style={{ fontSize: '13px', color: '#8C827A', margin: 0 }}>Create a new estimate or move existing orders between Running & Quotation folders.</p>
      </div>
    );
  }

  return (
    <div className="estimate-table-card" style={{ minHeight: '320px' }}>
      <div className="estimate-table-wrap" style={{ minHeight: '280px', paddingBottom: '40px' }}>
        <table className="estimate-table">
          <thead>
            <tr>
              <th style={{ width: '85px', minWidth: '85px', textAlign: 'left' }}>Order No</th>
              <th style={{ minWidth: '180px', textAlign: 'center' }}>Customer Name</th>
              <th style={{ width: '130px', minWidth: '120px', textAlign: 'center' }}>Phone / Site</th>
              <th style={{ width: '110px', minWidth: '100px', textAlign: 'center' }}>Project Type</th>
              <th style={{ width: '100px', minWidth: '95px', textAlign: 'center' }}>Date</th>
              <th style={{ width: '125px', minWidth: '120px', textAlign: 'center' }}>Folder Status</th>
              <th style={{ width: '130px', minWidth: '125px', textAlign: 'center', whiteSpace: 'nowrap' }}>Final Total</th>
              <th style={{ width: '100px', minWidth: '95px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est, index) => {
              const formattedTotal = Number(est.final_total || 0).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              });

              const dateStr = est.date
                ? new Date(est.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '-';

              // Parse base order number and revision
              const rawNum = String(est.estimate_number || '');
              const revMatch = rawNum.match(/^(\d+)-(\d+)$/);
              let baseOrder = '';
              let revNumber = '';

              if (revMatch) {
                const bNum = parseInt(revMatch[1], 10);
                baseOrder = bNum < 1000 ? String(bNum).padStart(3, '0') : String(bNum);
                revNumber = revMatch[2];
              } else {
                const match = rawNum.match(/\d+/);
                if (match) {
                  const num = parseInt(match[0], 10);
                  baseOrder = num < 1000 ? String(num).padStart(3, '0') : String(num);
                } else {
                  baseOrder = est.site_ref || rawNum || '-';
                }
              }

              // Strip manual -01, -02 from customer name if user had typed it
              const cleanCustomerName = String(est.customer_name || '').replace(/-\d+$/, '').trim();

              const currentStatus = est.effective_status || est.order_status || est.site_status || est.status || 'Running';
              const isRunning = currentStatus === 'Running' || currentStatus === 'Draft' || currentStatus === 'Quotation';
              const isCompleted = currentStatus === 'Completed' || currentStatus === 'Complete';
              const isOnHold = currentStatus === 'On Hold' || currentStatus === 'Hold / Cancelled' || currentStatus === 'Hold';

              return (
                <tr key={est.id}>
                  <td style={{ textAlign: 'left' }}>
                    <span className="estimate-num-badge">#{baseOrder}</span>
                    {revNumber ? (
                      <div style={{ marginTop: '3px' }}>
                        <span className="estimate-rev-badge">Bill #{parseInt(revNumber, 10) || revNumber}</span>
                      </div>
                    ) : null}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong
                      style={{
                        color: '#2B2520',
                        fontSize: '13.5px',
                        cursor: onEdit ? 'pointer' : 'default',
                        transition: 'color 0.15s ease'
                      }}
                      onClick={() => onEdit && onEdit(est)}
                      title={onEdit ? 'Click to Edit Estimate' : ''}
                      onMouseOver={(e) => { if (onEdit) e.currentTarget.style.color = '#8A5D3B'; }}
                      onMouseOut={(e) => { if (onEdit) e.currentTarget.style.color = '#2B2520'; }}
                    >
                      {cleanCustomerName}
                    </strong>
                    {est.address && (
                      <div style={{ fontSize: '11.5px', color: '#8C827A', marginTop: '3px', lineHeight: '1.4', wordBreak: 'break-word', textAlign: 'center' }}>
                        {est.address}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div>{est.phone || '-'}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#4A2C17' }}>
                      {est.project_type || 'Residential'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A5D3B', marginTop: '2px', fontWeight: '500' }}>
                      {est.collection_tier || (
                        est.furniture_level === 'Modern' ? 'Essential' :
                        est.furniture_level === 'Luxury' ? 'Elite' :
                        'Signature'
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{dateStr}</td>
                  
                  {/* Status Dropdown: 3 Categories (Running, Completed, On Hold) */}
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={isCompleted ? 'Completed' : (isOnHold ? 'On Hold' : 'Running')}
                      onChange={(e) => onStatusChange && onStatusChange(est.id, e.target.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none',
                        border: '1.5px solid',
                        background: isRunning ? '#ECFDF5' : (isCompleted ? '#F3F4F6' : '#FEF3C7'),
                        color: isRunning ? '#065F46' : (isCompleted ? '#4B5563' : '#92400E'),
                        borderColor: isRunning ? '#A7F3D0' : (isCompleted ? '#D1D5DB' : '#FCD34D'),
                        transition: 'all 0.15s ease'
                      }}
                      title="Move Order Status (Running / Completed / On Hold)"
                    >
                      <option value="Running">● Running</option>
                      <option value="Completed">● Completed</option>
                      <option value="On Hold">● On Hold</option>
                    </select>
                  </td>

                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', width: '130px', minWidth: '125px' }}>
                    <strong style={{ fontSize: '14px', color: '#2E7D32' }}>{formattedTotal}</strong>
                  </td>
                  <td style={{ textAlign: 'center', width: '100px', minWidth: '95px', whiteSpace: 'nowrap', position: 'relative' }}>
                    <div className="estimate-actions" style={{ justifyContent: 'center', gap: '6px' }}>
                      {/* 1. View Estimate */}
                      <button
                        type="button"
                        className="btn-action-icon"
                        title="Preview & Print Estimate"
                        onClick={() => onView(est)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: '#FAF8F5',
                          border: '1px solid #D1C2AF',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#4B5563',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          padding: 0,
                          flexShrink: 0
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#F3EDE6'; e.currentTarget.style.borderColor = '#9A7B56'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>

                      {/* 2. Three-Dots Menu */}
                      <div
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={() => {
                          setOpenMenuId(est.id);
                        }}
                        onMouseLeave={() => {
                          setOpenMenuId(null);
                        }}
                      >
                        <button
                          type="button"
                          title="Estimate Actions (Edit, Copy, Delete)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === est.id ? null : est.id);
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: openMenuId === est.id ? 'var(--gold, #4A2C17)' : '#FAF8F5',
                            border: openMenuId === est.id ? '1.5px solid var(--gold, #4A2C17)' : '1px solid #D1C2AF',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: openMenuId === est.id ? '#FFFFFF' : '#4A2C17',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            padding: 0,
                            flexShrink: 0,
                            boxShadow: openMenuId === est.id ? '0 2px 8px rgba(74, 44, 23, 0.25)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (openMenuId !== est.id) {
                              e.currentTarget.style.background = '#F3EDE6';
                              e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (openMenuId !== est.id) {
                              e.currentTarget.style.background = '#FAF8F5';
                              e.currentTarget.style.borderColor = '#D1C2AF';
                            }
                          }}
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        {openMenuId === est.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: index >= estimates.length - 2 && estimates.length > 2 ? 'auto' : '100%',
                              bottom: index >= estimates.length - 2 && estimates.length > 2 ? '100%' : 'auto',
                              paddingTop: index >= estimates.length - 2 && estimates.length > 2 ? '0' : '4px',
                              paddingBottom: index >= estimates.length - 2 && estimates.length > 2 ? '4px' : '0',
                              zIndex: 600,
                              minWidth: '185px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              style={{
                                background: '#FFFFFF',
                                borderRadius: '10px',
                                border: '1.5px solid #D1C2AF',
                                boxShadow: '0 12px 32px rgba(74, 44, 23, 0.25)',
                                padding: '6px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                textAlign: 'left',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Header */}
                              <div style={{
                                padding: '6px 14px 4px',
                                fontSize: '10.5px',
                                fontWeight: '800',
                                color: 'var(--gold, #8C5521)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.6px',
                                borderBottom: '1px solid #F3EDE6',
                                marginBottom: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <span>Estimate Actions</span>
                                <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>#{baseOrder || est.id}</span>
                              </div>

                              {/* 1. Edit */}
                              {onEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onEdit(est);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '9px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.12s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <span style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: '#EFF6FF',
                                    color: '#2563EB',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    border: '1px solid #BFDBFE'
                                  }}>
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </span>
                                  <span>Edit Estimate</span>
                                </button>
                              )}

                              {/* 2. Copy Estimate */}
                              {onRevision && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onRevision(est);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '9px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.12s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <span style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: '#FEF3C7',
                                    color: '#D97706',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    border: '1px solid #FDE68A'
                                  }}>
                                    <i className="fa-solid fa-copy"></i>
                                  </span>
                                  <span>Copy Estimate</span>
                                </button>
                              )}

                              <div style={{ height: '1px', background: '#F3EDE6', margin: '4px 0' }}></div>

                              {/* 3. Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDelete(est);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '9px 14px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#DC2626',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  width: '100%',
                                  textAlign: 'left',
                                  transition: 'all 0.12s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  border: '1px solid #FECACA'
                                }}>
                                  <i className="fa-solid fa-trash-can"></i>
                                </span>
                                <span>Delete Estimate</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimateTable;
