require('dotenv').config({ override: true });
const pool = require('../config/db');

async function initDb() {
  try {
    console.log('Connecting to database...');
    
    // 1. Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
        full_name VARCHAR(100) NOT NULL,
        role_title VARCHAR(100),
        mobile VARCHAR(20),
        daily_rate NUMERIC DEFAULT 0,
        avatar VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Active',
        site_policy VARCHAR(100) DEFAULT 'Flexible / Self-Pick',
        last_site VARCHAR(150) DEFAULT 'Not yet punched',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS site_policy VARCHAR(100) DEFAULT 'Flexible / Self-Pick';
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_site VARCHAR(150) DEFAULT 'Not yet punched';
    `);
    console.log('✅ Table "users" checked/updated.');

    // 2. Create sites table if not exists (EMPTY - no dummy data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.sites (
        id SERIAL PRIMARY KEY,
        site_ref VARCHAR(50) UNIQUE,
        customer_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        location VARCHAR(150),
        full_address TEXT,
        lat_lng VARCHAR(50),
        start_date DATE,
        target_date DATE,
        status VARCHAR(30) DEFAULT 'Running',
        progress INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "sites" checked/updated.');

    // 3. Ensure only real base accounts exist (admin & anurag only - NO dummy users)
    const seedQuery = `
      INSERT INTO public.users (username, password, role, full_name, role_title, mobile, daily_rate, avatar, status, site_policy, last_site)
      VALUES 
        ('admin', '1234', 'admin', 'Mahendra Sharma', 'Administrator', '9999999999', 0, 'https://i.pravatar.cc/150?img=11', 'Active', 'Admin', 'Head Office'),
        ('anurag', '9164', 'employee', 'Anurag Dhangond', 'Carpenter & Site Specialist', '9209036661', 1000, 'https://i.pravatar.cc/150?img=12', 'Active', 'Flexible / Self-Pick', 'Not yet punched')
      ON CONFLICT (username) DO UPDATE 
      SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        role_title = EXCLUDED.role_title,
        mobile = EXCLUDED.mobile;
    `;
    await pool.query(seedQuery);

    const userCount = await pool.query('SELECT count(*) FROM public.users;');
    const siteCount = await pool.query('SELECT count(*) FROM public.sites;');
    console.log(`Current DB records: Users: ${userCount.rows[0].count}, Sites: ${siteCount.rows[0].count}`);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  } finally {
    await pool.end();
  }
}

initDb();
