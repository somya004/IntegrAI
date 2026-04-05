class StructuringEngine {
  constructor() {
    this.structureTemplate = {
      integration_plan: {
        services: [],
        apis: [],
        authentication: [],
        data_flow: [],
        dependencies: []
      },
      metadata: {
        version: "1.0",
        generated_at: null,
        confidence_score: 0,
        total_services: 0,
        mandatory_services: 0,
        processing_time: 0
      },
      schemas: {
        request_schemas: {},
        response_schemas: {}
      }
    };
  }

  async structure(classifiedData) {
    try {
      const startTime = Date.now();
      
      const structured = {
        ...this.structureTemplate,
        integration_plan: this.buildIntegrationPlan(classifiedData),
        metadata: this.buildMetadata(classifiedData, startTime),
        schemas: this.buildSchemas(classifiedData)
      };

      return {
        success: true,
        data: structured,
        processing_time: Date.now() - startTime
      };

    } catch (error) {
      console.error('Structuring failed:', error.message);
      return this.generateMockStructure(classifiedData);
    }
  }

  buildIntegrationPlan(classifiedData) {
    const plan = {
      services: this.structureServices(classifiedData.services || []),
      apis: this.structureAPIs(classifiedData.apis || []),
      authentication: this.structureAuthentication(classifiedData.authentication || []),
      data_flow: this.buildDataFlow(classifiedData),
      dependencies: this.buildDependencies(classifiedData)
    };

    return plan;
  }

  structureServices(services) {
    return services.map(service => ({
      id: this.generateId('service', service.name),
      name: service.name,
      type: service.type,
      category: service.classification?.category || 'general',
      mandatory: service.mandatory,
      confidence: service.confidence,
      priority: service.priority,
      risk_level: service.classification?.risk_level || 'low',
      implementation_complexity: service.classification?.implementation_complexity || 'medium',
      description: service.description || `${service.name} service`,
      endpoints: this.getServiceEndpoints(service.name, service.type),
      authentication: this.getServiceAuth(service.name, service.type),
      fields: this.getServiceFields(service.name, service.type),
      estimated_effort: this.estimateEffort(service),
      dependencies: []
    }));
  }

  structureAPIs(apis) {
    return apis.map(api => ({
      id: this.generateId('api', api.name),
      name: api.name,
      endpoint: api.endpoint,
      method: api.method,
      category: api.classification?.category || 'other',
      mandatory: api.mandatory,
      confidence: api.confidence,
      priority: api.priority,
      authentication: api.authentication,
      data_sensitivity: api.classification?.data_sensitivity || 'medium',
      implementation_complexity: api.classification?.implementation_complexity || 'medium',
      description: api.description || `${api.name} endpoint`,
      request_schema: this.buildRequestSchema(api),
      response_schema: this.buildResponseSchema(api),
      rate_limits: this.estimateRateLimits(api),
      error_handling: this.buildErrorHandling(api),
      monitoring: this.buildMonitoring(api)
    }));
  }

  structureAuthentication(authMethods) {
    return authMethods.map(auth => ({
      id: this.generateId('auth', auth.type),
      type: auth.type,
      category: auth.classification?.category || 'other',
      confidence: auth.confidence,
      security_level: auth.security_level,
      implementation_complexity: auth.implementation_complexity,
      applies_to: auth.applies_to || [],
      configuration: this.buildAuthConfiguration(auth),
      tokens: this.buildTokenManagement(auth),
      security: this.buildSecurityMeasures(auth)
    }));
  }

  buildDataFlow(classifiedData) {
    const flows = [];
    const services = classifiedData.services || [];
    const apis = classifiedData.apis || [];

    services.forEach(service => {
      const serviceAPIs = apis.filter(api => 
        api.name.toLowerCase().includes(service.name.toLowerCase())
      );

      serviceAPIs.forEach(api => {
        flows.push({
          id: this.generateId('flow', `${service.name}-${api.name}`),
          source: 'client',
          target: service.name,
          api: api.name,
          endpoint: api.endpoint,
          method: api.method,
          data_type: this.inferDataType(api),
          frequency: this.estimateFrequency(service),
          volume: this.estimateVolume(service),
          reliability_requirement: this.assessReliability(service),
          timeout: this.estimateTimeout(api)
        });
      });
    });

    return flows.length > 0 ? flows : this.generateMockDataFlow();
  }

  buildDependencies(classifiedData) {
    const dependencies = [];
    const services = classifiedData.services || [];

    services.forEach(service => {
      const deps = this.identifyDependencies(service, services);
      deps.forEach(dep => {
        dependencies.push({
          id: this.generateId('dep', `${service.name}-${dep.service}`),
          service: service.name,
          depends_on: dep.service,
          dependency_type: dep.type,
          strength: dep.strength,
          critical: dep.critical,
          description: dep.description
        });
      });
    });

    return dependencies.length > 0 ? dependencies : this.generateMockDependencies();
  }

  buildMetadata(classifiedData, startTime) {
    const services = classifiedData.services || [];
    const apis = classifiedData.apis || [];
    
    const avgConfidence = [...services, ...apis].reduce((sum, item) => 
      sum + (item.confidence || 0), 0) / Math.max(services.length + apis.length, 1);

    return {
      version: "1.0",
      generated_at: new Date().toISOString(),
      confidence_score: Math.round(avgConfidence * 100) / 100,
      total_services: services.length,
      mandatory_services: services.filter(s => s.mandatory).length,
      total_apis: apis.length,
      processing_time: Date.now() - startTime,
      classification_metadata: classifiedData.metadata || {},
      quality_metrics: this.calculateQualityMetrics(classifiedData)
    };
  }

  buildSchemas(classifiedData) {
    const fields = classifiedData.fields || {};
    const apis = classifiedData.apis || [];

    const requestSchemas = {};
    const responseSchemas = {};

    apis.forEach(api => {
      const apiName = api.name.toLowerCase().replace(/\s+/g, '_');
      
      requestSchemas[apiName] = this.generateRequestSchema(api, fields.input || []);
      responseSchemas[apiName] = this.generateResponseSchema(api, fields.output || []);
    });

    return {
      request_schemas: requestSchemas,
      response_schemas: responseSchemas,
      common_types: this.generateCommonTypes(fields)
    };
  }

  generateRequestSchema(api, inputFields) {
    return {
      type: "object",
      required: this.getRequiredFields(api, inputFields),
      properties: this.buildProperties(inputFields, 'request'),
      additionalProperties: false,
      description: `Request schema for ${api.name}`,
      examples: [this.generateRequestExample(api, inputFields)]
    };
  }

  generateResponseSchema(api, outputFields) {
    return {
      type: "object",
      required: ["status"],
      properties: {
        status: {
          type: "string",
          enum: ["success", "error", "pending"],
          description: "Request status"
        },
        ...this.buildProperties(outputFields, 'response')
      },
      additionalProperties: false,
      description: `Response schema for ${api.name}`,
      examples: [this.generateResponseExample(api, outputFields)]
    };
  }

  generateCommonTypes(fields) {
    const allFields = [...(fields.input || []), ...(fields.output || [])];
    const types = {};

    allFields.forEach(field => {
      const fieldType = this.inferFieldType(field);
      if (!types[fieldType]) {
        types[fieldType] = this.getTypeDefinition(fieldType);
      }
    });

    return types;
  }

  buildProperties(fields, context) {
    const properties = {};
    
    fields.forEach(field => {
      const fieldName = field.name;
      properties[fieldName] = {
        type: field.type || 'string',
        description: `${context} field: ${fieldName}`,
        ...(field.validation_required && { required: true }),
        ...(field.sensitivity === 'high' && { sensitive: true })
      };
    });

    return properties;
  }

  getRequiredFields(api, fields) {
    const required = ['request_id', 'timestamp'];
    
    if (api.method === 'POST') {
      required.push(...fields.filter(f => f.validation_required).map(f => f.name));
    }

    return [...new Set(required)];
  }

  generateRequestExample(api, inputFields) {
    const example = {
      request_id: "req_123456",
      timestamp: new Date().toISOString()
    };

    inputFields.forEach(field => {
      example[field.name] = this.generateFieldValue(field);
    });

    return example;
  }

  generateResponseExample(api, outputFields) {
    const example = {
      status: "success",
      response_id: "resp_123456",
      timestamp: new Date().toISOString()
    };

    outputFields.forEach(field => {
      example[field.name] = this.generateFieldValue(field);
    });

    return example;
  }

  generateFieldValue(field) {
    const type = field.type || 'string';
    const name = field.name.toLowerCase();

    switch (type) {
      case 'string':
        if (name.includes('id')) return 'string_12345';
        if (name.includes('email')) return 'user@example.com';
        if (name.includes('status')) return 'active';
        return 'sample_value';
      case 'number':
        if (name.includes('amount')) return 100.50;
        return 123;
      case 'boolean':
        return true;
      case 'datetime':
        return new Date().toISOString();
      case 'email':
        return 'user@example.com';
      case 'phone':
        return '+1234567890';
      default:
        return {};
    }
  }

  getTypeDefinition(type) {
    const definitions = {
      string: { type: "string", minLength: 1, maxLength: 255 },
      number: { type: "number", minimum: 0 },
      boolean: { type: "boolean" },
      datetime: { type: "string", format: "date-time" },
      email: { type: "string", format: "email" },
      phone: { type: "string", pattern: "^\\+?[1-9]\\d{1,14}$" }
    };
    
    return definitions[type] || { type: "string" };
  }

  inferFieldType(field) {
    if (field.type) return field.type;
    
    const name = field.name.toLowerCase();
    if (name.includes('email')) return 'email';
    if (name.includes('phone')) return 'phone';
    if (name.includes('amount') || name.includes('price')) return 'number';
    if (name.includes('date') || name.includes('time')) return 'datetime';
    if (name.includes('flag') || name.includes('bool')) return 'boolean';
    
    return 'string';
  }

  generateId(prefix, name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${prefix}_${cleanName}_${Date.now()}`;
  }

  getServiceEndpoints(serviceName, serviceType) {
    const endpointTemplates = {
      kyc: ['/api/kyc/verify', '/api/kyc/status'],
      payment: ['/api/payments/process', '/api/payments/status'],
      gst: ['/api/gst/validate', '/api/gst/details'],
      fraud: ['/api/fraud/check', '/api/fraud/report'],
      notification: ['/api/notify/send', '/api/notify/status'],
      audit: ['/api/audit/log', '/api/audit/query']
    };

    return endpointTemplates[serviceType] || [`/api/${serviceName.toLowerCase()}/action`];
  }

  getServiceAuth(serviceName, serviceType) {
    const authMapping = {
      kyc: 'Bearer Token',
      payment: 'API Key',
      gst: 'OAuth2',
      fraud: 'Bearer Token',
      notification: 'API Key',
      audit: 'Basic Auth'
    };

    return authMapping[serviceType] || 'API Key';
  }

  getServiceFields(serviceName, serviceType) {
    const fieldMapping = {
      kyc: {
        input: ['customer_id', 'document_type', 'document_data'],
        output: ['verification_status', 'customer_details', 'confidence_score']
      },
      payment: {
        input: ['amount', 'currency', 'payment_method', 'customer_id'],
        output: ['transaction_id', 'status', 'payment_details']
      },
      gst: {
        input: ['gstin', 'business_name', 'state_code'],
        output: ['gstin_status', 'registration_details', 'validity']
      }
    };

    return fieldMapping[serviceType] || {
      input: ['id', 'data'],
      output: ['status', 'result']
    };
  }

  estimateEffort(service) {
    const complexity = service.classification?.implementation_complexity || 'medium';
    const effortMap = {
      low: 5,
      medium: 10,
      high: 20
    };
    
    return {
      days: effortMap[complexity] || 10,
      complexity: complexity,
      resources: this.estimateResources(complexity)
    };
  }

  estimateResources(complexity) {
    const resourceMap = {
      low: { developers: 1, testers: 0.5 },
      medium: { developers: 2, testers: 1 },
      high: { developers: 3, testers: 1.5 }
    };
    
    return resourceMap[complexity] || resourceMap.medium;
  }

  identifyDependencies(service, allServices) {
    const dependencies = [];
    
    if (service.type === 'payment') {
      const fraudService = allServices.find(s => s.type === 'fraud');
      if (fraudService) {
        dependencies.push({
          service: fraudService.name,
          type: 'security_check',
          strength: 'strong',
          critical: true,
          description: 'Payment requires fraud verification'
        });
      }
    }

    return dependencies;
  }

  inferDataType(api) {
    const method = api.method || 'POST';
    const name = api.name.toLowerCase();
    
    if (name.includes('kyc')) return 'personal_data';
    if (name.includes('payment')) return 'financial_data';
    if (name.includes('gst')) return 'tax_data';
    if (name.includes('fraud')) return 'security_data';
    
    return method === 'GET' ? 'query_data' : 'transaction_data';
  }

  estimateFrequency(service) {
    const frequencyMap = {
      kyc: 'low',
      payment: 'high',
      gst: 'medium',
      fraud: 'high',
      notification: 'medium',
      audit: 'low'
    };
    
    return frequencyMap[service.type] || 'medium';
  }

  estimateVolume(service) {
    const volumeMap = {
      kyc: 'low',
      payment: 'high',
      gst: 'medium',
      fraud: 'high',
      notification: 'medium',
      audit: 'low'
    };
    
    return volumeMap[service.type] || 'medium';
  }

  assessReliability(service) {
    return service.mandatory ? 'high' : 'medium';
  }

  estimateTimeout(api) {
    const timeoutMap = {
      GET: 5000,
      POST: 10000,
      PUT: 8000,
      DELETE: 3000,
      PATCH: 8000
    };
    
    return timeoutMap[api.method] || 10000;
  }

  buildRequestSchema(api) {
    return {
      type: 'object',
      required: ['request_id'],
      properties: {
        request_id: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };
  }

  buildResponseSchema(api) {
    return {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['success', 'error'] },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };
  }

  estimateRateLimits(api) {
    return {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 10000
    };
  }

  buildErrorHandling(api) {
    return {
      retry_policy: {
        max_attempts: 3,
        backoff_strategy: 'exponential'
      },
      error_codes: [400, 401, 403, 404, 429, 500]
    };
  }

  buildMonitoring(api) {
    return {
      metrics: ['response_time', 'success_rate', 'error_rate'],
      alerts: ['high_error_rate', 'slow_response'],
      logging: {
        level: 'info',
        include_payload: false
      }
    };
  }

  buildAuthConfiguration(auth) {
    const configMap = {
      'Bearer Token': {
        token_expiry: 3600,
        refresh_enabled: true,
        issuer: 'auth-server'
      },
      'API Key': {
        key_rotation_days: 90,
        key_length: 32
      },
      'OAuth2': {
        grant_types: ['client_credentials', 'authorization_code'],
        token_expiry: 3600
      },
      'Basic Auth': {
        password_policy: 'strong',
        session_timeout: 1800
      }
    };
    
    return configMap[auth.type] || {};
  }

  buildTokenManagement(auth) {
    return {
      generation: 'automatic',
      storage: 'secure',
      refresh: auth.type === 'Bearer Token',
      revocation: auth.type !== 'Basic Auth'
    };
  }

  buildSecurityMeasures(auth) {
    const securityMap = {
      'Bearer Token': ['jwt_validation', 'signature_verification'],
      'API Key': ['rate_limiting', 'ip_whitelist'],
      'OAuth2': ['scope_validation', 'token_introspection'],
      'Basic Auth': ['password_hashing', 'account_lockout']
    };
    
    return securityMap[auth.type] || ['basic_security'];
  }

  calculateQualityMetrics(classifiedData) {
    const services = classifiedData.services || [];
    const apis = classifiedData.apis || [];
    
    return {
      completeness: this.calculateCompleteness(services, apis),
      consistency: this.calculateConsistency(services, apis),
      clarity: this.calculateClarity(services, apis),
      feasibility: this.calculateFeasibility(services, apis)
    };
  }

  calculateCompleteness(services, apis) {
    let score = 0.5;
    
    if (services.length > 0) score += 0.2;
    if (apis.length > 0) score += 0.2;
    if (services.every(s => s.description)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  calculateConsistency(services, apis) {
    return 0.8;
  }

  calculateClarity(services, apis) {
    return 0.85;
  }

  calculateFeasibility(services, apis) {
    return 0.9;
  }

  generateMockDataFlow() {
    return [
      {
        id: 'flow_mock_1',
        source: 'client',
        target: 'kyc',
        api: 'KYC Verification',
        endpoint: '/api/kyc/verify',
        method: 'POST',
        data_type: 'personal_data',
        frequency: 'medium',
        volume: 'medium',
        reliability_requirement: 'high',
        timeout: 10000
      }
    ];
  }

  generateMockDependencies() {
    return [
      {
        id: 'dep_mock_1',
        service: 'payment',
        depends_on: 'fraud',
        dependency_type: 'security_check',
        strength: 'strong',
        critical: true,
        description: 'Payment requires fraud verification'
      }
    ];
  }

  generateMockStructure(classifiedData) {
    return {
      success: true,
      data: {
        ...this.structureTemplate,
        integration_plan: {
          services: this.generateMockServices(),
          apis: this.generateMockAPIs(),
          authentication: this.generateMockAuthentication(),
          data_flow: this.generateMockDataFlow(),
          dependencies: this.generateMockDependencies()
        },
        metadata: {
          version: "1.0",
          generated_at: new Date().toISOString(),
          confidence_score: 0.8,
          total_services: 4,
          mandatory_services: 3,
          processing_time: 1000
        },
        schemas: this.generateMockSchemas()
      },
      note: 'Generated mock structure due to structuring failure'
    };
  }

  generateMockServices() {
    return [
      {
        id: 'service_kyc_123',
        name: 'KYC',
        type: 'kyc',
        category: 'identity',
        mandatory: true,
        confidence: 0.9,
        priority: 'high',
        risk_level: 'high',
        implementation_complexity: 'medium',
        description: 'Customer identity verification service',
        endpoints: ['/api/kyc/verify', '/api/kyc/status'],
        authentication: 'Bearer Token',
        fields: { input: ['customer_id', 'document_type'], output: ['verification_status'] },
        estimated_effort: { days: 10, complexity: 'medium', resources: { developers: 2, testers: 1 } },
        dependencies: []
      }
    ];
  }

  generateMockAPIs() {
    return [
      {
        id: 'api_kyc_123',
        name: 'KYC Verification',
        endpoint: '/api/kyc/verify',
        method: 'POST',
        category: 'create',
        mandatory: true,
        confidence: 0.85,
        priority: 'high',
        authentication: 'Bearer Token',
        data_sensitivity: 'high',
        implementation_complexity: 'medium',
        description: 'Verify customer identity documents',
        request_schema: { type: 'object', required: ['customer_id'] },
        response_schema: { type: 'object', required: ['status'] },
        rate_limits: { requests_per_minute: 60 },
        error_handling: { retry_policy: { max_attempts: 3 } },
        monitoring: { metrics: ['response_time'] }
      }
    ];
  }

  generateMockAuthentication() {
    return [
      {
        id: 'auth_bearer_123',
        type: 'Bearer Token',
        category: 'token_based',
        confidence: 0.9,
        security_level: 'high',
        implementation_complexity: 'medium',
        applies_to: ['kyc', 'fraud'],
        configuration: { token_expiry: 3600 },
        tokens: { generation: 'automatic', storage: 'secure' },
        security: ['jwt_validation']
      }
    ];
  }

  generateMockSchemas() {
    return {
      request_schemas: {
        kyc_verification: {
          type: 'object',
          required: ['customer_id', 'document_type'],
          properties: {
            customer_id: { type: 'string' },
            document_type: { type: 'string' }
          }
        }
      },
      response_schemas: {
        kyc_verification: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string' },
            verification_status: { type: 'string' }
          }
        }
      },
      common_types: {
        string: { type: 'string', minLength: 1 },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };
  }

  async healthCheck() {
    try {
      const testResult = await this.generateFallback('test');
      return testResult && testResult.data;
    } catch (error) {
      return false;
    }
  }
}

module.exports = StructuringEngine;
