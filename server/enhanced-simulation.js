const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced Simulation Engine
class SimulationEngine {
  constructor() {
    this.simulationHistory = new Map();
    this.versionSnapshots = new Map();
    this.currentVersions = new Map();
    this.mockResponses = new Map();
    this.initializeMockResponses();
  }

  initializeMockResponses() {
    // Mock response templates for different scenarios
    this.mockResponses.set('success', {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req_12345',
        'x-response-time': '150ms'
      },
      body: {
        success: true,
        data: {
          transaction_id: 'txn_' + Date.now(),
          status: 'completed',
          timestamp: new Date().toISOString(),
          processing_time: Math.floor(Math.random() * 1000) + 100
        }
      }
    });

    this.mockResponses.set('failure', {
      status: 400,
      statusText: 'Bad Request',
      headers: {
        'content-type': 'application/json',
        'x-error-code': 'VALIDATION_ERROR',
        'x-request-id': 'req_12346'
      },
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: {
            field: 'pan_number',
            reason: 'Invalid PAN format'
          }
        }
      }
    });

    this.mockResponses.set('timeout', {
      status: 408,
      statusText: 'Request Timeout',
      headers: {
        'content-type': 'application/json',
        'x-timeout': 'true',
        'x-request-id': 'req_12347'
      },
      body: {
        success: false,
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Request timeout after 30 seconds'
        }
      }
    });

    this.mockResponses.set('server_error', {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'content-type': 'application/json',
        'x-error-code': 'INTERNAL_ERROR',
        'x-request-id': 'req_12348'
      },
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error occurred'
        }
      }
    });
  }

  // Version-specific response modifications
  getVersionSpecificResponse(baseResponse, version, service) {
    const response = JSON.parse(JSON.stringify(baseResponse));
    
    // Modify response based on version
    switch (version) {
      case 'v1':
        // v1 responses are simpler
        if (response.body.success) {
          response.body.data = {
            transaction_id: response.body.data.transaction_id,
            status: response.body.data.status
          };
          delete response.body.data.processing_time;
          delete response.body.data.timestamp;
        }
        break;
        
      case 'v2':
        // v2 responses have additional fields
        if (response.body.success) {
          response.body.data.metadata = {
            api_version: 'v2',
            response_format: 'enhanced',
            features: ['detailed_logging', 'extended_metadata']
          };
          response.headers['x-api-version'] = 'v2';
          response.headers['x-enhanced-response'] = 'true';
        }
        break;
        
      case 'v3':
        // v3 responses are most detailed
        if (response.body.success) {
          response.body.data.enhanced_data = {
            risk_score: Math.floor(Math.random() * 100),
            confidence_level: 'high',
            verification_methods: ['document', 'biometric', 'database'],
            compliance_flags: ['KYC_COMPLIANT', 'AML_CHECKED']
          };
          response.body.data.performance = {
            response_time: Math.floor(Math.random() * 200) + 50,
            cpu_usage: Math.floor(Math.random() * 30) + 10,
            memory_usage: Math.floor(Math.random() * 50) + 20
          };
          response.headers['x-api-version'] = 'v3';
          response.headers['x-advanced-features'] = 'true';
        }
        break;
    }
    
    // Service-specific modifications
    if (service === 'KYC') {
      response.body.data.service_type = 'kyc_verification';
      response.body.data.verification_level = version === 'v3' ? 'enhanced' : 'standard';
    } else if (service === 'Payments') {
      response.body.data.service_type = 'payment_processing';
      response.body.data.payment_method = version === 'v3' ? 'upi_enabled' : 'standard';
    } else if (service === 'GST') {
      response.body.data.service_type = 'gst_verification';
      response.body.data.gst_status = version === 'v3' ? 'verified_with_details' : 'verified';
    }
    
    return response;
  }

  // Simulate API integration
  async simulateIntegration(config, version, scenario = 'success') {
    const integrationId = config.id || config.service?.toLowerCase() + '_' + version;
    const service = config.service || 'unknown';
    
    // Check if we have a current version for this integration
    const currentVersion = this.currentVersions.get(integrationId) || version;
    
    // Get base response for scenario
    const baseResponse = this.mockResponses.get(scenario);
    if (!baseResponse) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }
    
    // Apply version-specific modifications
    const response = this.getVersionSpecificResponse(baseResponse, version, service);
    
    // Simulate network delay
    const delay = scenario === 'timeout' ? 35000 : Math.floor(Math.random() * 2000) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Create simulation log
    const simulationLog = {
      id: 'sim_' + Date.now(),
      integrationId,
      service,
      version,
      scenario,
      timestamp: new Date().toISOString(),
      request: {
        method: 'POST',
        url: config.config?.endpoints?.verify || 'https://api.example.com/verify',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ***masked***'
        },
        body: {
          // Mask sensitive data
          ...config.config?.required_fields?.reduce((acc, field) => {
            acc[field] = '***masked***';
            return acc;
          }, {})
        }
      },
      response,
      performance: {
        request_time: delay,
        response_size: JSON.stringify(response).length,
        status_code: response.status
      },
      success: response.status < 400,
      metadata: {
        simulation_engine_version: '2.0.0',
        mock_data: true,
        version_specific: true
      }
    };
    
    // Store simulation history
    if (!this.simulationHistory.has(integrationId)) {
      this.simulationHistory.set(integrationId, []);
    }
    this.simulationHistory.get(integrationId).push(simulationLog);
    
    // Keep only last 10 simulations per integration
    const history = this.simulationHistory.get(integrationId);
    if (history.length > 10) {
      history.shift();
    }
    
    return simulationLog;
  }

  // Get simulation history
  getSimulationHistory(integrationId, limit = 10) {
    const history = this.simulationHistory.get(integrationId) || [];
    return history.slice(-limit);
  }

  // Get current version for integration
  getCurrentVersion(integrationId) {
    return this.currentVersions.get(integrationId) || 'v1';
  }

  // Update version for integration
  updateVersion(integrationId, version) {
    this.currentVersions.set(integrationId, version);
  }

  // Create version snapshot
  createVersionSnapshot(integrationId, version, config) {
    const snapshotId = `${integrationId}_${version}_${Date.now()}`;
    this.versionSnapshots.set(snapshotId, {
      snapshotId,
      integrationId,
      version,
      config: JSON.parse(JSON.stringify(config)), // Deep copy
      timestamp: new Date().toISOString(),
      previous_version: this.getCurrentVersion(integrationId)
    });
    
    return snapshotId;
  }

  // Rollback to previous version
  rollbackToSnapshot(snapshotId) {
    const snapshot = this.versionSnapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
    
    // Restore version
    this.updateVersion(snapshot.integrationId, snapshot.previous_version);
    
    return {
      success: true,
      rolled_back_to: snapshot.previous_version,
      from_version: snapshot.version,
      snapshot_id: snapshotId
    };
  }

  // Get available snapshots for integration
  getSnapshots(integrationId) {
    const snapshots = [];
    for (const [snapshotId, snapshot] of this.versionSnapshots.entries()) {
      if (snapshot.integrationId === integrationId) {
        snapshots.push(snapshot);
      }
    }
    return snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get all simulation statistics
  getSimulationStats() {
    const stats = {
      total_simulations: 0,
      success_rate: 0,
      failure_rate: 0,
      timeout_rate: 0,
      version_distribution: {},
      service_distribution: {},
      average_response_time: 0
    };
    
    let totalResponseTime = 0;
    let successCount = 0;
    let failureCount = 0;
    let timeoutCount = 0;
    
    for (const history of this.simulationHistory.values()) {
      for (const log of history) {
        stats.total_simulations++;
        totalResponseTime += log.performance.request_time;
        
        if (log.success) {
          successCount++;
        } else if (log.response.status === 408) {
          timeoutCount++;
        } else {
          failureCount++;
        }
        
        // Version distribution
        const version = log.version;
        stats.version_distribution[version] = (stats.version_distribution[version] || 0) + 1;
        
        // Service distribution
        const service = log.service;
        stats.service_distribution[service] = (stats.service_distribution[service] || 0) + 1;
      }
    }
    
    if (stats.total_simulations > 0) {
      stats.success_rate = (successCount / stats.total_simulations * 100).toFixed(2);
      stats.failure_rate = (failureCount / stats.total_simulations * 100).toFixed(2);
      stats.timeout_rate = (timeoutCount / stats.total_simulations * 100).toFixed(2);
      stats.average_response_time = (totalResponseTime / stats.total_simulations).toFixed(2);
    }
    
    return stats;
  }
}

