import React, { useState, useMemo, useRef, useEffect } from 'react';

// Helper to strip unwanted leading zeros (e.g. "0100" -> "100", "05" -> "5", "00" -> "0")
const cleanNumberInput = (v) => {
  if (v === '' || v === null || v === undefined) return '';
  return String(v).replace(/^0+(?=\d)/, '');
};

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
  onRemove
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
  const [isCustomDesc, setIsCustomDesc] = useState(false);

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

  // Extract unique categories from catalog products, putting current room's category first
  const cleanRoomUpper = (roomName || '').trim().toUpperCase();

  // Filter catalog products for auto-recommendations as user types
  const query = (item.productName || '').trim().toUpperCase();
  const productSuggestions = useMemo(() => {
    if (!query) {
      const inRoom = catalogProducts.filter(p => {
        const catNames = (Array.isArray(p.category_names) && p.category_names.length > 0)
          ? p.category_names.map(c => (c || '').toUpperCase())
          : [(p.category || '').toUpperCase()];
        return catNames.includes(cleanRoomUpper);
      });
      return inRoom.length > 0 ? inRoom.slice(0, 8) : catalogProducts.slice(0, 8);
    }
    const startsWith = [];
    const includes = [];
    for (const p of catalogProducts) {
      const pUpper = (p.name || '').toUpperCase();
      if (pUpper.startsWith(query)) {
        startsWith.push(p);
      } else if (pUpper.includes(query)) {
        includes.push(p);
      }
      if (startsWith.length + includes.length >= 14) break;
    }
    return [...startsWith, ...includes];
  }, [query, catalogProducts, cleanRoomUpper]);

  const rawCats = Array.from(new Set(catalogProducts.flatMap(p =>
    (Array.isArray(p.category_names) && p.category_names.length > 0)
      ? p.category_names
      : [p.category || 'General']
  )));
  const categories = rawCats.sort((a, b) => {
    const aMatch = a.toUpperCase() === cleanRoomUpper;
    const bMatch = b.toUpperCase() === cleanRoomUpper;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return a.localeCompare(b);
  });

  // Filter catalog products for the searchable catalog dropdown popup
  const filteredCatalogProducts = useMemo(() => {
    if (!catalogSearch.trim()) return catalogProducts;
    const q = catalogSearch.trim().toUpperCase();
    return catalogProducts.filter(p => {
      const nameMatch = (p.name || '').toUpperCase().includes(q);
      const catMatch = (p.category || '').toUpperCase().includes(q) ||
        (Array.isArray(p.category_names) && p.category_names.some(c => c.toUpperCase().includes(q)));
      return nameMatch || catMatch;
    });
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

  // Handle description change and auto-switch rate based on selected collection description
  const handleDescriptionSelect = (newDesc) => {
    if (newDesc === '__CUSTOM__') {
      setIsCustomDesc(true);
      onChange({
        ...item,
        description: ''
      });
      return;
    }

    let updatedRate = Number(item.rate) || 0;

    // Check which collection description matches the selection
    if (essDesc && newDesc.trim() === essDesc && essRate > 0) {
      updatedRate = essRate;
    } else if (sigDesc && newDesc.trim() === sigDesc && sigRate > 0) {
      updatedRate = sigRate;
    } else if (eliDesc && newDesc.trim() === eliDesc && eliRate > 0) {
      updatedRate = eliRate;
    }

    const newAmount = Math.round((Number(item.totalArea) || 1) * updatedRate);

    onChange({
      ...item,
      description: newDesc,
      rate: updatedRate,
      amount: newAmount,
      essentialDesc: essDesc,
      signatureDesc: sigDesc,
      eliteDesc: eliDesc,
      essentialRate: essRate,
      signatureRate: sigRate,
      eliteRate: eliRate
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
      productName: selectedName,
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
              placeholder="PRODUCT NAME..."
              onFocus={() => setShowProductSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                onChange({ ...item, productName: val });
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

            {/* Floating Suggestions / Recommendations Menu */}
            {showProductSuggestions && productSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  ...(openUpward
                    ? { bottom: '100%', marginBottom: '4px' }
                    : { top: '100%', marginTop: '3px' }),
                  left: 0,
                  minWidth: '260px',
                  maxWidth: '340px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#FFFFFF',
                  border: '1px solid #DCD4CA',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(43, 37, 32, 0.25)',
                  zIndex: 99999,
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    padding: '5px 8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#8C827A',
                    background: '#FAF8F5',
                    borderBottom: '1px solid #F0ECE6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Recommended Products</span>
                  <span>{productSuggestions.length} items</span>
                </div>
                {productSuggestions.map((prod) => {
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
                      key={prod.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleProductSelect(prod.name);
                        setShowProductSuggestions(false);
                      }}
                      style={{
                        padding: '7px 10px',
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
                        <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#2B2520' }}>
                          {prod.name}
                        </div>
                        {prod.category && (
                          <div style={{ fontSize: '10px', color: '#8C827A', marginTop: '1px' }}>
                            📂 {prod.category}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            color: '#4A2C17',
                            background: '#F5EBE1',
                            padding: '2px 5px',
                            borderRadius: '3px'
                          }}
                        >
                          {rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : ''} {unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
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

            {/* Custom Searchable Catalog Dropdown */}
            {showCatalogDropdown && (
              <div
                style={{
                  position: 'absolute',
                  ...(openUpward
                    ? { bottom: '100%', marginBottom: '4px' }
                    : { top: '100%', marginTop: '4px' }),
                  right: 0,
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
                      placeholder="Type 1st or 2nd letter to search..."
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
                    <span>Recommended products</span>
                    <span>{filteredCatalogProducts.length} items</span>
                  </div>
                </div>

                {/* Products List */}
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
                  {filteredCatalogProducts.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#8C827A', fontSize: '12px' }}>
                      No products matching "{catalogSearch}"
                    </div>
                  ) : catalogSearch.trim() ? (
                    // Flat filtered list when user is actively searching
                    filteredCatalogProducts.map((prod) => {
                      const rate = Number(
                        furnitureTier === 'Essential Collection' || furnitureTier === 'Modern'
                          ? (prod.essentialRate || prod.modern)
                          : furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury'
                            ? (prod.eliteRate || prod.luxury)
                            : (prod.signatureRate || prod.luxuryModern)
                      ) || 0;
                      const unit = prod.defaultUnit || 'Sq.Ft.';
                      const catLabel = (prod.category_names && prod.category_names.length > 0)
                        ? prod.category_names.join(', ')
                        : (prod.category || 'General');

                      return (
                        <div
                          key={prod.name}
                          onClick={() => {
                            handleProductSelect(prod.name);
                            setShowCatalogDropdown(false);
                            setCatalogSearch('');
                          }}
                          style={{
                            padding: '7px 10px',
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
                            <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#2B2520' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#8C827A', marginTop: '1px' }}>
                              📂 {catLabel}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: '#4A2C17',
                                background: '#F5EBE1',
                                padding: '2px 5px',
                                borderRadius: '3px'
                              }}
                            >
                              {rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : ''} {unit}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Grouped by Category when opening without search query
                    categories.map((cat) => {
                      const prodsInCat = catalogProducts.filter((p) => {
                        const cats = (Array.isArray(p.category_names) && p.category_names.length > 0)
                          ? p.category_names
                          : [p.category || 'General'];
                        return cats.includes(cat);
                      });
                      if (prodsInCat.length === 0) return null;

                      return (
                        <div key={cat}>
                          <div
                            style={{
                              background: '#F5EFE9',
                              padding: '4px 10px',
                              fontWeight: '800',
                              fontSize: '10.5px',
                              color: '#5C3D24',
                              letterSpacing: '0.3px',
                              borderBottom: '1px solid #EAE4DD',
                              position: 'sticky',
                              top: 0,
                              zIndex: 1
                            }}
                          >
                            📂 {cat} ({prodsInCat.length})
                          </div>
                          {prodsInCat.map((prod) => {
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
                                key={prod.name}
                                onClick={() => {
                                  handleProductSelect(prod.name);
                                  setShowCatalogDropdown(false);
                                  setCatalogSearch('');
                                }}
                                style={{
                                  padding: '6px 12px',
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
                                <span style={{ fontWeight: '700', fontSize: '11px', color: '#2B2520' }}>
                                  {prod.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#4A2C17',
                                    background: '#F5EBE1',
                                    padding: '1px 5px',
                                    borderRadius: '3px'
                                  }}
                                >
                                  {rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : ''} {unit}
                                </span>
                              </div>
                            );
                          })}
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

      {/* Description / Specification Column - Centered Multi-line Paragraph */}
      <td style={{ textAlign: 'center' }}>
        {isCustomDesc ? (
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <textarea
              rows={2}
              autoFocus
              data-nav-item="true"
              data-col="1"
              value={item.description || ''}
              placeholder="Enter custom description..."
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              style={{
                fontSize: '10.5px',
                color: '#000000',
                fontWeight: '600',
                lineHeight: '1.35',
                minHeight: '34px',
                resize: 'vertical',
                overflow: 'auto',
                padding: '4px',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textAlign: 'center',
                flex: 1
              }}
            />
            <button
              type="button"
              onClick={() => setIsCustomDesc(false)}
              title="Pick from dropdown"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
                padding: '2px 4px',
                fontSize: '11px'
              }}
            >
              <i className="fa-solid fa-list"></i>
            </button>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 6px',
              cursor: 'pointer'
            }}
          >
            {/* Multi-line paragraph text display so user can read full specification */}
            <div
              style={{
                fontSize: '10.5px',
                color: '#000000',
                fontWeight: '600',
                lineHeight: '1.35',
                textAlign: 'center',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                width: '100%',
                paddingRight: '12px'
              }}
            >
              {item.description || <span style={{ color: '#999', fontStyle: 'italic' }}>-- Select Description --</span>}
            </div>

            {/* Dropdown Chevron indicator */}
            <i
              className="fa-solid fa-chevron-down"
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '9px',
                color: '#8C827A',
                pointerEvents: 'none'
              }}
            />

            {/* Invisible native select overlay that opens immediately on click */}
            <select
              data-nav-item="true"
              data-col="1"
              value={item.description || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setIsCustomDesc(true);
                  onChange({ ...item, description: '' });
                } else {
                  handleDescriptionSelect(e.target.value);
                }
              }}
              title="Click to change description specification (rate updates automatically)"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                zIndex: 2
              }}
            >
              <option value="" disabled>-- Select Collection Description --</option>
              {essDesc && (
                <option value={essDesc}>
                  🥉 Essential Collection {essRate ? `(₹${essRate})` : ''}: {essDesc}
                </option>
              )}
              {sigDesc && (
                <option value={sigDesc}>
                  🥈 Signature Collection {sigRate ? `(₹${sigRate})` : ''}: {sigDesc}
                </option>
              )}
              {eliDesc && (
                <option value={eliDesc}>
                  🥇 Elite Collection {eliRate ? `(₹${eliRate})` : ''}: {eliDesc}
                </option>
              )}
              {!essDesc && !sigDesc && !eliDesc && catalogDescriptions.map((desc, i) => (
                <option key={i} value={desc}>{desc}</option>
              ))}
              {Boolean(item.description) && 
                item.description !== essDesc && 
                item.description !== sigDesc && 
                item.description !== eliDesc && (
                <option value={item.description}>
                  📝 Custom: {item.description}
                </option>
              )}
              <option value="__CUSTOM__">✏️ Custom / Edit Description...</option>
            </select>
          </div>
        )}
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
