import React, { useState } from 'react';
import EstimateRoomSection from './EstimateRoomSection';
import EstimateSummaryFooter from './EstimateSummaryFooter';

const EstimateEditorModal = ({
  estimate,
  catalog,
  onSave,
  onClose,
  saving = false
}) => {
  const [customerName, setCustomerName] = useState(estimate.customer_name || '');
  const [phone, setPhone] = useState(estimate.phone || '');
  const [email, setEmail] = useState(estimate.email || '');
  const [address, setAddress] = useState(estimate.address || '');
  const [date, setDate] = useState(estimate.date || new Date().toISOString().split('T')[0]);
  const [projectType, setProjectType] = useState(estimate.project_type || 'Residential');
  const [furnitureLevel, setFurnitureLevel] = useState(estimate.furniture_level || 'Luxury-Modern');
  const [status, setStatus] = useState(estimate.status || 'Draft');

  const [rooms, setRooms] = useState(estimate.rooms_data || []);
  const [designFeePct, setDesignFeePct] = useState(estimate.design_fee_pct ?? 10);
  const [gstPct, setGstPct] = useState(estimate.gst_pct ?? 0);
  const [roundOff, setRoundOff] = useState(estimate.round_off ?? 0);
  const [notes, setNotes] = useState(estimate.notes || catalog?.defaultNote || '');
  const [termsConditions, setTermsConditions] = useState(estimate.terms_conditions || catalog?.defaultTerms || '');
  const [paymentTerms, setPaymentTerms] = useState(estimate.payment_terms || catalog?.defaultPaymentTerms || '');
  const [bankDetails, setBankDetails] = useState(estimate.bank_details || catalog?.defaultBankDetails || {});
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Handle tier rate switch across existing items if desired
  const handleTierChange = (newTier) => {
    setFurnitureLevel(newTier);
    if (!catalog?.products) return;

    // Optional confirmation or automatic update of default rates
    const updatedRooms = rooms.map(room => ({
      ...room,
      items: (room.items || []).map(item => {
        const prod = catalog.products.find(p => p.name.toUpperCase() === item.productName.toUpperCase());
        if (prod) {
          let newRate = prod.luxuryModern;
          if (newTier === 'Modern') newRate = prod.modern;
          if (newTier === 'Luxury') newRate = prod.luxury;
          const newAmount = Math.round((Number(item.totalArea) || 1) * newRate);
          return { ...item, rate: newRate, amount: newAmount };
        }
        return item;
      })
    }));

    // Recalculate room totals
    const recalculated = updatedRooms.map(r => ({
      ...r,
      roomTotal: r.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
    }));

    setRooms(recalculated);
  };

  const handleRoomChange = (roomIndex, updatedRoom) => {
    const updated = [...rooms];
    updated[roomIndex] = updatedRoom;
    setRooms(updated);
  };

  const handleRoomDelete = (roomIndex) => {
    if (!rooms[roomIndex]?.items || rooms[roomIndex].items.length === 0) {
      setRooms(rooms.filter((_, idx) => idx !== roomIndex));
    } else {
      setRoomToDelete(roomIndex);
    }
  };

  const handleAddCustomRoom = () => {
    const roomName = window.prompt('Enter new room name:', 'EXTRA ROOM');
    if (roomName && roomName.trim()) {
      const newRoom = {
        id: `room_${Date.now()}`,
        roomName: roomName.trim().toUpperCase(),
        roomTotal: 0,
        items: []
      };
      setRooms([...rooms, newRoom]);
    }
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    onSave({
      id: estimate.id,
      site_id: estimate.site_id,
      order_no: estimate.order_no || estimate.site_ref,
      site_ref: estimate.site_ref || estimate.order_no,
      customer_name: customerName,
      phone,
      email,
      address,
      date,
      project_type: projectType,
      furniture_level: furnitureLevel,
      status,
      rooms_data: rooms,
      design_fee_pct: designFeePct,
      gst_pct: gstPct,
      round_off: roundOff,
      notes,
      terms_conditions: termsConditions,
      payment_terms: paymentTerms,
      bank_details: bankDetails
    });
  };

  return (
    <div className="estimate-modal-overlay">
      <div className="estimate-modal modal-large">
        <div className="estimate-modal-header">
          <h2>
            <i className="fa-solid fa-pen-ruler" style={{ color: '#4A2C17' }}></i>
            {estimate.id
              ? `Edit Estimate: ${estimate.estimate_number || ''}`
              : (estimate.is_revision
                  ? `Create Next Bill / Revision (Order #${estimate.order_no || estimate.site_ref || ''})`
                  : 'New Estimate Editor')}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSaveSubmit} className="estimate-modal-body">
          {/* Header Customer & Tier Config */}
          <div className="editor-header-fields">
            <div className="editor-field">
              <label>Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="editor-field">
              <label>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="editor-field">
              <label>Site Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="editor-field">
              <label>Estimate Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="editor-field">
              <label>Furniture Level (Rate Tier)</label>
              <select
                value={furnitureLevel}
                onChange={(e) => handleTierChange(e.target.value)}
              >
                <option value="Modern">Modern (Standard)</option>
                <option value="Luxury-Modern">Luxury-Modern (Default)</option>
                <option value="Luxury">Luxury (Premium)</option>
              </select>
            </div>

            <div className="editor-field">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Rooms Sections */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#2B2520' }}>
              Project Rooms & Furniture Specification
            </h3>
            <button
              type="button"
              className="btn-create-estimate"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={handleAddCustomRoom}
            >
              <i className="fa-solid fa-plus"></i> Add New Room
            </button>
          </div>

          {rooms.map((room, roomIdx) => (
            <EstimateRoomSection
              key={room.id || roomIdx}
              room={room}
              roomIndex={roomIdx}
              catalogProducts={catalog?.products || []}
              catalogDescriptions={catalog?.readymadeDescriptions || []}
              catalogUnits={catalog?.units || []}
              furnitureTier={furnitureLevel}
              onRoomChange={(updated) => handleRoomChange(roomIdx, updated)}
              onRoomDelete={() => handleRoomDelete(roomIdx)}
            />
          ))}

          {/* Summary Footer */}
          <EstimateSummaryFooter
            rooms={rooms}
            designFeePct={designFeePct}
            setDesignFeePct={setDesignFeePct}
            gstPct={gstPct}
            setGstPct={setGstPct}
            roundOff={roundOff}
            setRoundOff={setRoundOff}
            notes={notes}
            setNotes={setNotes}
            termsConditions={termsConditions}
            setTermsConditions={setTermsConditions}
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            bankDetails={bankDetails}
            setBankDetails={setBankDetails}
          />

          <div className="estimate-modal-footer">
            <button
              type="button"
              className="btn-action-icon"
              style={{ width: 'auto', padding: '10px 18px' }}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-estimate"
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> Save Estimate
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Room Confirmation Modal */}
      {roomToDelete !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(30, 24, 20, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRoomToDelete(null);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px 22px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(43, 37, 32, 0.18)',
              border: '1px solid #EAE4DD',
              animation: 'fadeInScale 0.18s ease-out'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                margin: '0 auto 14px auto'
              }}
            >
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700', color: '#2B2520' }}>
              Delete {rooms[roomToDelete]?.roomName || 'Room'}?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#7A6F66', lineHeight: '1.4' }}>
              This will remove this entire room and all its furniture items from this estimate.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                style={{
                  flex: 1,
                  padding: '9px 16px',
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
                type="button"
                onClick={() => {
                  setRooms(rooms.filter((_, idx) => idx !== roomToDelete));
                  setRoomToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-trash-can"></i>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateEditorModal;
