const express = require('express');
const router = express.Router();
const parseController = require('../controllers/parseController');

// POST /api/parse/document - Parse document text
router.post('/document', parseController.parseDocument);

// GET /api/parse/services - Get supported services
router.get('/services', parseController.getSupportedServices);

module.exports = router;
