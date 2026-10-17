import React, { useState, useEffect } from 'react';

const EstimateWizardModal = ({
  sites = [],
  catalog,
  estimates = [],
  onClose,
  onProceed
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [furnitureLevel, setFurnitureLevel] = useState('Luxury-Modern');
  const [existingEstimate, setExistingEstimate] = useState(null);
  const [copyExisting, setCopyExisting] = useState(true);

  // Custom room adding state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');

  // Helper to get rooms checklist from dynamic catalog categories
  const getCategoriesForType = (type) => {
    if (catalog?.categories && catalog.categories.length > 0) {
      const filtered = catalog.categories.filter(c =>
        c.project_type === type || c.project_type === 'Both' || !c.project_type
      );
      if (filtered.length > 0) {
        return filtered.map(c => ({ name: c.name, checked: true }));
      }
    }
    // Fallback if catalog not yet loaded
    return type === 'Residential'
      ? [
          { name: 'LIVING ROOM', checked: true },
          { name: "KID'S ROOM", checked: true },
          { name: "PARENT'S ROOM", checked: true },
          { name: 'MASTER ROOM', checked: true },
          { name: 'KITCHEN', checked: true },
          { name: 'MISCELLANEOUS', checked: true },
          { name: 'CONTRACTOR WORK', checked: true }
        ]
      : [
          { name: 'RECEPTION & WAITING', checked: true },
          { name: 'CONFERENCE ROOM', checked: true },
          { name: 'MAIN DIRECTOR CABIN', checked: true },
          { name: 'PANTRY & DINING', checked: true },
          { name: 'MISCELLANEOUS & SERVICES', checked: true },
          { name: 'CONTRACTOR WORK', checked: true }
        ];
  };

  const [selectedRooms, setSelectedRooms] = useState(() => getCategoriesForType('Residential'));

  // Update rooms if catalog loads or project type changes
  useEffect(() => {
    setSelectedRooms(getCategoriesForType(projectType));
  }, [catalog, projectType]);

  // When project type toggles, reset rooms
  const handleTypeSelect = (type) => {
    setProjectType(type);
    setShowCustomInput(false);
    setCustomRoomName('');
    setSelectedRooms(getCategoriesForType(type));
  };

  // Handle site selection and auto-fill customer info + detect previous bill
  const handleSiteSelect = (e) => {
    const siteVal = e.target.value;
    setSelectedSiteId(siteVal);

    if (!siteVal) {
      setCustomerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setOrderNo('');
      setExistingEstimate(null);
      return;
    }

    const site = sites.find(s => 
      String(s.dbId || s.id) === String(siteVal) ||
      String(s.siteRef || s.site_ref) === String(siteVal) ||
      String(s.id) === String(siteVal)
    );

    if (site) {
      const rawRef = site.siteRef || site.site_ref || site.siteCode || site.id;
      const match = String(rawRef || '').match(/\d+/);
      const oNum = match ? (parseInt(match[0], 10) < 1000 ? String(parseInt(match[0], 10)).padStart(3, '0') : match[0]) : String(rawRef || '');
      setOrderNo(oNum);
      const cName = site.customerName || site.customer_name || '';
      setCustomerName(cName);
      setPhone(site.phone || '');
      setEmail(site.email || '');
      setAddress(site.fullAddress || site.full_address || site.location || '');

      // Check for existing estimates matching site_id or order_no or customer_name
      const sId = site.dbId || site.id;
      const cleanName = cName.replace(/-\d+$/, '').toLowerCase().trim();
      const matching = (estimates || []).filter(est =>
        (est.site_id && String(est.site_id) === String(sId)) ||
        (est.site_ref && String(est.site_ref) === String(oNum)) ||
        (est.customer_name && est.customer_name.replace(/-\d+$/, '').toLowerCase().trim() === cleanName)
      );

      if (matching.length > 0) {
        const latest = [...matching].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
        setExistingEstimate(latest);
        setCopyExisting(true);
        if (latest.project_type) setProjectType(latest.project_type);
        if (latest.furniture_level) setFurnitureLevel(latest.furniture_level);
      } else {
        setExistingEstimate(null);
      }
    }
  };

  // Toggle room checked state
  const handleRoomToggle = (roomName) => {
    setSelectedRooms(prev =>
      prev.map(r => r.name === roomName ? { ...r, checked: !r.checked } : r)
    );
  };

  // Add custom manual room
  const handleAddCustomRoom = () => {
    const name = customRoomName.trim().toUpperCase();
    if (!name) return;

    if (selectedRooms.some(r => r.name.toUpperCase() === name)) {
      alert('This room is already in the list!');
      return;
    }

    setSelectedRooms(prev => [...prev, { name, checked: true, isCustom: true }]);
    setCustomRoomName('');
    setShowCustomInput(false);
  };

  // Remove a custom manual room
  const handleRemoveCustomRoom = (name) => {
    setSelectedRooms(prev => prev.filter(r => r.name !== name));
  };

  const handleSelectAll = (checkAll) => {
    setSelectedRooms(prev => prev.map(r => ({ ...r, checked: checkAll })));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a customer name');
      return;
    }

    if (!selectedSiteId) {
      alert('Please select a registered site customer. Estimates can only be generated for existing site customers.');
      return;
    }

    const activeRooms = selectedRooms.filter(r => r.checked).map(r => r.name);
    if (!copyExisting && activeRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }

    onProceed({
      site_id: selectedSiteId ? parseInt(selectedSiteId, 10) : null,
      order_no: orderNo,
      site_ref: orderNo,
      customer_name: customerName,
      phone,
      email,
      address,
      date: new Date().toISOString().split('T')[0],
      project_type: projectType,
      furniture_level: furnitureLevel,
      activeRooms,
      copyExisting: Boolean(copyExisting && existingEstimate),
      existingEstimate: (copyExisting && existingEstimate) ? existingEstimate : null
    });
  };

  const hasNoSites = !sites || sites.length === 0;

  return (
    <div className="estimate-modal-overlay">
      <div className="estimate-modal">
        <div className="estimate-modal-header">
          <h2>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#4A2C17' }}></i>
            Create New Estimate
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="estimate-modal-body">
          {/* Customer / Site Selection */}
          <div className="wizard-section-title">1. Site / Customer Selection (Mandatory)</div>
          
          {hasNoSites ? (
            <div style={{
              padding: '24px',
              background: '#FEF3C7',
              border: '1.5px solid #FCD34D',
              borderRadius: '10px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '32px', color: '#D97706', marginBottom: '10px' }}></i>
              <h3 style={{ margin: '0 0 6px 0', color: '#92400E', fontSize: '16px' }}>No Registered Sites Found</h3>
              <p style={{ margin: 0, color: '#B45309', fontSize: '13px', lineHeight: '1.5' }}>
                Estimates can only be generated for registered site customers. Please create a Site under the <strong>Sites</strong> tab first before generating an estimate.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div className="editor-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontWeight: '700', color: '#4A2C17', fontSize: '13px' }}>
                  Select Registered Site / Customer *
                </label>
                <select
                  value={selectedSiteId}
                  onChange={handleSiteSelect}
                  required
                  style={{
                    border: '2px solid #4A2C17',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    padding: '10px 12px',
                    background: '#FAF8F5'
                  }}
                >
                  <option value="" disabled>-- Select Existing Site / Customer --</option>
                  {sites.map(s => {
                    const rawRef = s.siteRef || s.site_ref || s.siteCode || s.id;
                    const match = String(rawRef || '').match(/\d+/);
                    let ref = rawRef;
                    if (match) {
                      const num = parseInt(match[0], 10);
                      ref = num < 1000 ? String(num).padStart(3, '0') : String(num);
                    } else {
                      ref = String(rawRef || '').replace(/^SITE-/i, '');
                    }
                    const name = s.customerName || s.customer_name || 'Customer';
                    const val = s.dbId || s.id;
                    const statusText = s.status || 'Running';
                    return (
                      <option key={val} value={val}>
                        Order #{ref} · {name} ({statusText})
                      </option>
                    );
                  })}
                </select>
                <div style={{ fontSize: '11px', color: '#7D6C5E', marginTop: '4px' }}>
                  ℹ️ Estimates are strictly linked to registered site customers and their order folders.
                </div>
              </div>

              <div className="editor-field">
                <label>Linked Order Number</label>
                <input
                  type="text"
                  readOnly
                  style={{ background: '#FAF8F5', fontWeight: '700', color: '#4A2C17' }}
                  value={orderNo ? `Order #${orderNo}` : '-- (Auto-assigned from Site)'}
                />
              </div>

              <div className="editor-field">
                <label>Customer Name</label>
                <input
                  type="text"
                  readOnly
                  style={{ background: '#FAF8F5', fontWeight: '700', color: '#1F1A17' }}
                  value={customerName || '-- (Auto-filled from Site)'}
                />
              </div>

              <div className="editor-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  readOnly
                  style={{ background: '#FAF8F5' }}
                  value={phone || '--'}
                />
              </div>

              <div className="editor-field">
                <label>Site Address / Location</label>
                <input
                  type="text"
                  readOnly
                  style={{ background: '#FAF8F5' }}
                  value={address || '--'}
                />
              </div>
            </div>
          )}

          {/* Existing Estimate Detection Alert */}
          {existingEstimate && (
            <div className="wizard-existing-alert">
              <div className="wizard-existing-header">
                <div className="wizard-existing-icon">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                  <h4>Previous Bill Found: Order #{existingEstimate.site_ref || existingEstimate.estimate_number}</h4>
                  <p>
                    Customer: <strong>{existingEstimate.customer_name}</strong> · Total:{' '}
                    <strong style={{ color: '#2E7D32' }}>
                      ₹{Number(existingEstimate.final_total || 0).toLocaleString('en-IN')}
                    </strong>{' '}
                    {existingEstimate.date && `· (${new Date(existingEstimate.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`}
                  </p>
                </div>
              </div>

              <div className="wizard-existing-options">
                <label className={`wizard-choice-card ${copyExisting ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="copyChoice"
                    checked={copyExisting}
                    onChange={() => setCopyExisting(true)}
                  />
                  <div>
                    <strong>Copy previous bill's rooms, custom items & rates (Recommended)</strong>
                    <small>
                      Loads all {existingEstimate.rooms_data?.length || 0} customized rooms, items, and dimensions so you can make quick revisions without retyping.
                    </small>
                  </div>
                </label>

                <label className={`wizard-choice-card ${!copyExisting ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="copyChoice"
                    checked={!copyExisting}
                    onChange={() => setCopyExisting(false)}
                  />
                  <div>
                    <strong>Start fresh from blank room templates</strong>
                    <small>Ignores previous bill items and generates standard default room presets.</small>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Project Type Selection */}
          <div className="wizard-section-title">2. Select Project Type</div>
          <div className="type-selection-grid">
            <div
              className={`type-card ${projectType === 'Residential' ? 'selected' : ''}`}
              onClick={() => handleTypeSelect('Residential')}
            >
              <div className="type-card-icon">
                <i className="fa-solid fa-house-chimney"></i>
              </div>
              <div className="type-card-info">
                <h4>Residential Project</h4>
                <p>Apartments, Villas, Living, Bedrooms & Kitchen</p>
              </div>
            </div>

            <div
              className={`type-card ${projectType === 'Commercial' ? 'selected' : ''}`}
              onClick={() => handleTypeSelect('Commercial')}
            >
              <div className="type-card-icon">
                <i className="fa-solid fa-building"></i>
              </div>
              <div className="type-card-info">
                <h4>Commercial Project</h4>
                <p>Offices, Cabins, Conference Rooms & Receptions</p>
              </div>
            </div>
          </div>

          {/* Furniture Level Selection */}
          <div className="wizard-section-title">3. Select Furniture Level (Pricing Tier)</div>
          <div className="tier-selection-grid">
            <div
              className={`tier-card ${furnitureLevel === 'Modern' ? 'selected' : ''}`}
              onClick={() => setFurnitureLevel('Modern')}
            >
              <div className="tier-badge">Budget-Friendly</div>
              <h4>Modern</h4>
              <div className="tier-price">₹800 – ₹1,300 / Sq.Ft.</div>
              <p>Commercial ply, regular hardware, standard laminates</p>
            </div>

            <div
              className={`tier-card ${furnitureLevel === 'Luxury-Modern' ? 'selected' : ''}`}
              onClick={() => setFurnitureLevel('Luxury-Modern')}
            >
              <div className="tier-badge" style={{ background: '#92400E' }}>Most Popular</div>
              <h4>Luxury-Modern</h4>
              <div className="tier-price">₹1,200 – ₹1,800 / Sq.Ft.</div>
              <p>Alternate ply, egg-white inner, premium hardware & acrylic</p>
            </div>

            <div
              className={`tier-card ${furnitureLevel === 'Luxury' ? 'selected' : ''}`}
              onClick={() => setFurnitureLevel('Luxury')}
            >
              <div className="tier-badge" style={{ background: '#6B21A8' }}>High-End</div>
              <h4>Luxury</h4>
              <div className="tier-price">₹1,800 – ₹2,500+ / Sq.Ft.</div>
              <p>BWR/Marine ply, veneer polish, German soft-close fittings</p>
            </div>
          </div>

          {/* Section 4: Rooms to Include */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div className="wizard-section-title" style={{ margin: 0 }}>4. Rooms to Include</div>
            {!copyExisting && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  style={{ background: 'none', border: 'none', color: '#4A2C17', cursor: 'pointer', fontWeight: '700' }}
                >
                  Select All
                </button>
                <span style={{ color: '#DCD4CA' }}>|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  style={{ background: 'none', border: 'none', color: '#8C827A', cursor: 'pointer' }}
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {copyExisting && existingEstimate ? (
            <div style={{
              background: '#FAF8F5',
              border: '1px solid #EAE4DD',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A2C17', fontWeight: '600', fontSize: '13px', marginBottom: '8px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#2E7D32' }}></i>
                <span>Loading {existingEstimate.rooms_data?.length || 0} existing rooms from previous bill:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(existingEstimate.rooms_data || []).map((r, i) => (
                  <span key={i} style={{
                    background: '#F6EFE9',
                    color: '#4A2C17',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid #E5D9C5'
                  }}>
                    {r.roomName} ({r.items?.length || 0} items)
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8C827A', marginTop: '8px' }}>
                All customized furniture items, dimensions, and rates will be loaded ready to edit or adjust.
              </div>
            </div>
          ) : (
            <div className="room-checkbox-grid">
              {selectedRooms.map((room) => (
              <div
                key={room.name}
                className={`room-checkbox-item ${room.checked ? 'checked' : ''}`}
                onClick={() => handleRoomToggle(room.name)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={room.checked}
                    onChange={() => {}} // event handled by parent div
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{room.name}</span>
                </div>

                {room.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomRoom(room.name);
                    }}
                    title="Remove custom room"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#B91C1C',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '13px'
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            ))}

            {/* + Add Custom Room button / input */}
            {showCustomInput ? (
              <div
                className="room-checkbox-item"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#4A2C17',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <input
                  type="text"
                  placeholder="ROOM NAME (e.g. POOJA ROOM)..."
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRoom();
                    }
                  }}
                  autoFocus
                  style={{
                    border: '1px solid #DCD4CA',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    flex: 1,
                    textTransform: 'uppercase',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomRoom}
                  style={{
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomRoomName('');
                  }}
                  style={{
                    background: '#EAE4DD',
                    color: '#5C5248',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="room-checkbox-item"
                onClick={() => setShowCustomInput(true)}
                style={{
                  border: '1px dashed #4A2C17',
                  background: '#FDFBF7',
                  color: '#4A2C17',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-plus" style={{ fontSize: '13px' }}></i>
                <span>Add Room</span>
              </button>
            )}
          </div>
        )}

          <div className="estimate-modal-footer" style={{ padding: '16px 0 0 0', background: 'transparent' }}>
            <button type="button" className="btn-action-icon" style={{ width: 'auto', padding: '10px 18px' }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-estimate"
              disabled={hasNoSites || !selectedSiteId}
              style={{
                opacity: (hasNoSites || !selectedSiteId) ? 0.55 : 1,
                cursor: (hasNoSites || !selectedSiteId) ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fa-solid fa-arrow-right"></i>
              <span>Generate & Edit Estimate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EstimateWizardModal;
