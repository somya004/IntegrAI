const express = require('express');
const IntegrationRegistrySystem = require('../services/IntegrationRegistrySystem');
const router = express.Router();

// Initialize the integration registry system
const integrationSystem = new IntegrationRegistrySystem();

// Main integration endpoint - works with parser output
router.post('/process', async (req, res) => {
  try {
    const { parsedData, options = {} } = req.body;

    if (!parsedData || !parsedData.services) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parsed data. Services array is required.'
      });
    }

    console.log('Processing integration registry for', parsedData.services.length, 'services');

    const result = await integrationSystem.integrationLoop(parsedData, options);

    res.json({
      success: true,
      data: result.data,
      executionLog: result.executionLog,
      integrationSummary: result.integrationSummary,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Integration processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallbackData: integrationSystem.generateFallbackIntegration(req.body.parsedData || {})
    });
  }
});

// Get adapter registry information
router.get('/adapters', (req, res) => {
  try {
    const { search, service, provider } = req.query;
    let adapters = integrationSystem.getAdapterRegistry().getAllAdapters();

    // Apply filters
    if (search) {
      adapters = integrationSystem.getAdapterRegistry().searchAdapters(search);
    } else if (service) {
      adapters = integrationSystem.getAdapterRegistry().findAdaptersByService(service);
    } else if (provider) {
      adapters = integrationSystem.getAdapterRegistry().findAdaptersByProvider(provider);
    }

    res.json({
      success: true,
      data: adapters,
      total: adapters.length,
      stats: integrationSystem.getAdapterRegistry().getStats()
    });

  } catch (error) {
    console.error('Get adapters error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific adapter details
router.get('/adapters/:id', (req, res) => {
  try {
    const adapter = integrationSystem.getAdapterRegistry().getAdapter(req.params.id);
    
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: 'Adapter not found'
      });
    }

    // Add version information
    const versionInfo = integrationSystem.getVersionManager().estimateVersionPerformance(adapter, 'v1');

    res.json({
      success: true,
      data: {
        ...adapter,
        versionInfo
      }
    });

  } catch (error) {
    console.error('Get adapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register new adapter
router.post('/adapters', (req, res) => {
  try {
    const adapterData = req.body;
    
    if (!adapterData.id || !adapterData.service) {
      return res.status(400).json({
        success: false,
        error: 'Adapter must have id and service properties'
      });
    }

    const registeredAdapter = integrationSystem.getAdapterRegistry().registerAdapter(adapterData);

    res.status(201).json({
      success: true,
      data: registeredAdapter,
      message: 'Adapter registered successfully'
    });

  } catch (error) {
    console.error('Register adapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove adapter
router.delete('/adapters/:id', (req, res) => {
  try {
    const removed = integrationSystem.getAdapterRegistry().removeAdapter(req.params.id);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Adapter not found'
      });
    }

    res.json({
      success: true,
      message: 'Adapter removed successfully'
    });

  } catch (error) {
    console.error('Remove adapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test adapter versions in parallel
router.post('/adapters/:id/test-versions', async (req, res) => {
  try {
    const adapter = integrationSystem.getAdapterRegistry().getAdapter(req.params.id);
    
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: 'Adapter not found'
      });
    }

    const { testCases = [] } = req.body;
    const testResults = await integrationSystem.getVersionManager().testVersionsInParallel(adapter, testCases);

    res.json({
      success: true,
      data: testResults,
      adapter: adapter.id
    });

  } catch (error) {
    console.error('Test versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Explain adapter matching
router.get('/explain/:serviceName', async (req, res) => {
  try {
    const serviceName = req.params.serviceName;
    const explanation = await integrationSystem.explainMatching(serviceName);

    res.json({
      success: true,
      data: explanation
    });

  } catch (error) {
    console.error('Explain matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system statistics
router.get('/stats', (req, res) => {
  try {
    const stats = integrationSystem.getSystemStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available services
router.get('/services', (req, res) => {
  try {
    const services = integrationSystem.getAdapterRegistry().getServices();
    const providers = integrationSystem.getAdapterRegistry().getProviders();

    res.json({
      success: true,
      data: {
        services,
        providers,
        totalServices: services.length,
        totalProviders: providers.length
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Hook management endpoints
router.get('/hooks', (req, res) => {
  try {
    const hookEngine = integrationSystem.getHookEngine();
    const hookStats = hookEngine.getHookStats();
    const executionLog = hookEngine.getExecutionLog(50);

    res.json({
      success: true,
      data: {
        stats: hookStats,
        recentExecutions: executionLog
      }
    });

  } catch (error) {
    console.error('Get hooks error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add custom hook
router.post('/hooks', (req, res) => {
  try {
    const { type, hookFunction, options = {} } = req.body;
    
    if (!type || !hookFunction) {
      return res.status(400).json({
        success: false,
        error: 'Hook type and function are required'
      });
    }

    // Convert string function to actual function (in production, use proper validation)
    const func = new Function('data', 'context', hookFunction);
    
    let hookId;
    const hookEngine = integrationSystem.getHookEngine();
    
    switch (type) {
      case 'pre':
        hookId = hookEngine.addPreHook(func, options);
        break;
      case 'post':
        hookId = hookEngine.addPostHook(func, options);
        break;
      case 'error':
        hookId = hookEngine.addErrorHook(func, options);
        break;
      case 'transform':
        hookId = hookEngine.addTransformHook(func, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid hook type. Must be pre, post, error, or transform'
        });
    }

    res.status(201).json({
      success: true,
      data: { hookId },
      message: 'Hook added successfully'
    });

  } catch (error) {
    console.error('Add hook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove hook
router.delete('/hooks/:hookId', (req, res) => {
  try {
    const hookEngine = integrationSystem.getHookEngine();
    const removed = hookEngine.removeHook(req.params.hookId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Hook not found'
      });
    }

    res.json({
      success: true,
      message: 'Hook removed successfully'
    });

  } catch (error) {
    console.error('Remove hook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Version management endpoints
router.get('/versions/:adapterId', (req, res) => {
  try {
    const versionHistory = integrationSystem.getVersionManager().getVersionHistory(req.params.adapterId);
    
    res.json({
      success: true,
      data: versionHistory
    });

  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Select best version for adapter
router.post('/versions/:adapterId/select', (req, res) => {
  try {
    const adapter = integrationSystem.getAdapterRegistry().getAdapter(req.params.adapterId);
    
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: 'Adapter not found'
      });
    }

    const { requirement } = req.body;
    const versionSelection = integrationSystem.getVersionManager().selectBestVersion(adapter, requirement);

    res.json({
      success: true,
      data: versionSelection
    });

  } catch (error) {
    console.error('Select version error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        adapterRegistry: 'healthy',
        versionManager: 'healthy',
        hookEngine: 'healthy',
        adapterMatcher: 'healthy'
      },
      stats: integrationSystem.getSystemStats()
    };

    res.json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