// Initialize simulation engine
const simulationEngine = new SimulationEngine();

// API Routes

// POST /simulate - Run simulation
app.post('/simulate', async (req, res) => {
  try {
    const { config, version, scenario = 'success' } = req.body;
    
    if (!config || !version) {
      return res.status(400).json({
        success: false,
        error: 'config and version are required'
      });
    }
    
    // Update current version
    const integrationId = config.id || config.service?.toLowerCase() + '_' + version;
    simulationEngine.updateVersion(integrationId, version);
    
    // Create snapshot before simulation
    const snapshotId = simulationEngine.createVersionSnapshot(integrationId, version, config);
    
    // Run simulation
    const result = await simulationEngine.simulateIntegration(config, version, scenario);
    
    res.json({
      success: true,
      data: {
        simulation: result,
        snapshot_id: snapshotId,
        current_version: version
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /rollback - Rollback to previous version
app.post('/rollback', (req, res) => {
  try {
    const { snapshot_id } = req.body;
    
    if (!snapshot_id) {
      return res.status(400).json({
        success: false,
        error: 'snapshot_id is required'
      });
    }
    
    const result = simulationEngine.rollbackToSnapshot(snapshot_id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /simulations/:integrationId - Get simulation history
app.get('/simulations/:integrationId', (req, res) => {
  try {
    const { integrationId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = simulationEngine.getSimulationHistory(integrationId, limit);
    
    res.json({
      success: true,
      data: {
        integrationId,
        current_version: simulationEngine.getCurrentVersion(integrationId),
        history,
        total_count: history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /snapshots/:integrationId - Get snapshots for integration
app.get('/snapshots/:integrationId', (req, res) => {
  try {
    const { integrationId } = req.params;
    
    const snapshots = simulationEngine.getSnapshots(integrationId);
    
    res.json({
      success: true,
      data: {
        integrationId,
        snapshots,
        total_count: snapshots.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /stats - Get simulation statistics
app.get('/stats', (req, res) => {
  try {
    const stats = simulationEngine.getSimulationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /versions - Get available versions
app.get('/versions', (req, res) => {
  try {
    const versions = [
      {
        version: 'v1',
        description: 'Basic version with simple responses',
        features: ['basic_responses', 'standard_logging'],
        status: 'stable'
      },
      {
        version: 'v2',
        description: 'Enhanced version with additional metadata',
        features: ['enhanced_responses', 'extended_metadata', 'detailed_logging'],
        status: 'stable'
      },
      {
        version: 'v3',
        description: 'Advanced version with full feature set',
        features: ['advanced_responses', 'performance_metrics', 'risk_scoring', 'compliance_flags'],
        status: 'beta'
      }
    ];
    
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /scenarios - Get available scenarios
app.get('/scenarios', (req, res) => {
  try {
    const scenarios = [
      {
        name: 'success',
        description: 'Successful API response',
        status_code: 200,
        probability: 0.7
      },
      {
        name: 'failure',
        description: 'API returns validation error',
        status_code: 400,
        probability: 0.2
      },
      {
        name: 'timeout',
        description: 'API request times out',
        status_code: 408,
        probability: 0.05
      },
      {
        name: 'server_error',
        description: 'Internal server error',
        status_code: 500,
        probability: 0.05
      }
    ];
    
    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  const stats = simulationEngine.getSimulationStats();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Enhanced Simulation Engine',
    version: '2.0.0',
    capabilities: {
      mock_responses: true,
      version_testing: true,
      rollback_support: true,
      simulation_history: true,
      performance_metrics: true
    },
    statistics: stats
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Simulation Engine running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Simulate endpoint: http://localhost:${PORT}/simulate`);
});

module.exports = app;
