const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// GET /api/audit/logs - Get audit logs
router.get('/logs', auditController.getLogs);

// POST /api/audit/logs - Create audit log
router.post('/logs', auditController.createLog);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', auditController.getLogStats);

module.exports = router;
