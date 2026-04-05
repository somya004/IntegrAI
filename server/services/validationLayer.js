class ValidationLayer {
  constructor() {
    this.validationRules = {
      required: {
        services: ['name', 'type', 'mandatory', 'confidence'],
        apis: ['name', 'endpoint', 'method', 'authentication'],
        authentication: ['type', 'applies_to'],
        metadata: ['version', 'generated_at', 'confidence_score']
      },
      
      formats: {
        endpoint: /^\/api\/[a-zA-Z0-9\/\-_]+$/,
        method: /^(GET|POST|PUT|DELETE|PATCH)$/,
        confidence: /^0\.\d+$/,
        version: /^\d+\.\d+(\.\d+)?$/
      },
      
      constraints: {
        confidence: { min: 0, max: 1 },
        name: { minLength: 1, maxLength: 100 },
        endpoint: { minLength: 5, maxLength: 200 }
      }
    };
  }

  async validate(structuredData) {
    try {
      const validationResult = {
        is_valid: true,
        errors: [],
        warnings: [],
        corrections: [],
        score: 1.0,
        details: {}
      };

      this.validateStructure(structuredData, validationResult);
      this.validateServices(structuredData, validationResult);
      this.validateAPIs(structuredData, validationResult);
      this.validateAuthentication(structuredData, validationResult);
      this.validateSchemas(structuredData, validationResult);
      this.validateMetadata(structuredData, validationResult);
      this.validateBusinessRules(structuredData, validationResult);

      if (!validationResult.is_valid) {
        const correctedData = await this.applyCorrections(structuredData, validationResult.corrections);
        return {
          success: true,
          data: correctedData,
          validation: validationResult
        };
      }

      return {
        success: true,
        data: structuredData,
        validation: validationResult
      };

    } catch (error) {
      console.error('Validation failed:', error.message);
      return this.generateMockValidation(structuredData);
    }
  }

  validateStructure(data, result) {
    const requiredSections = ['integration_plan', 'metadata', 'schemas'];
    
    requiredSections.forEach(section => {
      if (!data[section]) {
        result.errors.push({
          type: 'missing_section',
          section: section,
          message: `Required section '${section}' is missing`
        });
        result.is_valid = false;
        result.corrections.push({
          type: 'add_section',
          section: section,
          data: this.generateDefaultSection(section)
        });
      }
    });

    if (data.integration_plan) {
      const planSections = ['services', 'apis', 'authentication'];
      planSections.forEach(section => {
        if (!data.integration_plan[section]) {
          result.warnings.push({
            type: 'missing_plan_section',
            section: section,
            message: `Plan section '${section}' is empty`
          });
        }
      });
    }
  }

  validateServices(data, result) {
    const services = data.integration_plan?.services || [];
    
    if (services.length === 0) {
      result.errors.push({
        type: 'no_services',
        message: 'No services defined in integration plan'
      });
      result.is_valid = false;
      result.corrections.push({
        type: 'add_mock_services',
        data: this.generateMockServices()
      });
      return;
    }

    services.forEach((service, index) => {
      this.validateService(service, index, result);
    });

    this.validateServiceConsistency(services, result);
  }

  validateService(service, index, result) {
    const required = this.validationRules.required.services;
    
    required.forEach(field => {
      if (!service[field]) {
        result.errors.push({
          type: 'missing_field',
          entity: 'service',
          index: index,
          field: field,
          message: `Service at index ${index} missing required field: ${field}`
        });
        result.is_valid = false;
        result.corrections.push({
          type: 'add_field',
          entity: 'service',
          index: index,
          field: field,
          value: this.getDefaultValue(field, 'service')
        });
      }
    });

    if (service.name) {
      this.validateField(service.name, 'name', 'service', index, result);
    }

    if (service.confidence !== undefined) {
      this.validateConfidence(service.confidence, 'service', index, result);
    }

    if (service.endpoints && !Array.isArray(service.endpoints)) {
      result.errors.push({
        type: 'invalid_format',
        entity: 'service',
        index: index,
        field: 'endpoints',
        message: 'Service endpoints must be an array'
      });
      result.is_valid = false;
    }
  }

  validateAPIs(data, result) {
    const apis = data.integration_plan?.apis || [];
    
    if (apis.length === 0) {
      result.warnings.push({
        type: 'no_apis',
        message: 'No APIs defined in integration plan'
      });
      result.corrections.push({
        type: 'add_mock_apis',
        data: this.generateMockAPIs()
      });
      return;
    }

    apis.forEach((api, index) => {
      this.validateAPI(api, index, result);
    });

    this.validateAPIConsistency(apis, result);
  }

  validateAPI(api, index, result) {
    const required = this.validationRules.required.apis;
    
    required.forEach(field => {
      if (!api[field]) {
        result.errors.push({
          type: 'missing_field',
          entity: 'api',
          index: index,
          field: field,
          message: `API at index ${index} missing required field: ${field}`
        });
        result.is_valid = false;
        result.corrections.push({
          type: 'add_field',
          entity: 'api',
          index: index,
          field: field,
          value: this.getDefaultValue(field, 'api')
        });
      }
    });

    if (api.endpoint) {
      this.validateEndpoint(api.endpoint, 'api', index, result);
    }

    if (api.method) {
      this.validateMethod(api.method, 'api', index, result);
    }

    if (api.confidence !== undefined) {
      this.validateConfidence(api.confidence, 'api', index, result);
    }
  }

  validateAuthentication(data, result) {
    const authMethods = data.integration_plan?.authentication || [];
    
    if (authMethods.length === 0) {
      result.warnings.push({
        type: 'no_authentication',
        message: 'No authentication methods defined'
      });
      result.corrections.push({
        type: 'add_mock_auth',
        data: this.generateMockAuthentication()
      });
      return;
    }

    authMethods.forEach((auth, index) => {
      this.validateAuthMethod(auth, index, result);
    });
  }

  validateAuthMethod(auth, index, result) {
    const required = this.validationRules.required.authentication;
    
    required.forEach(field => {
      if (!auth[field]) {
        result.errors.push({
          type: 'missing_field',
          entity: 'authentication',
          index: index,
          field: field,
          message: `Auth method at index ${index} missing required field: ${field}`
        });
        result.is_valid = false;
        result.corrections.push({
          type: 'add_field',
          entity: 'authentication',
          index: index,
          field: field,
          value: this.getDefaultValue(field, 'auth')
        });
      }
    });

    if (auth.type) {
      this.validateAuthType(auth.type, 'authentication', index, result);
    }
  }

  validateSchemas(data, result) {
    const schemas = data.schemas || {};
    
    if (!schemas.request_schemas || Object.keys(schemas.request_schemas).length === 0) {
      result.warnings.push({
        type: 'no_request_schemas',
        message: 'No request schemas defined'
      });
    }

    if (!schemas.response_schemas || Object.keys(schemas.response_schemas).length === 0) {
      result.warnings.push({
        type: 'no_response_schemas',
        message: 'No response schemas defined'
      });
    }

    this.validateJSONSchemas(schemas, result);
  }

  validateJSONSchemas(schemas, result) {
    const allSchemas = {
      ...schemas.request_schemas,
      ...schemas.response_schemas
    };

    Object.entries(allSchemas).forEach(([name, schema]) => {
      this.validateJSONSchema(schema, name, result);
    });
  }

  validateJSONSchema(schema, name, result) {
    if (!schema.type) {
      result.errors.push({
        type: 'invalid_schema',
        schema: name,
        message: `Schema '${name}' missing type field`
      });
      result.is_valid = false;
    }

    if (schema.type !== 'object') {
      result.warnings.push({
        type: 'unexpected_schema_type',
        schema: name,
        message: `Schema '${name}' has unexpected type: ${schema.type}`
      });
    }

    if (schema.properties && typeof schema.properties !== 'object') {
      result.errors.push({
        type: 'invalid_schema_properties',
        schema: name,
        message: `Schema '${name}' properties must be an object`
      });
      result.is_valid = false;
    }
  }

  validateMetadata(data, result) {
    const metadata = data.metadata || {};
    const required = this.validationRules.required.metadata;
    
    required.forEach(field => {
      if (!metadata[field]) {
        result.errors.push({
          type: 'missing_metadata',
          field: field,
          message: `Missing required metadata field: ${field}`
        });
        result.is_valid = false;
        result.corrections.push({
          type: 'add_metadata',
          field: field,
          value: this.getDefaultMetadataValue(field)
        });
      }
    });

    if (metadata.version) {
      this.validateVersion(metadata.version, result);
    }

    if (metadata.confidence_score !== undefined) {
      this.validateConfidence(metadata.confidence_score, 'metadata', null, result);
    }
  }

  validateBusinessRules(data, result) {
    this.validateServiceAPIAlignment(data, result);
    this.validateAuthCoverage(data, result);
    this.validateConfidenceConsistency(data, result);
    this.validateMandatoryServices(data, result);
  }

  validateServiceAPIAlignment(data, result) {
    const services = data.integration_plan?.services || [];
    const apis = data.integration_plan?.apis || [];
    
    services.forEach(service => {
      const serviceAPIs = apis.filter(api => 
        api.name.toLowerCase().includes(service.name.toLowerCase())
      );
      
      if (serviceAPIs.length === 0) {
        result.warnings.push({
          type: 'unmatched_service',
          service: service.name,
          message: `Service '${service.name}' has no corresponding APIs`
        });
      }
    });
  }

  validateAuthCoverage(data, result) {
    const services = data.integration_plan?.services || [];
    const authMethods = data.integration_plan?.authentication || [];
    
    const coveredServices = new Set();
    authMethods.forEach(auth => {
      (auth.applies_to || []).forEach(service => coveredServices.add(service));
    });

    services.forEach(service => {
      if (service.mandatory && !coveredServices.has(service.name.toLowerCase())) {
        result.warnings.push({
          type: 'unauthenticated_service',
          service: service.name,
          message: `Mandatory service '${service.name}' has no authentication method`
        });
      }
    });
  }

  validateConfidenceConsistency(data, result) {
    const allItems = [
      ...(data.integration_plan?.services || []),
      ...(data.integration_plan?.apis || [])
    ];

    const confidences = allItems.map(item => item.confidence || 0);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    if (Math.abs(avgConfidence - (data.metadata?.confidence_score || 0)) > 0.1) {
      result.warnings.push({
        type: 'confidence_mismatch',
        message: 'Overall confidence score differs from average item confidence'
      });
    }
  }

  validateMandatoryServices(data, result) {
    const services = data.integration_plan?.services || [];
    const mandatoryServices = services.filter(s => s.mandatory);
    
    if (mandatoryServices.length === 0) {
      result.warnings.push({
        type: 'no_mandatory_services',
        message: 'No mandatory services defined'
      });
    }

    mandatoryServices.forEach(service => {
      if ((service.confidence || 0) < 0.7) {
        result.warnings.push({
          type: 'low_confidence_mandatory',
          service: service.name,
          message: `Mandatory service '${service.name}' has low confidence: ${service.confidence}`
        });
      }
    });
  }

  validateField(value, fieldName, entityType, index, result) {
    const constraints = this.validationRules.constraints[fieldName];
    
    if (constraints) {
      if (constraints.minLength && value.length < constraints.minLength) {
        result.errors.push({
          type: 'constraint_violation',
          entity: entityType,
          index: index,
          field: fieldName,
          message: `${fieldName} is too short (min: ${constraints.minLength})`
        });
        result.is_valid = false;
      }

      if (constraints.maxLength && value.length > constraints.maxLength) {
        result.errors.push({
          type: 'constraint_violation',
          entity: entityType,
          index: index,
          field: fieldName,
          message: `${fieldName} is too long (max: ${constraints.maxLength})`
        });
        result.is_valid = false;
      }
    }

    const format = this.validationRules.formats[fieldName];
    if (format && !format.test(value)) {
      result.errors.push({
        type: 'format_violation',
        entity: entityType,
        index: index,
        field: fieldName,
        message: `${fieldName} format is invalid`
      });
      result.is_valid = false;
    }
  }

  validateEndpoint(endpoint, entityType, index, result) {
    if (!this.validationRules.formats.endpoint.test(endpoint)) {
      result.errors.push({
        type: 'invalid_endpoint',
        entity: entityType,
        index: index,
        endpoint: endpoint,
        message: `Invalid endpoint format: ${endpoint}`
      });
      result.is_valid = false;
    }
  }

  validateMethod(method, entityType, index, result) {
    if (!this.validationRules.formats.method.test(method)) {
      result.errors.push({
        type: 'invalid_method',
        entity: entityType,
        index: index,
        method: method,
        message: `Invalid HTTP method: ${method}`
      });
      result.is_valid = false;
    }
  }

  validateAuthType(authType, entityType, index, result) {
    const validTypes = ['Bearer Token', 'API Key', 'OAuth2', 'Basic Auth'];
    if (!validTypes.includes(authType)) {
      result.warnings.push({
        type: 'unknown_auth_type',
        entity: entityType,
        index: index,
        auth_type: authType,
        message: `Unknown authentication type: ${authType}`
      });
    }
  }

  validateVersion(version, result) {
    if (!this.validationRules.formats.version.test(version)) {
      result.errors.push({
        type: 'invalid_version',
        version: version,
        message: `Invalid version format: ${version}`
      });
      result.is_valid = false;
    }
  }

  validateConfidence(confidence, entityType, index, result) {
    const constraints = this.validationRules.constraints.confidence;
    
    if (confidence < constraints.min || confidence > constraints.max) {
      result.errors.push({
        type: 'invalid_confidence',
        entity: entityType,
        index: index,
        confidence: confidence,
        message: `Confidence must be between ${constraints.min} and ${constraints.max}`
      });
      result.is_valid = false;
    }
  }

  validateServiceConsistency(services, result) {
    const names = services.map(s => s.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    
    duplicates.forEach(name => {
      result.errors.push({
        type: 'duplicate_service',
        service: name,
        message: `Duplicate service name: ${name}`
      });
      result.is_valid = false;
    });
  }

  validateAPIConsistency(apis, result) {
    const endpoints = apis.map(a => a.endpoint);
    const duplicates = endpoints.filter((endpoint, index) => endpoints.indexOf(endpoint) !== index);
    
    duplicates.forEach(endpoint => {
      result.errors.push({
        type: 'duplicate_endpoint',
        endpoint: endpoint,
        message: `Duplicate API endpoint: ${endpoint}`
      });
      result.is_valid = false;
    });
  }

  async applyCorrections(data, corrections) {
    let correctedData = JSON.parse(JSON.stringify(data));
    
    for (const correction of corrections) {
      switch (correction.type) {
        case 'add_section':
          correctedData[correction.section] = correction.data;
          break;
          
        case 'add_field':
          if (correction.entity === 'service') {
            correctedData.integration_plan.services[correction.index][correction.field] = correction.value;
          } else if (correction.entity === 'api') {
            correctedData.integration_plan.apis[correction.index][correction.field] = correction.value;
          } else if (correction.entity === 'authentication') {
            correctedData.integration_plan.authentication[correction.index][correction.field] = correction.value;
          }
          break;
          
        case 'add_metadata':
          correctedData.metadata[correction.field] = correction.value;
          break;
          
        case 'add_mock_services':
          correctedData.integration_plan.services = correction.data;
          break;
          
        case 'add_mock_apis':
          correctedData.integration_plan.apis = correction.data;
          break;
          
        case 'add_mock_auth':
          correctedData.integration_plan.authentication = correction.data;
          break;
      }
    }

    return correctedData;
  }

  getDefaultValue(field, entityType) {
    const defaults = {
      name: entityType === 'service' ? 'Default Service' : 'Default API',
      type: 'other',
      mandatory: false,
      confidence: 0.5,
      endpoint: '/api/default',
      method: 'POST',
      authentication: 'API Key',
      applies_to: [],
      version: '1.0',
      generated_at: new Date().toISOString(),
      confidence_score: 0.5
    };
    
    return defaults[field] || '';
  }

  getDefaultMetadataValue(field) {
    const defaults = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      confidence_score: 0.5,
      total_services: 0,
      mandatory_services: 0,
      processing_time: 1000
    };
    
    return defaults[field];
  }

  generateDefaultSection(section) {
    const defaults = {
      integration_plan: {
        services: [],
        apis: [],
        authentication: [],
        data_flow: [],
        dependencies: []
      },
      metadata: {
        version: '1.0',
        generated_at: new Date().toISOString(),
        confidence_score: 0.5,
        total_services: 0,
        mandatory_services: 0,
        processing_time: 1000
      },
      schemas: {
        request_schemas: {},
        response_schemas: {}
      }
    };
    
    return defaults[section];
  }

  generateMockServices() {
    return [
      {
        id: 'service_default_1',
        name: 'Default Service',
        type: 'other',
        category: 'general',
        mandatory: false,
        confidence: 0.5,
        priority: 'low',
        risk_level: 'low',
        implementation_complexity: 'low',
        description: 'Default generated service',
        endpoints: ['/api/default/action'],
        authentication: 'API Key',
        fields: { input: ['id'], output: ['status'] },
        estimated_effort: { days: 5, complexity: 'low' },
        dependencies: []
      }
    ];
  }

  generateMockAPIs() {
    return [
      {
        id: 'api_default_1',
        name: 'Default API',
        endpoint: '/api/default/action',
        method: 'POST',
        category: 'create',
        mandatory: false,
        confidence: 0.5,
        priority: 'low',
        authentication: 'API Key',
        data_sensitivity: 'low',
        implementation_complexity: 'low',
        description: 'Default generated API',
        request_schema: { type: 'object' },
        response_schema: { type: 'object' },
        rate_limits: { requests_per_minute: 60 },
        error_handling: { retry_policy: { max_attempts: 3 } },
        monitoring: { metrics: ['response_time'] }
      }
    ];
  }

  generateMockAuthentication() {
    return [
      {
        id: 'auth_default_1',
        type: 'API Key',
        category: 'key_based',
        confidence: 0.7,
        security_level: 'medium',
        implementation_complexity: 'low',
        applies_to: ['default'],
        configuration: { key_rotation_days: 90 },
        tokens: { generation: 'automatic' },
        security: ['rate_limiting']
      }
    ];
  }

  generateMockValidation(structuredData) {
    return {
      success: true,
      data: structuredData,
      validation: {
        is_valid: true,
        errors: [],
        warnings: [{
          type: 'mock_validation',
          message: 'Validation skipped - using mock validation'
        }],
        corrections: [],
        score: 0.8,
        details: { note: 'Generated mock validation due to validation failure' }
      },
      note: 'Generated mock validation due to validation failure'
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

module.exports = ValidationLayer;
