/**
 * Estimate Catalog & Master Data
 * Extracted and calibrated from "203- SUJATA WARADE.xlsx"
 */

const PROJECT_TYPES = ['Residential', 'Commercial'];

const FURNITURE_TIERS = {
  MODERN: 'Modern',
  LUXURY_MODERN: 'Luxury-Modern',
  LUXURY: 'Luxury'
};

const UNITS = ['Sq.Ft.', 'SET', 'RFT.', 'APPROX'];

const READYMADE_DESCRIPTIONS = [
  'Providing Alternate Ply, Inside Egg white Laminate & External Regular Colour laminate, With Premium Quality Hardware.',
  'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter, With Premium Quality Hardware.',
  'Providing BWR Ply, Inside Egg white Laminate & External ACRYLIC Shutter/ Profile shutter, With Premium Quality Hardware.',
  'Hettich/Hafele Brand Tandem with base, back sheet and verticle support',
  'Providing Commercial Ply with veneer polish finish & soft-close German hardware.',
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

const DEFAULT_TERMS_CONDITIONS = `1) Laminate Used In Medium Range i.e. 1500-2000 Per Sheet.
2) GST 18% Extra.
3) Maintenance Will Be Given Only For 12 Months From The Date Of Completion.
4) After 12 Months For Any Kind Of Service Charges Will Be Taken As Actuals.
5) Estimation Is Calculated As Per Given Specification.
6) Estimation Is Done On A Thumb Rule Calculation, Hence May Vary Up To (+ Or -) 5 To 10%.
7) Transport, Loading Unloading, Taxes, Local charges extra as actual.
8) Images shown in the estimate are only for reference.`;

const DEFAULT_PAYMENT_TERMS = `1) 50% Advance Before Starting The Project.
2) 40% While The Project Is In Process.
3) 10% After Complete The Project.
4) Project Commences After 4 Days Of Receiving The Advance.`;

const DEFAULT_NOTE = 'Note : Any Changes In The Model, Design And Material Specification Made After The Work Is In Process, Will Be Charged Accordingly.';

const DEFAULT_BANK_DETAILS = {
  accountName: 'MODERN INTERIOR',
  bankName: 'HDFC BANK',
  accountNo: '50200088923412',
  ifscCode: 'HDFC0001824',
  gstNo: '27AAOFM1234F1Z8'
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
  COMMERCIAL_PRESETS
};
