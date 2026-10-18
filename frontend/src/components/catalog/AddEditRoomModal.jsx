import React, { useState, useEffect, useMemo } from 'react';

const AddEditRoomModal = ({ room, allProducts = [], onClose, onSave, saving = false }) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setProjectType(room.project_type || 'Residential');
      setDisplayOrder(room.display_order || 0);

      // Initialize selected product IDs from room.product_ids or find by category name
      if (Array.isArray(room.product_ids) && room.product_ids.length > 0) {
        setSelectedProductIds(room.product_ids);
      } else {
        const matchingIds = allProducts
          .filter(p => (p.category_name || p.resolved_category_name || '').toUpperCase() === (room.name || '').toUpperCase())
          .map(p => p.id);
        setSelectedProductIds(matchingIds);
      }
    } else {
      setName('');
      setProjectType('Residential');
      setDisplayOrder(0);
      setSelectedProductIds([]);
    }
    setSearchQuery('');
    setError('');
  }, [room, allProducts]);

  // Toggle product selection
  const handleToggleProduct = (prodId) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  // Quick remove product
  const handleRemoveProduct = (prodId) => {
    setSelectedProductIds(prev => prev.filter(id => id !== prodId));
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.unit || '').toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  // Separate into selected and unselected lists
  const selectedProductsList = useMemo(() => {
    const idSet = new Set(selectedProductIds);
    return allProducts.filter(p => idSet.has(p.id));
  }, [allProducts, selectedProductIds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a room or category name');
      return;
    }

    onSave({
      ...(room ? { id: room.id } : {}),
      name: name.trim().toUpperCase(),
      project_type: projectType,
      display_order: parseInt(displayOrder, 10) || 0,
      product_ids: selectedProductIds
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
        padding: '16px'
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
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(43, 37, 32, 0.22)',
          border: '1px solid #EAE4DD',
          animation: 'fadeInScale 0.18s ease-out',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2B2520' }}>
              {room ? 'Edit Room Category' : 'Add New Room Category'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#8C827A' }}>
              Configure room details and select standard furniture items.
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
            fontSize: '12.5px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Scrollable Form Body */}
          <div style={{ overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
            {/* Room Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '6px' }}>
                Room / Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. MASTER BEDROOM, LIVING ROOM, OFFICE WORK, POOJA ROOM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #4A2C17',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  background: '#FFFDF9',
                  color: '#2B2520',
                  textTransform: 'uppercase',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Scope & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                  Project Scope
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Both">Both (Universal)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4A3E36', marginBottom: '5px' }}>
                  Display Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #DCD4CA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    color: '#2B2520',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Included Furniture Items Section */}
            <div style={{ borderTop: '1px solid #EAE4DD', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#4A2C17', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-couch"></i>
                  <span>Included Furniture Items ({selectedProductIds.length})</span>
                </label>
                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#B91C1C',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      padding: 0
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Item Chips */}
              <div style={{
                minHeight: '44px',
                maxHeight: '110px',
                overflowY: 'auto',
                padding: '8px',
                background: '#FAF8F5',
                borderRadius: '8px',
                border: '1px solid #EAE4DD',
                marginBottom: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center'
              }}>
                {selectedProductsList.length === 0 ? (
                  <span style={{ fontSize: '11.5px', color: '#8C827A', fontStyle: 'italic' }}>
                    No items selected yet. Click any product below to add it to this room.
                  </span>
                ) : (
                  selectedProductsList.map(prod => (
                    <span
                      key={prod.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#4A2C17',
                        color: '#FFFFFF',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.3px'
                      }}
                    >
                      {prod.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(prod.id)}
                        title={`Remove ${prod.name}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.25)',
                          border: 'none',
                          color: '#FFFFFF',
                          borderRadius: '50%',
                          width: '15px',
                          height: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Product Search & Picker */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <i
                    className="fa-solid fa-magnifying-glass"
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      color: '#8C827A'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search master products to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 30px',
                      border: '1px solid #DCD4CA',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Master Products List (Click to Add / Remove) */}
              <div style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid #EAE4DD',
                borderRadius: '6px',
                background: '#FFFFFF'
              }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '11.5px', color: '#8C827A' }}>
                    No products found matching "{searchQuery}".
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderBottom: '1px solid #F4EFEA',
                          cursor: 'pointer',
                          background: isSelected ? '#F4EFEA' : '#FFFFFF',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by container click
                            style={{ cursor: 'pointer', accentColor: '#4A2C17' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '600', color: '#2B2520' }}>
                            {prod.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#8C827A', fontWeight: '500' }}>
                          {prod.unit || 'Sq.Ft.'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  <span>{room ? 'Update Room' : 'Add Room'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditRoomModal;
