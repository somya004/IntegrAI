const { v4: uuidv4 } = require('uuid');
const simulationService = require('../services/simulationService');

class SimulationController {
  async runSimulation(req, res) {
    try {
      const { service, payload } = req.body;

      // Validate required fields
      if (!service) {
        return res.status(400).json({
          success: false,
          error: 'Service name is required'
        });
      }

      if (typeof service !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Service must be a string'
        });
      }

      // Validate service is supported
      const supportedServices = ['KYC', 'BUREAU', 'PAYMENTS', 'OPEN_BANKING', 'GST', 'FRAUD'];
      if (!supportedServices.includes(service.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Unsupported service: ${service}. Supported services: ${supportedServices.join(', ')}`
        });
      }

      // Validate payload (optional, but if provided must be object)
      if (payload && typeof payload !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Payload must be an object'
        });
      }

      console.log(`🔄 Running simulation for service: ${service}`);
      
      // Use the enhanced simulation service
      const result = await simulationService.simulateIntegration(service.toUpperCase(), payload || {});
      
      // Log the simulation
      console.log(`✅ Simulation completed: ${result.status.toUpperCase()} - ${result.responseTime}`);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error running simulation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run simulation',
        message: error.message
      });
    }
  }

  async runLegacySimulation(req, res) {
    try {
      const { config, payload } = req.body;

      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'Configuration is required'
        });
      }

      const simulationId = uuidv4();
      const startTime = new Date();

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate mock response based on service type
      const mockResponse = this.generateMockResponse(config, payload);
      
      // Random success/failure for demo purposes (80% success rate)
      const success = Math.random() > 0.2;
      
      const endTime = new Date();
      const processingTime = endTime - startTime;

      const result = {
        simulationId,
        success,
        processingTime: `${processingTime}ms`,
        request: {
          url: `https://api.example.com/${config.service.toLowerCase()}/${config.version}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
            'X-Tenant-ID': config.tenant
          },
          payload: this.transformPayload(config, payload)
        },
        response: success ? mockResponse : {
          error: 'Service temporarily unavailable',
          code: 'SERVICE_ERROR',
          message: 'The external service is currently experiencing issues'
        },
        metadata: {
          service: config.service,
          version: config.version,
          tenant: config.tenant,
          timestamp: endTime.toISOString(),
          mappingsApplied: Object.keys(config.mapping || {}).length
        }
      };

      // Log the simulation (in production, this would go to a database)
      console.log(`Simulation ${simulationId}: ${success ? 'SUCCESS' : 'FAILURE'} - ${processingTime}ms`);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error running simulation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run simulation',
        message: error.message
      });
    }
  }

  generateMockResponse(config, payload) {
    const service = config.service;
    const responses = {
      'KYC': {
        status: 'verified',
        verificationId: `KYC_${Date.now()}`,
        customer: {
          fullName: payload?.name || 'John Doe',
          verificationStatus: 'PASS',
          riskScore: Math.floor(Math.random() * 100),
          checksPerformed: ['identity', 'address', 'document']
        },
        timestamp: new Date().toISOString()
      },
      'GST': {
        status: 'active',
        gstin: `27AAAPL1234C1Z${Math.floor(Math.random() * 1000)}`,
        business: {
          legalName: payload?.name || 'ABC Corporation',
          registrationDate: '2020-01-15',
          complianceStatus: 'COMPLIANT'
        },
        timestamp: new Date().toISOString()
      },
      'Payment': {
        status: 'completed',
        transactionId: `TXN_${Date.now()}`,
        payment: {
          amount: payload?.amount || 1000,
          currency: 'INR',
          status: 'SUCCESS',
          gateway: 'MockPay'
        },
        timestamp: new Date().toISOString()
      },
      'Fraud': {
        status: 'cleared',
        riskScore: Math.floor(Math.random() * 100),
        analysis: {
          riskLevel: 'LOW',
          flags: [],
          recommendation: 'APPROVE'
        },
        timestamp: new Date().toISOString()
      }
    };

    return responses[service] || {
      status: 'processed',
      messageId: `MSG_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  transformPayload(config, payload) {
    const transformed = {};
    
    if (!config.mapping || !payload) {
      return payload;
    }

    // Apply field mappings
    Object.entries(config.mapping).forEach(([clientField, apiField]) => {
      if (payload[clientField]) {
        transformed[apiField] = payload[clientField];
      }
    });

    return transformed;
  }

  async getSimulationHistory(req, res) {
    try {
      // Mock history data
      const history = [
        {
          id: 'sim_1',
          service: 'KYC',
          status: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          processingTime: '1250ms'
        },
        {
          id: 'sim_2',
          service: 'GST',
          status: 'success',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          processingTime: '890ms'
        },
        {
          id: 'sim_3',
          service: 'Payment',
          status: 'failure',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          processingTime: '2100ms'
        }
      ];

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting simulation history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get simulation history'
      });
    }
  }

  async getSupportedServices(req, res) {
    try {
      const services = [
        {
          name: 'KYC',
          description: 'Know Your Customer verification',
          apiKey: simulationService.maskApiKey(process.env.KYC_API_KEY)
        },
        {
          name: 'BUREAU',
          description: 'Credit bureau integration',
          apiKey: simulationService.maskApiKey(process.env.BUREAU_API_KEY)
        },
        {
          name: 'PAYMENTS',
          description: 'Payment gateway processing',
          apiKey: simulationService.maskApiKey(process.env.PAYMENTS_API_KEY)
        },
        {
          name: 'OPEN_BANKING',
          description: 'Open banking API',
          apiKey: simulationService.maskApiKey(process.env.OPEN_BANKING_API_KEY)
        },
        {
          name: 'GST',
          description: 'GST verification',
          apiKey: simulationService.maskApiKey(process.env.KYC_API_KEY)
        },
        {
          name: 'FRAUD',
          description: 'Fraud detection',
          apiKey: simulationService.maskApiKey(process.env.BUREAU_API_KEY)
        }
      ];

      res.json({
        success: true,
        data: services,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting supported services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get supported services'
      });
    }
  }
}

module.exports = new SimulationController();
