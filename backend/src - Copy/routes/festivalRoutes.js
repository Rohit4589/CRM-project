const express = require('express');
const router = express.Router();
const {
  getFestivals,
  addFestival,
  updateFestival,
  deleteFestival
} = require('../controllers/festivalController');

router.get('/', getFestivals);
router.post('/', addFestival);
router.put('/:id', updateFestival);
router.delete('/:id', deleteFestival);

module.exports = router;
