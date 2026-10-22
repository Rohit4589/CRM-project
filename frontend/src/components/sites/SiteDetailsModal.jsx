import React from 'react';

const SiteDetailsModal = ({ selectedSite, setSelectedSite, openEditModal, getStatusBadge, onNavigate, onOpenFolder, onDelete }) => {
  if (!selectedSite) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1250,
      backdropFilter: 'blur(3px)', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        width: '100%', maxWidth: '580px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB'
        }}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
              <span style={{
                background: 'rgba(165, 106, 48, 0.1)',
                color: 'var(--gold, #A56A30)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                {selectedSite.id}
              </span>
              <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                {selectedSite.customerName}
              </h2>
            </div>
            <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>
              Site Location: <strong>{selectedSite.location}</strong>
            </div>
          </div>
          <button
            onClick={() => setSelectedSite(null)}
            style={{
              background: 'transparent', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#9CA3AF'
            }}
          >
            &times;
          </button>
        </div>

        <div style={{padding: '20px'}}>
          
          {/* Status and Progress */}
          <div style={{
            background: '#F9FAFB', padding: '14px', borderRadius: '8px',
            border: '1px solid #E5E7EB', marginBottom: '18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Current Status</div>
              <div style={{marginTop: '4px'}}>{getStatusBadge(selectedSite.status)}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Progress</div>
              <div style={{fontSize: '18px', fontWeight: '700', color: 'var(--gold, #A56A30)'}}>{selectedSite.progress || 0}%</div>
            </div>
          </div>

          {/* Contact & Referral Info */}
          <div style={{marginBottom: '18px'}}>
            <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              Customer Contact & Referral Source
            </h4>
            <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
              <div style={{fontSize: '13px'}}>
                <span style={{color: '#6B7280'}}>Phone: </span>
                <strong style={{color: '#111827'}}>{selectedSite.phone || 'N/A'}</strong>
              </div>
              {selectedSite.email && (
                <div style={{fontSize: '13px'}}>
                  <span style={{color: '#6B7280'}}>Email: </span>
                  <strong style={{color: '#111827'}}>{selectedSite.email}</strong>
                </div>
              )}
              {selectedSite.refFrom && (
                <div style={{fontSize: '13px'}}>
                  <span style={{color: '#6B7280'}}>Source: </span>
                  <span style={{
                    background: selectedSite.refFrom === 'Existing Customer' ? '#DCFCE7' : '#FEF3C7',
                    color: selectedSite.refFrom === 'Existing Customer' ? '#15803D' : '#92400E',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}>
                    {selectedSite.refFrom === 'Existing Customer' ? 'Existing Customer (Repeat Order)' : selectedSite.refFrom}
                  </span>
                </div>
              )}
              {selectedSite.refName && (
                <div style={{fontSize: '13px'}}>
                  <span style={{color: '#6B7280'}}>
                    {selectedSite.refFrom === 'Existing Customer' ? 'Previous Order Ref: ' : 'Referred By: '}
                  </span>
                  <strong style={{color: '#111827'}}>{selectedSite.refName}</strong>
                </div>
              )}
            </div>

            {Array.isArray(selectedSite.contactPersons) && selectedSite.contactPersons.length > 0 && (
              <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #E5E7EB'}}>
                <span style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px'}}>
                  Additional Contact Persons:
                </span>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  {selectedSite.contactPersons.map((cp, i) => (
                    <div key={i} style={{
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      <strong style={{color: '#111827'}}>{cp.name || 'Contact'}</strong>
                      {cp.phone && (
                        <span style={{color: '#4B5563', marginLeft: '6px'}}>
                          <i className="fa-solid fa-phone" style={{fontSize: '10px', marginRight: '4px', color: 'var(--gold, #A56A30)'}}></i>
                          {cp.phone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Site Address & Map */}
          <div style={{marginBottom: '18px'}}>
            <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              Site Address & Location
            </h4>
            <div style={{
              padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB',
              borderRadius: '6px', fontSize: '13px', color: '#374151', lineHeight: '1.5'
            }}>
              <div style={{display: 'flex', gap: '8px'}}>
                <i className="fa-solid fa-map-location-dot" style={{color: 'var(--gold, #A56A30)', marginTop: '3px'}}></i>
                <div>
                  {selectedSite.refName && (
                    <div style={{fontWeight: '600', color: '#111827', marginBottom: '4px'}}>
                      Ref: {selectedSite.refName}
                    </div>
                  )}
                  <div>{selectedSite.fullAddress}</div>
                  {selectedSite.latLng && (
                    <div style={{fontSize: '12px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                      <span>GPS: <strong>{selectedSite.latLng}</strong></span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSite.latLng)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          color: 'var(--gold, #A56A30)', textDecoration: 'none', fontWeight: '600',
                          fontSize: '11px', background: 'rgba(165, 106, 48, 0.08)',
                          padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(165, 106, 48, 0.2)'
                        }}
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{marginBottom: '18px'}}>
            <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              Timeline
            </h4>
            <div style={{display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap'}}>
              <div>
                <span style={{color: '#6B7280'}}>Started: </span>
                <strong>{selectedSite.startDate || 'N/A'}</strong>
              </div>
              <div>
                <span style={{color: '#6B7280'}}>Target Completion: </span>
                <strong>{selectedSite.targetDate || 'Ongoing'}</strong>
              </div>
            </div>
          </div>

          {/* Scope & Notes */}
          {selectedSite.notes && (
            <div style={{marginBottom: '18px'}}>
              <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                Scope of Work / Notes
              </h4>
              <div style={{
                padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: '6px', fontSize: '13px', color: '#4B5563', lineHeight: '1.5'
              }}>
                {selectedSite.notes}
              </div>
            </div>
          )}

          {/* Assigned Staff */}
          {selectedSite.assignedTeam && selectedSite.assignedTeam.length > 0 && (
            <div>
              <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                Assigned Employees
              </h4>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {selectedSite.assignedTeam.map((emp, i) => (
                  <span key={i} style={{
                    background: 'rgba(165, 106, 48, 0.1)', color: '#7A4518', fontSize: '12px',
                    border: '1px solid rgba(165, 106, 48, 0.25)',
                    fontWeight: '600', padding: '4px 10px', borderRadius: '15px'
                  }}>
                    <i className="fa-solid fa-user-check" style={{marginRight: '5px'}}></i>
                    {emp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Folder Card */}
          <div style={{marginBottom: '16px'}}>
            <h4 style={{margin: '0 0 8px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700'}}>
              Project Folder (AutoCad, SketchUp, Estimates, Bills)
            </h4>
            <div style={{
              padding: '12px 14px', background: '#FDFBF7', border: '1px solid #EAE1D5',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', flexWrap: 'wrap'
            }}>
              <div style={{minWidth: 0, flex: 1}}>
                <div style={{fontSize: '11px', color: '#7A4518', fontWeight: '700', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <i className="fa-solid fa-folder-tree" style={{color: '#A56A30'}}></i> Standard Folder Structure
                </div>
                <div style={{
                  fontSize: '11.5px', color: '#4B5563', fontFamily: 'monospace',
                  wordBreak: 'break-all', lineHeight: '1.4'
                }}>
                  {selectedSite.projectFolder || 'Ready to auto-create on disk'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenFolder && onOpenFolder(selectedSite)}
                style={{
                  background: 'rgba(165, 106, 48, 0.1)', color: 'var(--gold, #A56A30)',
                  border: '1px solid rgba(165, 106, 48, 0.3)', borderRadius: '6px',
                  padding: '7px 14px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(165, 106, 48, 0.18)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(165, 106, 48, 0.1)'; }}
              >
                <i className="fa-solid fa-folder-open"></i> Open in Explorer
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Toolbar */}
          {onNavigate && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedSite(null);
                  onNavigate('estimates');
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2D9CF',
                  background: '#FAF8F5',
                  color: '#4A2C17',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F3EDE6'; e.currentTarget.style.borderColor = '#9A7B56'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#E2D9CF'; }}
              >
                <i className="fa-solid fa-file-invoice-dollar" style={{color: '#A56A30'}}></i> Generate Estimate
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSite(null);
                  onNavigate('salary');
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2D9CF',
                  background: '#FAF8F5',
                  color: '#4A2C17',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F3EDE6'; e.currentTarget.style.borderColor = '#9A7B56'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#E2D9CF'; }}
              >
                <i className="fa-solid fa-calculator" style={{color: '#059669'}}></i> View Labor Expenses
              </button>
            </div>
          )}

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            marginTop: '8px',
            borderTop: '1px solid #EAE1D5',
            gap: '12px'
          }}>
            {/* Delete Customer on Left */}
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedSite.id || selectedSite.dbId;
                  setSelectedSite(null);
                  onDelete(targetId);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
              >
                <i className="fa-solid fa-trash-can"></i> Delete Customer
              </button>
            ) : <div />}

            {/* Close & Edit Actions on Right */}
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <button
                type="button"
                onClick={() => setSelectedSite(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const siteToEdit = selectedSite;
                  setSelectedSite(null);
                  openEditModal(siteToEdit);
                }}
                className="btn-primary"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-pen"></i> Edit Site Details
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SiteDetailsModal;
