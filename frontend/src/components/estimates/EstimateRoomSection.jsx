import React from 'react';
import EstimateItemRow from './EstimateItemRow';

const EstimateRoomSection = ({
  room,
  roomIndex,
  catalogProducts,
  catalogDescriptions,
  catalogUnits = ['Sq.Ft.', 'SET', 'Nos', 'RFT.', 'APPROX'],
  furnitureTier,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
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
    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      productName: '',
      description: '',
      essentialDesc: '',
      signatureDesc: '',
      eliteDesc: '',
      essentialRate: 0,
      signatureRate: 0,
      eliteRate: 0,
      widthMm: '',
      heightMm: '',
      totalArea: '',
      unit: 'Sq.Ft.',
      rate: '',
      amount: 0
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

  const handleMoveItemUp = (itemIndex) => {
    if (itemIndex <= 0) return;
    const updatedItems = [...room.items];
    const [movedItem] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(itemIndex - 1, 0, movedItem);

    onRoomChange({
      ...room,
      items: updatedItems
    });
  };

  const handleMoveItemDown = (itemIndex) => {
    if (itemIndex >= room.items.length - 1) return;
    const updatedItems = [...room.items];
    const [movedItem] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(itemIndex + 1, 0, movedItem);

    onRoomChange({
      ...room,
      items: updatedItems
    });
  };

  const handleRoomNameChange = (e) => {
    onRoomChange({
      ...room,
      roomName: e.target.value
    });
  };

  return (
    <div style={{ marginBottom: '22px', position: 'relative' }}>
      <div style={{ overflow: 'visible' }}>
        <table className="print-room-table editor-sheet-table">
          <thead className="print-room-thead">
            {/* Room Title Row matching Photo 1 Preview */}
            <tr className="print-room-title-row editor-sheet-title-row">
              <td colSpan="9">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-layer-group" style={{ color: '#4A2C17', fontSize: '11px' }}></i>
                    <input
                      type="text"
                      value={room.roomName}
                      onChange={handleRoomNameChange}
                      placeholder="ROOM NAME"
                      title="Click to rename room"
                      style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '800',
                        fontSize: '12px',
                        color: '#4A2C17',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        width: '320px',
                        fontFamily: 'inherit',
                        padding: '2px 4px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Move Room Up Button */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={onMoveUp}
                      style={{
                        background: isFirst ? '#F9FAFB' : '#FFFFFF',
                        color: isFirst ? '#9CA3AF' : '#4A2C17',
                        border: '1px solid',
                        borderColor: isFirst ? '#E5E7EB' : '#DCD4CA',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: isFirst ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isFirst ? 0.5 : 1
                      }}
                      title={isFirst ? 'Already at the top' : 'Move room table up'}
                    >
                      <i className="fa-solid fa-arrow-up"></i> Move Up
                    </button>

                    {/* Move Room Down Button */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={onMoveDown}
                      style={{
                        background: isLast ? '#F9FAFB' : '#FFFFFF',
                        color: isLast ? '#9CA3AF' : '#4A2C17',
                        border: '1px solid',
                        borderColor: isLast ? '#E5E7EB' : '#DCD4CA',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: isLast ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isLast ? 0.5 : 1
                      }}
                      title={isLast ? 'Already at the bottom' : 'Move room table down'}
                    >
                      <i className="fa-solid fa-arrow-down"></i> Move Down
                    </button>

                    {/* Delete Room Button */}
                    <button
                      type="button"
                      onClick={onRoomDelete}
                      style={{
                        background: '#FEE2E2',
                        color: '#B91C1C',
                        border: '1px solid #FECACA',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Delete this room"
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete Room
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            {/* Dark Chocolate Header matching Photo 1 Preview */}
            <tr>
              <th style={{ width: '21%' }}>PRODUCT NAME</th>
              <th style={{ width: '29.5%', textAlign: 'center' }}>DISCRIPTION</th>
              <th style={{ width: '8.5%', textAlign: 'center' }}>WIDTH</th>
              <th style={{ width: '8.5%', textAlign: 'center' }}>HEIGHT</th>
              <th style={{ width: '7.5%', textAlign: 'center' }}>AREA</th>
              <th style={{ width: '8.5%', textAlign: 'center' }}>UNIT</th>
              <th style={{ width: '7.5%', textAlign: 'center' }}>RATE</th>
              <th style={{ width: '9%', textAlign: 'right' }}>AMOUNT</th>
              <th style={{ width: '72px', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {(room.items || []).map((item, idx) => (
              <EstimateItemRow
                key={item.id || idx}
                item={item}
                index={idx}
                roomName={room.roomName}
                catalogProducts={catalogProducts}
                catalogDescriptions={catalogDescriptions}
                catalogUnits={catalogUnits}
                furnitureTier={furnitureTier}
                isFirstItem={idx === 0}
                isLastItem={idx === (room.items || []).length - 1}
                onMoveUp={() => handleMoveItemUp(idx)}
                onMoveDown={() => handleMoveItemDown(idx)}
                onChange={(updated) => handleItemChange(idx, updated)}
                onRemove={() => handleRemoveItem(idx)}
              />
            ))}

            {/* Room Total Row matching Photo 1 Preview */}
            <tr className="print-room-total-row editor-sheet-total-row">
              <td colSpan="6" style={{ verticalAlign: 'middle', padding: '8px 12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="print-room-total-badge" style={{
                    background: '#4A2C17',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <i className="fa-solid fa-calculator" style={{ fontSize: '9px' }}></i>
                    TOTAL
                  </span>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '12px',
                    color: '#4A2C17',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase'
                  }}>
                    {room.roomName} TOTAL:
                  </span>
                </div>
              </td>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: '800', color: '#4A2C17', fontSize: '13px', padding: '8px 12px', verticalAlign: 'middle' }}>
                ₹{(Number(room.roomTotal) || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="btn-add-item"
        onClick={handleAddItem}
        style={{
          marginTop: '-4px',
          padding: '5px 12px',
          fontSize: '11.5px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <i className="fa-solid fa-plus"></i> Add Item to {room.roomName}
      </button>
    </div>
  );
};

export default EstimateRoomSection;
