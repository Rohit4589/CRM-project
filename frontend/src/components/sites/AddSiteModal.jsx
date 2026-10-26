import React, { useState, useEffect } from 'react';
import { toTitleCase } from '../../utils/autoCapitalize';
import { handleFormKeyDown } from '../../utils/formKeyboardNav';

const STANDARD_REF_SOURCES = [
  'Existing Customer',
  'Referred by Existing Customer',
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

const AddSiteModal = ({
  show,
  onClose,
  formData,
  setFormData,
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
    if (show) {
      setIsCustomRefFrom(formData.refFrom && !STANDARD_REF_SOURCES.includes(formData.refFrom));
      setIsCustomRefName(
        formData.refName && !existingSites.some(s => getSiteRefLabel(s) === formData.refName || s.customerName === formData.refName)
      );
    }
  }, [show]);

  if (!show) return null;

  // Primary Contact Person helper
  const primaryContactName = (formData.contactPersons && formData.contactPersons.length > 0)
    ? (formData.contactPersons[0].name || '')
    : (formData.refFrom !== 'Existing Customer' && formData.refFrom !== 'Referred by Existing Customer' ? (formData.refName || '') : '');

  const handleContactPersonNameChange = (name) => {
    const currentPersons = Array.isArray(formData.contactPersons) ? [...formData.contactPersons] : [];
    if (currentPersons.length > 0) {
      currentPersons[0] = { ...currentPersons[0], name, phone: currentPersons[0].phone || formData.phone || '' };
    } else {
      currentPersons.push({ name, phone: formData.phone || '' });
    }
    const updates = { ...formData, contactPersons: currentPersons };
    if (formData.refFrom !== 'Existing Customer' && formData.refFrom !== 'Referred by Existing Customer') {
      updates.refName = name;
    }
    setFormData(updates);
  };


  const handlePhoneChange = (phone) => {
    const currentPersons = Array.isArray(formData.contactPersons) ? [...formData.contactPersons] : [];
    if (currentPersons.length > 0) {
      currentPersons[0] = { ...currentPersons[0], phone };
    }
    setFormData({ ...formData, phone, contactPersons: currentPersons });
  };

  // Additional Contacts (index >= 1)
  const additionalContacts = Array.isArray(formData.contactPersons) ? formData.contactPersons.slice(1) : [];

  const handleAddAdditionalContact = () => {
    const current = Array.isArray(formData.contactPersons) ? [...formData.contactPersons] : [];
    if (current.length === 0) {
      current.push({ name: primaryContactName, phone: formData.phone || '' });
    }
    current.push({ name: '', phone: '' });
    setFormData({ ...formData, contactPersons: current });
  };

  const handleUpdateAdditionalContact = (addIdx, field, value) => {
    const realIdx = addIdx + 1;
    const current = [...formData.contactPersons];
    current[realIdx] = { ...current[realIdx], [field]: value };
    setFormData({ ...formData, contactPersons: current });
  };

  const handleRemoveAdditionalContact = (addIdx) => {
    const realIdx = addIdx + 1;
    const current = formData.contactPersons.filter((_, i) => i !== realIdx);
    setFormData({ ...formData, contactPersons: current });
  };

  // Dynamic Folder Preview
  const orderDisplay = formData.siteCode
    ? (parseInt(formData.siteCode, 10) < 1000 ? String(parseInt(formData.siteCode, 10)).padStart(3, '0') : formData.siteCode)
    : '___';
  const customerDisplay = formData.customerName?.trim() || '';
  const refDisplay = formData.location?.trim() || '';
  const folderPreview = [orderDisplay, customerDisplay, refDisplay].filter(Boolean).join(' - ');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1250,
      backdropFilter: 'blur(3px)', padding: '8px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        width: '100%', maxWidth: '920px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '94vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAF8F5'
        }}>
          <h2 style={{margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827'}}>
            Add New Customer / Site
          </h2>
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

        <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown} style={{padding: '14px 14px', overflowY: 'auto', overflowX: 'hidden', flex: 1, boxSizing: 'border-box', width: '100%'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '16px',
            alignItems: 'start',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* LEFT COLUMN: Customer & Order */}
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
              }}>
                Customer &amp; Order
              </div>

              {/* Row 1: Order Number & Status */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Order Number *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="e.g. 246"
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
                      padding: '8px 10px',
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

                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
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
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '8px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pranjal Spaces"
                    value={formData.customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        customerName: val,
                        refName: prev.refFrom === 'Existing Customer' ? val : prev.refName
                      }));
                    }}
                    onBlur={() => {
                      setFormData(prev => {
                        const formatted = toTitleCase(prev.customerName || '');
                        return {
                          ...prev,
                          customerName: formatted,
                          refName: prev.refFrom === 'Existing Customer' ? formatted : prev.refName
                        };
                      });
                    }}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px', textTransform: 'capitalize'
                    }}
                    required
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Reference Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ravet / Flat 402"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    onBlur={() => setFormData(prev => ({...prev, location: toTitleCase(prev.location || '')}))}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px', textTransform: 'capitalize'
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
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Customer Ref From
                  </label>
                  <select
                    value={
                      isCustomRefFrom ? '__CUSTOM__' :
                      (!formData.refFrom ? '' : (STANDARD_REF_SOURCES.includes(formData.refFrom) ? formData.refFrom : '__CUSTOM__'))
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__CUSTOM__') {
                        setIsCustomRefFrom(true);
                        setFormData({ ...formData, refFrom: '' });
                      } else {
                        setIsCustomRefFrom(false);
                        const updates = { ...formData, refFrom: val };
                        if (val === 'Existing Customer') {
                          updates.refName = formData.customerName || '';
                        }
                        setFormData(updates);
                      }
                    }}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff', fontSize: '13px'
                    }}
                  >
                    <option value="">-- Referral Source --</option>
                    <option value="Existing Customer">Existing Customer (Repeat Order)</option>
                    <option value="Referred by Existing Customer">Referred by Existing Customer</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Google">Google</option>
                    <option value="Instagram / Social Media">Instagram / Social Media</option>
                    <option value="Architect / Contractor">Architect / Contractor</option>
                    <option value="Friends & Family">Friends & Family</option>
                    <option value="Just Dial">Just Dial</option>
                    <option value="Other">Other</option>
                    <option value="__CUSTOM__">✏️ Custom...</option>
                  </select>
                  {(isCustomRefFrom || (formData.refFrom && !STANDARD_REF_SOURCES.includes(formData.refFrom))) && (
                    <input
                      type="text"
                      placeholder="Type custom source..."
                      value={formData.refFrom || ''}
                      onChange={(e) => setFormData({ ...formData, refFrom: e.target.value })}
                      onBlur={() => setFormData(prev => ({ ...prev, refFrom: toTitleCase(prev.refFrom || '') }))}
                      style={{
                        marginTop: '5px', width: '100%', padding: '7px 10px', borderRadius: '6px',
                        border: '1.5px solid var(--gold, #A56A30)', boxSizing: 'border-box', outline: 'none',
                        fontSize: '12.5px', backgroundColor: '#FFFDF7', textTransform: 'capitalize'
                      }}
                      autoFocus
                    />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Site Supervisor"
                    value={primaryContactName}
                    onChange={(e) => handleContactPersonNameChange(e.target.value)}
                    onBlur={() => handleContactPersonNameChange(toTitleCase(primaryContactName || ''))}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px', textTransform: 'capitalize'
                    }}
                  />
                </div>
              </div>


              {/* 2. Referred by Existing Customer */}
              {formData.refFrom === 'Referred by Existing Customer' && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '6px',
                  border: '1.5px solid #FCD34D'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ display: 'block', color: '#92400E', fontWeight: '700', fontSize: '12px' }}>
                      <i className="fa-solid fa-bullhorn" style={{ marginRight: '6px' }}></i>
                      Who Referred This Customer?
                    </label>
                    <span style={{ fontSize: '10px', color: '#B45309', fontWeight: '700', background: '#FDE68A', padding: '1px 6px', borderRadius: '4px' }}>
                      Referral Source
                    </span>
                  </div>
                  <select
                    value={
                      isCustomRefName ? '__CUSTOM__' :
                      (() => {
                        const match = existingSites.find(s => getSiteRefLabel(s) === formData.refName || s.customerName === formData.refName);
                        return match ? getSiteRefLabel(match) : (formData.refName ? '__CUSTOM__' : '');
                      })()
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__CUSTOM__') {
                        setIsCustomRefName(true);
                        setFormData({ ...formData, refName: '' });
                      } else {
                        setIsCustomRefName(false);
                        const found = existingSites.find(s => getSiteRefLabel(s) === val);
                        setFormData({ ...formData, refName: found ? found.customerName : val });
                      }
                    }}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: '6px',
                      border: '1.5px solid #D97706', boxSizing: 'border-box', outline: 'none',
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
                  {(isCustomRefName || (formData.refName && !existingSites.some(s => getSiteRefLabel(s) === formData.refName || s.customerName === formData.refName))) && (
                    <input
                      type="text"
                      placeholder="Type referring customer name..."
                      value={formData.refName || ''}
                      onChange={(e) => setFormData({ ...formData, refName: e.target.value })}
                      onBlur={() => setFormData(prev => ({ ...prev, refName: toTitleCase(prev.refName || '') }))}
                      style={{
                        marginTop: '6px', width: '100%', padding: '7px 10px', borderRadius: '6px',
                        border: '1.5px solid #D97706', boxSizing: 'border-box', outline: 'none',
                        fontSize: '12.5px', backgroundColor: '#FFFFFF', textTransform: 'capitalize'
                      }}
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* Row 4: Mobile Number & Email Address (Side-by-Side) */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
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
                          onChange={(e) => handleUpdateAdditionalContact(idx, 'name', e.target.value)}
                          onBlur={() => handleUpdateAdditionalContact(idx, 'name', toTitleCase(cp.name || ''))}
                          style={{
                            flex: '1 1 50%', padding: '6px 9px', borderRadius: '5px',
                            border: '1px solid #D1D5DB', fontSize: '12px', outline: 'none',
                            textTransform: 'capitalize'
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
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--gold, #A56A30)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
              }}>
                Site Address &amp; Timeline
              </div>

              {/* Site Address with Pick on Map button */}
              <div style={{marginBottom: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Site Address *
                  </label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap'}}>
                    {formData.latLng && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                        padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600'
                      }}>
                        📍 Pin Set
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, latLng: '' })}
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
                        fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px',
                        flexShrink: 0
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
                        fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px',
                        flexShrink: 0
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
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
                  onBlur={() => setFormData(prev => ({...prev, fullAddress: toTitleCase(prev.fullAddress || '')}))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', fontSize: '13px',
                    textTransform: 'capitalize'
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

              {/* Start Date & Target Date */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 8px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    style={{
                      width: '100%', padding: '8px 8px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '12px'
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
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
              onClick={onClose}
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
              <i className="fa-solid fa-check"></i> Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSiteModal;
