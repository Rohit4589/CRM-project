import React, { useState, useEffect } from 'react';
import { toTitleCase } from '../../utils/autoCapitalize';

const STANDARD_REF_SOURCES = [
  'Existing Customer',
  'Walk-in',
  'Google',
  'Instagram / Social Media',
  'Architect / Contractor',
  'Friends & Family',
  'Just Dial',
  'Other'
];

const getSiteRefLabel = (site) => {
  if (!site) return '';
  const rawCode = site.siteCode !== undefined && site.siteCode !== null && site.siteCode !== ''
    ? String(site.siteCode).trim()
    : String(site.id || site.siteRef || '').replace(/[^0-9]/g, '');
  const code = rawCode ? (parseInt(rawCode, 10) < 1000 ? String(parseInt(rawCode, 10)).padStart(3, '0') : rawCode) : '';
  const name = site.customerName || 'Unnamed';
  const ref = site.location ? ` - ${site.location}` : '';
  return code ? `${code} - ${name}${ref}` : name;
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

  // Primary Contact Person helper
  const primaryContactName = (editingSite.contactPersons && editingSite.contactPersons.length > 0)
    ? (editingSite.contactPersons[0].name || '')
    : (editingSite.refFrom !== 'Existing Customer' ? (editingSite.refName || '') : '');

  const handleContactPersonNameChange = (name) => {
    const currentPersons = Array.isArray(editingSite.contactPersons) ? [...editingSite.contactPersons] : [];
    if (currentPersons.length > 0) {
      currentPersons[0] = { ...currentPersons[0], name, phone: currentPersons[0].phone || editingSite.phone || '' };
    } else {
      currentPersons.push({ name, phone: editingSite.phone || '' });
    }
    const updates = { ...editingSite, contactPersons: currentPersons };
    if (editingSite.refFrom !== 'Existing Customer') {
      updates.refName = name;
    }
    setEditingSite(updates);
  };

  const handlePhoneChange = (phone) => {
    const currentPersons = Array.isArray(editingSite.contactPersons) ? [...editingSite.contactPersons] : [];
    if (currentPersons.length > 0) {
      currentPersons[0] = { ...currentPersons[0], phone };
    }
    setEditingSite({ ...editingSite, phone, contactPersons: currentPersons });
  };

  // Additional Contacts (index >= 1)
  const additionalContacts = Array.isArray(editingSite.contactPersons) ? editingSite.contactPersons.slice(1) : [];

  const handleAddAdditionalContact = () => {
    const current = Array.isArray(editingSite.contactPersons) ? [...editingSite.contactPersons] : [];
    if (current.length === 0) {
      current.push({ name: primaryContactName, phone: editingSite.phone || '' });
    }
    current.push({ name: '', phone: '' });
    setEditingSite({ ...editingSite, contactPersons: current });
  };

  const handleUpdateAdditionalContact = (addIdx, field, value) => {
    const realIdx = addIdx + 1;
    const current = [...editingSite.contactPersons];
    current[realIdx] = { ...current[realIdx], [field]: value };
    setEditingSite({ ...editingSite, contactPersons: current });
  };

  const handleRemoveAdditionalContact = (addIdx) => {
    const realIdx = addIdx + 1;
    const current = editingSite.contactPersons.filter((_, i) => i !== realIdx);
    setEditingSite({ ...editingSite, contactPersons: current });
  };

  // Dynamic Folder Preview
  const orderDisplay = editingSite.siteCode !== undefined && editingSite.siteCode !== null && editingSite.siteCode !== ''
    ? (parseInt(editingSite.siteCode, 10) < 1000 ? String(parseInt(editingSite.siteCode, 10)).padStart(3, '0') : editingSite.siteCode)
    : (editingSite.id || '___');
  const customerDisplay = editingSite.customerName?.trim() || '';
  const refDisplay = editingSite.location?.trim() || '';
  const folderPreview = [orderDisplay, customerDisplay, refDisplay].filter(Boolean).join(' - ');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1250,
      backdropFilter: 'blur(3px)', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        width: '100%', maxWidth: '920px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px', borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827'}}>
            Edit Customer: #{orderDisplay}
          </h2>
          <button
            onClick={() => setEditingSite(null)}
            style={{
              background: 'transparent', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#9CA3AF', padding: '4px'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{padding: '20px 22px'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px',
            alignItems: 'start'
          }}>
            {/* LEFT COLUMN: Customer & Order */}
            <div>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
              }}>
                Customer &amp; Order
              </div>

              {/* Row 1: Order Number & Status */}
              <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Order Number *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="e.g. 246"
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
                      padding: '8px 11px',
                      borderRadius: '6px',
                      border: '1.5px solid #D1D5DB',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      color: 'var(--gold, #A56A30)'
                    }}
                    required
                  />
                </div>

                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Status
                  </label>
                  <select
                    value={editingSite.status || 'Running'}
                    onChange={(e) => setEditingSite({...editingSite, status: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff', fontSize: '13px'
                    }}
                  >
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Name & Reference Name (Side-by-Side) */}
              <div style={{display: 'flex', gap: '12px', marginBottom: '8px'}}>
                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pranjal Spaces"
                    value={editingSite.customerName || ''}
                    onChange={(e) => setEditingSite({...editingSite, customerName: toTitleCase(e.target.value)})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>

                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Reference Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ravet / Flat 402"
                    value={editingSite.location || ''}
                    onChange={(e) => setEditingSite({...editingSite, location: toTitleCase(e.target.value)})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Subtle 1-line Folder Preview */}
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <i className="fa-solid fa-folder-closed" style={{color: 'var(--gold, #A56A30)'}}></i>
                <span>Folder: <strong style={{color: '#374151'}}>{folderPreview || '___'}</strong></span>
              </div>

              {/* Row 3: Customer Ref From & Contact Person Name (Side-by-Side) */}
              <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Customer Ref From
                  </label>
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
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff', fontSize: '13px'
                    }}
                  >
                    <option value="">-- Referral Source --</option>
                    <option value="Existing Customer">Existing Customer</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Google">Google</option>
                    <option value="Instagram / Social Media">Instagram / Social Media</option>
                    <option value="Architect / Contractor">Architect / Contractor</option>
                    <option value="Friends & Family">Friends & Family</option>
                    <option value="Just Dial">Just Dial</option>
                    <option value="Other">Other</option>
                    <option value="__CUSTOM__">✏️ Custom...</option>
                  </select>
                  {(isCustomRefFrom || (editingSite.refFrom && !STANDARD_REF_SOURCES.includes(editingSite.refFrom))) && (
                    <input
                      type="text"
                      placeholder="Type custom source..."
                      value={editingSite.refFrom || ''}
                      onChange={(e) => setEditingSite({ ...editingSite, refFrom: toTitleCase(e.target.value) })}
                      style={{
                        marginTop: '5px', width: '100%', padding: '7px 10px', borderRadius: '6px',
                        border: '1.5px solid var(--gold, #A56A30)', boxSizing: 'border-box', outline: 'none',
                        fontSize: '12.5px', backgroundColor: '#FFFDF7'
                      }}
                      autoFocus
                    />
                  )}
                </div>

                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Site Supervisor"
                    value={primaryContactName}
                    onChange={(e) => handleContactPersonNameChange(toTitleCase(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Conditional Existing Customer Selector */}
              {editingSite.refFrom === 'Existing Customer' && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '6px',
                  border: '1px solid #BBF7D0'
                }}>
                  <label style={{display: 'block', marginBottom: '4px', color: '#166534', fontWeight: '600', fontSize: '12px'}}>
                    Referred By Customer
                  </label>
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
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1.5px solid #16A34A', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#FFFFFF', fontSize: '13px'
                    }}
                  >
                    <option value="">-- Choose Referring Customer --</option>
                    {existingSites.map((site) => {
                      const label = getSiteRefLabel(site);
                      return (
                        <option key={site.id || site.dbId || site.siteCode} value={label}>
                          {label}
                        </option>
                      );
                    })}
                    <option value="__CUSTOM__">✏️ Custom Customer Name...</option>
                  </select>
                  {(isCustomRefName || (editingSite.refName && !existingSites.some(s => getSiteRefLabel(s) === editingSite.refName || s.customerName === editingSite.refName))) && (
                    <input
                      type="text"
                      placeholder="Type referring customer name..."
                      value={editingSite.refName || ''}
                      onChange={(e) => setEditingSite({ ...editingSite, refName: toTitleCase(e.target.value) })}
                      style={{
                        marginTop: '6px', width: '100%', padding: '7px 10px', borderRadius: '6px',
                        border: '1.5px solid #15803D', boxSizing: 'border-box', outline: 'none',
                        fontSize: '12.5px', backgroundColor: '#FFFFFF'
                      }}
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* Row 4: Mobile Number & Email Address (Side-by-Side) */}
              <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editingSite.phone || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{flex: '1 1 50%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={editingSite.email || ''}
                    onChange={(e) => setEditingSite({...editingSite, email: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Additional Contacts Toggle / Rows */}
              <div style={{marginBottom: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: additionalContacts.length > 0 ? '8px' : '0'}}>
                  <span style={{fontSize: '11.5px', color: '#4B5563', fontWeight: '600'}}>
                    Additional Contacts {additionalContacts.length > 0 ? `(${additionalContacts.length})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAdditionalContact}
                    style={{
                      padding: '3px 8px', fontSize: '11px', background: 'transparent',
                      border: '1px dashed #D1D5DB', borderRadius: '5px',
                      color: 'var(--gold, #A56A30)', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    + Add Person
                  </button>
                </div>

                {additionalContacts.length > 0 && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                    {additionalContacts.map((cp, idx) => (
                      <div key={idx} style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        <input
                          type="text"
                          placeholder="Name / Role"
                          value={cp.name || ''}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'name', toTitleCase(e.target.value))}
                          style={{
                            flex: '1 1 50%', padding: '6px 9px', borderRadius: '5px',
                            border: '1px solid #D1D5DB', fontSize: '12px', outline: 'none'
                          }}
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={cp.phone || ''}
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'phone', e.target.value)}
                          style={{
                            flex: '1 1 50%', padding: '6px 9px', borderRadius: '5px',
                            border: '1px solid #D1D5DB', fontSize: '12px', outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalContact(idx)}
                          style={{
                            width: '26px', height: '26px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#DC2626', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', flexShrink: 0
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Site Address & Timeline */}
            <div>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
              }}>
                Site Address &amp; Timeline
              </div>

              {/* Site Address with Pick on Map button */}
              <div style={{marginBottom: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Site Address *
                  </label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                    {editingSite.latLng && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                        padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600'
                      }}>
                        📍 Pin Set
                        <button
                          type="button"
                          onClick={() => setEditingSite({ ...editingSite, latLng: '' })}
                          style={{
                            background: 'none', border: 'none', color: '#9CA3AF',
                            cursor: 'pointer', padding: '0 2px', fontSize: '10px'
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onOpenMapPicker}
                      style={{
                        padding: '3px 8px', background: 'rgba(165, 106, 48, 0.1)',
                        border: '1px solid rgba(165, 106, 48, 0.35)', borderRadius: '5px',
                        color: 'var(--gold, #A56A30)', cursor: 'pointer', fontSize: '11px',
                        fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-map-location-dot"></i> Pick on Map
                    </button>
                    <button
                      type="button"
                      onClick={onQuickFetch}
                      disabled={quickGeocoding}
                      style={{
                        padding: '3px 7px', background: '#F8FAFC', border: '1px solid #CBD5E1',
                        borderRadius: '5px', color: '#334155', cursor: 'pointer', fontSize: '11px',
                        fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px'
                      }}
                    >
                      {quickGeocoding ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-wand-magic-sparkles" style={{color: 'var(--gold, #A56A30)'}}></i>
                      )}
                      Fetch
                    </button>
                  </div>
                </div>

                <textarea
                  placeholder="Enter complete site address..."
                  rows="3"
                  value={editingSite.fullAddress || ''}
                  onChange={(e) => setEditingSite({...editingSite, fullAddress: toTitleCase(e.target.value)})}
                  style={{
                    width: '100%', padding: '8px 11px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', fontSize: '13px'
                  }}
                  required
                ></textarea>
              </div>

              {geoNotice && (
                <div style={{
                  marginBottom: '10px', padding: '6px 10px', background: '#ECFDF5',
                  border: '1px solid #A7F3D0', borderRadius: '5px', color: '#065F46',
                  fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <i className="fa-solid fa-circle-check"></i> {geoNotice}
                </div>
              )}

              {/* Start Date, Target Date & Progress */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '12px'}}>
                <div style={{flex: '1 1 35%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editingSite.startDate || ''}
                    onChange={(e) => setEditingSite({...editingSite, startDate: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{flex: '1 1 35%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editingSite.targetDate || ''}
                    onChange={(e) => setEditingSite({...editingSite, targetDate: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{flex: '1 1 30%'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingSite.progress !== undefined ? editingSite.progress : 0}
                    onChange={(e) => setEditingSite({...editingSite, progress: Number(e.target.value)})}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{marginBottom: '12px'}}>
                <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Notes
                </label>
                <textarea
                  placeholder="Project notes (optional)..."
                  rows="3"
                  value={editingSite.notes || ''}
                  onChange={(e) => setEditingSite({...editingSite, notes: e.target.value})}
                  style={{
                    width: '100%', padding: '8px 11px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', fontSize: '13px'
                  }}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #E5E7EB', marginTop: '6px'}}>
            <button
              type="button"
              onClick={() => setEditingSite(null)}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500', fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{padding: '8px 20px', fontSize: '13px'}}
            >
              <i className="fa-solid fa-check"></i> Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSiteModal;
