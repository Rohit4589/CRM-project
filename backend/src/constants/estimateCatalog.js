/**
 * Estimate Catalog & Master Data
 * Extracted and calibrated from "203- SUJATA WARADE.xlsx"
 */

const PROJECT_TYPES = ['Residential', 'Commercial'];

const FURNITURE_TIERS = {
  ESSENTIAL: 'Essential Collection',
  SIGNATURE: 'Signature Collection',
  ELITE: 'Elite Collection',
  MODERN: 'Modern',
  LUXURY_MODERN: 'Luxury-Modern',
  LUXURY: 'Luxury'
};

const UNITS = ['Sq.Ft.', 'SET', 'Nos', 'RFT.', 'APPROX'];

const READYMADE_DESCRIPTIONS = [
  'Providing Alternate Commercial Ply, Inside Egg white Laminate & External Regular Colour laminate, With Standard Quality Hardware.',
  'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter / Profile shutter, With Premium Soft-Close Quality Hardware.',
  'Providing Marine HDHMR / BWP Ply, Inside Egg white Laminate & External Veneer Polish / PU Finish, With German Soft-Close Fittings (Hettich/Hafele).',
  'Hettich/Hafele Brand Tandem with base, back sheet and verticle support',
  'ALL SET',
  'APPROX'
];

