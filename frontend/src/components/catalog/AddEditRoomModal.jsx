import React, { useState, useEffect } from 'react';

const AddEditRoomModal = ({ room, onClose, onSave, saving = false }) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setProjectType(room.project_type || 'Residential');
      setDisplayOrder(room.display_order || 0);
    } else {
      setName('');
      setProjectType('Residential');
      setDisplayOrder(0);
    }
    setError('');
  }, [room]);

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
      display_order: parseInt(displayOrder, 10) || 0
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
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(43, 37, 32, 0.18)',
          border: '1px solid #EAE4DD',
          animation: 'fadeInScale 0.18s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2B2520' }}>
              {room ? 'Edit Room Category' : 'Add New Room Category'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#8C827A' }}>
              Categories group furniture items and appear in the estimate room selection.
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
              padding: '4px 8px'
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
            borderRadius: '6px',
            fontSize: '12.5px',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '6px' }}>
              Room / Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. MASTER BEDROOM, KID'S ROOM, POOJA ROOM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #DCD4CA',
                borderRadius: '8px',
                fontSize: '13.5px',
                background: '#FAF8F5',
                color: '#2B2520',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '6px' }}>
                Project Scope
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
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
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4A3E36', marginBottom: '6px' }}>
                Display Priority
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #DCD4CA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#FAF8F5',
                  color: '#2B2520',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
