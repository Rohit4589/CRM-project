const express = require('express');
const router = express.Router();
const estimateController = require('../controllers/estimateController');

// Catalog master presets & rate cards
router.get('/catalog', estimateController.getCatalog);

// CRUD operations
router.get('/', estimateController.getEstimates);
router.get('/:id', estimateController.getEstimateById);
router.post('/', estimateController.createEstimate);
router.put('/:id', estimateController.updateEstimate);
router.patch('/:id/status', estimateController.updateEstimateStatus);
router.put('/:id/status', estimateController.updateEstimateStatus);
router.delete('/:id', estimateController.deleteEstimate);

// Share via WhatsApp / Email
router.post('/:id/send', estimateController.sendEstimate);

module.exports = router;
