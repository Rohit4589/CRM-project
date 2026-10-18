import React from 'react';
import EstimateItemRow from './EstimateItemRow';

const EstimateRoomSection = ({
  room,
  roomIndex,
  catalogProducts,
  catalogDescriptions,
  catalogUnits,
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
    const isEssential = furnitureTier === 'Essential Collection' || furnitureTier === 'Modern';
    const isElite = furnitureTier === 'Elite Collection' || furnitureTier === 'Luxury';

    // Prioritize a product matching this room
    const cleanRoomUpper = (room.roomName || '').trim().toUpperCase();
    const matchingProds = (catalogProducts || []).filter(p => {
      const pCat = (p.category || '').toUpperCase();
      return pCat === cleanRoomUpper ||
        (cleanRoomUpper.includes('BEDROOM') && pCat.includes('BEDROOM')) ||
        (cleanRoomUpper.includes('MASTER') && pCat.includes('BEDROOM')) ||
        (cleanRoomUpper.includes('KID') && pCat.includes('BEDROOM'));
    });

    const defaultProduct = matchingProds[0] || catalogProducts[0] || { name: 'CUSTOM ITEM', signatureRate: 1600 };

    const essentialDesc = defaultProduct.essentialDesc || defaultProduct.defaultDesc || catalogDescriptions[0] || '';
    const signatureDesc = defaultProduct.signatureDesc || defaultProduct.defaultDesc || catalogDescriptions[0] || '';
    const eliteDesc = defaultProduct.eliteDesc || defaultProduct.defaultDesc || catalogDescriptions[0] || '';

    let initialRate = defaultProduct.signatureRate || defaultProduct.luxuryModern || 1600;
    let initialDesc = signatureDesc;

    if (isEssential) {
      initialRate = defaultProduct.essentialRate || defaultProduct.modern || 1200;
      initialDesc = essentialDesc;
    } else if (isElite) {
      initialRate = defaultProduct.eliteRate || defaultProduct.luxury || 2200;
      initialDesc = eliteDesc;
    }

    const defaultW = (defaultProduct.defaultW !== null && defaultProduct.defaultW !== undefined && defaultProduct.defaultW !== '') ? Number(defaultProduct.defaultW) : '';
    const defaultH = (defaultProduct.defaultH !== null && defaultProduct.defaultH !== undefined && defaultProduct.defaultH !== '') ? Number(defaultProduct.defaultH) : '';
    const defaultUnit = defaultProduct.defaultUnit || 'Sq.Ft.';
    let totalArea = 1;
    if (defaultUnit === 'Sq.Ft.' && defaultW && defaultH && Number(defaultW) > 0 && Number(defaultH) > 0) {
      const rawSqFt = (Number(defaultW) * Number(defaultH)) / 92903;
      totalArea = Math.ceil(rawSqFt * 2) / 2;
    }

    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      productName: defaultProduct.name || 'NEW ITEM',
      description: initialDesc,
      essentialDesc,
      signatureDesc,
      eliteDesc,
      widthMm: defaultW,
      heightMm: defaultH,
      totalArea,
      unit: defaultUnit,
      rate: initialRate,
      amount: Math.round(totalArea * initialRate)
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
    <div style={{ marginBottom: '22px' }}>
      <div style={{ overflowX: 'auto' }}>
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
              <th style={{ width: '22%' }}>PRODUCT NAME</th>
              <th style={{ width: '30%', textAlign: 'center' }}>DISCRIPTION</th>
              <th style={{ width: '9%', textAlign: 'center' }}>WIDTH</th>
              <th style={{ width: '9%', textAlign: 'center' }}>HEIGHT</th>
              <th style={{ width: '8%', textAlign: 'center' }}>AREA</th>
              <th style={{ width: '7%', textAlign: 'center' }}>UNIT</th>
              <th style={{ width: '7%', textAlign: 'center' }}>RATE</th>
              <th style={{ width: '8%', textAlign: 'right' }}>AMOUNT</th>
              <th style={{ width: '24px' }}></th>
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
                onChange={(updated) => handleItemChange(idx, updated)}
                onRemove={() => handleRemoveItem(idx)}
              />
            ))}

            {/* Room Total Row matching Photo 1 Preview */}
            <tr className="print-room-total-row editor-sheet-total-row">
              <td colSpan="6" style={{ textAlign: 'right', fontWeight: '700', textTransform: 'uppercase' }}>
                {room.roomName} TOTAL:
              </td>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: '800', color: '#4A2C17', fontSize: '12px' }}>
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
