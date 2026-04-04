const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory adapter registry
let adapters = [
  // KYC Services
  {
    id: 'kyc-karza-v1',
    service: 'KYC',
    provider: 'Karza',
    version: 'v1',
    endpoints: {
      verify: 'https://api.karza.in/v1/kyc/verify',
      status: 'https://api.karza.in/v1/kyc/status'
    },
    requiredFields: ['panNumber', 'aadhaarNumber', 'fullName', 'dateOfBirth'],
    authentication: {
      type: 'API Key',
      header: 'X-API-Key'
    },
    rateLimit: {
      requests: 100,
      period: 'minute'
    },
    description: 'Karza KYC verification service for identity verification'
  },
  {
    id: 'kyc-karza-v2',
    service: 'KYC',
    provider: 'Karza',
    version: 'v2',
    endpoints: {
      verify: 'https://api.karza.in/v2/kyc/verify',
      status: 'https://api.karza.in/v2/kyc/status',
      enhanced: 'https://api.karza.in/v2/kyc/enhanced'
    },
    requiredFields: ['panNumber', 'aadhaarNumber', 'fullName', 'dateOfBirth', 'mobileNumber'],
    authentication: {
      type: 'API Key',
      header: 'X-API-Key'
    },
    rateLimit: {
      requests: 200,
      period: 'minute'
    },
    description: 'Enhanced Karza KYC verification with additional features'
  },
  {
    id: 'kyc-onfido-v1',
    service: 'KYC',
    provider: 'Onfido',
    version: 'v1',
    endpoints: {
      verify: 'https://api.onfido.com/v1/kyc/verify',
      status: 'https://api.onfido.com/v1/kyc/status',
      documents: 'https://api.onfido.com/v1/documents'
    },
    requiredFields: ['firstName', 'lastName', 'email', 'documentType', 'documentFile'],
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization'
    },
    rateLimit: {
      requests: 50,
      period: 'minute'
    },
    description: 'Onfido KYC service with document verification'
  },
  
  // GST Services
  {
    id: 'gst-cleartax-v1',
    service: 'GST',
    provider: 'ClearTax',
    version: 'v1',
    endpoints: {
      verify: 'https://api.cleartax.in/v1/gst/verify',
      details: 'https://api.cleartax.in/v1/gst/details',
      returns: 'https://api.cleartax.in/v1/gst/returns'
    },
    requiredFields: ['gstin', 'businessName', 'state', 'registrationType'],
    authentication: {
      type: 'API Key',
      header: 'X-API-Key'
    },
    rateLimit: {
      requests: 80,
      period: 'minute'
    },
    description: 'ClearTax GST verification and filing service'
  },
  
  // Payment Services
  {
    id: 'payments-razorpay-v1',
    service: 'Payments',
    provider: 'Razorpay',
    version: 'v1',
    endpoints: {
      create: 'https://api.razorpay.com/v1/payments',
      capture: 'https://api.razorpay.com/v1/payments/:id/capture',
      refund: 'https://api.razorpay.com/v1/payments/:id/refund',
      status: 'https://api.razorpay.com/v1/payments/:id'
    },
    requiredFields: ['amount', 'currency', 'receipt', 'notes'],
    authentication: {
      type: 'Basic Auth',
      header: 'Authorization'
    },
    rateLimit: {
      requests: 300,
      period: 'minute'
    },
    description: 'Razorpay payment processing service'
  },
  {
    id: 'payments-razorpay-v2',
    service: 'Payments',
    provider: 'Razorpay',
    version: 'v2',
    endpoints: {
      create: 'https://api.razorpay.com/v2/payments',
      capture: 'https://api.razorpay.com/v2/payments/:id/capture',
      refund: 'https://api.razorpay.com/v2/payments/:id/refund',
      status: 'https://api.razorpay.com/v2/payments/:id',
      webhooks: 'https://api.razorpay.com/v2/webhooks'
    },
    requiredFields: ['amount', 'currency', 'receipt', 'notes', 'callbackUrl'],
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization'
    },
    rateLimit: {
      requests: 500,
      period: 'minute'
    },
    description: 'Enhanced Razorpay v2 with webhook support'
  },
  
  // Fraud Detection Services
  {
    id: 'fraud-karza-v1',
    service: 'Fraud',
    provider: 'Karza',
    version: 'v1',
    endpoints: {
      check: 'https://api.karza.in/v1/fraud/check',
      score: 'https://api.karza.in/v1/fraud/score',
      report: 'https://api.karza.in/v1/fraud/report'
    },
    requiredFields: ['transactionId', 'amount', 'accountNumber', 'deviceId'],
    authentication: {
      type: 'API Key',
      header: 'X-API-Key'
    },
    rateLimit: {
      requests: 150,
      period: 'minute'
    },
    description: 'Karza fraud detection and risk assessment'
  }
];

