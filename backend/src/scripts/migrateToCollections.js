const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting 3-Collection Migration for Products & Estimates...');
    await client.query('BEGIN');

    // 1. Add new columns to estimate_products
    await client.query(`
      ALTER TABLE estimate_products
        ADD COLUMN IF NOT EXISTS essential_rate NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS signature_rate NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS elite_rate NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS essential_description TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS signature_description TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS elite_description TEXT DEFAULT '';
    `);

    // 2. Populate new columns from legacy columns if available
    await client.query(`
      UPDATE estimate_products
      SET
        essential_rate = CASE WHEN essential_rate IS NULL OR essential_rate = 0 THEN COALESCE(modern_rate, 0) ELSE essential_rate END,
        signature_rate = CASE WHEN signature_rate IS NULL OR signature_rate = 0 THEN COALESCE(luxury_modern_rate, 0) ELSE signature_rate END,
        elite_rate = CASE WHEN elite_rate IS NULL OR elite_rate = 0 THEN COALESCE(luxury_rate, 0) ELSE elite_rate END,
        essential_description = CASE WHEN essential_description IS NULL OR essential_description = '' THEN COALESCE(default_description, '') ELSE essential_description END,
        signature_description = CASE WHEN signature_description IS NULL OR signature_description = '' THEN COALESCE(default_description, '') ELSE signature_description END,
        elite_description = CASE WHEN elite_description IS NULL OR elite_description = '' THEN COALESCE(default_description, '') ELSE elite_description END;
    `);

    // 3. Add collection_tier column to estimates table
    await client.query(`
      ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS collection_tier VARCHAR(50) DEFAULT 'Signature Collection';
    `);

    // 4. Update estimates collection_tier from furniture_level
    await client.query(`
      UPDATE estimates
      SET collection_tier = CASE
        WHEN furniture_level ILIKE '%modern%' AND furniture_level NOT ILIKE '%luxury%' THEN 'Essential Collection'
        WHEN furniture_level ILIKE '%luxury%' AND furniture_level NOT ILIKE '%modern%' THEN 'Elite Collection'
        ELSE 'Signature Collection'
      END
      WHERE collection_tier IS NULL OR collection_tier = '';
    `);

    await client.query('COMMIT');
    console.log('✅ Migration to 3 Collections completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
