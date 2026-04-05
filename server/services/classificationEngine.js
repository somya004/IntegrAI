class ClassificationEngine {
  constructor() {
    this.mandatoryKeywords = [
      'must', 'required', 'mandatory', 'essential', 'critical', 'compulsory',
      'shall', 'will', 'need to', 'have to', 'obligatory', 'unavoidable'
    ];
    
    this.optionalKeywords = [
      'should', 'could', 'would', 'may', 'might', 'optional', 'nice to have',
      'preferable', 'suggested', 'recommended', 'desired', 'beneficial'
    ];
    
    this.highConfidenceIndicators = [
      'clearly', 'explicitly', 'specifically', 'defined', 'specified',
      'detailed', 'comprehensive', 'complete', 'thorough'
    ];
    
    this.serviceWeights = {
      kyc: 0.9,
      payment: 0.95,
      gst: 0.8,
      fraud: 0.85,
      notification: 0.6,
      audit: 0.7,
      other: 0.5
    };
  }

  async classify(extractedData) {
    try {
      const classified = {
        services: this.classifyServices(extractedData.services || []),
        apis: this.classifyAPIs(extractedData.apis || []),
        authentication: this.classifyAuthentication(extractedData.authentication || []),
        fields: this.classifyFields(extractedData.fields || {}),
        metadata: this.generateClassificationMetadata(extractedData)
      };

      return {
        success: true,
        data: classified
      };

    } catch (error) {
      console.error('Classification failed:', error.message);
      return this.generateMockClassification(extractedData);
    }
  }

  classifyServices(services) {
    return services.map(service => {
      const mandatory = this.determineMandatory(service.description || '');
      const confidence = this.calculateConfidence(service, mandatory);
      
      return {
        ...service,
        mandatory: mandatory,
        confidence: confidence,
        priority: this.calculatePriority(confidence, mandatory),
        classification: {
          category: this.categorizeService(service.type),
          risk_level: this.assessRiskLevel(service.type, mandatory),
          implementation_complexity: this.assessComplexity(service.type)
        }
      };
    });
  }

  classifyAPIs(apis) {
    return apis.map(api => {
      const mandatory = this.determineMandatory(api.description || '');
      const confidence = this.calculateConfidence(api, mandatory);
      
      return {
        ...api,
        mandatory: mandatory,
        confidence: confidence,
        priority: this.calculatePriority(confidence, mandatory),
        classification: {
          category: this.categorizeAPI(api.method),
          risk_level: this.assessRiskLevel(api.name, mandatory),
          implementation_complexity: this.assessAPIComplexity(api.method),
          data_sensitivity: this.assessDataSensitivity(api.name)
        }
      };
    });
  }

  classifyAuthentication(authMethods) {
    return authMethods.map(auth => {
      const confidence = this.calculateAuthConfidence(auth);
      
      return {
        ...auth,
        confidence: confidence,
        security_level: this.assessSecurityLevel(auth.type),
        implementation_complexity: this.assessAuthComplexity(auth.type),
        classification: {
          category: this.categorizeAuth(auth.type),
          recommended_for: auth.applies_to || []
        }
      };
    });
  }

  classifyFields(fields) {
    const inputFields = (fields.input || []).map(field => ({
      name: field,
      type: this.inferFieldType(field),
      sensitivity: this.assessFieldSensitivity(field),
      validation_required: this.needsValidation(field),
      confidence: this.calculateFieldConfidence(field)
    }));

    const outputFields = (fields.output || []).map(field => ({
      name: field,
      type: this.inferFieldType(field),
      sensitivity: this.assessFieldSensitivity(field),
      confidence: this.calculateFieldConfidence(field)
    }));

    return {
      input: inputFields,
      output: outputFields,
      metadata: {
        total_input_fields: inputFields.length,
        total_output_fields: outputFields.length,
        high_sensitivity_fields: [...inputFields, ...outputFields].filter(f => f.sensitivity === 'high').length
      }
    };
  }

  determineMandatory(text) {
    const lowerText = text.toLowerCase();
    
    const mandatoryScore = this.mandatoryKeywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    const optionalScore = this.optionalKeywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);

    if (mandatoryScore > optionalScore) return true;
    if (optionalScore > mandatoryScore) return false;
    
    return true;
  }

  calculateConfidence(item, mandatory) {
    let confidence = 0.5;
    
    if (item.type && this.serviceWeights[item.type]) {
      confidence = this.serviceWeights[item.type];
    }
    
    const description = (item.description || '').toLowerCase();
    const highConfidenceCount = this.highConfidenceIndicators.reduce((count, indicator) => {
      return count + (description.includes(indicator) ? 1 : 0);
    }, 0);
    
    confidence += highConfidenceCount * 0.05;
    
    if (mandatory) {
      confidence += 0.1;
    }
    
    if (item.endpoint && item.endpoint.includes('/api/')) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  calculatePriority(confidence, mandatory) {
    if (mandatory && confidence >= 0.8) return 'high';
    if (mandatory && confidence >= 0.6) return 'medium';
    if (mandatory) return 'medium';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  categorizeService(type) {
    const categories = {
      kyc: 'identity',
      payment: 'financial',
      gst: 'regulatory',
      fraud: 'security',
      notification: 'communication',
      audit: 'compliance',
      other: 'general'
    };
    return categories[type] || 'general';
  }

  categorizeAPI(method) {
    const categories = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      DELETE: 'delete',
      PATCH: 'modify'
    };
    return categories[method] || 'other';
  }

  categorizeAuth(authType) {
    const categories = {
      'Bearer Token': 'token_based',
      'API Key': 'key_based',
      'OAuth2': 'oauth',
      'Basic Auth': 'basic'
    };
    return categories[authType] || 'other';
  }

  assessRiskLevel(serviceType, mandatory) {
    const riskLevels = {
      kyc: mandatory ? 'high' : 'medium',
      payment: 'high',
      gst: 'medium',
      fraud: 'high',
      notification: 'low',
      audit: 'medium',
      other: 'low'
    };
    return riskLevels[serviceType] || 'low';
  }

  assessComplexity(serviceType) {
    const complexity = {
      kyc: 'medium',
      payment: 'high',
      gst: 'medium',
      fraud: 'high',
      notification: 'low',
      audit: 'medium',
      other: 'low'
    };
    return complexity[serviceType] || 'low';
  }

  assessAPIComplexity(method) {
    const complexity = {
      GET: 'low',
      POST: 'medium',
      PUT: 'medium',
      DELETE: 'low',
      PATCH: 'medium'
    };
    return complexity[method] || 'medium';
  }

  assessDataSensitivity(apiName) {
    const sensitiveKeywords = ['kyc', 'payment', 'fraud', 'customer', 'user', 'account'];
    const lowerName = apiName.toLowerCase();
    
    return sensitiveKeywords.some(keyword => lowerName.includes(keyword)) ? 'high' : 'medium';
  }

  calculateAuthConfidence(auth) {
    const confidenceMap = {
      'OAuth2': 0.9,
      'Bearer Token': 0.8,
      'API Key': 0.7,
      'Basic Auth': 0.6
    };
    return confidenceMap[auth.type] || 0.5;
  }

  assessSecurityLevel(authType) {
    const securityLevels = {
      'OAuth2': 'high',
      'Bearer Token': 'high',
      'API Key': 'medium',
      'Basic Auth': 'low'
    };
    return securityLevels[authType] || 'medium';
  }

  assessAuthComplexity(authType) {
    const complexity = {
      'OAuth2': 'high',
      'Bearer Token': 'medium',
      'API Key': 'low',
      'Basic Auth': 'low'
    };
    return complexity[authType] || 'medium';
  }

  inferFieldType(fieldName) {
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('id')) return 'string';
    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('phone')) return 'phone';
    if (lowerName.includes('amount') || lowerName.includes('price')) return 'number';
    if (lowerName.includes('date') || lowerName.includes('time')) return 'datetime';
    if (lowerName.includes('status') || lowerName.includes('type')) return 'string';
    if (lowerName.includes('data') || lowerName.includes('document')) return 'object';
    if (lowerName.includes('flag') || lowerName.includes('bool')) return 'boolean';
    
    return 'string';
  }

  assessFieldSensitivity(fieldName) {
    const sensitiveKeywords = [
      'password', 'token', 'key', 'secret', 'ssn', 'pan', 'aadhar',
      'account', 'card', 'bank', 'credit', 'debit', 'personal', 'private'
    ];
    
    const lowerName = fieldName.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerName.includes(keyword)) ? 'high' : 'medium';
  }

  needsValidation(fieldName) {
    const validationRequired = [
      'email', 'phone', 'id', 'amount', 'date', 'status', 'type'
    ];
    
    const lowerName = fieldName.toLowerCase();
    return validationRequired.some(keyword => lowerName.includes(keyword));
  }

  calculateFieldConfidence(fieldName) {
    let confidence = 0.7;
    
    if (fieldName.includes('_')) confidence += 0.1;
    if (fieldName.length >= 3 && fieldName.length <= 20) confidence += 0.1;
    if (!/^\d+$/.test(fieldName)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  generateClassificationMetadata(extractedData) {
    const services = extractedData.services || [];
    const apis = extractedData.apis || [];
    const authMethods = extractedData.authentication || [];
    
    return {
      total_services: services.length,
      total_apis: apis.length,
      total_auth_methods: authMethods.length,
      mandatory_services: services.filter(s => s.mandatory).length,
      high_confidence_items: [...services, ...apis].filter(item => (item.confidence || 0) >= 0.8).length,
      classification_timestamp: new Date().toISOString(),
      processing_method: 'automated_classification'
    };
  }

  generateMockClassification(extractedData) {
    const mockServices = (extractedData.services || []).map(service => ({
      ...service,
      mandatory: true,
      confidence: 0.85,
      priority: 'high',
      classification: {
        category: this.categorizeService(service.type || 'other'),
        risk_level: 'medium',
        implementation_complexity: 'medium'
      }
    }));

    const mockAPIs = (extractedData.apis || []).map(api => ({
      ...api,
      mandatory: true,
      confidence: 0.8,
      priority: 'medium',
      classification: {
        category: this.categorizeAPI(api.method || 'POST'),
        risk_level: 'medium',
        implementation_complexity: 'medium',
        data_sensitivity: 'medium'
      }
    }));

    return {
      success: true,
      data: {
        services: mockServices,
        apis: mockAPIs,
        authentication: this.generateMockAuthentication(),
        fields: this.generateMockFields(),
        metadata: this.generateClassificationMetadata(extractedData)
      },
      note: 'Generated mock classification due to classification failure'
    };
  }

  generateMockAuthentication() {
    return [
      {
        type: 'Bearer Token',
        applies_to: ['kyc', 'fraud'],
        confidence: 0.9,
        security_level: 'high',
        implementation_complexity: 'medium',
        classification: {
          category: 'token_based',
          recommended_for: ['kyc', 'fraud']
        }
      }
    ];
  }

  generateMockFields() {
    return {
      input: [
        { name: 'customer_id', type: 'string', sensitivity: 'medium', validation_required: true, confidence: 0.9 },
        { name: 'amount', type: 'number', sensitivity: 'high', validation_required: true, confidence: 0.85 }
      ],
      output: [
        { name: 'status', type: 'string', sensitivity: 'low', confidence: 0.8 },
        { name: 'transaction_id', type: 'string', sensitivity: 'medium', confidence: 0.85 }
      ],
      metadata: {
        total_input_fields: 2,
        total_output_fields: 2,
        high_sensitivity_fields: 1
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

module.exports = ClassificationEngine;
