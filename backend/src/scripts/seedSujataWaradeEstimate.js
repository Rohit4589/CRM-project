require('dotenv').config({ override: true });
const pool = require('../config/db');
const {
  DEFAULT_TERMS_CONDITIONS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_NOTE,
  DEFAULT_BANK_DETAILS,
  READYMADE_DESCRIPTIONS
} = require('../constants/estimateCatalog');

async function seedSujataWaradeEstimate() {
  try {
    console.log('Seeding demo estimate from 203- SUJATA WARADE.xlsx...');

    // Check if it already exists
    const existing = await pool.query("SELECT id FROM estimates WHERE estimate_number = 'MI2025-26-0203'");
    if (existing.rows.length > 0) {
      console.log('Estimate MI2025-26-0203 already exists. Updating...');
      await pool.query("DELETE FROM estimates WHERE estimate_number = 'MI2025-26-0203'");
    }

    const roomsData = [
      {
        id: 'room_living',
        roomName: 'LIVING ROOM',
        roomTotal: 265200,
        items: [
          {
            id: 'it_liv_1',
            productName: 'SHOES RACK',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1081,
            heightMm: 2100,
            totalArea: 25,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 45000
          },
          {
            id: 'it_liv_2',
            productName: 'TEMPLE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 382,
            heightMm: 2100,
            totalArea: 9,
            unit: 'Sq.Ft.',
            rate: 3000,
            amount: 27000
          },
          {
            id: 'it_liv_3',
            productName: 'T V UNIT',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 3300,
            heightMm: 2100,
            totalArea: 75,
            unit: 'Sq.Ft.',
            rate: 1200,
            amount: 90000
          },
          {
            id: 'it_liv_4',
            productName: 'SAFETY DOOR',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1050,
            heightMm: 2100,
            totalArea: 24,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 43200
          },
          {
            id: 'it_liv_5',
            productName: 'SWING',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: null,
            heightMm: null,
            totalArea: 1,
            unit: 'SET',
            rate: 60000,
            amount: 60000
          }
        ]
      },
      {
        id: 'room_kids',
        roomName: "KID'S ROOM",
        roomTotal: 226300,
        items: [
          {
            id: 'it_kid_1',
            productName: 'WARDROBE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1800,
            heightMm: 2100,
            totalArea: 41,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 73800
          },
          {
            id: 'it_kid_2',
            productName: 'LOFT ABOVE WARDROBE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 2928,
            heightMm: 600,
            totalArea: 19,
            unit: 'Sq.Ft.',
            rate: 1500,
            amount: 28500
          },
          {
            id: 'it_kid_3',
            productName: 'BED',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1200,
            heightMm: 1900,
            totalArea: 25,
            unit: 'Sq.Ft.',
            rate: 1300,
            amount: 32500
          },
          {
            id: 'it_kid_4',
            productName: 'MATTRESS',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1200,
            heightMm: 1900,
            totalArea: 25,
            unit: 'Sq.Ft.',
            rate: 400,
            amount: 10000
          },
          {
            id: 'it_kid_5',
            productName: 'STUDY TABLE WITH BOOKS STORAGE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 750,
            heightMm: 2100,
            totalArea: 17,
            unit: 'Sq.Ft.',
            rate: 1500,
            amount: 25500
          },
          {
            id: 'it_kid_6',
            productName: 'BED WALL PANNELING',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 2690,
            heightMm: 1500,
            totalArea: 44,
            unit: 'Sq.Ft.',
            rate: 1000,
            amount: 44000
          },
          {
            id: 'it_kid_7',
            productName: 'SIDE TABLE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 750,
            heightMm: 450,
            totalArea: 4,
            unit: 'Sq.Ft.',
            rate: 3000,
            amount: 12000
          }
        ]
      },
      {
        id: 'room_master',
        roomName: 'MASTER ROOM',
        roomTotal: 302900,
        items: [
          {
            id: 'it_mas_1',
            productName: 'WARDROBE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 2069,
            heightMm: 2100,
            totalArea: 47,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 84600
          },
          {
            id: 'it_mas_2',
            productName: 'LOFT ABOVE WARDROBE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 2069,
            heightMm: 600,
            totalArea: 14,
            unit: 'Sq.Ft.',
            rate: 1500,
            amount: 21000
          },
          {
            id: 'it_mas_3',
            productName: 'BED',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1800,
            heightMm: 2100,
            totalArea: 41,
            unit: 'Sq.Ft.',
            rate: 1300,
            amount: 53300
          },
          {
            id: 'it_mas_4',
            productName: 'MATTRESS',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1800,
            heightMm: 2100,
            totalArea: 41,
            unit: 'Sq.Ft.',
            rate: 400,
            amount: 16400
          },
          {
            id: 'it_mas_5',
            productName: 'SIDE TABLE WITH DRESSING',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 900,
            heightMm: 2220,
            totalArea: 22,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 39600
          },
          {
            id: 'it_mas_6',
            productName: 'BED WALL PANNELING',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 2100,
            heightMm: 1500,
            totalArea: 34,
            unit: 'Sq.Ft.',
            rate: 1000,
            amount: 34000
          },
          {
            id: 'it_mas_7',
            productName: 'STUDY TABLE WITH BOOKS STORAGE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 1200,
            heightMm: 2100,
            totalArea: 28,
            unit: 'Sq.Ft.',
            rate: 1500,
            amount: 42000
          },
          {
            id: 'it_mas_8',
            productName: 'SIDE TABLE',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 750,
            heightMm: 450,
            totalArea: 4,
            unit: 'Sq.Ft.',
            rate: 3000,
            amount: 12000
          }
        ]
      },
      {
        id: 'room_kitchen',
        roomName: 'KITCHEN',
        roomTotal: 347250,
        items: [
          {
            id: 'it_kitch_1',
            productName: 'TANDEM DRAWERS',
            description: 'Hettich/Hefele Brand Tandem with base, back sheet and verticle support',
            widthMm: null,
            heightMm: null,
            totalArea: 9,
            unit: 'SET',
            rate: 9500,
            amount: 85500
          },
          {
            id: 'it_kitch_2',
            productName: 'OTTA SHUTTER',
            description: READYMADE_DESCRIPTIONS[1],
            widthMm: null,
            heightMm: null,
            totalArea: 35,
            unit: 'Sq.Ft.',
            rate: 950,
            amount: 33250
          },
          {
            id: 'it_kitch_3',
            productName: 'OVERHEAD UNIT',
            description: READYMADE_DESCRIPTIONS[2],
            widthMm: null,
            heightMm: null,
            totalArea: 17.5,
            unit: 'Sq.Ft.',
            rate: 2000,
            amount: 35000
          },
          {
            id: 'it_kitch_4',
            productName: 'LOFT ABOVE OVERHEAD UNIT',
            description: READYMADE_DESCRIPTIONS[1],
            widthMm: null,
            heightMm: null,
            totalArea: 17.5,
            unit: 'Sq.Ft.',
            rate: 1800,
            amount: 31500
          },
          {
            id: 'it_kitch_5',
            productName: 'TALL UNIT',
            description: READYMADE_DESCRIPTIONS[1],
            widthMm: null,
            heightMm: null,
            totalArea: 20,
            unit: 'Sq.Ft.',
            rate: 2000,
            amount: 40000
          },
          {
            id: 'it_kitch_6',
            productName: 'ACCESSORIES',
            description: 'ALL SET',
            widthMm: null,
            heightMm: null,
            totalArea: 1,
            unit: 'SET',
            rate: 20000,
            amount: 20000
          },
          {
            id: 'it_kitch_7',
            productName: 'CROCKARY UNIT',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 800,
            heightMm: 2100,
            totalArea: 19,
            unit: 'Sq.Ft.',
            rate: 2000,
            amount: 38000
          },
          {
            id: 'it_kitch_8',
            productName: 'DECORATIVE PARTITION',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: 750,
            heightMm: 2100,
            totalArea: 17,
            unit: 'Sq.Ft.',
            rate: 2000,
            amount: 34000
          },
          {
            id: 'it_kitch_9',
            productName: 'FRAME COVERING',
            description: READYMADE_DESCRIPTIONS[0],
            widthMm: null,
            heightMm: null,
            totalArea: 30,
            unit: 'RFT.',
            rate: 1000,
            amount: 30000
          }
        ]
      },
      {
        id: 'room_misc',
        roomName: 'MISCELLANEOUS',
        roomTotal: 175000,
        items: [
          { id: 'it_m_1', productName: 'FLOOR COVERING', description: 'Site protection', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 15000, amount: 15000 },
          { id: 'it_m_2', productName: 'DEBRIS', description: 'Debris removal', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 5000, amount: 5000 },
          { id: 'it_m_3', productName: 'PASSAGE JAALI', description: 'Designer jaali', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 20000, amount: 20000 },
          { id: 'it_m_4', productName: 'BASIN SHUTTER', description: 'Vanity shutter', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 15000, amount: 15000 },
          { id: 'it_m_5', productName: 'TEMPLE JAALI', description: 'Temple jaali CNC', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 10000, amount: 10000 },
          { id: 'it_m_6', productName: 'CURTAIN FITTING', description: 'Curtain track channels', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 100000, amount: 100000 },
          { id: 'it_m_7', productName: 'MISCELLANEOUS EXP.', description: 'Consumables', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 10000, amount: 10000 }
        ]
      },
      {
        id: 'room_contractor',
        roomName: 'CONTRACTOR WORK',
        roomTotal: 300000,
        items: [
          { id: 'it_c_1', productName: 'GYPSUM FALSE CEILING', description: 'APPROX', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 100000, amount: 100000 },
          { id: 'it_c_2', productName: 'ELECTRIC WORK', description: 'APPROX', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 100000, amount: 100000 },
          { id: 'it_c_3', productName: 'PAINTING WORK', description: 'APPROX', widthMm: null, heightMm: null, totalArea: 1, unit: 'APPROX', rate: 100000, amount: 100000 }
        ]
      }
    ];

    const insertQuery = `
      INSERT INTO estimates (
        estimate_number, customer_name, phone, address, date,
        project_type, furniture_level, rooms_data, sub_total,
        design_fee_pct, design_fee_amount, gst_pct, gst_amount,
        round_off, final_total, bank_details, notes,
        terms_conditions, payment_terms, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id, estimate_number, customer_name, final_total;
    `;

    const values = [
      'MI2025-26-0203',
      'MRS. SUJATA WARADE',
      '77200 09234',
      'B 903, WOODS ROYAL, KOTHRUD, PUNE',
      '2026-03-27',
      'Residential',
      'Luxury-Modern',
      JSON.stringify(roomsData),
      1616650,
      10.00,
      161665,
      0,
      0,
      0,
      1778315,
      JSON.stringify(DEFAULT_BANK_DETAILS),
      DEFAULT_NOTE,
      DEFAULT_TERMS_CONDITIONS,
      DEFAULT_PAYMENT_TERMS,
      'Approved'
    ];

    const res = await pool.query(insertQuery, values);
    console.log('✅ Demo estimate created successfully:', res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to seed estimate:', err);
  } finally {
    process.exit(0);
  }
}

seedSujataWaradeEstimate();
