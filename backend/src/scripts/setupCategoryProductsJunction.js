const pool = require('../config/db');

async function setupJunction() {
  const client = await pool.connect();
  try {
    console.log('🔄 Setting up estimate_category_products table...');
    await client.query('BEGIN');

    // 1. Create junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimate_category_products (
        category_id INT REFERENCES estimate_categories(id) ON DELETE CASCADE,
        product_id INT REFERENCES estimate_products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (category_id, product_id)
      );
    `);

    // 2. Drop NOT NULL constraint on category_name in estimate_products
    await client.query(`
      ALTER TABLE estimate_products ALTER COLUMN category_name DROP NOT NULL;
      ALTER TABLE estimate_products ALTER COLUMN category_name SET DEFAULT '';
    `);

    // 3. Populate junction table from existing data
    await client.query(`
      INSERT INTO estimate_category_products (category_id, product_id)
      SELECT category_id, id 
      FROM estimate_products 
      WHERE category_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ estimate_category_products junction table created and synced successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up junction table:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupJunction();
