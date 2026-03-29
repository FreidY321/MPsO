const express = require('express');
const router = express.Router();
const infoController = require('../controllers/info.controller');

/**
 * Get server and school information
 * GET /api/info
 */
router.get('/', infoController.getInfo);

module.exports = router;
