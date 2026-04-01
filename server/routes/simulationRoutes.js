const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// POST /api/simulation/run - Run enhanced simulation
router.post('/run', simulationController.runSimulation);

// POST /api/simulation/legacy - Run legacy simulation (for backward compatibility)
router.post('/legacy', simulationController.runLegacySimulation);

// GET /api/simulation/history - Get simulation history
router.get('/history', simulationController.getSimulationHistory);

// GET /api/simulation/services - Get supported services with masked API keys
router.get('/services', simulationController.getSupportedServices);

// GET /api/simulation/test - Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Simulation API is working',
    timestamp: new Date().toISOString(),
    supportedServices: ['KYC', 'BUREAU', 'PAYMENTS', 'OPEN_BANKING', 'GST', 'FRAUD']
  });
});

module.exports = router;
