const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors());
app.use(express.json());

// Security Service with Credential Vault
class SecurityService {
  constructor() {
    this.credentialVault = new Map();
    this.encryptionKey = crypto.randomBytes(32).toString('hex');
    this.initializeDefaultCredentials();
  }

  // Mock encryption function (in production, use proper encryption)
  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Mock decryption function
  decrypt(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv, tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // For demo purposes, return a masked version if decryption fails
      return '***decryption_error***';
    }
  }

  // Initialize default encrypted credentials
  initializeDefaultCredentials() {
    const defaultCredentials = [
      {
        id: 'karza_kyc_key',
        name: 'Karza KYC API Key',
        service: 'KYC',
        provider: 'Karza',
        type: 'api_key',
        value: 'karza_live_api_key_12345abcdef',
        created_at: new Date().toISOString()
      },
      {
        id: 'razorpay_key',
        name: 'Razorpay Key ID',
        service: 'Payments',
        provider: 'Razorpay',
        type: 'key_id',
        value: 'rzp_live_1234567890abcdef',
        created_at: new Date().toISOString()
      },
      {
        id: 'razorpay_secret',
        name: 'Razorpay Secret',
        service: 'Payments',
        provider: 'Razorpay',
        type: 'secret',
        value: 'razorpay_live_secret_1234567890abcdef',
        created_at: new Date().toISOString()
      },
      {
        id: 'cleartax_gst_key',
        name: 'ClearTax GST API Key',
        service: 'GST',
        provider: 'ClearTax',
        type: 'api_key',
        value: 'cleartax_live_gst_key_12345abcdef',
        created_at: new Date().toISOString()
      },
      {
        id: 'stripe_secret',
        name: 'Stripe Secret Key',
        service: 'Payments',
        provider: 'Stripe',
        type: 'secret',
        value: 'sk_live_1234567890abcdef',
        created_at: new Date().toISOString()
      }
    ];

    defaultCredentials.forEach(cred => {
      const encrypted = this.encrypt(cred.value);
      this.credentialVault.set(cred.id, {
        ...cred,
        encrypted_value: encrypted,
        masked_value: this.maskCredential(cred.value)
      });
    });
  }

  // Mask credential for display
  maskCredential(value) {
    if (!value || value.length < 8) {
      return '***';
    }
    const start = value.substring(0, 4);
    const end = value.substring(value.length - 4);
    const middle = '*'.repeat(Math.max(3, value.length - 8));
    return start + middle + end;
  }

  // Store encrypted credential
  storeCredential(credentialData) {
    const { id, name, service, provider, type, value, tenant_id } = credentialData;
    
    if (!id || !value) {
      throw new Error('Credential ID and value are required');
    }

    const encrypted = this.encrypt(value);
    const credential = {
      id,
      name,
      service,
      provider,
      type,
      encrypted_value: encrypted,
      masked_value: this.maskCredential(value),
      tenant_id: tenant_id || 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.credentialVault.set(id, credential);
    return credential;
  }

  // Get credential (returns masked version)
  getCredential(id) {
    const credential = this.credentialVault.get(id);
    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      name: credential.name,
      service: credential.service,
      provider: credential.provider,
      type: credential.type,
      masked_value: credential.masked_value,
      tenant_id: credential.tenant_id,
      created_at: credential.created_at,
      updated_at: credential.updated_at
    };
  }

  // Get decrypted credential (for internal use only)
  getDecryptedCredential(id) {
    const credential = this.credentialVault.get(id);
    if (!credential) {
      return null;
    }

    const decryptedValue = this.decrypt(credential.encrypted_value);
    
    return {
      ...credential,
      value: decryptedValue
    };
  }

  // Update credential
  updateCredential(id, updates) {
    const credential = this.credentialVault.get(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const updatedCredential = {
      ...credential,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.value) {
      updatedCredential.encrypted_value = this.encrypt(updates.value);
      updatedCredential.masked_value = this.maskCredential(updates.value);
    }

    this.credentialVault.set(id, updatedCredential);
    return updatedCredential;
  }

  // Delete credential
  deleteCredential(id) {
    const credential = this.credentialVault.get(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    this.credentialVault.delete(id);
    return credential;
  }

  // List credentials (masked)
  listCredentials(tenantId = null) {
    const credentials = [];
    
    for (const [id, credential] of this.credentialVault.entries()) {
      if (!tenantId || credential.tenant_id === tenantId) {
        credentials.push({
          id: credential.id,
          name: credential.name,
          service: credential.service,
          provider: credential.provider,
          type: credential.type,
          masked_value: credential.masked_value,
          tenant_id: credential.tenant_id,
          created_at: credential.created_at,
          updated_at: credential.updated_at
        });
      }
    }

    return credentials;
  }
}

// Audit Logging Service
class AuditLoggingService {
  constructor() {
    this.auditLogs = [];
    this.maxLogs = 1000; // Keep last 1000 logs
  }

  // Create audit log entry
  createLog(action, details, tenantId = null, userId = null) {
    const log = {
      id: crypto.randomUUID(),
      action,
      timestamp: new Date().toISOString(),
      tenant_id: tenantId,
      user_id: userId,
      details: details || {},
      ip_address: '127.0.0.1', // In production, get from request
      user_agent: 'ConfigAI Platform',
      severity: this.determineSeverity(action),
      category: this.determineCategory(action)
    };

    this.auditLogs.push(log);

    // Keep only the last maxLogs entries
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogs);
    }

    return log;
  }

  // Determine log severity based on action
  determineSeverity(action) {
    const highSeverityActions = [
      'CREDENTIAL_DELETED',
      'CREDENTIAL_UPDATED',
      'CONFIG_DELETED',
      'SIMULATION_FAILED',
      'ROLLBACK_EXECUTED',
      'SECURITY_BREACH_ATTEMPT'
    ];

    const mediumSeverityActions = [
      'CREDENTIAL_CREATED',
      'CONFIG_CREATED',
      'CONFIG_UPDATED',
      'MAPPING_UPDATED',
      'SIMULATION_RUN',
      'TENANT_CREATED',
      'TENANT_UPDATED'
    ];

    if (highSeverityActions.includes(action)) {
      return 'HIGH';
    } else if (mediumSeverityActions.includes(action)) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  // Determine log category based on action
  determineCategory(action) {
    if (action.includes('CREDENTIAL')) {
      return 'SECURITY';
    } else if (action.includes('CONFIG') || action.includes('MAPPING')) {
      return 'CONFIGURATION';
    } else if (action.includes('SIMULATION')) {
      return 'SIMULATION';
    } else if (action.includes('TENANT')) {
      return 'TENANT_MANAGEMENT';
    } else if (action.includes('LOGIN') || action.includes('AUTH')) {
      return 'AUTHENTICATION';
    } else {
      return 'GENERAL';
    }
  }

  // Get audit logs with filtering
  getLogs(filters = {}) {
    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.tenant_id) {
      logs = logs.filter(log => log.tenant_id === filters.tenant_id);
    }

    if (filters.user_id) {
      logs = logs.filter(log => log.user_id === filters.user_id);
    }

    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }

    if (filters.category) {
      logs = logs.filter(log => log.category === filters.category);
    }

    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    const limit = filters.limit || 100;
    logs = logs.slice(0, limit);

    return logs;
  }

  // Get audit statistics
  getStatistics(timeframe = '24h') {
    const now = new Date();
    const startTime = new Date(now.getTime() - this.getTimeframeMs(timeframe));
    
    const recentLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const stats = {
      total_logs: recentLogs.length,
      timeframe,
      severity_breakdown: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      category_breakdown: {},
      top_actions: {},
      tenant_breakdown: {},
      hourly_distribution: {}
    };

    recentLogs.forEach(log => {
      // Severity breakdown
      stats.severity_breakdown[log.severity]++;

      // Category breakdown
      stats.category_breakdown[log.category] = (stats.category_breakdown[log.category] || 0) + 1;

      // Top actions
      stats.top_actions[log.action] = (stats.top_actions[log.action] || 0) + 1;

      // Tenant breakdown
      if (log.tenant_id) {
        stats.tenant_breakdown[log.tenant_id] = (stats.tenant_breakdown[log.tenant_id] || 0) + 1;
      }

      // Hourly distribution
      const hour = new Date(log.timestamp).getHours();
      stats.hourly_distribution[hour] = (stats.hourly_distribution[hour] || 0) + 1;
    });

    return stats;
  }

  // Convert timeframe to milliseconds
  getTimeframeMs(timeframe) {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || timeframes['24h'];
  }
}

