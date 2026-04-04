const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory tenant storage
class TenantConfigStore {
  constructor() {
    this.configurations = new Map();
    this.initializeDefaultTenants();
  }

  initializeDefaultTenants() {
    // Default tenant configurations
    const defaultConfigs = {
      'bank_a': {
        tenant_id: 'bank_a',
        tenant_name: 'Bank A',
        tenant_type: 'banking',
        created_at: new Date().toISOString(),
        integrations: [
          {
            id: 'kyc-karza-v1',
            service: 'KYC',
            provider: 'Karza',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                verify: 'https://api.karza.in/v1/kyc/verify',
                status: 'https://api.karza.in/v1/kyc/status'
              },
              authentication: {
                type: 'API Key',
                header: 'X-API-Key',
                credentials: {
                  api_key: 'bank_a_karza_key_12345'
                }
              },
              rate_limit: {
                requests: 100,
                period: 'minute'
              },
              required_fields: ['panNumber', 'aadhaarNumber', 'fullName', 'dateOfBirth'],
              webhook_url: 'https://bank-a.com/webhooks/kyc'
            }
          },
          {
            id: 'gst-cleartax-v1',
            service: 'GST',
            provider: 'ClearTax',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                verify: 'https://api.cleartax.in/v1/gst/verify',
                details: 'https://api.cleartax.in/v1/gst/details',
                returns: 'https://api.cleartax.in/v1/gst/returns'
              },
              authentication: {
                type: 'API Key',
                header: 'X-API-Key',
                credentials: {
                  api_key: 'bank_a_cleartax_key_67890'
                }
              },
              rate_limit: {
                requests: 80,
                period: 'minute'
              },
              required_fields: ['gstin', 'businessName', 'state', 'registrationType'],
              webhook_url: 'https://bank-a.com/webhooks/gst'
            }
          },
          {
            id: 'payments-razorpay-v1',
            service: 'Payments',
            provider: 'Razorpay',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                create: 'https://api.razorpay.com/v1/payments',
                capture: 'https://api.razorpay.com/v1/payments/:id/capture',
                refund: 'https://api.razorpay.com/v1/payments/:id/refund',
                status: 'https://api.razorpay.com/v1/payments/:id'
              },
              authentication: {
                type: 'Basic Auth',
                header: 'Authorization',
                credentials: {
                  key_id: 'rzp_test_bank_a_key',
                  key_secret: 'rzp_test_bank_a_secret'
                }
              },
              rate_limit: {
                requests: 300,
                period: 'minute'
              },
              required_fields: ['amount', 'currency', 'receipt', 'notes'],
              webhook_url: 'https://bank-a.com/webhooks/payments'
            }
          }
        ],
        audit_logs: [],
        settings: {
          api_timeout: 30000,
          retry_attempts: 3,
          webhook_timeout: 10000,
          notification_settings: {
            email: true,
            sms: false,
            slack: true
          }
        }
      },
      'bank_b': {
        tenant_id: 'bank_b',
        tenant_name: 'Bank B',
        tenant_type: 'banking',
        created_at: new Date().toISOString(),
        integrations: [
          {
            id: 'kyc-onfido-v1',
            service: 'KYC',
            provider: 'Onfido',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                verify: 'https://api.onfido.com/v1/kyc/verify',
                status: 'https://api.onfido.com/v1/kyc/status',
                documents: 'https://api.onfido.com/v1/documents'
              },
              authentication: {
                type: 'Bearer Token',
                header: 'Authorization',
                credentials: {
                  token: 'bank_b_onfido_token_54321'
                }
              },
              rate_limit: {
                requests: 50,
                period: 'minute'
              },
              required_fields: ['firstName', 'lastName', 'email', 'documentType', 'documentFile'],
              webhook_url: 'https://bank-b.com/webhooks/kyc'
            }
          },
          {
            id: 'payments-stripe-v1',
            service: 'Payments',
            provider: 'Stripe',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                create: 'https://api.stripe.com/v1/charges',
                retrieve: 'https://api.stripe.com/v1/charges/:id',
                refund: 'https://api.stripe.com/v1/refunds',
                webhook: 'https://api.stripe.com/v1/webhooks'
              },
              authentication: {
                type: 'Bearer Token',
                header: 'Authorization',
                credentials: {
                  secret_key: 'sk_test_bank_b_stripe_key'
                }
              },
              rate_limit: {
                requests: 200,
                period: 'minute'
              },
              required_fields: ['amount', 'currency', 'source', 'description'],
              webhook_url: 'https://bank-b.com/webhooks/payments'
            }
          },
          {
            id: 'fraud-karza-v1',
            service: 'Fraud',
            provider: 'Karza',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                check: 'https://api.karza.in/v1/fraud/check',
                score: 'https://api.karza.in/v1/fraud/score',
                report: 'https://api.karza.in/v1/fraud/report'
              },
              authentication: {
                type: 'API Key',
                header: 'X-API-Key',
                credentials: {
                  api_key: 'bank_b_fraud_key_98765'
                }
              },
              rate_limit: {
                requests: 150,
                period: 'minute'
              },
              required_fields: ['transactionId', 'amount', 'accountNumber', 'deviceId'],
              webhook_url: 'https://bank-b.com/webhooks/fraud'
            }
          }
        ],
        audit_logs: [],
        settings: {
          api_timeout: 25000,
          retry_attempts: 2,
          webhook_timeout: 8000,
          notification_settings: {
            email: true,
            sms: true,
            slack: false
          }
        }
      },
      'fintech_x': {
        tenant_id: 'fintech_x',
        tenant_name: 'Fintech X',
        tenant_type: 'fintech',
        created_at: new Date().toISOString(),
        integrations: [
          {
            id: 'kyc-karza-v2',
            service: 'KYC',
            provider: 'Karza',
            version: 'v2',
            status: 'active',
            config: {
              endpoints: {
                verify: 'https://api.karza.in/v2/kyc/verify',
                status: 'https://api.karza.in/v2/kyc/status',
                enhanced: 'https://api.karza.in/v2/kyc/enhanced'
              },
              authentication: {
                type: 'API Key',
                header: 'X-API-Key',
                credentials: {
                  api_key: 'fintech_x_karza_key_24680'
                }
              },
              rate_limit: {
                requests: 200,
                period: 'minute'
              },
              required_fields: ['panNumber', 'aadhaarNumber', 'fullName', 'dateOfBirth', 'mobileNumber'],
              webhook_url: 'https://fintech-x.com/webhooks/kyc'
            }
          },
          {
            id: 'payments-razorpay-v2',
            service: 'Payments',
            provider: 'Razorpay',
            version: 'v2',
            status: 'active',
            config: {
              endpoints: {
                create: 'https://api.razorpay.com/v2/payments',
                capture: 'https://api.razorpay.com/v2/payments/:id/capture',
                refund: 'https://api.razorpay.com/v2/payments/:id/refund',
                status: 'https://api.razorpay.com/v2/payments/:id',
                webhooks: 'https://api.razorpay.com/v2/webhooks'
              },
              authentication: {
                type: 'Bearer Token',
                header: 'Authorization',
                credentials: {
                  token: 'rzp_test_fintech_x_token'
                }
              },
              rate_limit: {
                requests: 500,
                period: 'minute'
              },
              required_fields: ['amount', 'currency', 'receipt', 'notes', 'callbackUrl'],
              webhook_url: 'https://fintech-x.com/webhooks/payments'
            }
          },
          {
            id: 'fraud-check-v1',
            service: 'Fraud',
            provider: 'Check',
            version: 'v1',
            status: 'active',
            config: {
              endpoints: {
                screen: 'https://api.check.com/v1/fraud/screen',
                assess: 'https://api.check.com/v1/fraud/assess',
                monitor: 'https://api.check.com/v1/fraud/monitor'
              },
              authentication: {
                type: 'API Key',
                header: 'X-API-Key',
                credentials: {
                  api_key: 'fintech_x_check_key_13579'
                }
              },
              rate_limit: {
                requests: 100,
                period: 'minute'
              },
              required_fields: ['userId', 'transactionAmount', 'riskScore', 'deviceId'],
              webhook_url: 'https://fintech-x.com/webhooks/fraud'
            }
          }
        ],
        audit_logs: [],
        settings: {
          api_timeout: 20000,
          retry_attempts: 4,
          webhook_timeout: 12000,
          notification_settings: {
            email: false,
            sms: true,
            slack: true
          }
        }
      }
    };

    Object.entries(defaultConfigs).forEach(([tenantId, config]) => {
      this.configurations.set(tenantId, config);
    });
  }

  // Get tenant configuration
  getTenantConfig(tenantId) {
    return this.configurations.get(tenantId);
  }

  // Update tenant configuration
  updateTenantConfig(tenantId, config) {
    this.configurations.set(tenantId, {
      ...this.configurations.get(tenantId),
      ...config,
      updated_at: new Date().toISOString()
    });
  }

  // Add integration to tenant
  addIntegration(tenantId, integration) {
    const config = this.configurations.get(tenantId);
    if (config) {
      config.integrations.push({
        ...integration,
        created_at: new Date().toISOString(),
        status: 'active'
      });
      this.updateTenantConfig(tenantId, config);
    }
  }

  // Remove integration from tenant
  removeIntegration(tenantId, integrationId) {
    const config = this.configurations.get(tenantId);
    if (config) {
      config.integrations = config.integrations.filter(int => int.id !== integrationId);
      this.updateTenantConfig(tenantId, config);
    }
  }

  // Get all tenants
  getAllTenants() {
    return Array.from(this.configurations.entries()).map(([tenantId, config]) => ({
      tenant_id: tenantId,
      tenant_name: config.tenant_name,
      tenant_type: config.tenant_type,
      created_at: config.created_at,
      updated_at: config.updated_at,
      integration_count: config.integrations.length,
      active_integrations: config.integrations.filter(int => int.status === 'active').length
    }));
  }

  // Add audit log
  addAuditLog(tenantId, logEntry) {
    const config = this.configurations.get(tenantId);
    if (config) {
      config.audit_logs.push({
        ...logEntry,
        timestamp: new Date().toISOString(),
        tenant_id: tenantId
      });
      this.updateTenantConfig(tenantId, config);
    }
  }

  // Get audit logs for tenant
  getAuditLogs(tenantId, limit = 50) {
    const config = this.configurations.get(tenantId);
    if (config) {
      return config.audit_logs.slice(-limit);
    }
    return [];
  }
}