// Product master with rates for all 3 tiers
const PRODUCT_CATALOG = [
  // Living Room
  { name: 'SHOES RACK', category: 'Living Room', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1800, luxury: 2500, defaultW: 1080, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'TEMPLE', category: 'Living Room', defaultUnit: 'Sq.Ft.', modern: 2200, luxuryModern: 3000, luxury: 4500, defaultW: 400, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'T V UNIT', category: 'Living Room', defaultUnit: 'Sq.Ft.', modern: 900, luxuryModern: 1200, luxury: 1900, defaultW: 3300, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'SAFETY DOOR', category: 'Living Room', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1800, luxury: 2500, defaultW: 1050, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'SWING', category: 'Living Room', defaultUnit: 'SET', modern: 40000, luxuryModern: 60000, luxury: 90000, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[0] },

  // Bedroom Items
  { name: 'WARDROBE', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1800, luxury: 2400, defaultW: 1800, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'LOFT ABOVE WARDROBE', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 1100, luxuryModern: 1500, luxury: 2100, defaultW: 1800, defaultH: 600, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'BED', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 950, luxuryModern: 1300, luxury: 1800, defaultW: 1800, defaultH: 2000, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'MATTRESS', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 350, luxuryModern: 400, luxury: 600, defaultW: 1800, defaultH: 2000, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'STUDY TABLE WITH BOOKS STORAGE', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 1100, luxuryModern: 1500, luxury: 2200, defaultW: 1200, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'BED WALL PANNELING', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 750, luxuryModern: 1000, luxury: 1600, defaultW: 2400, defaultH: 1200, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'SIDE TABLE', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 2200, luxuryModern: 3000, luxury: 4200, defaultW: 750, defaultH: 450, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'SIDE TABLE WITH DRESSING', category: 'Bedroom', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1800, luxury: 2500, defaultW: 900, defaultH: 2220, defaultDesc: READYMADE_DESCRIPTIONS[0] },

  // Kitchen Items
  { name: 'TANDEM DRAWERS', category: 'Kitchen', defaultUnit: 'SET', modern: 7500, luxuryModern: 9500, luxury: 14000, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[3] },
  { name: 'OTTA SHUTTER', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 700, luxuryModern: 950, luxury: 1500, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[1] },
  { name: 'OVERHEAD UNIT', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 1400, luxuryModern: 2000, luxury: 2800, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[2] },
  { name: 'LOFT ABOVE OVERHEAD UNIT', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1800, luxury: 2500, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[1] },
  { name: 'TALL UNIT', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 1400, luxuryModern: 2000, luxury: 2800, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[1] },
  { name: 'ACCESSORIES', category: 'Kitchen', defaultUnit: 'SET', modern: 15000, luxuryModern: 20000, luxury: 32000, defaultW: null, defaultH: null, defaultDesc: 'ALL SET' },
  { name: 'CROCKARY UNIT', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 1400, luxuryModern: 2000, luxury: 2800, defaultW: 800, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'DECORATIVE PARTITION', category: 'Kitchen', defaultUnit: 'Sq.Ft.', modern: 1400, luxuryModern: 2000, luxury: 2800, defaultW: 750, defaultH: 2100, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'FRAME COVERING', category: 'Kitchen', defaultUnit: 'RFT.', modern: 750, luxuryModern: 1000, luxury: 1500, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[0] },

  // Commercial Items
  { name: 'RECEPTION DESK', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 1400, luxuryModern: 2000, luxury: 3000, defaultW: 2400, defaultH: 1050, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'BACKDROP LOGO WALL', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 900, luxuryModern: 1400, luxury: 2200, defaultW: 2400, defaultH: 2400, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'CONFERENCE TABLE', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 1200, luxuryModern: 1800, luxury: 2600, defaultW: 3600, defaultH: 1200, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'EXECUTIVE CABIN TABLE', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 1300, luxuryModern: 1900, luxury: 2800, defaultW: 1800, defaultH: 900, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'CABIN BACK CREDENZA', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 1100, luxuryModern: 1500, luxury: 2200, defaultW: 1800, defaultH: 900, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'WORKSTATION PARTITION', category: 'Commercial', defaultUnit: 'RFT.', modern: 800, luxuryModern: 1200, luxury: 1800, defaultW: null, defaultH: null, defaultDesc: READYMADE_DESCRIPTIONS[0] },
  { name: 'GLASS PARTITION WITH FILM', category: 'Commercial', defaultUnit: 'Sq.Ft.', modern: 750, luxuryModern: 1100, luxury: 1600, defaultW: null, defaultH: null, defaultDesc: 'Toughened glass partition with designer frosted film & hardware' },

  // Miscellaneous & Approx Items
  { name: 'FLOOR COVERING', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 10000, luxuryModern: 15000, luxury: 25000, defaultW: null, defaultH: null, defaultDesc: 'Protective floor covering during work' },
  { name: 'DEBRIS', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 3500, luxuryModern: 5000, luxury: 8000, defaultW: null, defaultH: null, defaultDesc: 'Site debris removal and cleaning' },
  { name: 'PASSAGE JAALI', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 14000, luxuryModern: 20000, luxury: 32000, defaultW: null, defaultH: null, defaultDesc: 'CNC designer jaali cutting & framing' },
  { name: 'BASIN SHUTTER', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 10000, luxuryModern: 15000, luxury: 22000, defaultW: null, defaultH: null, defaultDesc: 'Waterproof vanity shutter under counter' },
  { name: 'TEMPLE JAALI', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 7000, luxuryModern: 10000, luxury: 16000, defaultW: null, defaultH: null, defaultDesc: 'CNC Corian / MDF Jaali for temple' },
  { name: 'CURTAIN FITTING', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 60000, luxuryModern: 100000, luxury: 160000, defaultW: null, defaultH: null, defaultDesc: 'Curtain track channels and installation' },
  { name: 'MISCELLANEOUS EXP.', category: 'Miscellaneous', defaultUnit: 'APPROX', modern: 8000, luxuryModern: 10000, luxury: 18000, defaultW: null, defaultH: null, defaultDesc: 'Hardware consumables and miscellaneous' },

  // Contractor Work
  { name: 'GYPSUM FALSE CEILING', category: 'Contractor Work', defaultUnit: 'APPROX', modern: 70000, luxuryModern: 100000, luxury: 150000, defaultW: null, defaultH: null, defaultDesc: 'APPROX' },
  { name: 'ELECTRIC WORK', category: 'Contractor Work', defaultUnit: 'APPROX', modern: 70000, luxuryModern: 100000, luxury: 150000, defaultW: null, defaultH: null, defaultDesc: 'APPROX' },
  { name: 'PAINTING WORK', category: 'Contractor Work', defaultUnit: 'APPROX', modern: 70000, luxuryModern: 100000, luxury: 150000, defaultW: null, defaultH: null, defaultDesc: 'APPROX' }
];

