/**
 * Calculation Utilities for Estimates
 * Matching the exact Excel formulas from "203- SUJATA WARADE.xlsx"
 */
const { PRODUCT_CATALOG, READYMADE_DESCRIPTIONS } = require('../constants/estimateCatalog');

/**
 * Calculate Sq.Ft. Area from MM dimensions
 * Excel Formula: ROUNDUP(Width * Height / 92903, 0)
 */
function calculateArea(widthMm, heightMm, currentArea = 0, unit = 'Sq.Ft.') {
  if (unit === 'Sq.Ft.' && widthMm && heightMm) {
    const rawSqFt = (Number(widthMm) * Number(heightMm)) / 92903;
    return Math.ceil(rawSqFt); // ROUNDUP to next whole integer like Excel
  }
  return Number(currentArea) || 1;
}

/**
 * Find rate for product based on furniture tier
 */
function getRateForTier(productName, tier = 'Luxury-Modern') {
  const product = PRODUCT_CATALOG.find(p => p.name.toUpperCase() === (productName || '').trim().toUpperCase());
  if (!product) return 0;
  
  switch (tier) {
    case 'Modern':
      return product.modern || 0;
    case 'Luxury':
      return product.luxury || 0;
    case 'Luxury-Modern':
    default:
      return product.luxuryModern || 0;
  }
}

/**
 * Find default description and unit for a product
 */
function getProductDefaults(productName) {
  const product = PRODUCT_CATALOG.find(p => p.name.toUpperCase() === (productName || '').trim().toUpperCase());
  if (product) {
    return {
      description: product.defaultDesc || READYMADE_DESCRIPTIONS[0],
      unit: product.defaultUnit || 'Sq.Ft.',
      widthMm: product.defaultW || null,
      heightMm: product.defaultH || null
    };
  }
  return {
    description: READYMADE_DESCRIPTIONS[0],
    unit: 'Sq.Ft.',
    widthMm: null,
    heightMm: null
  };
}

/**
 * Calculate all amounts and subtotals across rooms
 */
function recalculateEstimate(roomsData = [], options = {}) {
  const {
    furnitureLevel = 'Luxury-Modern',
    designFeePct = 10,
    gstPct = 0,
    roundOff = 0
  } = options;

  let grandSubTotal = 0;

  const processedRooms = (roomsData || []).map((room, roomIdx) => {
    let roomTotal = 0;
    const items = (room.items || []).map((item, itemIdx) => {
      const unit = item.unit || 'Sq.Ft.';
      const widthMm = item.widthMm ? Number(item.widthMm) : null;
      const heightMm = item.heightMm ? Number(item.heightMm) : null;
      
      // Calculate area
      let totalArea = Number(item.totalArea);
      if (unit === 'Sq.Ft.' && widthMm && heightMm) {
        totalArea = Math.ceil((widthMm * heightMm) / 92903);
      } else if (!totalArea) {
        totalArea = 1;
      }

      // Calculate rate
      let rate = Number(item.rate);
      if (rate === undefined || rate === null || isNaN(rate) || rate === 0) {
        rate = getRateForTier(item.productName, furnitureLevel);
      }

      const amount = Math.round(totalArea * rate);
      roomTotal += amount;

      return {
        id: item.id || `item_${roomIdx}_${itemIdx}_${Date.now()}`,
        productName: item.productName || 'Custom Item',
        description: item.description || READYMADE_DESCRIPTIONS[0],
        widthMm,
        heightMm,
        totalArea,
        unit,
        rate,
        amount
      };
    });

    grandSubTotal += roomTotal;

    return {
      id: room.id || `room_${roomIdx}_${Date.now()}`,
      roomName: room.roomName || `Room ${roomIdx + 1}`,
      roomTotal,
      items
    };
  });

  const designFeeAmount = Math.round((grandSubTotal * Number(designFeePct || 0)) / 100);
  const taxableTotal = grandSubTotal + designFeeAmount;
  const gstAmount = Math.round((taxableTotal * Number(gstPct || 0)) / 100);
  const finalTotal = Math.round(taxableTotal + gstAmount - Number(roundOff || 0));

  return {
    roomsData: processedRooms,
    subTotal: grandSubTotal,
    designFeePct: Number(designFeePct),
    designFeeAmount,
    gstPct: Number(gstPct),
    gstAmount,
    roundOff: Number(roundOff),
    finalTotal
  };
}

module.exports = {
  calculateArea,
  getRateForTier,
  getProductDefaults,
  recalculateEstimate
};
