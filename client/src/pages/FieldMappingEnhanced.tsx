import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface FieldMapping {
  inputField: string;
  apiField: string;
  confidence: number;
}

interface ServiceSchema {
  service: string;
  provider: string;
  version: string;
  requiredFields: string[];
  optionalFields: string[];
  endpoints: Record<string, string>;
}

interface IntegrationConfig {
  service: string;
  provider: string;
  version: string;
  endpoints: Record<string, string>;
  mappings: Record<string, string>;
  authentication: {
    type: string;
    header: string;
  };
  rateLimit: {
    requests: number;
    period: string;
  };
}

interface GeneratedConfig {
  tenant_id: string;
  generated_at: string;
  integrations: IntegrationConfig[];
}

interface FieldMappingProps {
  onNext?: (config: GeneratedConfig) => void;
}

const FieldMapping: React.FC<FieldMappingProps> = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [tenantId] = useState('bank_123'); // Mock tenant ID

  // Get data from global state
  const parsedData = state.parsedData;
  const selectedAdapters = state.selectedAdapters;
  const schemas = state.schemas;

  // Extract fields from parsed data
  const parsedFields = parsedData?.fields_detected || [];
  const servicesDetected = parsedData?.services_detected || [];

  // STEP 3: ADD FALLBACK DATA (IMPORTANT)
  useEffect(() => {
    if (!selectedAdapters || selectedAdapters.length === 0) {
      console.log("🛡️ Setting fallback selected adapters");
      actions.setSelectedAdapters([
        {
          service: "KYC Verification",
          provider: "Default Adapter",
          version: "v1",
          endpoints: {
            "api": "https://api.default-adapter.com/v1",
            "webhook": "https://webhook.default-adapter.com/v1"
          },
          requiredFields: ["customerId", "apiKey"],
          optionalFields: ["metadata", "callback"],
          authentication: {
            type: "Bearer",
            header: "Authorization"
          },
          rateLimit: {
            requests: 1000,
            period: "hour"
          }
        }
      ]);
    }

    if (!schemas || Object.keys(schemas).length === 0) {
      console.log("🛡️ Setting fallback schemas");
      actions.setSchemas({
        "KYC Verification": {
          service: "KYC Verification",
          provider: "Default Adapter",
          version: "v1",
          requiredFields: ["customerId", "documents"],
          optionalFields: ["metadata"],
          endpoints: {
            "verify": "/api/kyc/verify",
            "status": "/api/kyc/status"
          }
        }
      });
    }
  }, [selectedAdapters, schemas, actions]);

  // STEP 4: DEBUG LOG (OPTIONAL)
  useEffect(() => {
    console.log("🔍 Field Mapping Debug:");
    console.log("📊 Parsed Data:", parsedData);
    console.log("🔌 Selected Adapters:", selectedAdapters);
    console.log("📋 Schemas:", schemas);
    console.log("📝 Parsed Fields:", parsedFields);
  }, [parsedData, selectedAdapters, schemas, parsedFields]);

  // Suggest field mappings based on field names (as specified)
  const suggestMappings = useCallback(() => {
    if (!parsedFields.length || !Object.keys(schemas).length) return;
    
    const suggestedMappings: Record<string, FieldMapping> = {};
    
    // Auto-suggest mapping as specified:
    // name → fullName
    // dob → date_of_birth
    suggestedMappings['name'] = {
      inputField: 'name',
      apiField: 'fullName',
      confidence: 90
    };
    
    suggestedMappings['dob'] = {
      inputField: 'dob',
      apiField: 'date_of_birth',
      confidence: 90
    };
    
    // Try to find matches for other fields
    parsedFields.forEach(inputField => {
      if (suggestedMappings[inputField]) return; // Skip if already mapped
      
      const lowerInputField = inputField.toLowerCase();
      
      // Find best match in any schema
      let bestMatch: { service: string; field: string; confidence: number } | null = null;
      
      Object.entries(schemas).forEach(([service, schema]) => {
        const allFields = [...(schema.requiredFields || []), ...(schema.optionalFields || [])];
        
        allFields.forEach(apiField => {
          const lowerApiField = apiField.toLowerCase();
          let confidence = 0;
          
          // Exact match
          if (lowerInputField === lowerApiField) {
            confidence = 100;
          }
          // Contains match
          else if (lowerInputField.includes(lowerApiField) || lowerApiField.includes(lowerInputField)) {
            confidence = 80;
          }
          // Partial match
          else if (lowerInputField.substring(0, 3) === lowerApiField.substring(0, 3)) {
            confidence = 60;
          }
          // Common field mappings
          else if (
            (lowerInputField.includes('name') && lowerApiField.includes('name')) ||
            (lowerInputField.includes('dob') && lowerApiField.includes('birth')) ||
            (lowerInputField.includes('pan') && lowerApiField.includes('pan')) ||
            (lowerInputField.includes('gstin') && lowerApiField.includes('gstin'))
          ) {
            confidence = 70;
          }
          
          if (confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { service, field: apiField, confidence };
          }
        });
      });
      
      if (bestMatch) {
        const match = bestMatch as { service: string; field: string; confidence: number };
        if (match.confidence >= 60) {
          suggestedMappings[inputField] = {
            inputField,
            apiField: match.field,
            confidence: match.confidence
          };
        }
      }
    });
    
    actions.setMappings(suggestedMappings);
  }, [parsedFields, schemas, actions]);

  // Auto-suggest mappings when component mounts
  useEffect(() => {
    if (parsedFields.length > 0 && Object.keys(schemas).length > 0) {
      suggestMappings();
    }
  }, [suggestMappings]);

  // Update mapping
  const updateMapping = (inputField: string, apiField: string, confidence: number) => {
    actions.updateMapping(inputField, apiField, confidence);
  };

  // Remove mapping
  const removeMapping = (inputField: string) => {
    actions.removeMapping(inputField);
  };

  // Check if required data is available
  if (!parsedData || !selectedAdapters || !schemas || Object.keys(schemas).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">⚠️ No Data Found</h2>
          <p className="text-gray-600 mb-6">
            Using fallback data...
          </p>
          <button
            onClick={() => navigate('/workflow')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue with Fallback Data
          </button>
        </div>
      </div>
    );
  }

  // Generate configuration
  const generateConfiguration = async () => {
    console.log('🔄 Mapping - Parsed Data:', parsedData);
    console.log('🔄 Mapping - Selected Adapters:', selectedAdapters);
    console.log('🔄 Mapping - Schemas:', schemas);
    console.log('🔄 Mapping - Current Mappings:', state.mappings);
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Create final configuration
      const finalConfig = {
        tenant_id: tenantId,
        integrations: selectedAdapters,
        mappings: state.mappings
      };
      
      // Store final config in global state
      actions.setFinalConfig(finalConfig);
      
      console.log('🔄 Mapping - Generated Final Config:', finalConfig);
      
      // Navigate to config page
      navigate('/config');
      
    } catch (error) {
      setError('Failed to generate configuration');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run simulation
  const runSimulation = async () => {
    if (!state.generatedConfig) return;
    
    setIsSimulating(true);
    setSimulationResult(null);
    
    try {
      const response = await fetch('http://localhost:5006/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: state.generatedConfig
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSimulationResult(data.data);
      } else {
        setError(data.error || 'Simulation failed');
      }
    } catch (error) {
      setError('Failed to run simulation');
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Download configuration
  const downloadConfig = () => {
    if (!state.generatedConfig) return;
    
    const blob = new Blob([JSON.stringify(state.generatedConfig, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Field Mapping</h1>
          <p className="text-gray-600">Map your input fields to API schema fields for seamless integration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Fields */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Input Fields</h2>
                <span className="text-sm text-gray-500">{parsedFields.length} fields detected</span>
              </div>
              
              <div className="space-y-2">
                {parsedFields.map((field, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{field}</p>
                    <p className="text-sm text-gray-500">Detected from document</p>
                  </div>
                ))}
              </div>
            </div>

            {/* API Schemas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Schemas</h2>
              
              <div className="space-y-4">
                {Object.values(state.schemas).map((schema: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {schema.service} - {schema.provider} v{schema.version}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Required Fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {schema.requiredFields.map((field: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {schema.optionalFields && schema.optionalFields.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Optional Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {schema.optionalFields.map((field: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Field Mappings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Field Mappings</h2>
                <button
                  onClick={suggestMappings}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Auto-suggest
                </button>
              </div>
              
              <div className="space-y-3">
                {parsedFields.map((inputField, index) => {
                  const mapping = state.mappings[inputField];
                  const allApiFields = Object.values(state.schemas).flatMap((schema: any) => [
                    ...schema.requiredFields,
                    ...(schema.optionalFields || [])
                  ]);
                  
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{inputField}</p>
                        <p className="text-sm text-gray-500">Input field</p>
                      </div>
                      
                      <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                      
                      <div className="flex-1">
                        <select
                          value={mapping?.apiField || ''}
                          onChange={(e) => updateMapping(inputField, e.target.value, 100)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select API field...</option>
                          {allApiFields.map((field: string, idx: number) => (
                            <option key={idx} value={field}>{field}</option>
                          ))}
                        </select>
                        
                        {mapping && (
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(mapping.confidence)}`}>
                              {mapping.confidence}% match
                            </span>
                            <button
                              onClick={() => removeMapping(inputField)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={generateConfiguration}
                  disabled={isGenerating || Object.keys(state.mappings).length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <CogIcon className="w-4 h-4 mr-2" />
                      Generate Config
                    </>
                  )}
                </button>
                
                {state.generatedConfig && (
                  <>
                    <button
                      onClick={downloadConfig}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Download Config
                    </button>
                    
                    <button
                      onClick={runSimulation}
                      disabled={isSimulating}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSimulating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Simulating...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Generated Configuration */}
        {state.generatedConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Configuration</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
                {JSON.stringify(state.generatedConfig, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Simulation Results */}
        {simulationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results</h2>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                simulationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {simulationResult.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    simulationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {simulationResult.success ? 'Simulation Successful' : 'Simulation Failed'}
                  </span>
                </div>
              </div>
              
              {simulationResult.results && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Integration Results:</h3>
                  {simulationResult.results.map((result: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{result.service}</p>
                      <p className="text-xs text-gray-600">Status: {result.status}</p>
                      {result.response && (
                        <pre className="text-xs text-gray-700 mt-1">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMapping;
