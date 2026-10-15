import React, { useState } from 'react';

const EstimateItemRow = ({
  item,
  index,
  catalogProducts = [],
  catalogDescriptions = [],
  catalogUnits = ['Sq.Ft.', 'SET', 'RFT.', 'APPROX'],
  furnitureTier = 'Luxury-Modern',
  onChange,
  onRemove
}) => {
  // Check if current product exists in catalog
  const isExistingInCatalog = catalogProducts.some(
    p => p.name.toUpperCase() === (item.productName || '').trim().toUpperCase()
  );

  // Custom mode state: true if not in catalog and user wants to type
  const [isCustomProduct, setIsCustomProduct] = useState(!isExistingInCatalog && Boolean(item.productName));

  // Check if current description exists in catalog
  const isExistingDesc = catalogDescriptions.includes(item.description);
  const [isCustomDesc, setIsCustomDesc] = useState(!isExistingDesc && Boolean(item.description));

  // Extract unique categories from catalog products
  const categories = Array.from(new Set(catalogProducts.map(p => p.category || 'General')));

  // When a catalog product is selected
  const handleProductSelect = (selectedName) => {
    if (selectedName === '__CUSTOM__') {
      setIsCustomProduct(true);
      return;
    }

    setIsCustomProduct(false);
    const found = catalogProducts.find(p => p.name === selectedName);

    let newRate = item.rate;
    let newDesc = item.description;
    let newUnit = item.unit;
    let newW = item.widthMm;
    let newH = item.heightMm;

    if (found) {
      if (furnitureTier === 'Modern') newRate = found.modern;
      else if (furnitureTier === 'Luxury') newRate = found.luxury;
      else newRate = found.luxuryModern;

      newDesc = found.defaultDesc || catalogDescriptions[0] || '';
      newUnit = found.defaultUnit || 'Sq.Ft.';
      if (found.defaultW) newW = found.defaultW;
      if (found.defaultH) newH = found.defaultH;
    }

    // Recalculate area
    let newArea = item.totalArea;
    if (newUnit === 'Sq.Ft.' && newW && newH) {
      newArea = Math.ceil((Number(newW) * Number(newH)) / 92903);
    } else if (found?.defaultUnit && found.defaultUnit !== 'Sq.Ft.') {
      newArea = item.totalArea || 1;
    }

    const newAmount = Math.round((Number(newArea) || 1) * (Number(newRate) || 0));

    onChange({
      ...item,
      productName: selectedName,
      description: newDesc,
      unit: newUnit,
      widthMm: newW,
      heightMm: newH,
      totalArea: newArea,
      rate: newRate,
      amount: newAmount
    });
  };

  const handleDimensionChange = (field, value) => {
    const updated = { ...item, [field]: value ? Number(value) : '' };
    
    // Auto-calculate area if unit is Sq.Ft.
    if (updated.unit === 'Sq.Ft.' && updated.widthMm && updated.heightMm) {
      updated.totalArea = Math.ceil((Number(updated.widthMm) * Number(updated.heightMm)) / 92903);
    }
    
    updated.amount = Math.round((Number(updated.totalArea) || 1) * (Number(updated.rate) || 0));
    onChange(updated);
  };

  const handleAreaChange = (val) => {
    const area = Number(val) || 0;
    const amount = Math.round(area * (Number(item.rate) || 0));
    onChange({
      ...item,
      totalArea: area,
      amount
    });
  };

  const handleRateChange = (val) => {
    const rate = Number(val) || 0;
    const amount = Math.round((Number(item.totalArea) || 1) * rate);
    onChange({
      ...item,
      rate,
      amount
    });
  };

  const handleUnitChange = (val) => {
    const updated = { ...item, unit: val };
    if (val === 'Sq.Ft.' && updated.widthMm && updated.heightMm) {
      updated.totalArea = Math.ceil((Number(updated.widthMm) * Number(updated.heightMm)) / 92903);
    }
    updated.amount = Math.round((Number(updated.totalArea) || 1) * (Number(updated.rate) || 0));
    onChange(updated);
  };

  return (
    <tr>
      {/* Product Name Column */}
      <td style={{ minWidth: '220px' }}>
        {isCustomProduct ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="text"
              value={item.productName || ''}
              placeholder="Type product name..."
              onChange={(e) => onChange({ ...item, productName: e.target.value.toUpperCase() })}
              style={{ fontWeight: '600', flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsCustomProduct(false)}
              title="Pick from standard products list"
              style={{
                padding: '4px 8px',
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#4A2C17',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <i className="fa-solid fa-list"></i>
            </button>
          </div>
        ) : (
          <select
            value={item.productName || ''}
            onChange={(e) => handleProductSelect(e.target.value)}
            style={{ fontWeight: '600', cursor: 'pointer', background: '#FFFFFF' }}
          >
            <option value="" disabled>-- Select Product ({catalogProducts.length} items) --</option>
            {categories.map((cat) => (
              <optgroup key={cat} label={`📂 ${cat}`}>
                {catalogProducts
                  .filter((p) => (p.category || 'General') === cat)
                  .map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
            <option value="__CUSTOM__">✏️ Custom / Other Item...</option>
          </select>
        )}
      </td>

      {/* Description / Specification Column */}
      <td style={{ minWidth: '260px' }}>
        {isCustomDesc ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="text"
              value={item.description || ''}
              placeholder="Type custom specification..."
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              style={{ fontSize: '11px', flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsCustomDesc(false)}
              title="Pick from readymade descriptions"
              style={{
                padding: '4px 8px',
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#4A2C17',
                fontSize: '11px'
              }}
            >
              <i className="fa-solid fa-list"></i>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select
              value={item.description || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM_DESC__') {
                  setIsCustomDesc(true);
                } else {
                  onChange({ ...item, description: e.target.value });
                }
              }}
              style={{ fontSize: '11px', cursor: 'pointer', flex: 1 }}
            >
              <option value="" disabled>-- Select Specification --</option>
              {catalogDescriptions.map((desc, i) => (
                <option key={i} value={desc}>
                  {desc.length > 55 ? `${desc.substring(0, 55)}...` : desc}
                </option>
              ))}
              <option value="__CUSTOM_DESC__">✏️ Custom Description...</option>
            </select>
            <button
              type="button"
              onClick={() => setIsCustomDesc(true)}
              title="Type custom description"
              style={{
                padding: '4px 6px',
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#4A2C17',
                fontSize: '10px'
              }}
            >
              <i className="fa-solid fa-pen"></i>
            </button>
          </div>
        )}
      </td>

      {/* Width MM */}
      <td style={{ width: '85px' }}>
        <input
          type="number"
          placeholder="W (mm)"
          value={item.widthMm || ''}
          onChange={(e) => handleDimensionChange('widthMm', e.target.value)}
        />
      </td>

      {/* Height MM */}
      <td style={{ width: '85px' }}>
        <input
          type="number"
          placeholder="H (mm)"
          value={item.heightMm || ''}
          onChange={(e) => handleDimensionChange('heightMm', e.target.value)}
        />
      </td>

      {/* Total Area */}
      <td style={{ width: '85px' }}>
        <input
          type="number"
          step="any"
          value={item.totalArea ?? ''}
          onChange={(e) => handleAreaChange(e.target.value)}
          style={{ fontWeight: '700', color: '#4A2C17' }}
        />
      </td>

      {/* Unit */}
      <td style={{ width: '90px' }}>
        <select
          value={item.unit || 'Sq.Ft.'}
          onChange={(e) => handleUnitChange(e.target.value)}
        >
          {catalogUnits.map((u, i) => (
            <option key={i} value={u}>{u}</option>
          ))}
        </select>
      </td>

      {/* Rate (₹) */}
      <td style={{ width: '100px' }}>
        <input
          type="number"
          value={item.rate ?? ''}
          onChange={(e) => handleRateChange(e.target.value)}
          style={{ fontWeight: '600' }}
        />
      </td>

      {/* Amount (₹) */}
      <td style={{ width: '120px', fontWeight: '700', color: '#2B2520' }}>
        ₹{(item.amount || 0).toLocaleString('en-IN')}
      </td>

      {/* Delete Row */}
      <td style={{ width: '40px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#B91C1C',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '13px'
          }}
          title="Remove line item"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </td>
    </tr>
  );
};

export default EstimateItemRow;