const DEFAULT_TERMS_CONDITIONS = `1. Taxes & Additional Charges
GST @ 18%, transportation, loading/unloading and applicable local charges (including Mathadi) shall be charged extra at actuals.

2. Maintenance & Service
Complimentary maintenance for 12 months from work completion, covering workmanship-related issues only. Physical damage, misuse, water damage and normal wear and tear are excluded. Thereafter, service charges shall apply at actuals. Hardware and accessories are subject to their respective manufacturers' warranties.

3. Estimation & Price Variation
This quotation is based on approximate measurements and specified materials. Final billing may vary by ±5–10% depending on actual site measurements, material requirements and work executed.

4. Quotation Validity & Price Revision
This quotation is valid for 7 days from the date of issue. Prices are subject to revision after the validity period due to fluctuations in market rates, material costs or other applicable charges. Revised rates shall be confirmed before order acceptance.`;

const DEFAULT_PAYMENT_TERMS = `1) 50% Advance Before Starting The Project.
2) 40% While The Project Is In Process.
3) 10% After Complete The Project.
4) Project Commences After 4 Days Of Receiving The Advance.`;

const DEFAULT_NOTE = 'Note : Any Changes In The Model, Design And Material Specification Made After The Work Is In Process, Will Be Charged Accordingly.';

const DEFAULT_BANK_DETAILS = {
  accountName: 'Modern Interior',
  bankName: 'IndusInd Bank',
  accountNo: '251000000789',
  branch: 'Katraj Pune',
  ifscCode: 'INDB0001665',
  accountType: 'Current A/C',
  gpay: '9552527801',
  gstNo: '27BIPPS2002G1ZA'
};

