const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Storage directory for configurations
const CONFIG_DIR = path.join(__dirname, 'configs');
const CONFIG_FILE = path.join(CONFIG_DIR, 'integration-configs.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load existing configurations
let configurations = [];
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    configurations = JSON.parse(data);
  } catch (error) {
    console.error('Error loading configurations:', error);
    configurations = [];
  }
}

// Save configuration with unique ID
router.post('/save', (req, res) => {
  try {
    const { configId, parserId, data, timestamp } = req.body;
    
    if (!configId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: configId, data'
      });
    }
    
    const config = {
      id: configId,
      parserId: parserId || null,
      data: data,
      timestamp: timestamp || new Date().toISOString(),
      status: 'active'
    };
    
    // Add to configurations array
    configurations.push(config);
    
    // Save to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configurations, null, 2));
    
    console.log('Saved configuration:', {
      id: configId,
      parserId: parserId,
      servicesCount: data.services_detected?.length || 0,
      mandatoryCount: data.mandatory_services?.length || 0,
      optionalCount: data.optional_services?.length || 0
    });
    
    res.json({
      success: true,
      message: 'Configuration saved successfully',
      configId: configId
    });
    
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save configuration: ' + error.message
    });
  }
});

// Get all configurations
router.get('/list', (req, res) => {
  try {
    res.json({
      success: true,
      configurations: configurations.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).reverse() // Most recent first
    });
  } catch (error) {
    console.error('Error retrieving configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configurations: ' + error.message
    });
  }
});

// Get specific configuration
router.get('/:configId', (req, res) => {
  try {
    const { configId } = req.params;
    const config = configurations.find(c => c.id === configId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    res.json({
      success: true,
      configuration: config
    });
    
  } catch (error) {
    console.error('Error retrieving configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration: ' + error.message
    });
  }
});

// Update configuration status
router.put('/:configId/status', (req, res) => {
  try {
    const { configId } = req.params;
    const { status } = req.body;
    
    const configIndex = configurations.findIndex(c => c.id === configId);
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    configurations[configIndex].status = status;
    configurations[configIndex].updated_at = new Date().toISOString();
    
    // Save to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configurations, null, 2));
    
    res.json({
      success: true,
      message: 'Configuration status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration: ' + error.message
    });
  }
});

// Delete configuration
router.delete('/:configId', (req, res) => {
  try {
    const { configId } = req.params;
    
    const configIndex = configurations.findIndex(c => c.id === configId);
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    const deletedConfig = configurations.splice(configIndex, 1)[0];
    
    // Save to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configurations, null, 2));
    
    console.log('Deleted configuration:', {
      id: configId,
      parserId: deletedConfig.parserId
    });
    
    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration: ' + error.message
    });
  }
});

module.exports = router;
