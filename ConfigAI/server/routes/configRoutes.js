const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// POST /api/config/generate - Generate configuration
router.post('/generate', configController.generateConfig);

// POST /api/config/validate - Validate configuration
router.post('/validate', configController.validateConfig);

module.exports = router;
