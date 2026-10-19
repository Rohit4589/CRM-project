import React, { useState, useEffect, useRef } from 'react';
import EstimateRoomSection from './EstimateRoomSection';
import EstimateSummaryFooter from './EstimateSummaryFooter';
import AddRoomModal from './AddRoomModal';

const EstimateEditorModal = ({
  estimate,
  catalog,
  onSave,
  onClose,
  onPreview,
  saving = false
}) => {
  const modalBodyRef = useRef(null);

  // Always start at the top of the estimate when editor opens
  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, []);
  const [customerName, setCustomerName] = useState(estimate.customer_name || '');
  const [phone, setPhone] = useState(estimate.phone || '');
  const [email, setEmail] = useState(estimate.email || '');
  const [address, setAddress] = useState(estimate.address || '');
  const [date, setDate] = useState(
    estimate.date ? String(estimate.date).split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [projectType, setProjectType] = useState(estimate.project_type || 'Residential');
  const [furnitureLevel, setFurnitureLevel] = useState(() => {
    const fl = estimate.collection_tier || estimate.furniture_level || 'Signature Collection';
    if (fl === 'Modern') return 'Essential Collection';
    if (fl === 'Luxury') return 'Elite Collection';
    if (fl === 'Luxury-Modern') return 'Signature Collection';
    return fl;
  });
  const [status, setStatus] = useState(estimate.status || 'Draft');

  const [rooms, setRooms] = useState(() => {
    if (!estimate.rooms_data) return [];
    if (typeof estimate.rooms_data === 'string') {
      try {
        return JSON.parse(estimate.rooms_data) || [];
      } catch (e) {
        return [];
      }
    }
    return estimate.rooms_data || [];
  });
  const [designFeePct, setDesignFeePct] = useState(estimate.design_fee_pct ?? 10);
  const [gstPct, setGstPct] = useState(estimate.gst_pct ?? 0);
  const [roundOff, setRoundOff] = useState(estimate.round_off ?? 0);
  const [notes, setNotes] = useState(estimate.notes || catalog?.defaultNote || '');
  const [termsConditions, setTermsConditions] = useState(() => {
    const raw = estimate.terms_conditions;
    if (!raw || raw.includes('Laminate Used In Medium Range')) {
      return catalog?.defaultTerms || '';
    }
    return raw;
  });
  const [paymentTerms, setPaymentTerms] = useState(estimate.payment_terms || catalog?.defaultPaymentTerms || '');
  const [bankDetails, setBankDetails] = useState(() => {
    let bd = estimate.bank_details;
    if (typeof bd === 'string') {
      try {
        bd = JSON.parse(bd);
      } catch (e) {
        bd = null;
      }
    }
    const defaultBank = catalog?.defaultBankDetails || {
      accountName: 'Modern Interior',
      bankName: 'IndusInd Bank',
      accountNo: '251000000789',
      branch: 'Katraj Pune',
      ifscCode: 'INDB0001665',
      accountType: 'Current A/C',
      gpay: '9552527801',
      gstNo: '27BIPPS2002G1ZA'
    };
    if (!bd || !bd.bankName || bd.bankName === 'HDFC BANK' || bd.bankName === 'HDFC Bank') {
      return { ...defaultBank, ...(bd || {}), bankName: 'IndusInd Bank', accountName: 'Modern Interior', accountNo: '251000000789', branch: 'Katraj Pune', ifscCode: 'INDB0001665', accountType: 'Current A/C', gpay: '9552527801', gstNo: '27BIPPS2002G1ZA' };
    }
    return bd;
  });
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  // Handle tier rate & description switch across existing items with per-collection memory
  const handleTierChange = (newTier) => {
    const oldTier = furnitureLevel;
    setFurnitureLevel(newTier);
    if (!catalog?.products) return;

    const isOldEssential = oldTier === 'Essential Collection' || oldTier === 'Modern';
    const isOldElite = oldTier === 'Elite Collection' || oldTier === 'Luxury';

    const isNewEssential = newTier === 'Essential Collection' || newTier === 'Modern';
    const isNewElite = newTier === 'Elite Collection' || newTier === 'Luxury';

    const updatedRooms = rooms.map(room => ({
      ...room,
      items: (room.items || []).map(item => {
        const prod = catalog.products.find(p => p.name.toUpperCase() === (item.productName || '').toUpperCase());

        // Snapshot current description into old tier's memory
        let curEssentialDesc = item.essentialDesc !== undefined ? item.essentialDesc : (prod?.essentialDesc || '');
        let curSignatureDesc = item.signatureDesc !== undefined ? item.signatureDesc : (prod?.signatureDesc || '');
        let curEliteDesc = item.eliteDesc !== undefined ? item.eliteDesc : (prod?.eliteDesc || '');

        if (isOldEssential) {
          curEssentialDesc = item.description || curEssentialDesc;
        } else if (isOldElite) {
          curEliteDesc = item.description || curEliteDesc;
        } else {
          curSignatureDesc = item.description || curSignatureDesc;
        }

        // Determine rate and description for the new tier
        let newRate = prod ? (prod.signatureRate || prod.luxuryModern || 1600) : item.rate;
        let newDesc = curSignatureDesc || prod?.signatureDesc || prod?.defaultDesc || item.description;

        if (isNewEssential) {
          newRate = prod ? (prod.essentialRate || prod.modern || 1200) : item.rate;
          newDesc = curEssentialDesc || prod?.essentialDesc || prod?.defaultDesc || item.description;
        } else if (isNewElite) {
          newRate = prod ? (prod.eliteRate || prod.luxury || 2200) : item.rate;
          newDesc = curEliteDesc || prod?.eliteDesc || prod?.defaultDesc || item.description;
        }

        const newAmount = Math.round((Number(item.totalArea) || 1) * (Number(newRate) || 0));
        return {
          ...item,
          rate: newRate,
          description: newDesc,
          essentialDesc: curEssentialDesc,
          signatureDesc: curSignatureDesc,
          eliteDesc: curEliteDesc,
          amount: newAmount
        };
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

  const handleMoveRoom = (roomIndex, direction) => {
    const targetIndex = direction === 'up' ? roomIndex - 1 : roomIndex + 1;
    if (targetIndex < 0 || targetIndex >= rooms.length) return;

    setRooms(prev => {
      const next = [...prev];
      const [moved] = next.splice(roomIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleAddNewRooms = (newRoomsList) => {
    setRooms(prev => [...prev, ...newRoomsList]);
  };

  const handlePreviewDraft = () => {
    const subTotal = rooms.reduce((sum, r) => sum + (Number(r.roomTotal) || 0), 0);
    const designFeeAmount = Math.round((subTotal * Number(designFeePct || 0)) / 100);
    const taxableAmount = subTotal + designFeeAmount;
    const gstAmount = Math.round((taxableAmount * Number(gstPct || 0)) / 100);
    const finalTotal = Math.round(taxableAmount + gstAmount - Number(roundOff || 0));

    const draft = {
      ...estimate,
      customer_name: customerName,
      phone,
      email,
      address,
      date,
      project_type: projectType,
      furniture_level: furnitureLevel,
      status,
      rooms_data: rooms,
      sub_total: subTotal,
      design_fee_pct: designFeePct,
      design_fee_amount: designFeeAmount,
      gst_pct: gstPct,
      gst_amount: gstAmount,
      round_off: roundOff,
      final_total: finalTotal,
      notes,
      terms_conditions: termsConditions,
      payment_terms: paymentTerms,
      bank_details: bankDetails
    };

    if (onPreview) {
      onPreview(draft);
    }
  };

  // Intercept Ctrl+P inside the editor so user gets the finalized A4 bill rather than raw form inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        handlePreviewDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    customerName,
    phone,
    email,
    address,
    date,
    projectType,
    furnitureLevel,
    status,
    rooms,
    designFeePct,
    gstPct,
    roundOff,
    notes,
    termsConditions,
    paymentTerms,
    bankDetails,
    estimate,
    onPreview
  ]);

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
      collection_tier: furnitureLevel,
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

  // Comprehensive Keyboard Navigation (Arrow Keys up/down/left/right, Enter, and Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. ESCAPE: Close modal / cancel confirmation
      if (e.key === 'Escape') {
        if (roomToDelete) {
          e.stopPropagation();
          setRoomToDelete(null);
          return;
        }
        if (showAddRoomModal) {
          e.stopPropagation();
          setShowAddRoomModal(false);
          return;
        }
        // If a catalog dropdown or floating suggestion is currently open, let its own handler dismiss it
        const hasOpenPopup = modalBodyRef.current?.querySelector('.catalog-dropdown-popup, .product-suggestions-menu');
        if (hasOpenPopup) {
          return;
        }
        if (onClose) {
          onClose();
        }
        return;
      }

      // 2. CTRL+S / CMD+S: Quick Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const fakeEvent = { preventDefault: () => {} };
        handleSaveSubmit(fakeEvent);
        return;
      }

      // 3. ARROW KEYS & ENTER navigation
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        return;
      }

      const target = e.target;
      if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      // Skip arrow navigation inside search boxes or popups
      if (target.getAttribute('placeholder')?.includes('search') || target.closest('.catalog-dropdown-popup')) {
        return;
      }

      // Special case: multiline textarea (like Notes or Terms), let arrow keys move within text unless at boundaries
      if (target.tagName === 'TEXTAREA') {
        if (e.key === 'ArrowUp' && target.selectionStart > 0) return;
        if (e.key === 'ArrowDown' && target.selectionEnd < target.value.length) return;
      }

      // Check if target is inside an item table row (EstimateItemRow)
      const currentTr = target.closest('tr[data-nav-row="true"]');
      if (currentTr) {
        const currentCol = parseInt(target.getAttribute('data-col') ?? '-1', 10);
        const allRows = Array.from(modalBodyRef.current?.querySelectorAll('tr[data-nav-row="true"]') || []);
        const currentRowIndex = allRows.indexOf(currentTr);

        // DOWN or ENTER: move to same column in next row
        if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          if (currentRowIndex < allRows.length - 1) {
            const nextRow = allRows[currentRowIndex + 1];
            const nextTarget = nextRow.querySelector(`[data-col="${currentCol}"]`) || nextRow.querySelector('[data-nav-item="true"]');
            if (nextTarget) {
              nextTarget.focus();
              nextTarget.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              nextTarget.select?.();
            }
          } else {
            // Reached last row, move to first footer field
            const footerInput = modalBodyRef.current?.querySelector('.grand-totals-grid input, .grand-totals-grid select');
            if (footerInput) {
              footerInput.focus();
              footerInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              footerInput.select?.();
            }
          }
          return;
        }

        // UP or SHIFT+ENTER: move to same column in previous row
        if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
          e.preventDefault();
          if (currentRowIndex > 0) {
            const prevRow = allRows[currentRowIndex - 1];
            const prevTarget = prevRow.querySelector(`[data-col="${currentCol}"]`) || prevRow.querySelector('[data-nav-item="true"]');
            if (prevTarget) {
              prevTarget.focus();
              prevTarget.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              prevTarget.select?.();
            }
          } else {
            // Reached first row, move to last header field
            const headerInputs = Array.from(modalBodyRef.current?.querySelectorAll('.editor-header-fields input, .editor-header-fields select') || []);
            if (headerInputs.length > 0) {
              const lastHeader = headerInputs[headerInputs.length - 1];
              lastHeader.focus();
              lastHeader.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              lastHeader.select?.();
            }
          }
          return;
        }

        // RIGHT ARROW: move to next column in current row, or wrap to next row
        if (e.key === 'ArrowRight') {
          let canMoveRight = false;
          try {
            if (target.type === 'number' || target.tagName === 'SELECT') {
              canMoveRight = true;
            } else if (typeof target.selectionEnd === 'number') {
              const isAllSelected = target.selectionStart === 0 && target.selectionEnd === target.value.length;
              const isAtEnd = target.selectionEnd === target.value.length;
              canMoveRight = isAllSelected || isAtEnd;
            } else {
              canMoveRight = true;
            }
          } catch {
            canMoveRight = true;
          }

          if (canMoveRight) {
            e.preventDefault();
            const nextColInput = currentTr.querySelector(`[data-col="${currentCol + 1}"]`);
            if (nextColInput) {
              nextColInput.focus();
              nextColInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              nextColInput.select?.();
            } else if (currentRowIndex < allRows.length - 1) {
              const nextRow = allRows[currentRowIndex + 1];
              const firstColInput = nextRow.querySelector('[data-col="0"]') || nextRow.querySelector('[data-nav-item="true"]');
              if (firstColInput) {
                firstColInput.focus();
                firstColInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                firstColInput.select?.();
              }
            }
          }
          return;
        }

        // LEFT ARROW: move to previous column in current row, or wrap to previous row
        if (e.key === 'ArrowLeft') {
          let canMoveLeft = false;
          try {
            if (target.type === 'number' || target.tagName === 'SELECT') {
              canMoveLeft = true;
            } else if (typeof target.selectionStart === 'number') {
              const isAllSelected = target.selectionStart === 0 && target.selectionEnd === target.value.length;
              const isAtStart = target.selectionStart === 0;
              canMoveLeft = isAllSelected || isAtStart;
            } else {
              canMoveLeft = true;
            }
          } catch {
            canMoveLeft = true;
          }

          if (canMoveLeft) {
            e.preventDefault();
            const prevColInput = currentTr.querySelector(`[data-col="${currentCol - 1}"]`);
            if (prevColInput) {
              prevColInput.focus();
              prevColInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
              prevColInput.select?.();
            } else if (currentRowIndex > 0) {
              const prevRow = allRows[currentRowIndex - 1];
              const lastColInput = prevRow.querySelector('[data-col="6"]') || prevRow.querySelector('[data-nav-item="true"]:last-of-type');
              if (lastColInput) {
                lastColInput.focus();
                lastColInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                lastColInput.select?.();
              }
            }
          }
          return;
        }
      }

      // If outside table grid: Header fields, Footer fields, or general form fields
      const allFormInputs = Array.from(modalBodyRef.current?.querySelectorAll(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      ) || []);
      const currentIndex = allFormInputs.indexOf(target);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (currentIndex < allFormInputs.length - 1) {
          const nextInput = allFormInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
          nextInput.select?.();
        }
        return;
      }

      if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevInput = allFormInputs[currentIndex - 1];
          prevInput.focus();
          prevInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
          prevInput.select?.();
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        let canMove = false;
        try {
          if (target.type === 'number' || target.tagName === 'SELECT') canMove = true;
          else if (target.selectionEnd === target.value.length || (target.selectionStart === 0 && target.selectionEnd === target.value.length)) canMove = true;
        } catch { canMove = true; }
        if (canMove && currentIndex < allFormInputs.length - 1) {
          e.preventDefault();
          const nextInput = allFormInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
          nextInput.select?.();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        let canMove = false;
        try {
          if (target.type === 'number' || target.tagName === 'SELECT') canMove = true;
          else if (target.selectionStart === 0 || (target.selectionStart === 0 && target.selectionEnd === target.value.length)) canMove = true;
        } catch { canMove = true; }
        if (canMove && currentIndex > 0) {
          e.preventDefault();
          const prevInput = allFormInputs[currentIndex - 1];
          prevInput.focus();
          prevInput.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
          prevInput.select?.();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomToDelete, showAddRoomModal, onClose, customerName, phone, email, address, date, projectType, furnitureLevel, status, rooms, designFeePct, gstPct, roundOff, notes, termsConditions, paymentTerms, bankDetails]);

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

        <form ref={modalBodyRef} onSubmit={handleSaveSubmit} className="estimate-modal-body">
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
              <label>Furniture Collection (Package)</label>
              <select
                value={furnitureLevel}
                onChange={(e) => handleTierChange(e.target.value)}
                style={{ fontWeight: '700', color: '#4A2C17' }}
              >
                <option value="Essential Collection">🥉 Essential Collection</option>
                <option value="Signature Collection">🥈 Signature Collection</option>
                <option value="Elite Collection">🥇 Elite Collection</option>
              </select>
            </div>

            <div className="editor-field">
              <label>Folder Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Running">Running</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
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
              style={{ padding: '7px 16px', fontSize: '12.5px', gap: '6px' }}
              onClick={() => setShowAddRoomModal(true)}
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
              catalogUnits={Array.from(new Set([...(catalog?.units || []), 'Sq.Ft.', 'SET', 'Nos', 'RFT.', 'APPROX']))}
              furnitureTier={furnitureLevel}
              isFirst={roomIdx === 0}
              isLast={roomIdx === rooms.length - 1}
              onMoveUp={() => handleMoveRoom(roomIdx, 'up')}
              onMoveDown={() => handleMoveRoom(roomIdx, 'down')}
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
            furnitureTier={furnitureLevel}
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
              type="button"
              className="btn-action-icon"
              style={{
                width: 'auto',
                padding: '10px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                color: '#4A2C17',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={handlePreviewDraft}
              title="Preview finalized A4 bill & Print without editing controls"
            >
              <i className="fa-solid fa-file-invoice"></i> Preview & Print
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

      {/* Add Room Modal (Presets & Custom) */}
      <AddRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        catalog={catalog}
        projectType={projectType}
        existingRooms={rooms}
        furnitureTier={furnitureLevel}
        onAddRooms={handleAddNewRooms}
      />
    </div>
  );
};

export default EstimateEditorModal;
