require('dotenv').config({ override: true });
const pool = require('../config/db');
const { PRODUCT_CATALOG } = require('../constants/estimateCatalog');

const INITIAL_CATEGORIES = [
  // Residential
  { name: 'LIVING ROOM', project_type: 'Residential', display_order: 1 },
  { name: 'MASTER ROOM', project_type: 'Residential', display_order: 2 },
  { name: "KID'S ROOM", project_type: 'Residential', display_order: 3 },
  { name: "PARENT'S ROOM", project_type: 'Residential', display_order: 4 },
  { name: 'KITCHEN', project_type: 'Residential', display_order: 5 },
  { name: 'MISCELLANEOUS', project_type: 'Residential', display_order: 6 },
  { name: 'CONTRACTOR WORK', project_type: 'Residential', display_order: 7 },

  // Commercial
  { name: 'RECEPTION & WAITING', project_type: 'Commercial', display_order: 8 },
  { name: 'CONFERENCE ROOM', project_type: 'Commercial', display_order: 9 },
  { name: 'MAIN DIRECTOR CABIN', project_type: 'Commercial', display_order: 10 },
  { name: 'PANTRY & DINING', project_type: 'Commercial', display_order: 11 },
  { name: 'MISCELLANEOUS & SERVICES', project_type: 'Commercial', display_order: 12 }
];

async function setupProductCatalogTables() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Product Catalog Database Migration...');
    await client.query('BEGIN');

    // 1. Create estimate_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimate_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        project_type VARCHAR(50) DEFAULT 'Residential',
        display_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create estimate_products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS estimate_products (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES estimate_categories(id) ON DELETE SET NULL,
        category_name VARCHAR(100) NOT NULL,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'Sq.Ft.',
        modern_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
        luxury_modern_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
        luxury_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
        default_width NUMERIC(10,2),
        default_height NUMERIC(10,2),
        default_description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_estimate_products_category_id ON estimate_products(category_id);
      CREATE INDEX IF NOT EXISTS idx_estimate_products_name ON estimate_products(name);
    `);

    // 3. Seed initial categories
    console.log('🌱 Seeding initial room categories...');
    const categoryMap = {};
    for (const cat of INITIAL_CATEGORIES) {
      const res = await client.query(`
        INSERT INTO estimate_categories (name, project_type, display_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE 
        SET project_type = EXCLUDED.project_type, display_order = EXCLUDED.display_order
        RETURNING id, name;
      `, [cat.name, cat.project_type, cat.display_order]);
      categoryMap[res.rows[0].name.toUpperCase()] = res.rows[0].id;
    }

    // Helper to resolve category for product
    const mapProductToCategory = (prodCategory) => {
      const upper = (prodCategory || '').toUpperCase();
      if (upper === 'BEDROOM') return 'MASTER ROOM';
      if (categoryMap[upper]) return upper;
      if (categoryMap[`${upper} ROOM`]) return `${upper} ROOM`;
      return 'LIVING ROOM';
    };

    // 4. Seed initial products if table is empty
    const countRes = await client.query('SELECT COUNT(*) FROM estimate_products');
    const existingCount = parseInt(countRes.rows[0].count, 10);

    if (existingCount === 0) {
      console.log('🌱 Seeding initial products & rates...');
      for (const prod of PRODUCT_CATALOG) {
        const catName = mapProductToCategory(prod.category);
        const catId = categoryMap[catName] || null;

        await client.query(`
          INSERT INTO estimate_products (
            category_id,
            category_name,
            name,
            unit,
            modern_rate,
            luxury_modern_rate,
            luxury_rate,
            default_width,
            default_height,
            default_description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          catId,
          catName,
          prod.name,
          prod.defaultUnit || 'Sq.Ft.',
          prod.modern || 0,
          prod.luxuryModern || 0,
          prod.luxury || 0,
          prod.defaultW || null,
          prod.defaultH || null,
          prod.defaultDesc || ''
        ]);
      }
      console.log(`✅ Seeded ${PRODUCT_CATALOG.length} initial products!`);
    } else {
      console.log(`ℹ️ Products table already has ${existingCount} items. Skipping insert.`);
    }

    await client.query('COMMIT');
    console.log('🎉 Product Catalog database setup complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupProductCatalogTables();
