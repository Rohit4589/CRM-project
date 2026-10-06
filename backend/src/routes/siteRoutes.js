const express = require('express');
const router = express.Router();
const { getSites, addSite, updateSite, deleteSite } = require('../controllers/siteController');

router.get('/', getSites);
router.post('/', addSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

module.exports = router;
