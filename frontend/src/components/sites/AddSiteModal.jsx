import React from 'react';

const AddSiteModal = ({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  onOpenMapPicker,
  onQuickFetch,
  quickGeocoding,
  geoNotice
}) => {
  if (!show) return null;

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
              Add New Site / Customer
            </h2>
            <span style={{fontSize: '12px', color: '#6B7280'}}>
              The customer represents the site location and project owner
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#9CA3AF', padding: '4px'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{padding: '20px'}}>
          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
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
                value={formData.siteCode || ''}
                onChange={(e) => {
                  const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, siteCode: numericOnly });
                }}
                onBlur={() => {
                  if (formData.siteCode) {
                    const rawNum = parseInt(formData.siteCode, 10);
                    if (!isNaN(rawNum)) {
                      const formatted = rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum);
                      setFormData({ ...formData, siteCode: formatted });
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
                e.g. 001, 002 ... 999, 1000+ (min 3 digits: {formData.siteCode ? (parseInt(formData.siteCode, 10) < 1000 ? String(parseInt(formData.siteCode, 10)).padStart(3, '0') : formData.siteCode) : '___'})
              </div>
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  backgroundColor: '#fff'
                }}
              >
                <option value="Running">Running</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Customer / Site Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Deshmukh"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
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
                value={formData.refName || ''}
                onChange={(e) => setFormData({...formData, refName: e.target.value})}
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
                Mobile Number *
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
                required
              />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{marginBottom: '14px'}}>
            <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
              Site Area / Location *
            </label>
            <input
              type="text"
              placeholder="e.g. Kothrud, Pune"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
              }}
              required
            />
          </div>

          <div style={{marginBottom: '14px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
              <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                GPS Coordinates (Lat, Lng)
              </label>
              <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                (Optional)
              </span>
            </div>
            <div style={{display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap'}}>
              <input
                type="text"
                placeholder="e.g. 18.5204, 73.8567"
                value={formData.latLng}
                onChange={(e) => setFormData({...formData, latLng: e.target.value})}
                style={{
                  flex: '1 1 200px', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  fontSize: '13px'
                }}
              />
              {formData.latLng && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, latLng: ''})}
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
              Full Site Address *
            </label>
            <textarea
              placeholder="Enter complete site address with building and landmark..."
              rows="2"
              value={formData.fullAddress}
              onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit'
              }}
              required
            ></textarea>
          </div>

          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Work Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Target Completion Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{marginBottom: '18px'}}>
            <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
              Site Notes & Scope of Work
            </label>
            <textarea
              placeholder="Details on 2BHK/3BHK interior, woodwork specifications, tiles, etc."
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
              onClick={onClose}
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
              <i className="fa-solid fa-check"></i> Save Site / Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSiteModal;
