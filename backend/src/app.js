const express = require('express');
const { Pool } = require('pg');

const app = express();

// Initialize Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

// Health API Endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test the database connection by running a simple query
    await pool.query('SELECT 1');
    
    res.status(200).json({ 
      status: 'success', 
      message: 'API is running and successfully connected to the Supabase PostgreSQL database!' 
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'API is running, but failed to connect to the database.',
      error: error.message
    });
  }
});

module.exports = app;
