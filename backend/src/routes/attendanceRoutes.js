const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  punchAttendance,
  getEmployeeAttendance,
} = require('../controllers/attendanceController');

// Admin & General attendance routes
router.get('/', getAttendance);
router.post('/', markAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Employee specific routes
router.post('/punch', punchAttendance);
router.get('/employee/:id', getEmployeeAttendance);

module.exports = router;
