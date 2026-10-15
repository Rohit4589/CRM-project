import React from 'react';
import EstimateItemRow from './EstimateItemRow';

const EstimateRoomSection = ({
  room,
  roomIndex,
  catalogProducts,
  catalogDescriptions,
  catalogUnits,
  furnitureTier,
  onRoomChange,
  onRoomDelete
}) => {
  const handleItemChange = (itemIndex, updatedItem) => {
    const updatedItems = [...room.items];
    updatedItems[itemIndex] = updatedItem;

    const newRoomTotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    onRoomChange({
      ...room,
      items: updatedItems,
      roomTotal: newRoomTotal
    });
  };

  const handleAddItem = () => {
    const defaultProduct = catalogProducts[0] || { name: 'CUSTOM ITEM', luxuryModern: 1500 };
    let initialRate = defaultProduct.luxuryModern;
    if (furnitureTier === 'Modern') initialRate = defaultProduct.modern;
    if (furnitureTier === 'Luxury') initialRate = defaultProduct.luxury;

    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      productName: defaultProduct.name || 'NEW ITEM',
      description: defaultProduct.defaultDesc || catalogDescriptions[0] || '',
      widthMm: defaultProduct.defaultW || 1200,
      heightMm: defaultProduct.defaultH || 2100,
      totalArea: 28,
      unit: defaultProduct.defaultUnit || 'Sq.Ft.',
      rate: initialRate || 1500,
      amount: Math.round(28 * (initialRate || 1500))
    };

    const updatedItems = [...room.items, newItem];
    const newRoomTotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    onRoomChange({
      ...room,
      items: updatedItems,
      roomTotal: newRoomTotal
    });
  };

  const handleRemoveItem = (itemIndex) => {
    const updatedItems = room.items.filter((_, idx) => idx !== itemIndex);
    const newRoomTotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    onRoomChange({
      ...room,
      items: updatedItems,
      roomTotal: newRoomTotal
    });
  };

  const handleRoomNameChange = (e) => {
    onRoomChange({
      ...room,
      roomName: e.target.value
    });
  };

  return (
    <div className="room-section">
      <div className="room-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-layer-group" style={{ color: '#4A2C17' }}></i>
          <input
            type="text"
            className="room-title-input"
            value={room.roomName}
            onChange={handleRoomNameChange}
            placeholder="Room Name"
          />
        </div>

        <div className="room-header-actions">
          <span className="room-total-badge">
            Total: ₹{(room.roomTotal || 0).toLocaleString('en-IN')}
          </span>
          <button
            type="button"
            onClick={onRoomDelete}
            style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Delete this room"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="room-items-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Description / Specification</th>
              <th>Width (mm)</th>
              <th>Height (mm)</th>
              <th>Area</th>
              <th>Unit</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(room.items || []).map((item, idx) => (
              <EstimateItemRow
                key={item.id || idx}
                item={item}
                index={idx}
                catalogProducts={catalogProducts}
                catalogDescriptions={catalogDescriptions}
                catalogUnits={catalogUnits}
                furnitureTier={furnitureTier}
                onChange={(updated) => handleItemChange(idx, updated)}
                onRemove={() => handleRemoveItem(idx)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-add-item" onClick={handleAddItem}>
        <i className="fa-solid fa-plus"></i> Add Item to {room.roomName}
      </button>
    </div>
  );
};

export default EstimateRoomSection;
