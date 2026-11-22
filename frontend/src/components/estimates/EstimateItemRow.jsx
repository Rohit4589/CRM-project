import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toTitleCase } from '../../utils/autoCapitalize';

// Helper to strip unwanted leading zeros (e.g. "0100" -> "100", "05" -> "5", "00" -> "0")
const cleanNumberInput = (v) => {
  if (v === '' || v === null || v === undefined) return '';
  return String(v).replace(/^0+(?=\d)/, '');
};

// Minor helping words to keep lowercase in title case (unless at sentence start)
const MINOR_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'or', 'nor', 'but',
  'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with', 'from', 'into', 'onto', 'as', 'per', 'etc'
]);

// Interior industry acronyms to keep or format as uppercase
const KNOWN_ACRONYMS = new Set([
  'SS', 'BWR', 'PVC', 'LED', 'PU', 'MS', 'CNC', 'HDHMR', 'MDF', 'GI', 'CP', 'WPC', 'ACP', 'MM', 'RFT', 'SQFT', 'NOS'
]);

// Use central toTitleCase
const toSmartTitleCase = toTitleCase;

const EstimateItemRow = ({
  item,
  index,
  roomName = '',
  catalogProducts = [],
  catalogDescriptions = [],
  catalogUnits = ['Sq.Ft.', 'SET', 'Nos', 'RFT.', 'APPROX'],
  furnitureTier = 'Signature Collection',
  isFirstItem = false,
  isLastItem = false,
  onMoveUp,
  onMoveDown,
  onChange,
  onRemove,
  onOpenCreateProduct
}) => {
  // Standard units plus any custom unit label entered
  const standardUnits = ['Sq.Ft.', 'SET', 'Nos', 'Pcs', 'RFT.', 'APPROX', 'Meter', 'Pair', 'Sheet', 'Lump Sum'];
  const availableUnits = Array.from(new Set([
    ...standardUnits,
    ...(Array.isArray(catalogUnits) && catalogUnits.length > 0 ? catalogUnits : []),
    ...(item.unit ? [item.unit] : [])
  ]));
  // Check if current product exists in catalog
  const isExistingInCatalog = catalogProducts.some(
    p => p.name.toUpperCase() === (item.productName || '').trim().toUpperCase()
  );

  // Custom mode state: true if not in catalog and user wants to type
  const [isCustomProduct, setIsCustomProduct] = useState(!isExistingInCatalog && Boolean(item.productName));

  // Check if current description exists in catalog
  const isExistingDesc = catalogDescriptions.includes(item.description);

  // Product autocomplete recommendations state
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Searchable catalog dropdown popup state
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const catalogDropdownRef = useRef(null);
  const unitInputRef = useRef(null);

  // Close catalog dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catalogDropdownRef.current && !catalogDropdownRef.current.contains(e.target)) {
        setShowCatalogDropdown(false);
      }
    };
    if (showCatalogDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCatalogDropdown]);

  // Filter catalog products for auto-recommendations as user types (All in 1 list)
  const query = (item.productName || '').trim();
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  const productSuggestions = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) return [];

    if (!normalizedQuery) {
      // Return ALL products in catalog, sorted alphabetically
      return [...catalogProducts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const seen = new Set();
    const result = [];
    const addProduct = (p) => {
      const key = p.id || p.name;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    };

    const qUpper = query.toUpperCase();

    // 1. Starts with query
    for (const p of catalogProducts) {
      if ((p.name || '').toUpperCase().startsWith(qUpper)) addProduct(p);
    }
    // 2. Substring match
    for (const p of catalogProducts) {
      if ((p.name || '').toUpperCase().includes(qUpper)) addProduct(p);
    }
    // 3. Space-insensitive match (e.g. 'tv' or 't v' matches 'T V UNIT')
    for (const p of catalogProducts) {
      const pNorm = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pNorm.includes(normalizedQuery)) addProduct(p);
    }

    return result;
  }, [query, normalizedQuery, catalogProducts]);

  // Filter catalog products for the 3-lines catalog popup
  const filteredCatalogProducts = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) return [];
    if (!catalogSearch.trim()) {
      return [...catalogProducts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    const qUpper = catalogSearch.trim().toUpperCase();
    const qNorm = catalogSearch.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const seen = new Set();
    const result = [];
    const addProduct = (p) => {
      const key = p.id || p.name;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    };

    for (const p of catalogProducts) {
      if ((p.name || '').toUpperCase().startsWith(qUpper)) addProduct(p);
    }
    for (const p of catalogProducts) {
      if ((p.name || '').toUpperCase().includes(qUpper)) addProduct(p);
    }
    for (const p of catalogProducts) {
      const pNorm = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pNorm.includes(qNorm)) addProduct(p);
    }

    return result;
  }, [catalogProducts, catalogSearch]);

  // When a catalog product is selected
  // Matched catalog product lookup
  const matchedProd = catalogProducts.find(
    p => p.name.toUpperCase() === (item.productName || '').trim().toUpperCase()
  );

  const essDesc = (item.essentialDesc || matchedProd?.essentialDesc || '').trim();
  const sigDesc = (item.signatureDesc || matchedProd?.signatureDesc || '').trim();
  const eliDesc = (item.eliteDesc || matchedProd?.eliteDesc || '').trim();

  const essRate = Number(item.essentialRate || matchedProd?.essentialRate || matchedProd?.modern) || 0;
  const sigRate = Number(item.signatureRate || matchedProd?.signatureRate || matchedProd?.luxuryModern) || 0;
  const eliRate = Number(item.eliteRate || matchedProd?.eliteRate || matchedProd?.luxury) || 0;

  // Handle description preset change and auto-switch rate based on selected collection
  const handleDescriptionPreset = (presetKey) => {
    if (presetKey === '__CUSTOM__') {
      onChange({
        ...item,
        description: 'APPROX'
      });
      return;
    }

    if (presetKey === '__ESSENTIAL__') {
      const updatedRate = essRate > 0 ? essRate : (Number(item.rate) || 0);
      const newAmount = Math.round((Number(item.totalArea) || 1) * updatedRate);
      onChange({
        ...item,
        description: essDesc,
        rate: updatedRate,
        amount: newAmount,
        essentialDesc: essDesc,
        signatureDesc: sigDesc,
        eliteDesc: eliDesc,
        essentialRate: essRate,
        signatureRate: sigRate,
        eliteRate: eliRate
      });
      return;
    }

    if (presetKey === '__SIGNATURE__') {
      const updatedRate = sigRate > 0 ? sigRate : (Number(item.rate) || 0);
      const newAmount = Math.round((Number(item.totalArea) || 1) * updatedRate);
      onChange({
        ...item,
        description: sigDesc,
        rate: updatedRate,
        amount: newAmount,
        essentialDesc: essDesc,
        signatureDesc: sigDesc,
        eliteDesc: eliDesc,
        essentialRate: essRate,
        signatureRate: sigRate,
        eliteRate: eliRate
      });
      return;
    }

    if (presetKey === '__ELITE__') {
      const updatedRate = eliRate > 0 ? eliRate : (Number(item.rate) || 0);
      const newAmount = Math.round((Number(item.totalArea) || 1) * updatedRate);
      onChange({
        ...item,
        description: eliDesc,
        rate: updatedRate,
        amount: newAmount,
        essentialDesc: essDesc,
        signatureDesc: sigDesc,
        eliteDesc: eliDesc,
        essentialRate: essRate,
        signatureRate: sigRate,
        eliteRate: eliRate
      });
      return;
    }

    // Direct catalog description text selection if no tiered collection specs exist
    const updatedRate = Number(item.rate) || 0;
    const newAmount = Math.round((Number(item.totalArea) || 1) * updatedRate);
    onChange({
      ...item,
      description: presetKey,
      rate: updatedRate,
      amount: newAmount
    });
  };

  // When a catalog product is selected
  const handleProductSelect = (selectedName) => {
    if (selectedName === '__CUSTOM__') {
      setIsCustomProduct(true);
      return;
    }

    setIsCustomProduct(false);
    const found = catalogProducts.find(p => p.name === selectedName);

    let essentialDesc = item.essentialDesc || '';
    let signatureDesc = item.signatureDesc || '';
    let eliteDesc = item.eliteDesc || '';

    let essentialRate = item.essentialRate || 0;
    let signatureRate = item.signatureRate || 0;
    let eliteRate = item.eliteRate || 0;

    let newRate = item.rate;
    let newDesc = item.description;
    let newUnit = item.unit || 'Sq.Ft.';
    let newW = (item.widthMm !== null && item.widthMm !== undefined) ? item.widthMm : '';
    let newH = (item.heightMm !== null && item.heightMm !== undefined) ? item.heightMm : '';

    if (found) {
      essentialDesc = found.essentialDesc || found.defaultDesc || catalogDescriptions[0] || '';
      signatureDesc = found.signatureDesc || found.defaultDesc || catalogDescriptions[0] || '';
      eliteDesc = found.eliteDesc || found.defaultDesc || catalogDescriptions[0] || '';

      essentialRate = found.essentialRate || found.modern || 1200;
      signatureRate = found.signatureRate || found.luxuryModern || 1600;
      eliteRate = found.eliteRate || found.luxury || 2200;

      const isEssential = furnitureTier === 'Essential Collection' || furnitureTier === 'Modern';
      const isElite = furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury';

      if (isEssential) {
        newRate = essentialRate;
        newDesc = essentialDesc;
      } else if (isElite) {
        newRate = eliteRate;
        newDesc = eliteDesc;
      } else {
        newRate = signatureRate;
        newDesc = signatureDesc;
      }

      newUnit = found.defaultUnit || 'Sq.Ft.';
      newW = (found.defaultW !== null && found.defaultW !== undefined && found.defaultW !== '') ? Number(found.defaultW) : '';
      newH = (found.defaultH !== null && found.defaultH !== undefined && found.defaultH !== '') ? Number(found.defaultH) : '';
    }

    // Recalculate area with 0.5 step roundup: Math.ceil(raw * 2) / 2
    let newArea = 1;
    if (newUnit === 'Sq.Ft.' && newW && newH && Number(newW) > 0 && Number(newH) > 0) {
      const rawSqFt = (Number(newW) * Number(newH)) / 92903;
      newArea = Math.ceil(rawSqFt * 2) / 2;
    } else if (found?.defaultUnit && found.defaultUnit !== 'Sq.Ft.') {
      newArea = item.totalArea || 1;
    }

    const newAmount = Math.round((Number(newArea) || 1) * (Number(newRate) || 0));

    onChange({
      ...item,
      productName: toTitleCase(selectedName),
      description: newDesc,
      essentialDesc,
      signatureDesc,
      eliteDesc,
      essentialRate,
      signatureRate,
      eliteRate,
      unit: newUnit,
      widthMm: newW,
      heightMm: newH,
      totalArea: newArea,
      rate: newRate,
      amount: newAmount
    });
  };

  const handleDimensionChange = (field, value) => {
    const cleaned = cleanNumberInput(value);
    const updated = { ...item, [field]: cleaned !== '' ? cleaned : '' };
    
    // Auto-calculate area if unit is Sq.Ft. with 0.5 step roundup
    if (updated.unit === 'Sq.Ft.' && updated.widthMm && updated.heightMm && Number(updated.widthMm) > 0 && Number(updated.heightMm) > 0) {
      const rawSqFt = (Number(updated.widthMm) * Number(updated.heightMm)) / 92903;
      updated.totalArea = Math.ceil(rawSqFt * 2) / 2;
    }
    
    updated.amount = Math.round((Number(updated.totalArea) || 1) * (Number(updated.rate) || 0));
    onChange(updated);
  };

  const handleAreaChange = (val) => {
    const cleaned = cleanNumberInput(val);
    const area = cleaned !== '' ? cleaned : '';
    const amount = Math.round((Number(area) || 0) * (Number(item.rate) || 0));
    onChange({
      ...item,
      totalArea: area,
      amount
    });
  };

  const handleRateChange = (val) => {
    const cleaned = cleanNumberInput(val);
    const rate = cleaned === '' ? '' : (Number(cleaned) || 0);
    const amount = Math.round((Number(item.totalArea) || 1) * (Number(rate) || 0));
    onChange({
      ...item,
      rate,
      amount
    });
  };

  const handleUnitChange = (val) => {
    if (val === '__CUSTOM__') {
      // Clear the box and place cursor directly in the box so user can type
      onChange({ ...item, unit: '' });
      setTimeout(() => {
        if (unitInputRef.current) {
          unitInputRef.current.focus();
          unitInputRef.current.value = '';
        }
      }, 20);
      return;
    }
    const updated = { ...item, unit: val };
    const cleanUnit = (val || '').trim();
    if (cleanUnit === 'Sq.Ft.' && updated.widthMm && updated.heightMm && Number(updated.widthMm) > 0 && Number(updated.heightMm) > 0) {
      const rawSqFt = (Number(updated.widthMm) * Number(updated.heightMm)) / 92903;
      updated.totalArea = Math.ceil(rawSqFt * 2) / 2;
    } else if (cleanUnit === 'SET' || cleanUnit.toLowerCase().startsWith('no') || cleanUnit === 'APPROX' || cleanUnit.toLowerCase().includes('pcs') || cleanUnit.toLowerCase().includes('pair')) {
      if (!updated.totalArea || Number(updated.totalArea) <= 0) {
        updated.totalArea = 1;
      }
    }
    updated.amount = Math.round((Number(updated.totalArea) || 1) * (Number(updated.rate) || 0));
    onChange(updated);
  };

  const openUpward = isLastItem && index >= 1;

  return (
    <tr data-nav-row="true" style={{ position: 'relative', zIndex: showProductSuggestions ? 99999 : 1 }}>
      {/* Product Name Column - Directly Editable + Dynamic Recommendations Dropdown */}
      <td style={{ fontWeight: '600', position: 'relative', zIndex: showProductSuggestions ? 99999 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              data-nav-item="true"
              data-col="0"
              value={item.productName || ''}
              placeholder="Product Name..."
              onFocus={() => setShowProductSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowProductSuggestions(false), 200);
                if (item.productName) {
                  const formatted = toTitleCase(item.productName);
                  if (formatted !== item.productName) {
                    onChange({ ...item, productName: formatted });
                  }
                }
              }}
              onChange={(e) => {
                onChange({ ...item, productName: e.target.value });
                setShowProductSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (showProductSuggestions && productSuggestions.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleProductSelect(productSuggestions[0].name);
                    setShowProductSuggestions(false);
                  }
                } else if (e.key === 'Escape') {
                  if (showProductSuggestions) {
                    e.stopPropagation();
                    setShowProductSuggestions(false);
                  }
                }
              }}
              style={{
                width: '100%',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#000000',
                padding: '4px 6px',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                fontSize: '11px',
                background: '#FFFFFF'
              }}
              title="Type letters (e.g. 'b' for Bed) to get catalog recommendations"
            />

            {/* Floating Suggestions Dropdown (All In 1 - No Room Tags) */}
            {showProductSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  ...(openUpward
                    ? { bottom: '100%', marginBottom: '4px' }
                    : { top: '100%', marginTop: '3px' }),
                  left: 0,
                  width: '320px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#FFFFFF',
                  border: '1.5px solid #4A2C17',
                  borderRadius: '8px',
                  boxShadow: '0 10px 28px rgba(43, 37, 32, 0.28)',
                  zIndex: 99999,
                  textAlign: 'left'
                }}
              >
                {/* 1. TOP ITEM: + Create New Product Option */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowProductSuggestions(false);
                    if (onOpenCreateProduct) {
                      onOpenCreateProduct({
                        itemIndex: index,
                        defaultRoomName: roomName,
                        initialName: item.productName || ''
                      });
                    }
                  }}
                  style={{
                    padding: '8.5px 12px',
                    cursor: 'pointer',
                    background: '#FAF5EE',
                    borderBottom: '1.5px solid #EAE2D8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#4A2C17',
                    fontWeight: '700',
                    fontSize: '12px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F2E8DC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FAF5EE'; }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {query ? (
                      <span>Create <strong style={{ color: '#2B2520' }}>"{query}"</strong> as New Product...</span>
                    ) : (
                      <span>+ Create New Product</span>
                    )}
                  </div>
                </div>

                {/* 2. All Catalog Products (Single Clean List - No Room Tags) */}
                {productSuggestions.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#8C827A', fontSize: '11.5px' }}>
                    No products matching "{query}"
                  </div>
                ) : (
                  productSuggestions.map((prod) => {
                    const rate = Number(
                      furnitureTier === 'Essential Collection' || furnitureTier === 'Modern'
                        ? (prod.essentialRate || prod.modern)
                        : furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury'
                          ? (prod.eliteRate || prod.luxury)
                          : (prod.signatureRate || prod.luxuryModern)
                    ) || 0;
                    const unit = prod.defaultUnit || 'Sq.Ft.';
                    return (
                      <div
                        key={prod.id || prod.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProductSelect(prod.name);
                          setShowProductSuggestions(false);
                        }}
                        style={{
                          padding: '7.5px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #F5F1EC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F9F6F0'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: '#2B2520' }}>
                            {toTitleCase(prod.name)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#4A2C17',
                              background: '#F5EBE1',
                              padding: '2.5px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : ''} {unit}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }} ref={catalogDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowCatalogDropdown(prev => !prev);
                setCatalogSearch('');
              }}
              title="Search and pick product from catalog"
              style={{
                background: showCatalogDropdown ? '#4A2C17' : '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                color: showCatalogDropdown ? '#FFFFFF' : '#4A2C17',
                cursor: 'pointer',
                padding: '4px 6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                width: '26px',
                transition: 'all 0.15s ease'
              }}
            >
              <i className="fa-solid fa-list"></i>
            </button>

            {/* Custom Searchable Catalog Dropdown (Opens cleanly to the right, never clipped) */}
            {showCatalogDropdown && (
              <div
                style={{
                  position: 'absolute',
                  ...(openUpward
                    ? { bottom: '100%', marginBottom: '4px' }
                    : { top: '100%', marginTop: '4px' }),
                  left: 0,
                  width: '320px',
                  maxHeight: '320px',
                  background: '#FFFFFF',
                  border: '1.5px solid #4A2C17',
                  borderRadius: '8px',
                  boxShadow: '0 12px 30px rgba(43, 37, 32, 0.3)',
                  zIndex: 999999,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                {/* Search Bar at Top */}
                <div style={{ padding: '8px', background: '#FAF8F5', borderBottom: '1px solid #EAE4DD' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i
                      className="fa-solid fa-magnifying-glass"
                      style={{ position: 'absolute', left: '9px', color: '#8C827A', fontSize: '11px', pointerEvents: 'none' }}
                    />
                    <input
                      type="text"
                      placeholder="Search product (e.g. TV, Bed, Table)..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setShowCatalogDropdown(false);
                        }
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '6px 24px 6px 28px',
                        fontSize: '11.5px',
                        border: '1px solid #DCD4CA',
                        borderRadius: '5px',
                        outline: 'none',
                        background: '#FFFFFF',
                        fontWeight: '600'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCatalogSearch('');
                        }}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#8C827A',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8C827A', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>All Products</span>
                    <span>{filteredCatalogProducts.length} items</span>
                  </div>
                </div>

                {/* 1. TOP ITEM: + Create New Product Option */}
                <div
                  onClick={() => {
                    setShowCatalogDropdown(false);
                    if (onOpenCreateProduct) {
                      onOpenCreateProduct({
                        itemIndex: index,
                        defaultRoomName: roomName,
                        initialName: catalogSearch || ''
                      });
                    }
                  }}
                  style={{
                    padding: '8.5px 12px',
                    cursor: 'pointer',
                    background: '#FAF5EE',
                    borderBottom: '1.5px solid #EAE2D8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#4A2C17',
                    fontWeight: '700',
                    fontSize: '12px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F2E8DC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FAF5EE'; }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {catalogSearch ? (
                      <span>Create <strong style={{ color: '#2B2520' }}>"{catalogSearch}"</strong> as New Product...</span>
                    ) : (
                      <span>+ Create New Product</span>
                    )}
                  </div>
                </div>

                {/* Products List (Unified Single List - No Room Tags) */}
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
                  {filteredCatalogProducts.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#8C827A', fontSize: '12px' }}>
                      No products matching "{catalogSearch}"
                    </div>
                  ) : (
                    filteredCatalogProducts.map((prod) => {
                      const rate = Number(
                        furnitureTier === 'Essential Collection' || furnitureTier === 'Modern'
                          ? (prod.essentialRate || prod.modern)
                          : furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury'
                            ? (prod.eliteRate || prod.luxury)
                            : (prod.signatureRate || prod.luxuryModern)
                      ) || 0;
                      const unit = prod.defaultUnit || 'Sq.Ft.';

                      return (
                        <div
                          key={prod.id || prod.name}
                          onClick={() => {
                            handleProductSelect(prod.name);
                            setShowCatalogDropdown(false);
                            setCatalogSearch('');
                          }}
                          style={{
                            padding: '7.5px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F5F1EC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9F6F0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#2B2520' }}>
                            {toTitleCase(prod.name)}
                          </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#4A2C17',
                                background: '#F5EBE1',
                                padding: '2.5px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : ''} {unit}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Description / Specification Column - Centered Multi-line Paragraph with Collection Presets & Direct Editing */}
      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '3px 4px' }}>
        {(() => {
          const descTrimmed = (item.description || '').trim();
          let currentPresetValue = '';
          if (descTrimmed === 'APPROX') {
            currentPresetValue = '__CUSTOM__';
          } else if (essDesc && descTrimmed === essDesc) {
            currentPresetValue = '__ESSENTIAL__';
          } else if (sigDesc && descTrimmed === sigDesc) {
            currentPresetValue = '__SIGNATURE__';
          } else if (eliDesc && descTrimmed === eliDesc) {
            currentPresetValue = '__ELITE__';
          } else if (descTrimmed) {
            currentPresetValue = '__MODIFIED__';
          } else {
            currentPresetValue = '';
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
              {/* Preset Selector Dropdown */}
              <select
                value={currentPresetValue}
                onChange={(e) => handleDescriptionPreset(e.target.value)}
                title="Pick collection specification or custom preset. Text below remains directly editable for this estimate."
                style={{
                  width: '100%',
                  height: '21px',
                  fontSize: '9.5px',
                  fontWeight: '700',
                  color: '#4A2C17',
                  background: '#FAF6F0',
                  border: '1px solid #D1C2AF',
                  borderRadius: '3px',
                  padding: '0 4px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="" disabled>-- Select Specification --</option>
                {essDesc && (
                  <option value="__ESSENTIAL__">
                    🥉 Essential {essRate > 0 ? `(₹${essRate})` : ''}
                  </option>
                )}
                {sigDesc && (
                  <option value="__SIGNATURE__">
                    🥈 Signature {sigRate > 0 ? `(₹${sigRate})` : ''}
                  </option>
                )}
                {eliDesc && (
                  <option value="__ELITE__">
                    🥇 Elite {eliRate > 0 ? `(₹${eliRate})` : ''}
                  </option>
                )}
                {!essDesc && !sigDesc && !eliDesc && catalogDescriptions.map((desc, i) => (
                  <option key={i} value={desc}>{desc}</option>
                ))}
                <option value="__CUSTOM__">✏️ Custom (APPROX)</option>
                {currentPresetValue === '__MODIFIED__' && (
                  <option value="__MODIFIED__" disabled>
                    📝 Custom / Edited ({descTrimmed.length > 22 ? descTrimmed.slice(0, 22) + '...' : descTrimmed})
                  </option>
                )}
              </select>

              {/* Direct Editable Textarea - Editable for that estimate only */}
              <textarea
                rows={2}
                data-nav-item="true"
                data-col="1"
                data-custom-casing="true"
                value={item.description || ''}
                placeholder="Specification / description..."
                onChange={(e) => {
                  onChange({ ...item, description: e.target.value });
                }}
                onBlur={() => {
                  if (item.description) {
                    const formatted = toSmartTitleCase(item.description);
                    if (formatted !== item.description) {
                      onChange({ ...item, description: formatted });
                    }
                  }
                }}
                style={{
                  fontSize: '10.5px',
                  color: '#000000',
                  fontWeight: '600',
                  lineHeight: '1.35',
                  minHeight: '36px',
                  resize: 'vertical',
                  overflow: 'auto',
                  padding: '4px 6px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  textAlign: 'center',
                  width: '100%',
                  border: '1px solid #D1C2AF',
                  borderRadius: '4px',
                  background: '#FFFFFF',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );
        })()}
      </td>

      {/* Width (MM) - Centered matching Photo 1 */}
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          data-nav-item="true"
          data-col="2"
          placeholder="-"
          value={item.widthMm === '' ? '' : (item.widthMm ?? '')}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const cleaned = cleanNumberInput(e.target.value);
            e.target.value = cleaned;
            handleDimensionChange('widthMm', cleaned);
          }}
          style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}
        />
      </td>

      {/* Height (MM) - Centered matching Photo 1 */}
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          data-nav-item="true"
          data-col="3"
          placeholder="-"
          value={item.heightMm === '' ? '' : (item.heightMm ?? '')}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const cleaned = cleanNumberInput(e.target.value);
            e.target.value = cleaned;
            handleDimensionChange('heightMm', cleaned);
          }}
          style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}
        />
      </td>

      {/* Total Area - Centered & Bold matching Photo 1 */}
      <td style={{ textAlign: 'center', fontWeight: '700' }}>
        <input
          type="number"
          step="any"
          data-nav-item="true"
          data-col="4"
          placeholder="0"
          value={item.totalArea === '' ? '' : (item.totalArea ?? '')}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const cleaned = cleanNumberInput(e.target.value);
            e.target.value = cleaned;
            handleAreaChange(cleaned);
          }}
          onBlur={() => {
            if (item.totalArea === '' || Number(item.totalArea) === 0) handleAreaChange(1);
          }}
          style={{ textAlign: 'center', fontWeight: '700', color: '#000000' }}
        />
      </td>

      {/* Unit - Directly Editable + Suggestions Dropdown */}
      <td style={{ textAlign: 'center', minWidth: '80px', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', width: '100%', justifyContent: 'center' }}>
          <input
            ref={unitInputRef}
            type="text"
            data-nav-item="true"
            data-col="5"
            list={`units-datalist-${item.id || index}`}
            value={item.unit || ''}
            placeholder="Unit"
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleUnitChange(e.target.value)}
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: '#000000',
              flex: 1,
              minWidth: '45px',
              padding: '4px 2px',
              border: '1px solid #DCD4CA',
              borderRadius: '4px',
              background: '#FFFFFF',
              fontSize: '11px',
              cursor: 'text'
            }}
            title="Type any custom unit (e.g. Nos, Pcs, Pair, Meter) or pick from arrow"
          />
          <datalist id={`units-datalist-${item.id || index}`}>
            {availableUnits.map((u, i) => (
              <option key={i} value={u} />
            ))}
          </datalist>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleUnitChange(e.target.value);
              }}
              title="Select unit or enter custom"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2
              }}
            >
              <option value="" disabled>-- Select Unit --</option>
              {availableUnits.map((u, i) => (
                <option key={i} value={u}>{u}</option>
              ))}
              <option value="__CUSTOM__">✏️ Custom Unit (Type Label)...</option>
            </select>
            <button
              type="button"
              tabIndex={-1}
              title="Choose unit from list or enter custom"
              style={{
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                color: '#4A2C17',
                cursor: 'pointer',
                padding: '4px 5px',
                fontSize: '10px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px' }}></i>
            </button>
          </div>
        </div>
      </td>

      {/* Rate - Centered */}
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          data-nav-item="true"
          data-col="6"
          placeholder="0"
          value={item.rate === '' ? '' : (item.rate ?? '')}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const cleaned = cleanNumberInput(e.target.value);
            e.target.value = cleaned;
            handleRateChange(cleaned);
          }}
          onBlur={() => {
            if (item.rate === '') handleRateChange(0);
          }}
          style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}
        />
      </td>

      {/* Amount - Right Aligned & Bold matching Photo 1 */}
      <td style={{ textAlign: 'right', fontWeight: '800', whiteSpace: 'nowrap', color: '#000000' }}>
        ₹{(item.amount || 0).toLocaleString('en-IN')}
      </td>

      {/* Reorder and Delete Item Column */}
      <td style={{ width: '72px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', padding: '2px 4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {/* Move Item Up */}
          <button
            type="button"
            disabled={isFirstItem}
            onClick={onMoveUp}
            title={isFirstItem ? 'Already at top of room' : 'Move item up'}
            style={{
              background: isFirstItem ? 'transparent' : '#FAF8F5',
              border: isFirstItem ? '1px solid transparent' : '1px solid #DCD4CA',
              borderRadius: '3px',
              color: isFirstItem ? '#D1D5DB' : '#4A2C17',
              cursor: isFirstItem ? 'not-allowed' : 'pointer',
              padding: '3px 5px',
              fontSize: '10px',
              lineHeight: 1
            }}
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>

          {/* Move Item Down */}
          <button
            type="button"
            disabled={isLastItem}
            onClick={onMoveDown}
            title={isLastItem ? 'Already at bottom of room' : 'Move item down'}
            style={{
              background: isLastItem ? 'transparent' : '#FAF8F5',
              border: isLastItem ? '1px solid transparent' : '1px solid #DCD4CA',
              borderRadius: '3px',
              color: isLastItem ? '#D1D5DB' : '#4A2C17',
              cursor: isLastItem ? 'not-allowed' : 'pointer',
              padding: '3px 5px',
              fontSize: '10px',
              lineHeight: 1
            }}
          >
            <i className="fa-solid fa-arrow-down"></i>
          </button>

          {/* Delete Item */}
          <button
            type="button"
            onClick={onRemove}
            title="Remove item"
            style={{
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '3px',
              color: '#B91C1C',
              cursor: 'pointer',
              padding: '3px 5px',
              fontSize: '10px',
              lineHeight: 1
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EstimateItemRow;