// Preset default rooms for template generation
const RESIDENTIAL_PRESETS = [
  {
    roomName: 'LIVING ROOM',
    items: [
      { productName: 'SHOES RACK', widthMm: 1081, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'TEMPLE', widthMm: 382, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'T V UNIT', widthMm: 3300, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'SAFETY DOOR', widthMm: 1050, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'SWING', totalArea: 1, unit: 'SET' }
    ]
  },
  {
    roomName: "KID'S ROOM",
    items: [
      { productName: 'WARDROBE', widthMm: 1800, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'LOFT ABOVE WARDROBE', widthMm: 2928, heightMm: 600, unit: 'Sq.Ft.' },
      { productName: 'BED', widthMm: 1200, heightMm: 1900, unit: 'Sq.Ft.' },
      { productName: 'MATTRESS', widthMm: 1200, heightMm: 1900, unit: 'Sq.Ft.' },
      { productName: 'STUDY TABLE WITH BOOKS STORAGE', widthMm: 750, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'BED WALL PANNELING', widthMm: 2690, heightMm: 1500, unit: 'Sq.Ft.' },
      { productName: 'SIDE TABLE', widthMm: 750, heightMm: 450, unit: 'Sq.Ft.' }
    ]
  },
  {
    roomName: 'MASTER ROOM',
    items: [
      { productName: 'WARDROBE', widthMm: 2069, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'LOFT ABOVE WARDROBE', widthMm: 2069, heightMm: 600, unit: 'Sq.Ft.' },
      { productName: 'BED', widthMm: 1800, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'MATTRESS', widthMm: 1800, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'SIDE TABLE WITH DRESSING', widthMm: 900, heightMm: 2220, unit: 'Sq.Ft.' },
      { productName: 'BED WALL PANNELING', widthMm: 2100, heightMm: 1500, unit: 'Sq.Ft.' },
      { productName: 'STUDY TABLE WITH BOOKS STORAGE', widthMm: 1200, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'SIDE TABLE', widthMm: 750, heightMm: 450, unit: 'Sq.Ft.' }
    ]
  },
  {
    roomName: 'KITCHEN',
    items: [
      { productName: 'TANDEM DRAWERS', totalArea: 9, unit: 'SET' },
      { productName: 'OTTA SHUTTER', totalArea: 35, unit: 'Sq.Ft.' },
      { productName: 'OVERHEAD UNIT', totalArea: 17.5, unit: 'Sq.Ft.' },
      { productName: 'LOFT ABOVE OVERHEAD UNIT', totalArea: 17.5, unit: 'Sq.Ft.' },
      { productName: 'TALL UNIT', totalArea: 20, unit: 'Sq.Ft.' },
      { productName: 'ACCESSORIES', totalArea: 1, unit: 'SET' },
      { productName: 'CROCKARY UNIT', widthMm: 800, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'DECORATIVE PARTITION', widthMm: 750, heightMm: 2100, unit: 'Sq.Ft.' },
      { productName: 'FRAME COVERING', totalArea: 30, unit: 'RFT.' }
    ]
  },
  {
    roomName: 'MISCELLANEOUS',
    items: [
      { productName: 'FLOOR COVERING', totalArea: 1, unit: 'APPROX' },
      { productName: 'DEBRIS', totalArea: 1, unit: 'APPROX' },
      { productName: 'PASSAGE JAALI', totalArea: 1, unit: 'APPROX' },
      { productName: 'BASIN SHUTTER', totalArea: 1, unit: 'APPROX' },
      { productName: 'TEMPLE JAALI', totalArea: 1, unit: 'APPROX' },
      { productName: 'CURTAIN FITTING', totalArea: 1, unit: 'APPROX' },
      { productName: 'MISCELLANEOUS EXP.', totalArea: 1, unit: 'APPROX' }
    ]
  },
  {
    roomName: 'CONTRACTOR WORK',
    items: [
      { productName: 'GYPSUM FALSE CEILING', totalArea: 1, unit: 'APPROX' },
      { productName: 'ELECTRIC WORK', totalArea: 1, unit: 'APPROX' },
      { productName: 'PAINTING WORK', totalArea: 1, unit: 'APPROX' }
    ]
  }
];

const COMMERCIAL_PRESETS = [
  {
    roomName: 'RECEPTION & WAITING',
    items: [
      { productName: 'RECEPTION DESK', widthMm: 2400, heightMm: 1050, unit: 'Sq.Ft.' },
      { productName: 'BACKDROP LOGO WALL', widthMm: 2400, heightMm: 2400, unit: 'Sq.Ft.' },
      { productName: 'SHOES RACK', widthMm: 1200, heightMm: 900, unit: 'Sq.Ft.' }
    ]
  },
  {
    roomName: 'CONFERENCE ROOM',
    items: [
      { productName: 'CONFERENCE TABLE', widthMm: 3600, heightMm: 1200, unit: 'Sq.Ft.' },
      { productName: 'T V UNIT', widthMm: 2400, heightMm: 1800, unit: 'Sq.Ft.' },
      { productName: 'GLASS PARTITION WITH FILM', totalArea: 150, unit: 'Sq.Ft.' }
    ]
  },
  {
    roomName: 'MAIN DIRECTOR CABIN',
    items: [
      { productName: 'EXECUTIVE CABIN TABLE', widthMm: 1800, heightMm: 900, unit: 'Sq.Ft.' },
      { productName: 'CABIN BACK CREDENZA', widthMm: 1800, heightMm: 900, unit: 'Sq.Ft.' },
      { productName: 'DECORATIVE PARTITION', widthMm: 1500, heightMm: 2400, unit: 'Sq.Ft.' }
    ]
  },
  {
    roomName: 'PANTRY & DINING',
    items: [
      { productName: 'OTTA SHUTTER', totalArea: 25, unit: 'Sq.Ft.' },
      { productName: 'OVERHEAD UNIT', totalArea: 15, unit: 'Sq.Ft.' },
      { productName: 'TANDEM DRAWERS', totalArea: 4, unit: 'SET' }
    ]
  },
  {
    roomName: 'MISCELLANEOUS & SERVICES',
    items: [
      { productName: 'FLOOR COVERING', totalArea: 1, unit: 'APPROX' },
      { productName: 'DEBRIS', totalArea: 1, unit: 'APPROX' },
      { productName: 'MISCELLANEOUS EXP.', totalArea: 1, unit: 'APPROX' }
    ]
  },
  {
    roomName: 'CONTRACTOR WORK',
    items: [
      { productName: 'GYPSUM FALSE CEILING', totalArea: 1, unit: 'APPROX' },
      { productName: 'ELECTRIC WORK', totalArea: 1, unit: 'APPROX' },
      { productName: 'PAINTING WORK', totalArea: 1, unit: 'APPROX' }
    ]
  }
];

