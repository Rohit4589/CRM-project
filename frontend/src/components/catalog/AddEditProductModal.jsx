import React, { useState, useEffect } from 'react';

const SUGGESTED_DESCRIPTIONS = [
  'Providing Alternate Ply, Inside Egg white Laminate & External Regular Colour laminate, With Premium Quality Hardware.',
  'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter, With Premium Quality Hardware.',
  'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter/ Profile shutter, With Premium Quality Hardware.',
  'Hettich/Hafele Brand Tandem with base, back sheet and verticle support',
  'Providing Commercial Ply with veneer polish finish & soft-close German hardware.',
  'ALL SET',
  'APPROX'
];

const AddEditProductModal = ({
  product,
  categories = [],
  defaultCategory = '',
  onClose,
  onSave,
  saving = false
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('Sq.Ft.');
  const [modernRate, setModernRate] = useState('');
  const [luxuryModernRate, setLuxuryModernRate] = useState('');
  const [luxuryRate, setLuxuryRate] = useState('');
  const [defaultWidth, setDefaultWidth] = useState('');
  const [defaultHeight, setDefaultHeight] = useState('');
  const [defaultDescription, setDefaultDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategoryId(product.category_id || (categories.find(c => c.name.toUpperCase() === (product.category_name || '').toUpperCase())?.id || ''));
      setUnit(product.unit || 'Sq.Ft.');
      setModernRate(product.modern_rate !== undefined ? String(product.modern_rate) : '');
      setLuxuryModernRate(product.luxury_modern_rate !== undefined ? String(product.luxury_modern_rate) : '');
      setLuxuryRate(product.luxury_rate !== undefined ? String(product.luxury_rate) : '');
      setDefaultWidth(product.default_width ? String(product.default_width) : '');
      setDefaultHeight(product.default_height ? String(product.default_height) : '');
      setDefaultDescription(product.default_description || '');
    } else {
      setName('');
      // Default to passed category or first in list
      const initialCat = defaultCategory
        ? categories.find(c => c.name.toUpperCase() === defaultCategory.toUpperCase())
        : categories[0];
      setCategoryId(initialCat?.id || '');
      setUnit('Sq.Ft.');
      setModernRate('');
      setLuxuryModernRate('');
      setLuxuryRate('');
      setDefaultWidth('');
      setDefaultHeight('');
      setDefaultDescription(SUGGESTED_DESCRIPTIONS[0]);
    }
    setError('');
  }, [product, defaultCategory, categories]);

  // Preview area calculation in sq.ft from mm
  const previewArea = (Number(defaultWidth) > 0 && Number(defaultHeight) > 0)
    ? Math.round((Number(defaultWidth) * Number(defaultHeight)) / 92903.04)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name');
      return;
    }

    const selectedCat = categories.find(c => String(c.id) === String(categoryId));

    onSave({
      ...(product ? { id: product.id } : {}),
      name: name.trim().toUpperCase(),
      category_id: selectedCat?.id || null,
      category_name: selectedCat?.name || 'LIVING ROOM',
      unit: unit || 'Sq.Ft.',
      modern_rate: Number(modernRate) || 0,
      luxury_modern_rate: Number(luxuryModernRate) || 0,
      luxury_rate: Number(luxuryRate) || 0,
      default_width: Number(defaultWidth) > 0 ? Number(defaultWidth) : null,
      default_height: Number(defaultHeight) > 0 ? Number(defaultHeight) : null,
      default_description: defaultDescription.trim()
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(30, 24, 20, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1150,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(43, 37, 32, 0.18)',
          border: '1px solid #EAE4DD',
          animation: 'fadeInScale 0.18s ease-out',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2B2520' }}>
              {product ? 'Edit Product & Rates' : 'Add New Furniture Product'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#8C827A' }}>
              Set standard calculation units, dimensions, and 3-tier rates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#8C827A',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#B91C1C',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Product Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. WARDROBE, TV UNIT, BED"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                Room / Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.project_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Unit & Dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                Unit Type *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Sq.Ft.">Sq.Ft. (Area)</option>
                <option value="SET">SET / Nos</option>
                <option value="RFT.">RFT. (Running Ft)</option>
                <option value="APPROX">APPROX (Lump Sum)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                Default Width (mm)
              </label>
              <input
                type="number"
                placeholder="e.g. 1800"
                value={defaultWidth}
                onChange={(e) => setDefaultWidth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                Default Height (mm)
              </label>
              <input
                type="number"
                placeholder="e.g. 2100"
                value={defaultHeight}
                onChange={(e) => setDefaultHeight(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {previewArea !== null && (
            <div style={{
              fontSize: '11.5px',
              color: '#4A2C17',
              background: '#F6EFE9',
              padding: '6px 10px',
              borderRadius: '6px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-calculator"></i>
              <span>Standard calculated area: <strong>{previewArea} Sq.Ft.</strong> (from {defaultWidth}mm × {defaultHeight}mm)</span>
            </div>
          )}

          {/* Section: 3-Tier Rates */}
          <div style={{
            background: '#FAF8F5',
            border: '1px solid #EAE4DD',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '14px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#4A2C17', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Standard 3-Tier Rates ({unit})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#0369A1', marginBottom: '4px' }}>
                  Modern Rate (₹)
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={modernRate}
                  onChange={(e) => setModernRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#92400E', marginBottom: '4px' }}>
                  Luxury-Modern (₹)
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={luxuryModernRate}
                  onChange={(e) => setLuxuryModernRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#6B21A8', marginBottom: '4px' }}>
                  Luxury Rate (₹)
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={luxuryRate}
                  onChange={(e) => setLuxuryRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section: Material Description / Specification */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
              Default Material Specification
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Providing Alternate Ply, Inside Egg white Laminate & External Regular Colour laminate..."
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #DCD4CA',
                borderRadius: '8px',
                fontSize: '12.5px',
                background: '#FAF8F5',
                color: '#2B2520',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />

            {/* Quick Prefill Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#8C827A', alignSelf: 'center' }}>Quick prefill:</span>
              {SUGGESTED_DESCRIPTIONS.slice(0, 3).map((desc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDefaultDescription(desc)}
                  style={{
                    background: '#F0EBE4',
                    border: '1px solid #DCD4CA',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10.5px',
                    color: '#4A3E36',
                    cursor: 'pointer'
                  }}
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #EAE4DD' }}>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #DCD4CA',
                background: '#FAF8F5',
                color: '#5C5248',
                fontSize: '13px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#4A2C17',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(74, 44, 23, 0.25)'
              }}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>{product ? 'Update Product' : 'Add Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProductModal;