// Initialize services
const securityService = new SecurityService();
const auditService = new AuditLoggingService();

// API Routes

// Credential Management Routes

// POST /credentials - Store new credential
app.post('/credentials', (req, res) => {
  try {
    const credential = securityService.storeCredential(req.body);
    
    // Log the action
    auditService.createLog('CREDENTIAL_CREATED', {
      credential_id: credential.id,
      service: credential.service,
      provider: credential.provider,
      type: credential.type
    }, req.body.tenant_id, req.body.user_id);
    
    res.status(201).json({
      success: true,
      data: {
        id: credential.id,
        name: credential.name,
        service: credential.service,
        provider: credential.provider,
        type: credential.type,
        masked_value: credential.masked_value,
        tenant_id: credential.tenant_id,
        created_at: credential.created_at
      },
      message: 'Credential stored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /credentials - List credentials (masked)
app.get('/credentials', (req, res) => {
  try {
    const { tenant_id } = req.query;
    const credentials = securityService.listCredentials(tenant_id);
    
    res.json({
      success: true,
      data: credentials,
      total: credentials.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /credentials/:id - Get specific credential (masked)
app.get('/credentials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const credential = securityService.getCredential(id);
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }
    
    res.json({
      success: true,
      data: credential
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /credentials/:id - Update credential
app.put('/credentials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedCredential = securityService.updateCredential(id, req.body);
    
    // Log the action
    auditService.createLog('CREDENTIAL_UPDATED', {
      credential_id: id,
      updated_fields: Object.keys(req.body)
    }, req.body.tenant_id, req.body.user_id);
    
    res.json({
      success: true,
      data: {
        id: updatedCredential.id,
        name: updatedCredential.name,
        service: updatedCredential.service,
        provider: updatedCredential.provider,
        type: updatedCredential.type,
        masked_value: updatedCredential.masked_value,
        tenant_id: updatedCredential.tenant_id,
        updated_at: updatedCredential.updated_at
      },
      message: 'Credential updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /credentials/:id - Delete credential
app.delete('/credentials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deletedCredential = securityService.deleteCredential(id);
    
    // Log the action
    auditService.createLog('CREDENTIAL_DELETED', {
      credential_id: id,
      service: deletedCredential.service,
      provider: deletedCredential.provider
    }, req.body.tenant_id, req.body.user_id);
    
    res.json({
      success: true,
      data: {
        id: deletedCredential.id,
        name: deletedCredential.name
      },
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Audit Logging Routes

// GET /audit-logs - Get audit logs
app.get('/audit-logs', (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      user_id: req.query.user_id,
      action: req.query.action,
      category: req.query.category,
      severity: req.query.severity,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const logs = auditService.getLogs(filters);
    
    res.json({
      success: true,
      data: logs,
      total: logs.length,
      filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /audit-logs - Create audit log entry
app.post('/audit-logs', (req, res) => {
  try {
    const { action, details, tenant_id, user_id } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'action is required'
      });
    }
    
    const log = auditService.createLog(action, details, tenant_id, user_id);
    
    res.status(201).json({
      success: true,
      data: log,
      message: 'Audit log created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /audit-stats - Get audit statistics
app.get('/audit-stats', (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const stats = auditService.getStatistics(timeframe);
    
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

// Security Routes

// POST /security/encrypt - Encrypt text (demo)
app.post('/security/encrypt', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text is required'
      });
    }
    
    const encrypted = securityService.encrypt(text);
    
    // Log the encryption action
    auditService.createLog('ENCRYPTION_PERFORMED', {
      text_length: text.length
    }, req.body.tenant_id, req.body.user_id);
    
    res.json({
      success: true,
      data: encrypted,
      message: 'Text encrypted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /security/decrypt - Decrypt text (demo)
app.post('/security/decrypt', (req, res) => {
  try {
    const { encrypted_data } = req.body;
    
    if (!encrypted_data) {
      return res.status(400).json({
        success: false,
        error: 'encrypted_data is required'
      });
    }
    
    const decrypted = securityService.decrypt(encrypted_data);
    
    // Log the decryption action
    auditService.createLog('DECRYPTION_PERFORMED', {
      has_encrypted_data: !!encrypted_data
    }, req.body.tenant_id, req.body.user_id);
    
    res.json({
      success: true,
      data: { decrypted },
      message: 'Text decrypted successfully'
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
    service: 'Security and Audit Service',
    version: '1.0.0',
    capabilities: {
      credential_vault: true,
      encryption: true,
      audit_logging: true,
      log_filtering: true,
      statistics: true
    },
    statistics: {
      stored_credentials: securityService.credentialVault.size,
      total_audit_logs: auditService.auditLogs.length,
      max_logs_retained: auditService.maxLogs
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Security and Audit Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Credentials: http://localhost:${PORT}/credentials`);
  console.log(`📋 Audit logs: http://localhost:${PORT}/audit-logs`);
});

module.exports = app;
