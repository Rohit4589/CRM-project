const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const pool = require('../config/db');

const initialFestivals = [
  // 2025
  { date: '2025-01-26', label: 'Republic Day', year: 2025 },
  { date: '2025-03-14', label: 'Holi', year: 2025 },
  { date: '2025-03-31', label: 'Eid ul-Fitr (Ramzan Eid)', year: 2025 },
  { date: '2025-06-07', label: 'Eid al-Adha (Bakrid)', year: 2025 },
  { date: '2025-08-15', label: 'Independence Day', year: 2025 },
  { date: '2025-10-02', label: 'Dasera (Vijayadashami)', year: 2025 },
  { date: '2025-10-20', label: 'Diwali (Laxmi Pujan)', year: 2025 },

  // 2026
  { date: '2026-01-26', label: 'Republic Day', year: 2026 },
  { date: '2026-03-04', label: 'Holi', year: 2026 },
  { date: '2026-03-20', label: 'Eid ul-Fitr (Ramzan Eid)', year: 2026 },
  { date: '2026-05-27', label: 'Eid al-Adha (Bakrid)', year: 2026 },
  { date: '2026-08-15', label: 'Independence Day', year: 2026 },
  { date: '2026-10-20', label: 'Dasera (Vijayadashami)', year: 2026 },
  { date: '2026-11-08', label: 'Diwali (Laxmi Pujan)', year: 2026 },

  // 2027
  { date: '2027-01-26', label: 'Republic Day', year: 2027 },
  { date: '2027-03-10', label: 'Eid ul-Fitr (Ramzan Eid)', year: 2027 },
  { date: '2027-03-22', label: 'Holi', year: 2027 },
  { date: '2027-05-17', label: 'Eid al-Adha (Bakrid)', year: 2027 },
  { date: '2027-08-15', label: 'Independence Day', year: 2027 },
  { date: '2027-10-10', label: 'Dasera (Vijayadashami)', year: 2027 },
  { date: '2027-10-29', label: 'Diwali (Laxmi Pujan)', year: 2027 },
];

async function createAndSeedFestivals() {
  try {
    console.log('Creating festivals table in Supabase PostgreSQL...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS festivals (
        id SERIAL PRIMARY KEY,
        date VARCHAR(20) NOT NULL UNIQUE,
        label VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table festivals ensured.');

    for (const fest of initialFestivals) {
      await pool.query(`
        INSERT INTO festivals (date, label, year, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (date) DO UPDATE 
        SET label = EXCLUDED.label, year = EXCLUDED.year;
      `, [fest.date, fest.label, fest.year]);
    }

    console.log(`Successfully seeded ${initialFestivals.length} festival holidays!`);
  } catch (err) {
    console.error('Failed to create/seed festivals table:', err);
  } finally {
    await pool.end();
  }
}

createAndSeedFestivals();