const COLLECTION_MATERIAL_SPECS = {
  'Elite Collection': {
    title: 'Material Specifications – Elite Collection',
    items: [
      { label: '1. Board:', text: 'Standard Brand BWR Grade Full Core Plywood / HDHMR (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Merino / Royale Touche / Greenlam or equivalent premium brand, with Laminate, Acrylic or Veneer finishes (SF/HGL/MR+ as applicable). Selected finishes applied to visible surfaces only; remaining in standard white finish.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White, Fabric Texture or Selected Colour Laminate with Suede Finish, as specified.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability and compatibility with selected finish.' },
      { label: '5. Hinges:', text: 'Onyx / Hettich / Häfele or equivalent premium brand, Soft-Close Hinges.' },
      { label: '6. Scope of Work:', text: 'Includes only specified items, materials, finishes, hardware and work. Any additional work or modifications charged separately.' }
    ],
    note: 'Handles, decorative items, special hardware and accessories are excluded unless specifically mentioned. Soft-close hinges are included as specified above.',
    additionalCharges: 'Any changes in model, design or material specifications, or special colours, premium finishes, veneer polishing or upgrades beyond quoted specifications, made after work is in process shall be charged extra at actual cost difference.'
  },
  'Essential Collection': {
    title: 'Material Specifications – Essential Collection',
    items: [
      { label: '1. Board:', text: 'Standard Brand Pre-Laminated Particle Board (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Prism / Action Tesa or equivalent brand, SF/HGL finish. Selected colour applied to visible surfaces only; remaining in standard white finish.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White Pre-Laminated Board with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx or equivalent brand, Regular (Non-Soft-Close) Hinges.' },
      { label: '6. Scope of Work:', text: 'Includes only explicitly mentioned items, materials, specifications and work. Any additional work charged separately.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned.',
    additionalCharges: 'Any changes in model, design or material specifications, or special colours, finishes or material upgrades beyond standard range, made after work is in process shall be charged extra at actual cost difference.'
  },
  'Signature Collection': {
    title: 'Material Specifications – Signature Collection',
    items: [
      { label: '1. Plywood:', text: 'Standard Brand Alternate Plywood (Standard Thickness).' },
      { label: '2. External Laminate:', text: 'Merino / Greenlam or equivalent brand, SF/HGL finish (₹1,500–₹2,000 per sheet), applied to visible surfaces only.' },
      { label: '3. Internal Laminate:', text: 'Regular Egg White Laminate with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx Brand Regular (Non-Soft-Close) Hinges or equivalent brand.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned in the quotation.',
    additionalCharges: 'Any changes in model, design or material specifications, or laminate selection exceeding the specified price range / requiring special finishes, made after work is in process shall be charged extra at actual cost difference.'
  }
};

module.exports = {
  PROJECT_TYPES,
  FURNITURE_TIERS,
  UNITS,
  READYMADE_DESCRIPTIONS,
  PRODUCT_CATALOG,
  DEFAULT_TERMS_CONDITIONS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_NOTE,
  DEFAULT_BANK_DETAILS,
  RESIDENTIAL_PRESETS,
  COMMERCIAL_PRESETS,
  COLLECTION_MATERIAL_SPECS
};
