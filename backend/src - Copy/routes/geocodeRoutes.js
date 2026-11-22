const express = require('express');
const router = express.Router();

// GET /api/geocode/search?q=...
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ModernInteriorCRM/1.0 (admin@moderninterior.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding service error (${response.status})`);
    }

    const data = await response.json();
    const results = data.map((item) => ({
      placeId: item.place_id,
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error in geocode search:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search address',
      error: error.message,
    });
  }
});

// GET /api/geocode/reverse?lat=...&lon=...
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, lng } = req.query;
    const targetLon = lon || lng;

    if (!lat || !targetLon) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(targetLon)}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ModernInteriorCRM/1.0 (admin@moderninterior.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding service error (${response.status})`);
    }

    const item = await response.json();
    return res.status(200).json({
      success: true,
      displayName: item.display_name || '',
      address: item.address || {},
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    });
  } catch (error) {
    console.error('Error in reverse geocode:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
      error: error.message,
    });
  }
});

module.exports = router;
