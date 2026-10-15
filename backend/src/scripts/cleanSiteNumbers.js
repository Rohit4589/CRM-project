require('dotenv').config({ override: true });
const pool = require('../config/db');

async function cleanSiteNumbers() {
  try {
    const res = await pool.query('SELECT id, site_ref, customer_name FROM sites');
    for (const row of res.rows) {
      const match = (row.site_ref || '').match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        const cleanRef = num < 1000 ? String(num).padStart(3, '0') : String(num);
        await pool.query('UPDATE sites SET site_ref = $1 WHERE id = $2', [cleanRef, row.id]);
        console.log(`Updated site ${row.id} (${row.customer_name}): '${row.site_ref}' -> '${cleanRef}'`);
      }
    }
    console.log('✅ All site numbers cleaned successfully!');
  } catch (err) {
    console.error('Error cleaning site numbers:', err);
  } finally {
    process.exit(0);
  }
}

cleanSiteNumbers();
