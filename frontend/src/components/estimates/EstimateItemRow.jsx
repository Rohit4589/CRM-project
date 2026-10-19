import React, { useState } from 'react';

const EstimateItemRow = ({
  item,
  index,
  roomName = '',
  catalogProducts = [],
  catalogDescriptions = [],
  catalogUnits = ['Sq.Ft.', 'SET', 'RFT.', 'APPROX'],
  furnitureTier = 'Signature Collection',
  isFirstItem = false,
  isLastItem = false,
  onMoveUp,
  onMoveDown,
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
  const [isCustomDesc, setIsCustomDesc] = useState(false);

  // Extract unique categories from catalog products, putting current room's category first
  const cleanRoomUpper = (roomName || '').trim().toUpperCase();
  const rawCats = Array.from(new Set(catalogProducts.map(p => p.category || 'General')));
  const categories = rawCats.sort((a, b) => {
    const aMatch = a.toUpperCase() === cleanRoomUpper;
    const bMatch = b.toUpperCase() === cleanRoomUpper;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return a.localeCompare(b);
  });

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
    const updated = { ...item, [field]: value !== '' ? Number(value) : '' };
    
    // Auto-calculate area if unit is Sq.Ft. with 0.5 step roundup
    if (updated.unit === 'Sq.Ft.' && updated.widthMm && updated.heightMm && Number(updated.widthMm) > 0 && Number(updated.heightMm) > 0) {
      const rawSqFt = (Number(updated.widthMm) * Number(updated.heightMm)) / 92903;
      updated.totalArea = Math.ceil(rawSqFt * 2) / 2;
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
    if (val === 'Sq.Ft.' && updated.widthMm && updated.heightMm && Number(updated.widthMm) > 0 && Number(updated.heightMm) > 0) {
      const rawSqFt = (Number(updated.widthMm) * Number(updated.heightMm)) / 92903;
      updated.totalArea = Math.ceil(rawSqFt * 2) / 2;
    }
    updated.amount = Math.round((Number(updated.totalArea) || 1) * (Number(updated.rate) || 0));
    onChange(updated);
  };

  return (
    <tr>
      {/* Product Name Column - Directly Editable for this bill + Catalog Dropdown */}
      <td style={{ fontWeight: '600' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
          <input
            type="text"
            value={item.productName || ''}
            placeholder="PRODUCT NAME..."
            onChange={(e) => onChange({ ...item, productName: e.target.value.toUpperCase() })}
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: '700',
              textTransform: 'uppercase',
              color: '#000000',
              padding: '4px 6px',
              border: '1px solid #DCD4CA',
              borderRadius: '4px',
              fontSize: '11px',
              background: '#FFFFFF'
            }}
            title="Click to edit product name for this estimate only"
          />
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              title="Pick product from catalog"
              style={{
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                borderRadius: '4px',
                color: '#4A2C17',
                cursor: 'pointer',
                padding: '4px 6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                width: '26px'
              }}
            >
              <i className="fa-solid fa-list"></i>
            </button>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleProductSelect(e.target.value);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              title="Select from product catalog to auto-fill specs & rates"
            >
              <option value="" disabled>-- Select Catalog Product --</option>
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
            </select>
          </div>
        </div>
      </td>

      {/* Description / Specification Column - Centered Multi-line Paragraph */}
      <td style={{ textAlign: 'center' }}>
        {isCustomDesc ? (
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <textarea
              rows={2}
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
              value={item.description || ''}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setIsCustomDesc(true);
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
          placeholder="-"
          value={item.widthMm || ''}
          onChange={(e) => handleDimensionChange('widthMm', e.target.value)}
          style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}
        />
      </td>

      {/* Height (MM) - Centered matching Photo 1 */}
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          placeholder="-"
          value={item.heightMm || ''}
          onChange={(e) => handleDimensionChange('heightMm', e.target.value)}
          style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}
        />
      </td>

      {/* Total Area - Centered & Bold matching Photo 1 */}
      <td style={{ textAlign: 'center', fontWeight: '700' }}>
        <input
          type="number"
          step="any"
          value={item.totalArea ?? ''}
          onChange={(e) => handleAreaChange(e.target.value)}
          style={{ textAlign: 'center', fontWeight: '700', color: '#000000' }}
        />
      </td>

      {/* Unit - Centered matching Photo 1 */}
      <td style={{ textAlign: 'center' }}>
        <select
          value={item.unit || 'Sq.Ft.'}
          onChange={(e) => handleUnitChange(e.target.value)}
          style={{ textAlign: 'center', cursor: 'pointer', color: '#000000', fontWeight: '600' }}
        >
          {catalogUnits.map((u, i) => (
            <option key={i} value={u}>{u}</option>
          ))}
        </select>
      </td>

      {/* Rate - Centered */}
      <td style={{ textAlign: 'center' }}>
        <input
          type="number"
          value={item.rate ?? ''}
          onChange={(e) => handleRateChange(e.target.value)}
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
