const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  punchAttendance,
  getEmployeeAttendance,
  approveAttendance,
  rejectAttendance,
  bulkApproveAttendance,
  awardBonusAttendance,
  bulkMarkAttendance,
} = require('../controllers/attendanceController');

// Admin & General attendance routes
router.get('/', getAttendance);
router.post('/', markAttendance);
router.post('/bulk-mark', bulkMarkAttendance);
router.post('/bonus', awardBonusAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Admin Approval routes
router.post('/:id/approve', approveAttendance);
router.post('/approve/:id', approveAttendance);
router.post('/:id/reject', rejectAttendance);
router.post('/reject/:id', rejectAttendance);
router.post('/bulk-approve', bulkApproveAttendance);

// Employee specific routes
router.post('/punch', punchAttendance);
router.get('/employee/:id', getEmployeeAttendance);

module.exports = router;
