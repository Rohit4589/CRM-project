const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const siteRoutes = require('./routes/siteRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const estimateRoutes = require('./routes/estimateRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const siteTaskRoutes = require('./routes/siteTaskRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/site-tasks', siteTaskRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/catalog', catalogRoutes);

// Health Check API Endpoint
app.get('/api/health', async (req, res) => {
  try {
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
