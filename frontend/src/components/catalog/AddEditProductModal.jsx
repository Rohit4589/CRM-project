import React, { useState, useEffect, useMemo } from 'react';

const STANDARD_PRODUCT_NAMES = [
  'BED',
  'WARDROBE',
  'T V UNIT',
  'SHOES RACK',
  'TEMPLE',
  'SAFETY DOOR',
  'SWING',
  'LOFT ABOVE WARDROBE',
  'MATTRESS',
  'STUDY TABLE WITH BOOKS STORAGE',
  'BED WALL PANNELING',
  'SIDE TABLE',
  'SIDE TABLE WITH DRESSING',
  'TANDEM DRAWERS',
  'OTTA SHUTTER',
  'OVERHEAD UNIT',
  'LOFT ABOVE OVERHEAD UNIT',
  'TALL UNIT',
  'ACCESSORIES',
  'CROCKARY UNIT',
  'DECORATIVE PARTITION',
  'FRAME COVERING',
  'RECEPTION DESK',
  'BACKDROP LOGO WALL',
  'CONFERENCE TABLE',
  'EXECUTIVE CABIN TABLE',
  'CABIN BACK CREDENZA',
  'WORKSTATION PARTITION',
  'GLASS PARTITION WITH FILM',
  'FLOOR COVERING',
  'DEBRIS',
  'PASSAGE JAALI',
  'BASIN SHUTTER',
  'TEMPLE JAALI',
  'CURTAIN FITTING',
  'MISCELLANEOUS EXP.',
  'GYPSUM FALSE CEILING',
  'ELECTRIC WORK',
  'PAINTING WORK'
];

const COLLECTION_PRESETS = {
  essential: [
    {
      label: 'Commercial Ply + Liner',
      text: 'Providing Alternate Commercial Ply, Inside Egg white Laminate & External Regular Colour laminate, With Standard Quality Hardware.'
    },
    {
      label: 'High-Gloss Laminate',
      text: 'Providing Commercial Ply with 0.8mm inside liner & 1mm external high-gloss laminate.'
    },
    { label: 'ALL SET', text: 'ALL SET' },
    { label: 'APPROX', text: 'APPROX' }
  ],
  signature: [
    {
      label: 'BWR Ply + Acrylic',
      text: 'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter / Profile shutter, With Premium Soft-Close Quality Hardware.'
    },
    {
      label: 'Hettich/Hafele Tandem',
      text: 'Hettich/Hafele Brand Tandem with base, back sheet and vertical support.'
    },
    { label: 'ALL SET', text: 'ALL SET' },
    { label: 'APPROX', text: 'APPROX' }
  ],
  elite: [
    {
      label: 'Veneer Polish / PU',
      text: 'Providing Marine HDHMR / BWP Ply, Inside Egg white Laminate & External Veneer Polish / PU Finish, With German Soft-Close Fittings (Hettich/Hafele).'
    },
    {
      label: 'German Concealed Fittings',
      text: 'Providing Commercial/Marine Ply with natural veneer polish finish & soft-close German concealed hardware.'
    },
    { label: 'ALL SET', text: 'ALL SET' },
    { label: 'APPROX', text: 'APPROX' }
  ]
};

