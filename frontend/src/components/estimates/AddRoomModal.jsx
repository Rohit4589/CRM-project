import React, { useState, useEffect } from 'react';

const AddRoomModal = ({
  isOpen,
  onClose,
  catalog,
  projectType = 'Residential',
  existingRooms = [],
  furnitureTier = 'Luxury-Modern',
  onAddRooms
}) => {
  const [selectedPresetNames, setSelectedPresetNames] = useState([]);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [loadPresets, setLoadPresets] = useState(true);

  // Existing room names (normalized uppercase)
  const existingNames = (existingRooms || []).map(r => (r.roomName || '').trim().toUpperCase());

  // Get available presets for this project type
  const presets = projectType === 'Commercial'
    ? (catalog?.commercialPresets || [])
    : (catalog?.residentialPresets || []);

  // Standard fallback list if catalog presets are empty
  const defaultList = projectType === 'Commercial'
    ? [
        { roomName: 'RECEPTION & WAITING', items: [{ productName: 'RECEPTION TABLE', widthMm: 1800, heightMm: 750, totalArea: 15 }] },
        { roomName: 'CONFERENCE ROOM', items: [{ productName: 'CONFERENCE TABLE', widthMm: 3000, heightMm: 1200, totalArea: 40 }] },
        { roomName: 'MAIN DIRECTOR CABIN', items: [{ productName: 'MAIN DIRECTOR TABLE', widthMm: 2100, heightMm: 900, totalArea: 21 }] },
        { roomName: 'PANTRY & DINING', items: [{ productName: 'PANTRY COUNTER', widthMm: 2400, heightMm: 600, totalArea: 16 }] },
        { roomName: 'MISCELLANEOUS & SERVICES', items: [{ productName: 'STORAGE UNIT', widthMm: 1800, heightMm: 2100, totalArea: 42 }] },
        { roomName: 'CONTRACTOR WORK', items: [{ productName: 'PARTITION WALL', widthMm: 3000, heightMm: 2700, totalArea: 90 }] }
      ]
    : [
        { roomName: 'LIVING ROOM', items: [{ productName: 'T V UNIT', widthMm: 3300, heightMm: 2100, totalArea: 75 }, { productName: 'SHOES RACK', widthMm: 1081, heightMm: 2100, totalArea: 25 }] },
        { roomName: 'MASTER ROOM', items: [{ productName: 'SLIDING WARDROBE', widthMm: 2100, heightMm: 2400, totalArea: 54 }, { productName: 'KING BED WITH STORAGE', totalArea: 1 }] },
        { roomName: "KID'S ROOM", items: [{ productName: 'OPENING WARDROBE', widthMm: 1800, heightMm: 2100, totalArea: 42 }, { productName: 'STUDY TABLE', widthMm: 1200, heightMm: 750, totalArea: 10 }] },
        { roomName: "PARENT'S ROOM", items: [{ productName: 'OPENING WARDROBE', widthMm: 1800, heightMm: 2100, totalArea: 42 }, { productName: 'QUEEN BED', totalArea: 1 }] },
        { roomName: 'KITCHEN', items: [{ productName: 'MODULAR KITCHEN TROLLEYS', totalArea: 1 }, { productName: 'OVERHEAD CABINET', widthMm: 2400, heightMm: 600, totalArea: 16 }] },
        { roomName: 'MISCELLANEOUS', items: [{ productName: 'DRESSING UNIT', widthMm: 600, heightMm: 1800, totalArea: 12 }] },
        { roomName: 'CONTRACTOR WORK', items: [{ productName: 'POP / FALSE CEILING', totalArea: 1 }] }
      ];

  const availablePresets = presets.length > 0 ? presets : defaultList;

  // Reset selections when opening modal
  useEffect(() => {
    if (isOpen) {
      setSelectedPresetNames([]);
      setCustomRoomInput('');
      setLoadPresets(true);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const togglePreset = (roomName) => {
    const upper = roomName.toUpperCase();
    if (existingNames.includes(upper)) return; // already in estimate

    setSelectedPresetNames(prev =>
      prev.includes(upper) ? prev.filter(n => n !== upper) : [...prev, upper]
    );
  };

  const handleSelectAllMissing = () => {
    const missing = availablePresets
      .map(p => p.roomName.toUpperCase())
      .filter(name => !existingNames.includes(name));
    setSelectedPresetNames(missing);
  };

  const handleDeselectAll = () => {
    setSelectedPresetNames([]);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();

    const roomsToAdd = [...selectedPresetNames];
    if (customRoomInput.trim()) {
      const customName = customRoomInput.trim().toUpperCase();
      if (!roomsToAdd.includes(customName)) {
        roomsToAdd.push(customName);
      }
    }

    if (roomsToAdd.length === 0) {
      alert('Please select at least one room or enter a custom room name.');
      return;
    }

    // Generate room objects with items and tier rates
    const timestamp = Date.now();
    const newRooms = roomsToAdd.map((roomName, rIdx) => {
      const foundPreset = availablePresets.find(p => p.roomName.toUpperCase() === roomName.toUpperCase());
      const presetItems = (foundPreset && loadPresets) ? (foundPreset.items || []) : [];

      let items = presetItems.map((pi, iIdx) => {
        const catalogProd = (catalog?.products || []).find(
          p => p.name.toUpperCase() === pi.productName.toUpperCase()
        );

        const isEssential = furnitureTier === 'Essential Collection' || furnitureTier === 'Modern';
        const isElite = furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury';

        const essentialDesc = catalogProd?.essentialDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[0] || '';
        const signatureDesc = catalogProd?.signatureDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[1] || '';
        const eliteDesc = catalogProd?.eliteDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[2] || '';

        let rate = catalogProd ? (catalogProd.signatureRate || catalogProd.luxuryModern || 1600) : 1500;
        let description = signatureDesc;

        if (isEssential) {
          rate = catalogProd ? (catalogProd.essentialRate || catalogProd.modern || 1200) : 1200;
          description = essentialDesc;
        } else if (isElite) {
          rate = catalogProd ? (catalogProd.eliteRate || catalogProd.luxury || 2200) : 2200;
          description = eliteDesc;
        }

        const unit = pi.unit || catalogProd?.defaultUnit || 'Sq.Ft.';
        const w = (pi.widthMm !== null && pi.widthMm !== undefined && pi.widthMm !== '') ? Number(pi.widthMm) : '';
        const h = (pi.heightMm !== null && pi.heightMm !== undefined && pi.heightMm !== '') ? Number(pi.heightMm) : '';
        let totalArea = pi.totalArea || 1;
        if (unit === 'Sq.Ft.' && w && h && Number(w) > 0 && Number(h) > 0) {
          const rawSqFt = (Number(w) * Number(h)) / 92903;
          totalArea = Math.ceil(rawSqFt * 2) / 2;
        }

        const amount = Math.round(totalArea * rate);

        return {
          id: `item_${timestamp}_${rIdx}_${iIdx}`,
          productName: pi.productName,
          description,
          essentialDesc,
          signatureDesc,
          eliteDesc,
          widthMm: w,
          heightMm: h,
          totalArea,
          unit,
          rate,
          amount,
          essentialRate: catalogProd?.essentialRate || catalogProd?.modern || 1200,
          signatureRate: catalogProd?.signatureRate || catalogProd?.luxuryModern || 1600,
          eliteRate: catalogProd?.eliteRate || catalogProd?.luxury || 2200
        };
      });

      // If preset didn't have items, check dynamic catalog products assigned to this room category
      if (items.length === 0 && loadPresets) {
        const catObj = (catalog?.categories || []).find(
          c => (c.name || '').trim().toUpperCase() === roomName.toUpperCase()
        );
        const matchingCatalog = (catalog?.products || []).filter(p => {
          if (catObj && Array.isArray(catObj.product_ids) && catObj.product_ids.length > 0) {
            return catObj.product_ids.includes(p.id);
          }
          const catNames = (Array.isArray(p.category_names) && p.category_names.length > 0)
            ? p.category_names.map(c => (c || '').toUpperCase())
            : [(p.category || '').toUpperCase()].filter(Boolean);
          return catNames.includes(roomName.toUpperCase());
        });

        if (matchingCatalog.length > 0) {
          const isEssential = furnitureTier === 'Essential Collection' || furnitureTier === 'Modern';
          const isElite = furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury';

          items = matchingCatalog.map((p, iIdx) => {
            const essentialDesc = p.essentialDesc || p.defaultDesc || '';
            const signatureDesc = p.signatureDesc || p.defaultDesc || '';
            const eliteDesc = p.eliteDesc || p.defaultDesc || '';

            let rate = p.signatureRate || p.luxuryModern || 1600;
            let description = signatureDesc;

            if (isEssential) {
              rate = p.essentialRate || p.modern || 1200;
              description = essentialDesc;
            } else if (isElite) {
              rate = p.eliteRate || p.luxury || 2200;
              description = eliteDesc;
            }

            const unit = p.defaultUnit || 'Sq.Ft.';
            const w = (p.defaultW !== null && p.defaultW !== undefined && p.defaultW !== '') ? Number(p.defaultW) : '';
            const h = (p.defaultH !== null && p.defaultH !== undefined && p.defaultH !== '') ? Number(p.defaultH) : '';
            let totalArea = 1;
            if (unit === 'Sq.Ft.' && w && h && Number(w) > 0 && Number(h) > 0) {
              const rawSqFt = (Number(w) * Number(h)) / 92903;
              totalArea = Math.ceil(rawSqFt * 2) / 2;
            }

            const amount = Math.round(totalArea * rate);

            return {
              id: `item_${timestamp}_${rIdx}_${iIdx}`,
              productName: p.name,
              description,
              essentialDesc,
              signatureDesc,
              eliteDesc,
              widthMm: w,
              heightMm: h,
              totalArea,
              unit,
              rate,
              amount,
              essentialRate: p.essentialRate || p.modern || 1200,
              signatureRate: p.signatureRate || p.luxuryModern || 1600,
              eliteRate: p.eliteRate || p.luxury || 2200
            };
          });
        }
      }

      // If still no items generated (e.g. custom room or user chose blank), provide a starter item
      if (items.length === 0) {
        const defaultProd = catalog?.products?.[0] || { name: 'FURNITURE ITEM', signatureRate: 1600 };
        const isEssential = furnitureTier === 'Essential Collection' || furnitureTier === 'Modern';
        const isElite = furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury';

        const essentialDesc = defaultProd.essentialDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[0] || '';
        const signatureDesc = defaultProd.signatureDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[1] || '';
        const eliteDesc = defaultProd.eliteDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[2] || '';

        let rate = defaultProd.signatureRate || defaultProd.luxuryModern || 1600;
        let description = signatureDesc;

        if (isEssential) {
          rate = defaultProd.essentialRate || defaultProd.modern || 1200;
          description = essentialDesc;
        } else if (isElite) {
          rate = defaultProd.eliteRate || defaultProd.luxury || 2200;
          description = eliteDesc;
        }

        const defaultW = (defaultProd.defaultW !== null && defaultProd.defaultW !== undefined && defaultProd.defaultW !== '') ? Number(defaultProd.defaultW) : '';
        const defaultH = (defaultProd.defaultH !== null && defaultProd.defaultH !== undefined && defaultProd.defaultH !== '') ? Number(defaultProd.defaultH) : '';
        let totalArea = 1;
        if (defaultW && defaultH && Number(defaultW) > 0 && Number(defaultH) > 0) {
          const rawSqFt = (Number(defaultW) * Number(defaultH)) / 92903;
          totalArea = Math.ceil(rawSqFt * 2) / 2;
        }

        items.push({
          id: `item_${timestamp}_${rIdx}_0`,
          productName: defaultProd.name || 'FURNITURE / UNIT',
          description,
          essentialDesc,
          signatureDesc,
          eliteDesc,
          widthMm: defaultW,
          heightMm: defaultH,
          totalArea,
          unit: defaultProd.defaultUnit || 'Sq.Ft.',
          rate,
          amount: Math.round(totalArea * rate)
        });
      }

      const roomTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

      return {
        id: `room_${timestamp}_${rIdx}`,
        roomName,
        roomTotal,
        items
      };
    });

    onAddRooms(newRooms);
    onClose();
  };

  const totalSelectedCount = selectedPresetNames.length + (customRoomInput.trim() ? 1 : 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(30, 24, 20, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(30, 20, 10, 0.22)',
          border: '1.5px solid #D1C2AF',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.22s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: '#FAF8F5',
            borderBottom: '1px solid #EAE4DD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1F1A17', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-shapes" style={{ color: '#4A2C17' }}></i>
              Add Rooms to Estimate
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#7D6C5E' }}>
              Select missing room presets or enter custom rooms with automatic furniture costing.
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
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleAddSubmit} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Quick Select Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A2C17', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              1. Choose Preset Rooms ({projectType})
            </span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <button
                type="button"
                onClick={handleSelectAllMissing}
                style={{ background: 'none', border: 'none', color: '#4A2C17', cursor: 'pointer', fontWeight: '700' }}
              >
                Select Missing
              </button>
              <span style={{ color: '#DCD4CA' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ background: 'none', border: 'none', color: '#8C827A', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Preset Rooms Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '22px' }}>
            {availablePresets.map((preset) => {
              const upper = preset.roomName.toUpperCase();
              const isAlreadyIn = existingNames.includes(upper);
              const isSelected = selectedPresetNames.includes(upper);
              const itemCount = preset.items ? preset.items.length : 0;

              return (
                <div
                  key={upper}
                  onClick={() => !isAlreadyIn && togglePreset(upper)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: isAlreadyIn
                      ? '#E2E8F0'
                      : (isSelected ? '#4A2C17' : '#E5D9C5'),
                    background: isAlreadyIn
                      ? '#F8FAFC'
                      : (isSelected ? '#F6EFE9' : '#FFFFFF'),
                    cursor: isAlreadyIn ? 'not-allowed' : 'pointer',
                    opacity: isAlreadyIn ? 0.65 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(74, 44, 23, 0.12)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isAlreadyIn || isSelected}
                        disabled={isAlreadyIn}
                        onChange={() => {}}
                        style={{ cursor: isAlreadyIn ? 'not-allowed' : 'pointer' }}
                      />
                      <strong style={{ fontSize: '13px', color: isAlreadyIn ? '#64748B' : (isSelected ? '#4A2C17' : '#1F1A17') }}>
                        {preset.roomName}
                      </strong>
                    </div>

                    {isAlreadyIn && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#166534',
                        background: '#DCFCE7',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        ✓ In Estimate
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#8C827A', paddingLeft: '24px' }}>
                    {itemCount} standard furniture items
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Room Option */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#4A2C17', marginBottom: '6px' }}>
              2. Or Add a Custom Room Name (Optional)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. POOJA ROOM, BALCONY, TERRACE, SERVANT ROOM..."
                value={customRoomInput}
                onChange={(e) => setCustomRoomInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1.5px solid #D1C2AF',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  textTransform: 'uppercase'
                }}
              />
            </div>
            <div style={{ fontSize: '11.5px', color: '#7D6C5E', marginTop: '4px' }}>
              Custom rooms are generated with starter dimensions ready for customization.
            </div>
          </div>

          {/* Pricing Options */}
          <div style={{
            background: '#FAF8F5',
            border: '1px solid #EAE4DD',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '10px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={loadPresets}
                onChange={(e) => setLoadPresets(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <div>
                <strong style={{ fontSize: '13px', color: '#2B2520' }}>
                  Auto-load preset furniture items with {furnitureTier} rates
                </strong>
                <div style={{ fontSize: '11.5px', color: '#7D6C5E' }}>
                  Automatically generates standard items (wardrobe, bed, unit, cabinets) with current tier rates. Uncheck to add completely blank rooms.
                </div>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #EAE4DD',
              marginTop: '16px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #DCD4CA',
                background: '#FAF8F5',
                color: '#5C5248',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={totalSelectedCount === 0}
              className="btn-create-estimate"
              style={{
                opacity: totalSelectedCount === 0 ? 0.55 : 1,
                cursor: totalSelectedCount === 0 ? 'not-allowed' : 'pointer',
                padding: '10px 22px'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add {totalSelectedCount > 0 ? `${totalSelectedCount} Room${totalSelectedCount > 1 ? 's' : ''}` : 'Rooms'} to Estimate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal;
