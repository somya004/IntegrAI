// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CogIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { ParseResult, APIConfiguration, FieldMapping, TransformationRule } from '../types/config';

// @ts-nocheck
const ConfigurationEngine: React.FC<any> = ({ 
  parsedRequirements, 
  onConfigurationGenerated 
}) => {
  const [configurations, setConfigurations] = useState<APIConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<APIConfiguration | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [newMapping, setNewMapping] = useState({ clientField: '', apiField: '' });

  // Auto-generate configurations from parsed requirements
  const generateConfigurations = useCallback(async () => {
    if (!parsedRequirements) return;

    setIsGenerating(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const generatedConfigs: APIConfiguration[] = [];

    // Generate configurations for each detected service
    parsedRequirements.services.forEach((service, index) => {
      const config: APIConfiguration = {
        id: `config_${index}`,
        name: service.name,
        version: 'v1',
        endpoint: generateEndpoint(service.name),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Version': 'v1'
        },
        parameters: generateFieldMappings(service, parsedRequirements.fields),
        response: {
          format: 'json',
          schema: generateResponseSchema(service.name)
        },
        authentication: {
          type: 'apikey',
          location: 'header'
        },
        rateLimit: {
          requests: 100,
          period: 'minute'
        },
        transformations: generateTransformationRules(service.name, parsedRequirements.fields),
        metadata: {
          generatedAt: new Date().toISOString(),
          confidence: service.confidence,
          source: 'auto'
        }
      };
      generatedConfigs.push(config);
    });

    // Generate configurations for detected endpoints
    parsedRequirements.endpoints.forEach((endpoint, index) => {
      const config: APIConfiguration = {
        id: `endpoint_config_${index}`,
        name: `${endpoint.name} API`,
        version: 'v1',
        endpoint: `https://api.example.com${generateEndpoint(endpoint.name)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        parameters: generateEndpointParameters(endpoint, parsedRequirements.fields),
        response: {
          format: 'json',
          schema: { status: 'string', data: 'object' }
        },
        authentication: {
          type: 'apikey',
          location: 'header'
        },
        rateLimit: {
          requests: 50,
          period: 'minute'
        },
        transformations: generateEndpointTransformations(endpoint),
        metadata: {
          generatedAt: new Date().toISOString(),
          confidence: endpoint.confidence as any,
          source: 'auto'
        }
      };
      generatedConfigs.push(config);
    });

    setConfigurations(generatedConfigs);
    setIsGenerating(false);
  }, [parsedRequirements]);

  // Generate endpoint URL based on service name
  const generateEndpoint = (serviceName: string): string => {
    const endpoints: Record<string, string> = {
      'KYC Provider': '/api/kyc/verify',
      'GST API': '/api/gst/validate',
      'Payment Gateway': '/api/payment/process',
      'Fraud Detection API': '/api/fraud/detect',
      'Credit Bureau': '/api/bureau/score'
    };
    return endpoints[serviceName] || '/api/generic/endpoint';
  };

  // Generate field mappings from parsed fields
  const generateFieldMappings = (service: any, fields: any[]): FieldMapping[] => {
    const mappings: FieldMapping[] = [];
    const serviceFields = getServiceFields(service.name);
    
    fields.forEach(field => {
      if (field.category === 'data') {
        const mapping = findBestMapping(field.name, serviceFields);
        mappings.push({
          clientField: field.name,
          apiField: mapping.apiField,
          confidence: mapping.confidence,
          transformation: mapping.transformation
        });
      }
    });
    
    return mappings;
  };

  // Get expected fields for each service
  const getServiceFields = (serviceName: string): string[] => {
    const serviceFields: Record<string, string[]> = {
      'KYC Provider': ['fullName', 'dateOfBirth', 'panNumber', 'email', 'phoneNumber'],
      'GST API': ['businessName', 'panNumber', 'email', 'phoneNumber'],
      'Payment Gateway': ['customerName', 'email', 'phoneNumber', 'amount'],
      'Fraud Detection API': ['userName', 'email', 'phoneNumber', 'transactionAmount'],
      'Credit Bureau': ['fullName', 'panNumber', 'email', 'phoneNumber']
    };
    return serviceFields[serviceName] || [];
  };

  // Find best mapping for a field
  const findBestMapping = (clientField: string, serviceFields: string[]): { apiField: string; confidence: number; transformation?: TransformationRule } => {
    const directMatch = serviceFields.find(field => field.toLowerCase() === clientField.toLowerCase());
    
    if (directMatch) {
      return {
        apiField: directMatch,
        confidence: 0.95,
        transformation: {
          id: `transform_${directMatch}`,
          name: 'Direct Mapping',
          type: 'format',
          source: {
            field: clientField,
            format: 'string',
            example: 'John Doe'
          },
          target: {
            field: directMatch,
            format: 'string',
            example: 'John Doe'
          },
          rule: 'direct_mapping',
          enabled: true
        }
      };
    }
    
    // Fuzzy matching for similar fields
    const fuzzyMatches = serviceFields.filter(field => 
      field.toLowerCase().includes(clientField.toLowerCase()) || 
      clientField.toLowerCase().includes(field.toLowerCase())
    );
    
    if (fuzzyMatches.length > 0) {
      return {
        apiField: fuzzyMatches[0],
        confidence: 0.75,
        transformation: {
          id: `transform_${fuzzyMatches[0]}`,
          name: 'Fuzzy Mapping',
          type: 'convert',
          source: {
            field: clientField,
            format: 'string',
            example: 'John Doe'
          },
          target: {
            field: fuzzyMatches[0],
            format: 'string',
            example: 'John Doe'
          },
          rule: `fuzzy_match_${clientField.toLowerCase()}_to_${fuzzyMatches[0].toLowerCase()}`,
          enabled: true
        }
      };
    }
    
    return {
      apiField: clientField,
      confidence: 0.5,
      transformation: {
        id: `transform_${clientField}`,
        name: 'Default Mapping',
        type: 'default',
        source: {
          field: clientField,
          format: 'string',
          example: 'example'
        },
        target: {
          field: clientField,
          format: 'string',
          example: 'example'
        },
        rule: 'default_passthrough',
        enabled: true
      }
    };
  };

  // Generate response schema
  const generateResponseSchema = (serviceName: string): Record<string, any> => {
    const schemas: Record<string, Record<string, any>> = {
      'KYC Provider': {
        status: { type: 'string', enum: ['verified', 'pending', 'failed'] },
        customer: { type: 'object', properties: { id: 'string', name: 'string', verified: 'boolean' } }
      },
      'GST API': {
        status: { type: 'string', enum: ['valid', 'invalid'] },
        business: { type: 'object', properties: { gstin: 'string', name: 'string', valid: 'boolean' } }
      },
      'Payment Gateway': {
        status: { type: 'string', enum: ['success', 'failed', 'pending'] },
        transaction: { type: 'object', properties: { id: 'string', amount: 'number', status: 'string' } }
      },
      'Fraud Detection API': {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        decision: { type: 'string', enum: ['approve', 'decline', 'review'] }
      },
      'Credit Bureau': {
        score: { type: 'number', minimum: 300, maximum: 900 },
        report: { type: 'object', properties: { score: 'number', factors: 'array' } }
      }
    };
    
    return schemas[serviceName] || { status: { type: 'string' } };
  };

  // Generate endpoint parameters
  const generateEndpointParameters = (endpoint: any, fields: any[]): FieldMapping[] => {
    const params: FieldMapping[] = [
      {
        clientField: 'requestId',
        apiField: 'request_id',
        confidence: 0.9
      },
      {
        clientField: 'timestamp',
        apiField: 'timestamp',
        confidence: 0.9
      }
    ];
    
    // Add relevant fields based on endpoint category
    if (endpoint.category === 'identity') {
      params.push(
        { clientField: 'fullName', apiField: 'full_name', confidence: 0.8 },
        { clientField: 'dateOfBirth', apiField: 'date_of_birth', confidence: 0.8 },
        { clientField: 'panNumber', apiField: 'pan_number', confidence: 0.9 }
      );
    }
    
    return params;
  };

  // Generate transformation rules for endpoints
  const generateEndpointTransformations = (endpoint: any): TransformationRule[] => {
    return [
      {
        id: `validate_${endpoint.name}`,
        name: 'Request Validation',
        type: 'validate',
        source: {
          field: 'request',
          format: 'json',
          example: '{ "data": "value" }'
        },
        target: {
          field: 'validated_request',
          format: 'json',
          example: '{ "validated": true, "data": "value" }'
        },
        rule: 'validate_required_fields',
        enabled: true
      },
      {
        id: `format_${endpoint.name}`,
        name: 'Response Formatting',
        type: 'format',
        source: {
          field: 'response',
          format: 'object',
          example: '{ "status": "success" }'
        },
        target: {
          field: 'formatted_response',
          format: 'json',
          example: '{ "status": "success", "timestamp": "2026-04-02T12:00:00Z" }'
        },
        rule: 'add_timestamp_and_metadata',
        enabled: true
      }
    ];
  };

  // Generate transformation rules for services
  const generateTransformationRules = (serviceName: string, fields: any[]): TransformationRule[] => {
    const rules: TransformationRule[] = [];
    
    // Add common transformation rules
    rules.push(
      {
        id: 'format_phone',
        name: 'Phone Number Formatting',
        type: 'format',
        source: {
          field: 'phoneNumber',
          format: 'various',
          example: '+91-9876543210'
        },
        target: {
          field: 'phoneNumber',
          format: 'E.164',
          example: '+919876543210'
        },
        rule: 'format_to_e164_standard',
        enabled: true
      },
      {
        id: 'validate_pan',
        name: 'PAN Card Validation',
        type: 'validate',
        source: {
          field: 'panNumber',
          format: 'string',
          example: 'ABCDE1234F'
        },
        target: {
          field: 'panNumber',
          format: 'validated_string',
          example: 'ABCDE1234F'
        },
        rule: 'validate_pan_format_10digit_alphanumeric',
        enabled: true
      },
      {
        id: 'convert_date',
        name: 'Date Format Conversion',
        type: 'convert',
        source: {
          field: 'dateOfBirth',
          format: 'DD/MM/YYYY',
          example: '15/01/1990'
        },
        target: {
          field: 'dateOfBirth',
          format: 'YYYY-MM-DD',
          example: '1990-01-15'
        },
        rule: 'convert_ddmmyyyy_to_iso8601',
        enabled: true
      }
    );
    
    return rules;
  };

  // Handle adding new mapping
  const handleAddMapping = useCallback(() => {
    if (newMapping.clientField && newMapping.apiField && selectedConfig) {
      const updatedConfig = { ...selectedConfig };
      updatedConfig.parameters = [
        ...updatedConfig.parameters,
        {
          clientField: newMapping.clientField,
          apiField: newMapping.apiField,
          confidence: 0.8
        }
      ];
      
      setConfigurations(prev => 
        prev.map(config => config.id === selectedConfig.id ? updatedConfig : config)
      );
      setSelectedConfig(updatedConfig);
      setNewMapping({ clientField: '', apiField: '' });
    }
  }, [newMapping, selectedConfig]);

  // Handle editing mapping
  const handleEditMapping = useCallback((mappingId: string, field: string, value: string) => {
    if (selectedConfig) {
      const updatedConfig = { ...selectedConfig };
      updatedConfig.parameters = updatedConfig.parameters.map(mapping =>
        mapping.clientField === field ? { ...mapping, apiField: value } : mapping
      );
      
      setConfigurations(prev => 
        prev.map(config => config.id === selectedConfig.id ? updatedConfig : config)
      );
      setSelectedConfig(updatedConfig);
    }
  }, [selectedConfig]);

  // Handle deleting mapping
  const handleDeleteMapping = useCallback((field: string) => {
    if (selectedConfig) {
      const updatedConfig = { ...selectedConfig };
      updatedConfig.parameters = updatedConfig.parameters.filter(
        mapping => mapping.clientField !== field
      );
      
      setConfigurations(prev => 
        prev.map(config => config.id === selectedConfig.id ? updatedConfig : config)
      );
      setSelectedConfig(updatedConfig);
    }
  }, [selectedConfig]);

  // Export configurations as JSON
  const exportConfigurations = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      configurations: configurations,
      summary: {
        totalConfigurations: configurations.length,
        totalMappings: configurations.reduce((sum, config) => sum + config.parameters.length, 0),
        averageConfidence: configurations.reduce((sum, config) => sum + config.metadata.confidence, 0) / configurations.length
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configurations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [configurations]);

  // Generate configurations when parsed requirements are available
  useEffect(() => {
    if (parsedRequirements && !isGenerating) {
      generateConfigurations();
    }
  }, [parsedRequirements, generateConfigurations, isGenerating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto Configuration Engine</h1>
        <p className="text-gray-600">Generate API configurations and field mappings from parsed requirements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1 bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CogIcon className="w-6 h-6 mr-2 text-primary-600" />
            Input Requirements
          </h2>

          {parsedRequirements ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Document Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Type:</span>
                    <span className="font-medium text-blue-900">{parsedRequirements.document.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Services:</span>
                    <span className="font-medium text-blue-900">{parsedRequirements.summary.totalServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Fields:</span>
                    <span className="font-medium text-blue-900">{parsedRequirements.summary.totalFields}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Confidence:</span>
                    <span className="font-medium text-blue-900">
                      {(parsedRequirements.summary.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={generateConfigurations}
                disabled={isGenerating}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Generate Configurations
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CogIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p>No parsed requirements available</p>
              <p className="text-sm">Parse a document first to generate configurations</p>
            </div>
          )}
        </motion.div>

        {/* Configuration List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <DocumentArrowDownIcon className="w-6 h-6 mr-2 text-primary-600" />
              Generated Configurations
            </span>
            {configurations.length > 0 && (
              <button
                onClick={exportConfigurations}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Export JSON
              </button>
            )}
          </h2>

          {configurations.length === 0 && !isGenerating ? (
            <div className="text-center py-12 text-gray-500">
              <DocumentArrowDownIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p>No configurations generated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configurations.map((config) => (
                <div
                  key={config.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedConfig?.id === config.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        config.metadata.confidence > 0.8
                          ? 'bg-green-100 text-green-800'
                          : config.metadata.confidence > 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(config.metadata.confidence * 100).toFixed(0)}%
                      </span>
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Endpoint:</span>
                      <span className="font-mono text-gray-900">{config.endpoint}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Method:</span>
                      <span className="font-mono text-gray-900">{config.method}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Authentication:</span>
                      <span className="font-mono text-gray-900">{config.authentication.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate Limit:</span>
                      <span className="font-mono text-gray-900">
                        {config.rateLimit?.requests}/{config.rateLimit?.period}
                      </span>
                    </div>
                  </div>

                  {/* Field Mappings */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Field Mappings</h4>
                      <button
                        onClick={() => setEditingMapping(editingMapping === 'new' ? null : 'new')}
                        className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PlusIcon className="w-3 h-3 inline mr-1" />
                        Add Mapping
                      </button>
                    </div>

                    {editingMapping === 'new' && (
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Client field"
                            value={newMapping.clientField}
                            onChange={(e) => setNewMapping(prev => ({ ...prev, clientField: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="API field"
                            value={newMapping.apiField}
                            onChange={(e) => setNewMapping(prev => ({ ...prev, apiField: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleAddMapping()}
                            disabled={!newMapping.clientField || !newMapping.apiField}
                            className="px-2 py-1 text-xs border border-transparent rounded text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {config.parameters.map((mapping) => (
                        <div
                          key={mapping.clientField}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-700">
                              {mapping.clientField}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-900">
                              {mapping.apiField}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingMapping(mapping.clientField)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(mapping.clientField)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ConfigurationEngine;