const AddEditProductModal = ({
  product,
  categories = [],
  existingProducts = [],
  defaultCategory = '',
  onClose,
  onSave,
  onAddCategory,
  saving = false
}) => {
  const [name, setName] = useState('');
  const [isCustomProductName, setIsCustomProductName] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('Sq.Ft.');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [defaultWidth, setDefaultWidth] = useState('');
  const [defaultHeight, setDefaultHeight] = useState('');

  // Inline Quick Add Room state
  const [showAddRoomInput, setShowAddRoomInput] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  // 3-Collection Rates
  const [essentialRate, setEssentialRate] = useState('');
  const [signatureRate, setSignatureRate] = useState('');
  const [eliteRate, setEliteRate] = useState('');

  // 3-Collection Descriptions
  const [essentialDesc, setEssentialDesc] = useState('');
  const [signatureDesc, setSignatureDesc] = useState('');
  const [eliteDesc, setEliteDesc] = useState('');

  // Active collection tab in modal: 'essential' | 'signature' | 'elite' | 'all'
  const [activeTab, setActiveTab] = useState('signature');
  const [error, setError] = useState('');

  // Combine standard and existing product names without duplicates
  const allProductOptions = useMemo(() => {
    const set = new Set(STANDARD_PRODUCT_NAMES);
    (existingProducts || []).forEach(p => {
      if (p.name && p.name.trim()) set.add(p.name.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [existingProducts]);

  useEffect(() => {
    if (product) {
      const pName = (product.name || '').trim().toUpperCase();
      setName(pName);
      setIsCustomProductName(!allProductOptions.includes(pName));

      setCategoryId(product.category_id || (categories.find(c => c.name.toUpperCase() === (product.category_name || '').toUpperCase())?.id || ''));
      const pUnit = product.unit || 'Sq.Ft.';
      setUnit(pUnit);
      setIsCustomUnit(!['Sq.Ft.', 'SET', 'Nos', 'Pcs', 'RFT.', 'APPROX', 'Meter', 'Pair', 'Sheet'].includes(pUnit));
      setDefaultWidth(product.default_width ? String(product.default_width) : '');
      setDefaultHeight(product.default_height ? String(product.default_height) : '');

      setEssentialRate(
        product.essential_rate !== undefined ? String(product.essential_rate) :
        product.modern_rate !== undefined ? String(product.modern_rate) : ''
      );
      setSignatureRate(
        product.signature_rate !== undefined ? String(product.signature_rate) :
        product.luxury_modern_rate !== undefined ? String(product.luxury_modern_rate) : ''
      );
      setEliteRate(
        product.elite_rate !== undefined ? String(product.elite_rate) :
        product.luxury_rate !== undefined ? String(product.luxury_rate) : ''
      );

      setEssentialDesc(
        product.essential_description ||
        product.default_description ||
        COLLECTION_PRESETS.essential[0].text
      );
      setSignatureDesc(
        product.signature_description ||
        product.default_description ||
        COLLECTION_PRESETS.signature[0].text
      );
      setEliteDesc(
        product.elite_description ||
        product.default_description ||
        COLLECTION_PRESETS.elite[0].text
      );
    } else {
      const defaultProd = allProductOptions[0] || 'BED';
      setName(defaultProd);
      setIsCustomProductName(false);

      const initialCat = defaultCategory
        ? categories.find(c => c.name.toUpperCase() === defaultCategory.toUpperCase())
        : categories[0];
      setCategoryId(initialCat?.id || '');
      setUnit('Sq.Ft.');
      setIsCustomUnit(false);
      setDefaultWidth('');
      setDefaultHeight('');
      setEssentialRate('');
      setSignatureRate('');
      setEliteRate('');
      setEssentialDesc(COLLECTION_PRESETS.essential[0].text);
      setSignatureDesc(COLLECTION_PRESETS.signature[0].text);
      setEliteDesc(COLLECTION_PRESETS.elite[0].text);
    }
    setError('');
  }, [product, defaultCategory, categories, allProductOptions]);

  // Keyboard navigation & Escape key support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;

      const target = e.target;
      if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

      if (target.tagName === 'TEXTAREA') {
        if (e.key === 'ArrowUp' && target.selectionStart > 0) return;
        if (e.key === 'ArrowDown' && target.selectionEnd < target.value.length) return;
      }

      const modalEl = target.closest('.modal-content, .modal-body, form');
      if (!modalEl) return;

      const inputs = Array.from(modalEl.querySelectorAll(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      ));
      const idx = inputs.indexOf(target);
      if (idx === -1) return;

      if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        if (target.tagName === 'TEXTAREA' && e.key === 'Enter') return; // allow newline in textarea
        e.preventDefault();
        if (idx < inputs.length - 1) {
          inputs[idx + 1].focus();
          inputs[idx + 1].select?.();
        }
      } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault();
        if (idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].select?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // When user selects a product from the dropdown
  const handleProductSelectChange = (val) => {
    if (val === '__CUSTOM_NEW__') {
      setIsCustomProductName(true);
      setName('');
      return;
    }
    setIsCustomProductName(false);
    setName(val);

    // Auto-match default dimensions and unit from existing product if available
    const existing = (existingProducts || []).find(p => (p.name || '').toUpperCase() === val.toUpperCase());
    if (existing) {
      if (existing.unit) setUnit(existing.unit);
      if (existing.default_width) setDefaultWidth(String(existing.default_width));
      if (existing.default_height) setDefaultHeight(String(existing.default_height));
      if (existing.essential_rate && !essentialRate) setEssentialRate(String(existing.essential_rate));
      if (existing.signature_rate && !signatureRate) setSignatureRate(String(existing.signature_rate));
      if (existing.elite_rate && !eliteRate) setEliteRate(String(existing.elite_rate));
      if (existing.essential_description && !essentialDesc) setEssentialDesc(existing.essential_description);
      if (existing.signature_description && !signatureDesc) setSignatureDesc(existing.signature_description);
      if (existing.elite_description && !eliteDesc) setEliteDesc(existing.elite_description);
    }
  };

  // Inline Quick Add Room Category
  const handleCreateNewRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    if (!onAddCategory) {
      alert('Room addition is not configured');
      return;
    }

    try {
      setAddingRoom(true);
      const cleanName = newRoomName.trim().toUpperCase();
      const created = await onAddCategory({
        name: cleanName,
        project_type: 'Residential',
        display_order: categories.length + 1
      });

      if (created && created.id) {
        setCategoryId(created.id);
      }
      setNewRoomName('');
      setShowAddRoomInput(false);
    } catch (err) {
      console.error('Error adding room inline:', err);
    } finally {
      setAddingRoom(false);
    }
  };

  // Preview area calculation in sq.ft from mm with 0.5 step roundup
  const previewArea = (Number(defaultWidth) > 0 && Number(defaultHeight) > 0)
    ? Math.ceil(((Number(defaultWidth) * Number(defaultHeight)) / 92903) * 2) / 2
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please select or enter a product name');
      return;
    }

    onSave({
      ...(product ? { id: product.id } : {}),
      name: name.trim().toUpperCase(),
      category_id: product?.category_id || null,
      category_name: product?.category_name || '',
      unit: unit || 'Sq.Ft.',
      default_width: Number(defaultWidth) > 0 ? Number(defaultWidth) : null,
      default_height: Number(defaultHeight) > 0 ? Number(defaultHeight) : null,

      // 3 Collection Rates
      essential_rate: Number(essentialRate) || 0,
      signature_rate: Number(signatureRate) || 0,
      elite_rate: Number(eliteRate) || 0,

      // 3 Collection Descriptions
      essential_description: (essentialDesc || '').trim(),
      signature_description: (signatureDesc || '').trim(),
      elite_description: (eliteDesc || '').trim(),

      // Backward compatibility aliases
      modern_rate: Number(essentialRate) || 0,
      luxury_modern_rate: Number(signatureRate) || 0,
      luxury_rate: Number(eliteRate) || 0,
      default_description: (signatureDesc || essentialDesc || '').trim()
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
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(43, 37, 32, 0.22)',
          border: '1px solid #EAE4DD',
          animation: 'fadeInScale 0.18s ease-out',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2B2520' }}>
              {product ? 'Edit Product' : 'Add Furniture Product'}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8C827A' }}>
              Set dimensions and collection rates &amp; specifications.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F5EFE8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              color: '#4A2C17',
              cursor: 'pointer',
              padding: '6px 10px',
              lineHeight: 1
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
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Product Name */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A3E36' }}>
                Product Name *
              </label>
              {isCustomProductName && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomProductName(false);
                    setName(allProductOptions[0] || 'BED');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4A2C17',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '600',
                    padding: 0
                  }}
                >
                  ← List
                </button>
              )}
            </div>

            {isCustomProductName ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="TYPE PRODUCT NAME..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid #4A2C17',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#2B2520',
                    textTransform: 'uppercase',
                    outline: 'none',
                    background: '#FFFDF9',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ) : (
              <select
                value={name}
                onChange={(e) => handleProductSelectChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#2B2520',
                  background: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <optgroup label="Standard Products">
                  {allProductOptions.map((pName) => (
                    <option key={pName} value={pName}>
                      {pName}
                    </option>
                  ))}
                </optgroup>
                <option value="__CUSTOM_NEW__" style={{ fontWeight: '700', color: '#4A2C17' }}>
                  + Add Custom Name...
                </option>
              </select>
            )}
          </div>

          {/* Row 2: Unit Type & Default Dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A3E36' }}>
                  Unit *
                </label>
                {isCustomUnit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      setUnit('Sq.Ft.');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0369A1',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ← Presets
                  </button>
                ) : null}
              </div>

              {isCustomUnit ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Pair, Pcs, Meter, Sheet"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1.5px solid #4A2C17',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#2B2520',
                    background: '#FFFDF9',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              ) : (
                <select
                  value={['Sq.Ft.', 'SET', 'Nos', 'Pcs', 'RFT.', 'APPROX', 'Meter', 'Pair', 'Sheet'].includes(unit) ? unit : '__CUSTOM__'}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomUnit(true);
                      setUnit('');
                    } else {
                      setUnit(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#2B2520',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Sq.Ft.">Sq.Ft.</option>
                  <option value="SET">SET</option>
                  <option value="Nos">Nos</option>
                  <option value="Pcs">Pcs</option>
                  <option value="RFT.">RFT.</option>
                  <option value="APPROX">APPROX</option>
                  <option value="Meter">Meter</option>
                  <option value="Pair">Pair</option>
                  <option value="Sheet">Sheet</option>
                  {unit && !['Sq.Ft.', 'SET', 'Nos', 'Pcs', 'RFT.', 'APPROX', 'Meter', 'Pair', 'Sheet'].includes(unit) && (
                    <option value={unit}>📝 Custom: {unit}</option>
                  )}
                  <option value="__CUSTOM__">✏️ Custom Unit (Type Any Label)...</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4A3E36', marginBottom: '4px' }}>
                Width (mm)
              </label>
              <input
                type="number"
                placeholder="e.g. 1800"
                value={defaultWidth}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDefaultWidth(e.target.value.replace(/^0+(?=\d)/, ''))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4A3E36', marginBottom: '4px' }}>
                Height (mm)
              </label>
              <input
                type="number"
                placeholder="e.g. 2100"
                value={defaultHeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDefaultHeight(e.target.value.replace(/^0+(?=\d)/, ''))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {previewArea && (
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11.5px',
              color: '#0369A1',
              marginBottom: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600'
            }}>
              <i className="fa-solid fa-calculator"></i>
              <span>Area: {previewArea} Sq.Ft.</span>
            </div>
          )}

          {/* Section: 3-Collection Pricing & Specifications */}
          <div style={{
            background: '#FAF8F5',
            border: '1px solid #EAE4DD',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#4A2C17', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Collection Rates & Specs
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('essential')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: activeTab === 'essential' ? '1.5px solid #0369A1' : '1px solid #DCD4CA',
                    background: activeTab === 'essential' ? '#E0F2FE' : '#FFFFFF',
                    color: activeTab === 'essential' ? '#0369A1' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  🥉 Essential {essentialRate ? `(₹${Math.round(Number(essentialRate)).toLocaleString('en-IN')})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signature')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: activeTab === 'signature' ? '1.5px solid #B45309' : '1px solid #DCD4CA',
                    background: activeTab === 'signature' ? '#FEF3C7' : '#FFFFFF',
                    color: activeTab === 'signature' ? '#B45309' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  🥈 Signature {signatureRate ? `(₹${Math.round(Number(signatureRate)).toLocaleString('en-IN')})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('elite')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: activeTab === 'elite' ? '1.5px solid #7E22CE' : '1px solid #DCD4CA',
                    background: activeTab === 'elite' ? '#F3E8FF' : '#FFFFFF',
                    color: activeTab === 'elite' ? '#7E22CE' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  🥇 Elite {eliteRate ? `(₹${Math.round(Number(eliteRate)).toLocaleString('en-IN')})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: activeTab === 'all' ? '1.5px solid #4A2C17' : '1px solid #DCD4CA',
                    background: activeTab === 'all' ? '#4A2C17' : '#FFFFFF',
                    color: activeTab === 'all' ? '#FFFFFF' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  All 3
                </button>
              </div>
            </div>

            {/* TAB: ESSENTIAL COLLECTION */}
            {(activeTab === 'essential' || activeTab === 'all') && (
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #BAE6FD',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: activeTab === 'all' ? '10px' : 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1' }}>
                    🥉 Essential
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#0369A1' }}>
                      Rate (₹):
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={essentialRate}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEssentialRate(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{
                        width: '95px',
                        padding: '5px 8px',
                        border: '1.5px solid #0369A1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#0369A1',
                        background: '#F0F9FF',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#666', marginBottom: '3px' }}>
                  Specification:
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter specification..."
                  value={essentialDesc}
                  onChange={(e) => setEssentialDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    border: '1px solid #BAE6FD',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: '#888', fontWeight: '600' }}>Quick Fill:</span>
                  {COLLECTION_PRESETS.essential.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={preset.text}
                      onClick={() => setEssentialDesc(preset.text)}
                      style={{
                        background: '#F0F9FF',
                        border: '1px solid #BAE6FD',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        color: '#0369A1',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SIGNATURE COLLECTION */}
            {(activeTab === 'signature' || activeTab === 'all') && (
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #FCD34D',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: activeTab === 'all' ? '10px' : 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#B45309' }}>
                    🥈 Signature
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#B45309' }}>
                      Rate (₹):
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={signatureRate}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setSignatureRate(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{
                        width: '95px',
                        padding: '5px 8px',
                        border: '1.5px solid #B45309',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#B45309',
                        background: '#FFFBEB',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#666', marginBottom: '3px' }}>
                  Specification:
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter specification..."
                  value={signatureDesc}
                  onChange={(e) => setSignatureDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    border: '1px solid #FCD34D',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: '#888', fontWeight: '600' }}>Quick Fill:</span>
                  {COLLECTION_PRESETS.signature.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={preset.text}
                      onClick={() => setSignatureDesc(preset.text)}
                      style={{
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        color: '#B45309',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ELITE COLLECTION */}
            {(activeTab === 'elite' || activeTab === 'all') && (
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #D8B4FE',
                borderRadius: '10px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#7E22CE' }}>
                    🥇 Elite
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#7E22CE' }}>
                      Rate (₹):
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={eliteRate}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEliteRate(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{
                        width: '95px',
                        padding: '5px 8px',
                        border: '1.5px solid #7E22CE',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#7E22CE',
                        background: '#FAF5FF',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#666', marginBottom: '3px' }}>
                  Specification:
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter specification..."
                  value={eliteDesc}
                  onChange={(e) => setEliteDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 9px',
                    border: '1px solid #D8B4FE',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: '#888', fontWeight: '600' }}>Quick Fill:</span>
                  {COLLECTION_PRESETS.elite.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={preset.text}
                      onClick={() => setEliteDesc(preset.text)}
                      style={{
                        background: '#F3E8FF',
                        border: '1px solid #D8B4FE',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        color: '#7E22CE',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                padding: '9px 22px',
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