// Initialize tenant store
const tenantStore = new TenantConfigStore();

// API Routes

// GET /tenants - Get all tenants
app.get('/tenants', (req, res) => {
  try {
    const tenants = tenantStore.getAllTenants();
    res.json({
      success: true,
      data: tenants,
      total: tenants.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /tenants/:tenantId - Get specific tenant configuration
app.get('/tenants/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = tenantStore.getTenantConfig(tenantId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenantId} not found`
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /tenants/:tenantId/integrations - Add integration to tenant
app.post('/tenants/:tenantId/integrations', (req, res) => {
  try {
    const { tenantId } = req.params;
    const integration = req.body;
    
    // Validate required fields
    const requiredFields = ['id', 'service', 'provider', 'version', 'config'];
    const missingFields = requiredFields.filter(field => !integration[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Add audit log
    tenantStore.addAuditLog(tenantId, {
      action: 'integration_added',
      details: {
        integration_id: integration.id,
        service: integration.service,
        provider: integration.provider,
        version: integration.version
      }
    });
    
    tenantStore.addIntegration(tenantId, integration);
    
    res.status(201).json({
      success: true,
      data: integration,
      message: 'Integration added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /tenants/:tenantId/integrations/:integrationId - Remove integration
app.delete('/tenants/:tenantId/integrations/:integrationId', (req, res) => {
  try {
    const { tenantId, integrationId } = req.params;
    
    const config = tenantStore.getTenantConfig(tenantId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenantId} not found`
      });
    }
    
    const integration = config.integrations.find(int => int.id === integrationId);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: `Integration ${integrationId} not found`
      });
    }
    
    // Add audit log
    tenantStore.addAuditLog(tenantId, {
      action: 'integration_removed',
      details: {
        integration_id: integrationId,
        service: integration.service,
        provider: integration.provider,
        version: integration.version
      }
    });
    
    tenantStore.removeIntegration(tenantId, integrationId);
    
    res.json({
      success: true,
      data: integration,
      message: 'Integration removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /tenants/:tenantId/integrations/:integrationId - Update integration
app.put('/tenants/:tenantId/integrations/:integrationId', (req, res) => {
  try {
    const { tenantId, integrationId } = req.params;
    const updates = req.body;
    
    const config = tenantStore.getTenantConfig(tenantId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenantId} not found`
      });
    }
    
    const integrationIndex = config.integrations.findIndex(int => int.id === integrationId);
    if (integrationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Integration ${integrationId} not found`
      });
    }
    
    const oldIntegration = config.integrations[integrationIndex];
    config.integrations[integrationIndex] = {
      ...oldIntegration,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Add audit log
    tenantStore.addAuditLog(tenantId, {
      action: 'integration_updated',
      details: {
        integration_id: integrationId,
        changes: updates,
        previous_config: oldIntegration
      }
    });
    
    tenantStore.updateTenantConfig(tenantId, config);
    
    res.json({
      success: true,
      data: config.integrations[integrationIndex],
      message: 'Integration updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /tenants/:tenantId/integrations - Get all integrations for tenant
app.get('/tenants/:tenantId/integrations', (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = tenantStore.getTenantConfig(tenantId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenantId} not found`
      });
    }
    
    res.json({
      success: true,
      data: config.integrations,
      total: config.integrations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /tenants/:tenantId/audit-logs - Get audit logs for tenant
app.get('/tenants/:tenantId/audit-logs', (req, res) => {
  try {
    const { tenantId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = tenantStore.getAuditLogs(tenantId, limit);
    
    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /tenants/:tenantId/audit-logs - Add audit log for tenant
app.post('/tenants/:tenantId/audit-logs', (req, res) => {
  try {
    const { tenantId } = req.params;
    const logEntry = req.body;
    
    tenantStore.addAuditLog(tenantId, logEntry);
    
    res.status(201).json({
      success: true,
      message: 'Audit log added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /tenants/:tenantId/settings - Update tenant settings
app.put('/tenants/:tenantId/settings', (req, res) => {
  try {
    const { tenantId } = req.params;
    const settings = req.body;
    
    const config = tenantStore.getTenantConfig(tenantId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenantId} not found`
      });
    }
    
    const oldSettings = config.settings;
    config.settings = { ...config.settings, ...settings };
    
    // Add audit log
    tenantStore.addAuditLog(tenantId, {
      action: 'settings_updated',
      details: {
        changes: settings,
        previous_settings: oldSettings
      }
    });
    
    tenantStore.updateTenantConfig(tenantId, config);
    
    res.json({
      success: true,
      data: config.settings,
      message: 'Settings updated successfully'
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
    service: 'Multi-Tenant Configuration Service',
    version: '1.0.0',
    tenants: tenantStore.getAllTenants().length,
    capabilities: {
      tenant_isolation: true,
      configuration_management: true,
      audit_logging: true,
      settings_management: true
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multi-Tenant Configuration Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Tenants: http://localhost:${PORT}/tenants`);
});

module.exports = app;
