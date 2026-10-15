require('dotenv').config({ override: true });
const pool = require('../config/db');

async function cleanEstimateNumbers() {
  try {
    const res = await pool.query('SELECT e.id, e.estimate_number, s.site_ref, e.customer_name FROM estimates e LEFT JOIN sites s ON e.site_id = s.id');
    for (const row of res.rows) {
      let cleanNum = '';
      if (row.site_ref) {
        const m = String(row.site_ref).match(/\d+/);
        if (m) {
          const n = parseInt(m[0], 10);
          cleanNum = n < 1000 ? String(n).padStart(3, '0') : String(n);
        } else {
          cleanNum = String(row.site_ref).replace(/^SITE-/i, '');
        }
      } else {
        const m = String(row.estimate_number).match(/\d+$/);
        if (m) {
          const n = parseInt(m[0], 10);
          cleanNum = n < 1000 ? String(n).padStart(3, '0') : String(n);
        } else {
          cleanNum = '001';
        }
      }
      await pool.query('UPDATE estimates SET estimate_number = $1 WHERE id = $2', [cleanNum, row.id]);
      console.log(`Updated estimate ${row.id} (${row.customer_name}): '${row.estimate_number}' -> '${cleanNum}'`);
    }
    console.log('✅ All estimates updated to clean order numbers!');
  } catch (err) {
    console.error('Error updating estimate numbers:', err);
  } finally {
    process.exit(0);
  }
}

cleanEstimateNumbers();
