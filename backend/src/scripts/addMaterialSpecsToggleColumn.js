const pool = require('../config/db');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Adding include_material_specs column to estimates table...');
    await client.query(`
      ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS include_material_specs BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ include_material_specs column added successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