// Helper function to group adapters by service
const groupAdaptersByService = () => {
  const grouped = {};
  
  adapters.forEach(adapter => {
    if (!grouped[adapter.service]) {
      grouped[adapter.service] = {
        service: adapter.service,
        providers: {}
      };
    }
    
    if (!grouped[adapter.service].providers[adapter.provider]) {
      grouped[adapter.service].providers[adapter.provider] = {
        provider: adapter.provider,
        versions: []
      };
    }
    
    grouped[adapter.service].providers[adapter.provider].versions.push({
      id: adapter.id,
      version: adapter.version,
      endpoints: adapter.endpoints,
      requiredFields: adapter.requiredFields,
      authentication: adapter.authentication,
      rateLimit: adapter.rateLimit,
      description: adapter.description
    });
  });
  
  return Object.values(grouped);
};

// API Routes

// GET /adapters - Get all adapters grouped by service
app.get('/adapters', (req, res) => {
  try {
    const groupedAdapters = groupAdaptersByService();
    res.json({
      success: true,
      data: groupedAdapters,
      total: adapters.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /adapters/:service - Get adapters for specific service
app.get('/adapters/:service', (req, res) => {
  try {
    const serviceName = req.params.service;
    const serviceAdapters = adapters.filter(adapter => 
      adapter.service.toLowerCase() === serviceName.toLowerCase()
    );
    
    if (serviceAdapters.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No adapters found for service: ${serviceName}`
      });
    }
    
    const groupedAdapters = groupAdaptersByService();
    const serviceGroup = groupedAdapters.find(group => 
      group.service.toLowerCase() === serviceName.toLowerCase()
    );
    
    res.json({
      success: true,
      data: serviceGroup,
      total: serviceAdapters.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /adapters/:service/:provider - Get adapters for specific service and provider
app.get('/adapters/:service/:provider', (req, res) => {
  try {
    const { service, provider } = req.params;
    const providerAdapters = adapters.filter(adapter => 
      adapter.service.toLowerCase() === service.toLowerCase() &&
      adapter.provider.toLowerCase() === provider.toLowerCase()
    );
    
    if (providerAdapters.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No adapters found for ${service} - ${provider}`
      });
    }
    
    const groupedAdapters = groupAdaptersByService();
    const serviceGroup = groupedAdapters.find(group => 
      group.service.toLowerCase() === service.toLowerCase()
    );
    
    const providerGroup = serviceGroup.providers[provider];
    
    res.json({
      success: true,
      data: {
        service: serviceGroup.service,
        providers: {
          [provider]: providerGroup
        }
      },
      total: providerAdapters.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /adapters - Add new adapter
app.post('/adapters', (req, res) => {
  try {
    const newAdapter = req.body;
    
    // Validation
    const requiredFields = ['service', 'provider', 'version', 'endpoints', 'requiredFields', 'authentication'];
    const missingFields = requiredFields.filter(field => !newAdapter[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Generate ID
    newAdapter.id = `${newAdapter.service.toLowerCase()}-${newAdapter.provider.toLowerCase()}-${newAdapter.version}`;
    
    // Check if adapter already exists
    const existingAdapter = adapters.find(adapter => adapter.id === newAdapter.id);
    if (existingAdapter) {
      return res.status(409).json({
        success: false,
        error: `Adapter with ID ${newAdapter.id} already exists`
      });
    }
    
    // Add default values
    newAdapter.rateLimit = newAdapter.rateLimit || { requests: 100, period: 'minute' };
    newAdapter.description = newAdapter.description || `${newAdapter.provider} ${newAdapter.service} adapter`;
    
    // Add to registry
    adapters.push(newAdapter);
    
    res.status(201).json({
      success: true,
      data: newAdapter,
      message: 'Adapter added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /adapters/:id - Delete adapter
app.delete('/adapters/:id', (req, res) => {
  try {
    const adapterId = req.params.id;
    const adapterIndex = adapters.findIndex(adapter => adapter.id === adapterId);
    
    if (adapterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Adapter with ID ${adapterId} not found`
      });
    }
    
    const deletedAdapter = adapters.splice(adapterIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedAdapter,
      message: 'Adapter deleted successfully'
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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Adapter Registry API',
    version: '1.0.0',
    adapters: adapters.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Adapter Registry API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Adapters: http://localhost:${PORT}/adapters`);
});

module.exports = app;
