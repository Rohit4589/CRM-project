const express = require('express');
const router = express.Router();
const {
  getSiteTasks,
  createSiteTask,
  toggleSiteTask,
  updateSiteTask,
  deleteSiteTask,
  batchSaveSiteTasks
} = require('../controllers/siteTaskController');

router.get('/', getSiteTasks);
router.post('/', createSiteTask);
router.post('/batch-save', batchSaveSiteTasks);
router.patch('/:id/toggle', toggleSiteTask);
router.put('/:id', updateSiteTask);
router.delete('/:id', deleteSiteTask);

module.exports = router;
