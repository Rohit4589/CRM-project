import React, { useState, useEffect } from 'react';
import { toTitleCase } from '../../utils/autoCapitalize';

const STANDARD_REF_SOURCES = [
  'Existing Customer',
  'Walk-in',
  'Just Dial',
  'Google',
  'Instagram / Social Media',
  'Architect / Contractor',
  'Friends & Family',
  'Other'
];

const getSiteRefLabel = (site) => {
  if (!site) return '';
  const rawCode = site.siteCode !== undefined && site.siteCode !== null && site.siteCode !== ''
    ? String(site.siteCode).trim()
    : String(site.id || site.siteRef || '').replace(/[^0-9]/g, '');
  const code = rawCode ? (parseInt(rawCode, 10) < 1000 ? String(parseInt(rawCode, 10)).padStart(3, '0') : rawCode) : '';
  const name = site.customerName || 'Unnamed';
  return code ? `${code} - ${name}` : name;
};

const EditSiteModal = ({
  editingSite,
  setEditingSite,
  existingSites = [],
  onSubmit,
  onOpenMapPicker,
  onQuickFetch,
  quickGeocoding,
  geoNotice
}) => {
  const [isCustomRefFrom, setIsCustomRefFrom] = useState(false);
  const [isCustomRefName, setIsCustomRefName] = useState(false);

  useEffect(() => {
    if (editingSite) {
      setIsCustomRefFrom(editingSite.refFrom && !STANDARD_REF_SOURCES.includes(editingSite.refFrom));
      setIsCustomRefName(
        editingSite.refName && !existingSites.some(s => getSiteRefLabel(s) === editingSite.refName || s.customerName === editingSite.refName)
      );
    }
  }, [editingSite?.id, editingSite?.dbId]);

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
        width: '100%', maxWidth: '980px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: '1px solid #E5E7EB'
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

        <form onSubmit={onSubmit} style={{padding: '24px'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '24px',
            alignItems: 'start',
            marginBottom: '10px'
          }}>
            {/* LEFT COLUMN: Customer & Contact Information */}
            <div>
              <div style={{
                fontSize: '12px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <i className="fa-solid fa-user-circle"></i> Customer & Contact Details
              </div>

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

          {/* Customer / Site Name & Customer Ref From */}
          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Customer / Site Name *
              </label>
              <input
                type="text"
                value={editingSite.customerName}
                onChange={(e) => setEditingSite({...editingSite, customerName: toTitleCase(e.target.value)})}
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
                  Customer Ref From
                </label>
                <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                  (Optional)
                </span>
              </div>
              <select
                value={
                  isCustomRefFrom ? '__CUSTOM__' :
                  (!editingSite.refFrom ? '' : (STANDARD_REF_SOURCES.includes(editingSite.refFrom) ? editingSite.refFrom : '__CUSTOM__'))
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__CUSTOM__') {
                    setIsCustomRefFrom(true);
                    setEditingSite({ ...editingSite, refFrom: '' });
                  } else {
                    setIsCustomRefFrom(false);
                    setEditingSite({ ...editingSite, refFrom: val });
                  }
                }}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  backgroundColor: '#fff', fontSize: '13px'
                }}
              >
                <option value="__CUSTOM__">✏️ + Custom (Type your own source...)</option>
                <option value="">-- Select Customer Source --</option>
                <option value="Existing Customer">Existing Customer</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Just Dial">Just Dial</option>
                <option value="Google">Google</option>
                <option value="Instagram / Social Media">Instagram / Social Media</option>
                <option value="Architect / Contractor">Architect / Contractor</option>
                <option value="Friends & Family">Friends & Family</option>
                <option value="Other">Other</option>
              </select>
              {(isCustomRefFrom || (editingSite.refFrom && !STANDARD_REF_SOURCES.includes(editingSite.refFrom))) && (
                <input
                  type="text"
                  placeholder="Type custom source (e.g. Exhibition, Hoarding...)"
                  value={editingSite.refFrom || ''}
                  onChange={(e) => setEditingSite({ ...editingSite, refFrom: toTitleCase(e.target.value) })}
                  style={{
                    marginTop: '6px', width: '100%', padding: '8px 12px', borderRadius: '6px',
                    border: '1.5px solid var(--gold, #A56A30)', boxSizing: 'border-box', outline: 'none',
                    fontSize: '13px', backgroundColor: '#FFFDF7'
                  }}
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Conditional Referral / Existing Customer Section */}
          {editingSite.refFrom === 'Existing Customer' ? (
            <div style={{
              marginBottom: '14px',
              padding: '12px 14px',
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                <label style={{color: '#166534', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <i className="fa-solid fa-users" style={{color: '#16a34a'}}></i>
                  Referred By Existing Customer / Site
                </label>
                <span style={{color: '#15803D', fontSize: '11px', fontWeight: '600'}}>
                  Select from {existingSites.length} Customers
                </span>
              </div>
              <select
                value={
                  isCustomRefName ? '__CUSTOM__' :
                  (() => {
                    const match = existingSites.find(s => getSiteRefLabel(s) === editingSite.refName || s.customerName === editingSite.refName);
                    return match ? getSiteRefLabel(match) : (editingSite.refName ? '__CUSTOM__' : '');
                  })()
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__CUSTOM__') {
                    setIsCustomRefName(true);
                    setEditingSite({ ...editingSite, refName: '' });
                  } else {
                    setIsCustomRefName(false);
                    setEditingSite({ ...editingSite, refName: val });
                  }
                }}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1.5px solid #16A34A', boxSizing: 'border-box', outline: 'none',
                  backgroundColor: '#FFFFFF', fontSize: '13px'
                }}
              >
                <option value="__CUSTOM__">✏️ + Custom (Type Customer / Site Name...)</option>
                <option value="">-- Choose Referring Customer / Site --</option>
                {existingSites.map((site) => {
                  const label = getSiteRefLabel(site);
                  return (
                    <option key={site.id || site.dbId || site.siteCode} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {(isCustomRefName || (editingSite.refName && !existingSites.some(s => getSiteRefLabel(s) === editingSite.refName || s.customerName === editingSite.refName))) && (
                <input
                  type="text"
                  placeholder="Type referring customer or site name..."
                  value={editingSite.refName || ''}
                  onChange={(e) => setEditingSite({ ...editingSite, refName: toTitleCase(e.target.value) })}
                  style={{
                    marginTop: '8px', width: '100%', padding: '8px 12px', borderRadius: '6px',
                    border: '1.5px solid #15803D', boxSizing: 'border-box', outline: 'none',
                    fontSize: '13px', backgroundColor: '#FFFFFF'
                  }}
                  autoFocus
                />
              )}
            </div>
          ) : (
            <div style={{marginBottom: '14px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Reference / Contact Person Name
                </label>
                <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                  (Optional)
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter referee name or contact person (optional)"
                value={editingSite.refName || ''}
                onChange={(e) => setEditingSite({...editingSite, refName: toTitleCase(e.target.value)})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Mobile Number
                </label>
                <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                  (Optional)
                </span>
              </div>
              <input
                type="tel"
                value={editingSite.phone}
                onChange={(e) => setEditingSite({...editingSite, phone: e.target.value})}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                }}
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

          {/* Multiple Contact Persons */}
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: (editingSite.contactPersons && editingSite.contactPersons.length > 0) ? '10px' : '0px'
            }}>
              <div>
                <label style={{color: '#374151', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0}}>
                  <i className="fa-solid fa-address-book" style={{color: 'var(--gold, #A56A30)'}}></i>
                  Contact Persons
                </label>
                <span style={{fontSize: '11px', color: '#6B7280'}}>
                  Add extra contact persons for this customer / site
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = Array.isArray(editingSite.contactPersons) ? [...editingSite.contactPersons] : [];
                  setEditingSite({
                    ...editingSite,
                    contactPersons: [...current, { name: '', phone: '' }]
                  });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--gold, #A56A30)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <i className="fa-solid fa-plus"></i> Add Person
              </button>
            </div>

            {Array.isArray(editingSite.contactPersons) && editingSite.contactPersons.length > 0 && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px'}}>
                {editingSite.contactPersons.map((cp, idx) => (
                  <div key={idx} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input
                      type="text"
                      placeholder="Person Name / Role"
                      value={cp.name || ''}
                      onChange={(e) => {
                        const updated = [...editingSite.contactPersons];
                        updated[idx] = { ...updated[idx], name: toTitleCase(e.target.value) };
                        setEditingSite({ ...editingSite, contactPersons: updated });
                      }}
                      style={{
                        flex: '1 1 180px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '12.5px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Contact Number"
                      value={cp.phone || cp.contact || ''}
                      onChange={(e) => {
                        const updated = [...editingSite.contactPersons];
                        updated[idx] = { ...updated[idx], phone: e.target.value };
                        setEditingSite({ ...editingSite, contactPersons: updated });
                      }}
                      style={{
                        flex: '1 1 160px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '12.5px',
                        outline: 'none',
                        background: '#fff'
                      }}
                    />
                    {/* Add another line below with + icon */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...editingSite.contactPersons];
                        updated.splice(idx + 1, 0, { name: '', phone: '' });
                        setEditingSite({ ...editingSite, contactPersons: updated });
                      }}
                      title="Add another line below"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#059669',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        flexShrink: 0
                      }}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                    {/* Remove row button */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingSite.contactPersons.filter((_, i) => i !== idx);
                        setEditingSite({ ...editingSite, contactPersons: updated });
                      }}
                      title="Remove contact person"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        flexShrink: 0
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>

            {/* RIGHT COLUMN: Site Location & Project Timeline */}
            <div>
              <div style={{
                fontSize: '12px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <i className="fa-solid fa-map-location-dot"></i> Site Location & Timeline
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 200px'}}>
              <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                Location / Area
              </label>
              <input
                type="text"
                value={editingSite.location}
                onChange={(e) => setEditingSite({...editingSite, location: toTitleCase(e.target.value)})}
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
              onChange={(e) => setEditingSite({...editingSite, fullAddress: toTitleCase(e.target.value)})}
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
            </div>
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
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
