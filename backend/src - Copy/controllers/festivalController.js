const pool = require('../config/db');

// GET /api/festivals?year=2026
const getFestivals = async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT id, date, label, year, is_active FROM festivals';
    const params = [];

    if (year) {
      query += ' WHERE year = $1';
      params.push(parseInt(year, 10));
    }

    query += ' ORDER BY date ASC';

    const result = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      festivals: result.rows
    });
  } catch (error) {
    console.error('Error in getFestivals:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving festivals', error: error.message });
  }
};

// POST /api/festivals
// Body: { date: 'YYYY-MM-DD', label: 'Diwali' }
const addFestival = async (req, res) => {
  try {
    const { date, label } = req.body;
    if (!date || !label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'Date and Label are required' });
    }

    const cleanDate = date.trim();
    const cleanLabel = label.trim();
    const year = parseInt(cleanDate.slice(0, 4), 10) || new Date().getFullYear();

    const result = await pool.query(`
      INSERT INTO festivals (date, label, year, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (date) DO UPDATE 
      SET label = EXCLUDED.label, year = EXCLUDED.year, is_active = true
      RETURNING id, date, label, year, is_active;
    `, [cleanDate, cleanLabel, year]);

    return res.status(201).json({
      success: true,
      message: 'Festival added successfully',
      festival: result.rows[0]
    });
  } catch (error) {
    console.error('Error in addFestival:', error);
    return res.status(500).json({ success: false, message: 'Server error adding festival', error: error.message });
  }
};

// PUT /api/festivals/:id
const updateFestival = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, label, is_active } = req.body;

    const currentRes = await pool.query('SELECT * FROM festivals WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const newDate = date ? date.trim() : currentRes.rows[0].date;
    const newLabel = label ? label.trim() : currentRes.rows[0].label;
    const newActive = typeof is_active === 'boolean' ? is_active : currentRes.rows[0].is_active;
    const year = parseInt(newDate.slice(0, 4), 10) || currentRes.rows[0].year;

    const updateRes = await pool.query(`
      UPDATE festivals
      SET date = $1, label = $2, year = $3, is_active = $4
      WHERE id = $5
      RETURNING id, date, label, year, is_active;
    `, [newDate, newLabel, year, newActive, id]);

    return res.status(200).json({
      success: true,
      message: 'Festival updated successfully',
      festival: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Error in updateFestival:', error);
    return res.status(500).json({ success: false, message: 'Server error updating festival', error: error.message });
  }
};

// DELETE /api/festivals/:id
const deleteFestival = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM festivals WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Festival deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFestival:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting festival', error: error.message });
  }
};

module.exports = {
  getFestivals,
  addFestival,
  updateFestival,
  deleteFestival
};
