import React from 'react';

const EditSiteModal = ({
  editingSite,
  setEditingSite,
  onSubmit,
  onOpenMapPicker,
  onQuickFetch,
  quickGeocoding,
  geoNotice
}) => {
  if (!editingSite) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1250,
      backdropFilter: 'blur(3px)', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        width: '100%', maxWidth: '620px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #E5E7EB'
        }}>
          <div>
            <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
              Edit Order / Site: #{(() => {
                const match = String(editingSite.siteCode !== undefined ? editingSite.siteCode : (editingSite.siteRef || editingSite.id || '')).match(/\d+/);
                const num = match ? parseInt(match[0], 10) : NaN;
                return !isNaN(num) ? (num < 1000 ? String(num).padStart(3, '0') : String(num)) : (editingSite.siteCode || editingSite.id || '');
              })()}
            </h2>
            <span style={{fontSize: '12px', color: '#6B7280'}}>
              Update order/site number (numbers only), customer details, or status
            </span>
          </div>
          <button
            onClick={() => setEditingSite(null)}
            style={{
              background: 'transparent', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#9CA3AF'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{padding: '20px'}}>
          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            {/* Editable Site Ref Number */}
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                <span>Order / Site Number *</span>
                <span style={{fontSize: '11px', color: '#6B7280', fontWeight: '400'}}>Numbers only</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="001"
                value={editingSite.siteCode !== undefined ? editingSite.siteCode : ''}
                onChange={(e) => {
                  const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                  setEditingSite({ ...editingSite, siteCode: numericOnly });
                }}
                onBlur={() => {
                  if (editingSite.siteCode) {
                    const rawNum = parseInt(editingSite.siteCode, 10);
                    if (!isNaN(rawNum)) {
                      const formatted = rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum);
                      setEditingSite({ ...editingSite, siteCode: formatted });
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #D1D5DB',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: 'var(--gold, #A56A30)',
                  letterSpacing: '1px'
                }}
                required
              />
              <div style={{fontSize: '11px', color: '#9CA3AF', marginTop: '4px'}}>
                e.g. 001, 002 ... 999, 1000+ (min 3 digits: {editingSite.siteCode ? (parseInt(editingSite.siteCode, 10) < 1000 ? String(parseInt(editingSite.siteCode, 10)).padStart(3, '0') : editingSite.siteCode) : '___'})
              </div>
            </div>

            {/* Status */}
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Status
              </label>
              <select
                value={editingSite.status}
                onChange={(e) => setEditingSite({...editingSite, status: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  backgroundColor: '#fff', height: '42px', fontSize: '13px'
                }}
              >
                <option value="Running">Running</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Customer / Site Name & Reference Name */}
          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Customer / Site Name *
              </label>
              <input
                type="text"
                value={editingSite.customerName}
                onChange={(e) => setEditingSite({...editingSite, customerName: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Reference Name
                </label>
                <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                  (Optional)
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter Name"
                value={editingSite.refName || ''}
                onChange={(e) => setEditingSite({...editingSite, refName: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Phone Number
              </label>
              <input
                type="tel"
                value={editingSite.phone}
                onChange={(e) => setEditingSite({...editingSite, phone: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
                required
              />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Email
              </label>
              <input
                type="email"
                value={editingSite.email || ''}
                onChange={(e) => setEditingSite({...editingSite, email: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Location / Area
              </label>
              <input
                type="text"
                value={editingSite.location}
                onChange={(e) => setEditingSite({...editingSite, location: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
                required
              />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Progress %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editingSite.progress || 0}
                onChange={(e) => setEditingSite({...editingSite, progress: Number(e.target.value)})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* GPS Coordinates Field in Edit Modal */}
          <div style={{marginBottom: '14px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
              <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                GPS Coordinates (Lat, Lng)
              </label>
              <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                (Optional)
              </span>
            </div>
            <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
              <input
                type="text"
                placeholder="e.g. 18.5204, 73.8567"
                value={editingSite.latLng || ''}
                onChange={(e) => setEditingSite({...editingSite, latLng: e.target.value})}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  fontSize: '13px'
                }}
              />
              {editingSite.latLng && (
                <button
                  type="button"
                  onClick={() => setEditingSite({...editingSite, latLng: ''})}
                  title="Clear coordinates"
                  style={{
                    padding: '9px 10px', background: '#F3F4F6', border: '1px solid #D1D5DB',
                    borderRadius: '6px', color: '#6B7280', cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={onOpenMapPicker}
                style={{
                  padding: '9px 12px', background: 'rgba(165, 106, 48, 0.1)',
                  border: '1px solid rgba(165, 106, 48, 0.35)', borderRadius: '6px',
                  color: 'var(--gold, #A56A30)', cursor: 'pointer', fontSize: '12px',
                  fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px',
                  whiteSpace: 'nowrap'
                }}
                title="Open interactive map to pick location"
              >
                <i className="fa-solid fa-map-location-dot"></i> Pick on Map
              </button>
              <button
                type="button"
                onClick={onQuickFetch}
                disabled={quickGeocoding}
                style={{
                  padding: '9px 10px', background: '#F8FAFC',
                  border: '1px solid #CBD5E1', borderRadius: '6px',
                  color: '#334155', cursor: 'pointer', fontSize: '12px',
                  fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px',
                  whiteSpace: 'nowrap'
                }}
                title="Auto-detect coordinates from entered address or area"
              >
                {quickGeocoding ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles" style={{color: 'var(--gold, #A56A30)'}}></i>
                )}
                Fetch
              </button>
            </div>
            <div style={{fontSize: '11px', color: '#6B7280', marginTop: '4px'}}>
              💡 Optional: Click <strong>Pick on Map</strong> to drag a pin, or <strong>Fetch</strong> from address.
            </div>
          </div>

          {geoNotice && (
            <div style={{
              marginBottom: '14px', padding: '8px 12px', background: '#ECFDF5',
              border: '1px solid #A7F3D0', borderRadius: '6px', color: '#065F46',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <i className="fa-solid fa-circle-check"></i> {geoNotice}
            </div>
          )}

          <div style={{marginBottom: '14px'}}>
            <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
              Full Site Address
            </label>
            <textarea
              rows="2"
              value={editingSite.fullAddress}
              onChange={(e) => setEditingSite({...editingSite, fullAddress: e.target.value})}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit'
              }}
              required
            ></textarea>
          </div>

          <div style={{marginBottom: '18px'}}>
            <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
              Notes / Work Description
            </label>
            <textarea
              rows="2"
              value={editingSite.notes || ''}
              onChange={(e) => setEditingSite({...editingSite, notes: e.target.value})}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit'
              }}
            ></textarea>
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={() => setEditingSite(null)}
              style={{
                padding: '9px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{padding: '9px 20px'}}
            >
              <i className="fa-solid fa-check"></i> Update Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSiteModal;
