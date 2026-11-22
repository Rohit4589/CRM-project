import React from 'react';
import { getMaterialSpecsForCollection } from '../../data/collectionSpecs';

const EstimateSummaryFooter = ({
  rooms = [],
  designFeePct = 10,
  setDesignFeePct,
  gstPct = 0,
  setGstPct,
  roundOff = 0,
  setRoundOff,
  notes,
  setNotes,
  termsConditions,
  setTermsConditions,
  paymentTerms,
  setPaymentTerms,
  bankDetails,
  setBankDetails,
  furnitureTier = 'Signature Collection',
  includeMaterialSpecs = true,
  setIncludeMaterialSpecs,
  materialSpecs,
  setMaterialSpecs,
  onResetMaterialSpecs
}) => {
  const activeSpecs = materialSpecs || getMaterialSpecsForCollection(furnitureTier);
  const subTotal = rooms.reduce((sum, r) => sum + (Number(r.roomTotal) || 0), 0);
  const designFeeAmount = Math.round((subTotal * Number(designFeePct || 0)) / 100);
  const taxableAmount = subTotal + designFeeAmount;
  const gstAmount = Math.round((taxableAmount * Number(gstPct || 0)) / 100);
  const finalTotal = Math.round(taxableAmount + gstAmount - Number(roundOff || 0));

  const handleSpecItemChange = (idx, field, val) => {
    if (!setMaterialSpecs) return;
    const current = activeSpecs ? JSON.parse(JSON.stringify(activeSpecs)) : { title: `Material Specifications – ${furnitureTier}`, items: [], note: '' };
    const items = [...(current.items || [])];
    if (items[idx]) {
      items[idx][field] = val;
      setMaterialSpecs({ ...current, items });
    }
  };

  const handleAddSpecItem = () => {
    if (!setMaterialSpecs) return;
    const current = activeSpecs ? JSON.parse(JSON.stringify(activeSpecs)) : { title: `Material Specifications – ${furnitureTier}`, items: [], note: '' };
    const items = [...(current.items || [])];
    items.push({
      label: `${items.length + 1}. Item:`,
      text: ''
    });
    setMaterialSpecs({ ...current, items });
  };

  const handleRemoveSpecItem = (idx) => {
    if (!setMaterialSpecs) return;
    const current = activeSpecs ? JSON.parse(JSON.stringify(activeSpecs)) : { title: `Material Specifications – ${furnitureTier}`, items: [], note: '' };
    const items = (current.items || []).filter((_, i) => i !== idx);
    setMaterialSpecs({ ...current, items });
  };

  const handleNoteChange = (val) => {
    if (!setMaterialSpecs) return;
    const current = activeSpecs ? JSON.parse(JSON.stringify(activeSpecs)) : { title: `Material Specifications – ${furnitureTier}`, items: [], note: '' };
    setMaterialSpecs({ ...current, note: val });
  };

  const handleTitleChange = (val) => {
    if (!setMaterialSpecs) return;
    const current = activeSpecs ? JSON.parse(JSON.stringify(activeSpecs)) : { title: `Material Specifications – ${furnitureTier}`, items: [], note: '' };
    setMaterialSpecs({ ...current, title: val });
  };

  const handleResetSpecs = () => {
    if (onResetMaterialSpecs) {
      onResetMaterialSpecs();
    } else if (setMaterialSpecs) {
      setMaterialSpecs(JSON.parse(JSON.stringify(getMaterialSpecsForCollection(furnitureTier))));
    }
  };

  return (
    <div className="grand-totals-card" style={{ marginTop: '20px', background: '#FFFFFF', border: '1px solid #E5D9C5', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 10px rgba(74, 44, 23, 0.04)' }}>
      <div className="grand-totals-grid" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Left: Fixed Company Terms, Payment Rules & Material Specifications Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Header Bar with Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FDFBF7',
            border: '1px solid #EAE0D2',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '13px', color: '#4A2C17' }}></i>
              <span style={{ fontWeight: '800', color: '#4A2C17', fontSize: '12px', letterSpacing: '0.3px' }}>
                Company Policy &amp; Specifications
              </span>
            </div>

            {/* Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#4A2C17' }}>
                Material Specifications:
              </span>
              <label
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                title="Toggle whether Material Specifications should be printed on the quotation"
              >
                <input
                  type="checkbox"
                  checked={includeMaterialSpecs}
                  onChange={(e) => setIncludeMaterialSpecs && setIncludeMaterialSpecs(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <div
                  style={{
                    width: '46px',
                    height: '24px',
                    background: includeMaterialSpecs ? '#4A2C17' : '#D1D5DB',
                    borderRadius: '24px',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      background: '#FFFFFF',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '3px',
                      left: includeMaterialSpecs ? '25px' : '3px',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }}
                  />
                </div>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: includeMaterialSpecs ? '#4A2C17' : '#6B7280',
                    minWidth: '32px'
                  }}
                >
                  {includeMaterialSpecs ? 'YES' : 'NO'}
                </span>
              </label>
            </div>
          </div>

          {/* Material Specifications Block (Shown if toggle is YES) */}
          {includeMaterialSpecs ? (
            <div style={{
              background: '#FDFBF7',
              border: '1px solid #E5D9C5',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                <input
                  type="text"
                  value={activeSpecs.title || `Material Specifications – ${furnitureTier}:`}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: '#4A2C17',
                    border: 'none',
                    borderBottom: '1px dashed #C19A6B',
                    background: 'transparent',
                    outline: 'none',
                    padding: '2px 4px',
                    width: '60%'
                  }}
                  title="Click to edit section title"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleResetSpecs}
                    title="Reset to standard specifications for this collection"
                    style={{
                      fontSize: '10px',
                      background: '#FAF8F5',
                      border: '1px solid #DCD4CA',
                      color: '#6B5A4E',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="fa-solid fa-rotate-left" style={{ fontSize: '9px' }}></i> Reset
                  </button>
                  <span style={{
                    fontSize: '10px',
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '800',
                    letterSpacing: '0.4px',
                    whiteSpace: 'nowrap'
                  }}>
                    {furnitureTier}
                  </span>
                </div>
              </div>

              {/* Editable Material Items Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', fontSize: '10.5px' }}>
                {(activeSpecs.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EFE8DE',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <input
                        type="text"
                        value={it.label || ''}
                        onChange={(e) => handleSpecItemChange(idx, 'label', e.target.value)}
                        placeholder="e.g. 1. Plywood:"
                        style={{
                          fontWeight: '800',
                          color: '#4A2C17',
                          fontSize: '11px',
                          border: 'none',
                          borderBottom: '1px solid transparent',
                          outline: 'none',
                          background: 'transparent',
                          width: '100%',
                          padding: '1px 0'
                        }}
                        onFocus={(e) => e.target.style.borderBottomColor = '#C19A6B'}
                        onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                      />
                      {(activeSpecs.items || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecItem(idx)}
                          title="Remove specification item"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0 2px',
                            lineHeight: '1'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#DC2626'}
                          onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    <textarea
                      value={it.text || ''}
                      onChange={(e) => handleSpecItemChange(idx, 'text', e.target.value)}
                      placeholder="Specification details..."
                      rows={2}
                      style={{
                        width: '100%',
                        fontSize: '10.5px',
                        color: '#374151',
                        border: '1px solid #EAE0D2',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.35',
                        background: '#FAF8F5',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#C19A6B'; e.target.style.background = '#FFFFFF'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#EAE0D2'; e.target.style.background = '#FAF8F5'; }}
                    />
                  </div>
                ))}
              </div>

              {/* Add Specification Item Button */}
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={handleAddSpecItem}
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#4A2C17',
                    background: '#FDFBF7',
                    border: '1px dashed #C19A6B',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#F5EBE1'}
                  onMouseLeave={(e) => e.target.style.background = '#FDFBF7'}
                >
                  <i className="fa-solid fa-plus" style={{ fontSize: '9px' }}></i> Add Specification
                </button>
              </div>

              {/* Note / Exclusions Field */}
              <div style={{
                marginTop: '8px',
                background: '#FAF8F5',
                borderRadius: '6px',
                padding: '6px 8px',
                border: '1px solid #EADDC9'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#4A2C17', marginBottom: '3px' }}>
                  Note / Exclusions:
                </div>
                <textarea
                  value={activeSpecs.note || ''}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Note or excluded items (e.g. Handles, soft-close hinges...)"
                  rows={2}
                  style={{
                    width: '100%',
                    fontSize: '10px',
                    color: '#4B5563',
                    border: '1px solid #EAE0D2',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.35',
                    background: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#C19A6B'}
                  onBlur={(e) => e.target.style.borderColor = '#EAE0D2'}
                />
              </div>
            </div>
          ) : (
            <div style={{
              background: '#F9FAFB',
              border: '1px dashed #D1D5DB',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '11px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fa-solid fa-eye-slash" style={{ fontSize: '14px', color: '#9CA3AF' }}></i>
              <span>
                <strong>Material Specifications are excluded</strong> for this estimate. They will not be printed on the quotation sheet.
              </span>
            </div>
          )}

          {/* Standard Terms & Payment Terms Side-by-Side Cards (Editable) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '12px' }}>
            {/* Standard Terms & Conditions */}
            <div style={{
              background: '#FDFBF7',
              border: '1px solid #E5D9C5',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-file-contract" style={{ fontSize: '11px', color: '#4A2C17' }}></i>
                  <strong style={{ fontSize: '11px', color: '#4A2C17', fontWeight: '800' }}>
                    Standard Terms &amp; Conditions
                  </strong>
                </div>
                <span style={{ fontSize: '9.5px', color: '#8A5D3B', fontWeight: '600' }}>
                  Editable
                </span>
              </div>
              <textarea
                value={termsConditions}
                onChange={(e) => setTermsConditions && setTermsConditions(e.target.value)}
                placeholder="Enter Terms & Conditions..."
                rows={6}
                style={{
                  color: '#2B2520',
                  fontSize: '10.5px',
                  lineHeight: '1.45',
                  background: '#FFFFFF',
                  border: '1px solid #EAE0D2',
                  borderRadius: '5px',
                  padding: '6px 8px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  minHeight: '125px',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C19A6B'}
                onBlur={(e) => e.target.style.borderColor = '#EAE0D2'}
              />
            </div>

            {/* Fixed Mode of Payment */}
            <div style={{
              background: '#FDFBF7',
              border: '1px solid #E5D9C5',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-credit-card" style={{ fontSize: '11px', color: '#4A2C17' }}></i>
                  <strong style={{ fontSize: '11px', color: '#4A2C17', fontWeight: '800' }}>
                    Fixed Mode of Payment
                  </strong>
                </div>
                <span style={{ fontSize: '9.5px', color: '#8A5D3B', fontWeight: '600' }}>
                  Editable
                </span>
              </div>
              <textarea
                value={paymentTerms}
                onChange={(e) => setPaymentTerms && setPaymentTerms(e.target.value)}
                placeholder="Enter Payment Terms..."
                rows={6}
                style={{
                  color: '#2B2520',
                  fontSize: '10.5px',
                  lineHeight: '1.45',
                  background: '#FFFFFF',
                  border: '1px solid #EAE0D2',
                  borderRadius: '5px',
                  padding: '6px 8px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  minHeight: '125px',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C19A6B'}
                onBlur={(e) => e.target.style.borderColor = '#EAE0D2'}
              />
            </div>
          </div>
        </div>

        {/* Right: Calculations Summary Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5D9C5',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(74, 44, 23, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '800',
              color: '#4A2C17',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1.5px solid #EAE0D2',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-receipt" style={{ color: '#4A2C17' }}></i>
              Billing &amp; Tax Calculation
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="totals-row">
                <span style={{ fontWeight: '600' }}>Items Sub Total</span>
                <strong style={{ fontSize: '15px', color: '#1F2937' }}>₹{subTotal.toLocaleString('en-IN')}</strong>
              </div>

              <div className="totals-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Design &amp; Consulting Fee</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={designFeePct}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const cleaned = String(e.target.value).replace(/^0+(?=\d)/, '');
                      e.target.value = cleaned;
                      setDesignFeePct(cleaned);
                    }}
                    style={{
                      width: '54px',
                      padding: '3px 6px',
                      fontSize: '12px',
                      borderRadius: '5px',
                      border: '1px solid #DCD4CA',
                      textAlign: 'center',
                      fontWeight: '700',
                      color: '#4A2C17'
                    }}
                  />
                  <span style={{ fontWeight: '600' }}>%</span>
                </span>
                <span style={{ fontWeight: '700', color: '#4A2C17' }}>+ ₹{designFeeAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="totals-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>GST:</span>
                  <select
                    value={Number(gstPct) || 0}
                    onChange={(e) => setGstPct(Number(e.target.value))}
                    style={{
                      padding: '3px 8px',
                      fontSize: '12px',
                      borderRadius: '5px',
                      border: '1px solid #DCD4CA',
                      fontWeight: '600',
                      color: '#4A2C17',
                      background: '#FAF8F5'
                    }}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% Extra</option>
                    <option value={12}>12% Extra</option>
                    <option value={18}>18% Extra</option>
                    <option value={28}>28% Extra</option>
                    {gstPct !== undefined && gstPct !== null && ![0, 5, 12, 18, 28].includes(Number(gstPct)) && (
                      <option value={Number(gstPct)}>{Number(gstPct)}% Extra</option>
                    )}
                  </select>
                </span>
                <span style={{ fontWeight: '700', color: '#4A2C17' }}>+ ₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="totals-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Round Off / Discount</span>
                  <input
                    type="number"
                    value={roundOff}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const cleaned = String(e.target.value).replace(/^0+(?=\d)/, '');
                      e.target.value = cleaned;
                      setRoundOff(cleaned);
                    }}
                    style={{
                      width: '74px',
                      padding: '3px 6px',
                      fontSize: '12px',
                      borderRadius: '5px',
                      border: '1px solid #DCD4CA',
                      textAlign: 'right',
                      fontWeight: '700',
                      color: '#4A2C17'
                    }}
                  />
                </span>
                <span style={{ fontWeight: '700', color: '#B91C1C' }}>- ₹{(Number(roundOff) || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Final Total Highlight Box */}
          <div style={{
            marginTop: '16px',
            background: '#4A2C17',
            color: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(74, 44, 23, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-coins" style={{ color: '#F3E8DC', fontSize: '15px' }}></i>
              <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Final Total:
              </span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px', color: '#FFFFFF' }}>
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EstimateSummaryFooter;
