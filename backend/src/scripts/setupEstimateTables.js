require('dotenv').config({ override: true });
const pool = require('../config/db');

async function setupEstimateTables() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Estimates Database Migration...');
    await client.query('BEGIN');

    // 1. Create estimates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimates (
        id SERIAL PRIMARY KEY,
        estimate_number VARCHAR(50) UNIQUE NOT NULL,
        site_id INT REFERENCES sites(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        date DATE DEFAULT CURRENT_DATE,
        project_type VARCHAR(50) DEFAULT 'Residential',
        furniture_level VARCHAR(50) DEFAULT 'Luxury-Modern',
        rooms_data JSONB NOT NULL DEFAULT '[]'::jsonb,
        sub_total NUMERIC(14,2) DEFAULT 0,
        design_fee_pct NUMERIC(5,2) DEFAULT 10.00,
        design_fee_amount NUMERIC(14,2) DEFAULT 0,
        gst_pct NUMERIC(5,2) DEFAULT 0,
        gst_amount NUMERIC(14,2) DEFAULT 0,
        round_off NUMERIC(14,2) DEFAULT 0,
        final_total NUMERIC(14,2) DEFAULT 0,
        bank_details JSONB,
        notes TEXT,
        terms_conditions TEXT,
        payment_terms TEXT,
        status VARCHAR(50) DEFAULT 'Draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create index for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_estimates_site_id ON estimates(site_id);
      CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
      CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✅ Estimates table created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupEstimateTables();
