const express = require('express');
const router = express.Router();
const { getSites, addSite, updateSite, deleteSite, openSiteFolder } = require('../controllers/siteController');

router.get('/', getSites);
router.post('/', addSite);
router.post('/:id/open-folder', openSiteFolder);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

module.exports = router;
