import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentArrowUpIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  TableCellsIcon,
  BeakerIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ServerIcon,
  TagIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface SelectedIntegration {
  service: string;
  provider: string;
  version: string;
  endpoints: Record<string, string>;
}

interface NLPParseResult {
  timestamp: string;
  input_text: string;
  input_length: number;
  word_count: number;
  services_detected: string[];
  fields_detected: string[];
  mandatory_services: string[];
  optional_services: string[];
  confidence_score: number;
  processing_details: {
    service_matches: { [service: string]: string[] };
    field_matches: { [field: string]: string[] };
    total_service_keywords_found: number;
    total_field_keywords_found: number;
  };
  metadata: {
    parser_version: string;
    processing_method: string;
    language: string;
  };
}

const RequirementParser: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<NLPParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [availableAdapters, setAvailableAdapters] = useState<any[]>([]);

  // Fetch available adapters
  const fetchAdapters = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5003/adapters');
      const data = await response.json();
      if (data.success) {
        setAvailableAdapters(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch adapters:', error);
    }
  }, []);

  // Match detected services with adapters
  const matchServicesWithAdapters = useCallback(async (services: string[]) => {
    try {
      const response = await fetch('http://localhost:5003/match-adapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services_detected: services
        }),
      });

      const data = await response.json();

      if (data.success) {
        actions.setSelectedAdapters(data.data);
        
        // Fetch schemas for each selected integration
        for (const integration of data.data) {
          await fetchSchema(integration.service, integration.version);
        }
      } else {
        console.error('Failed to match adapters:', data.error);
      }
    } catch (error) {
      console.error('Failed to match adapters:', error);
    }
  }, [actions]);

  // Fetch schema for a specific service
  const fetchSchema = useCallback(async (service: string, version: string) => {
    try {
      const response = await fetch(`http://localhost:5003/schema/${service}/${version}`);
      const data = await response.json();
      
      if (data.success) {
        // Store schema for later use
        return data.data;
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
    return null;
  }, []);

  // Fetch adapters on component mount
  useEffect(() => {
    fetchAdapters();
  }, [fetchAdapters]);
  const getServiceInfo = (service: string) => {
    switch (service.toLowerCase()) {
      case 'kyc':
        return { icon: BeakerIcon, color: 'bg-blue-100 text-blue-800 border-blue-200', name: 'KYC Verification' };
      case 'gst':
        return { icon: ServerIcon, color: 'bg-green-100 text-green-800 border-green-200', name: 'GST Services' };
      case 'payments':
        return { icon: CreditCardIcon, color: 'bg-purple-100 text-purple-800 border-purple-200', name: 'Payment Processing' };
      case 'fraud':
        return { icon: ShieldCheckIcon, color: 'bg-red-100 text-red-800 border-red-200', name: 'Fraud Detection' };
      default:
        return { icon: CogIcon, color: 'bg-gray-100 text-gray-800 border-gray-200', name: service };
    }
  };

  // Field type colors
  const getFieldTypeColor = (field: string) => {
    const fieldTypes: { [key: string]: string } = {
      'name': 'bg-blue-50 text-blue-700',
      'dob': 'bg-green-50 text-green-700',
      'PAN': 'bg-purple-50 text-purple-700',
      'GSTIN': 'bg-orange-50 text-orange-700',
      'phone': 'bg-pink-50 text-pink-700',
      'email': 'bg-indigo-50 text-indigo-700',
      'address': 'bg-gray-50 text-gray-700',
      'aadhaar': 'bg-yellow-50 text-yellow-700',
      'bankAccount': 'bg-teal-50 text-teal-700',
      'amount': 'bg-red-50 text-red-700'
    };
    return fieldTypes[field] || 'bg-gray-50 text-gray-700';
  };

  // Parse requirements using NLP service
  const parseRequirements = useCallback(async () => {
    if (!documentText.trim()) {
      setError('Please enter some text to parse');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5003/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: documentText,
          options: {
            extract_services: true,
            extract_fields: true,
            include_confidence: true,
            include_metadata: true
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setParseResult(data.data);
        
        // Automatically match detected services with adapters
        if (data.data.services_detected && data.data.services_detected.length > 0) {
          await matchServicesWithAdapters(data.data.services_detected);
        }
      } else {
        setError(data.error || 'Parsing failed');
      }
    } catch (error) {
      setError('Failed to connect to parsing service');
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  }, [documentText, matchServicesWithAdapters]);

  // Mock parsing as fallback
  const mockParseDocument = (text: string): NLPParseResult => {
    const normalizedText = text.toLowerCase();
    
    // Simple keyword detection
    const services = [];
    const fields = [];
    
    if (normalizedText.includes('kyc') || normalizedText.includes('identity')) services.push('KYC');
    if (normalizedText.includes('gst') || normalizedText.includes('tax')) services.push('GST');
    if (normalizedText.includes('payment') || normalizedText.includes('transaction')) services.push('Payments');
    if (normalizedText.includes('fraud') || normalizedText.includes('risk')) services.push('Fraud');
    
    if (normalizedText.includes('name')) fields.push('name');
    if (normalizedText.includes('dob') || normalizedText.includes('birth')) fields.push('dob');
    if (normalizedText.includes('pan')) fields.push('PAN');
    if (normalizedText.includes('gstin')) fields.push('GSTIN');
    if (normalizedText.includes('phone') || normalizedText.includes('mobile')) fields.push('phone');
    if (normalizedText.includes('email')) fields.push('email');

    return {
      timestamp: new Date().toISOString(),
      input_text: text,
      input_length: text.length,
      word_count: text.split(/\s+/).length,
      services_detected: services,
      fields_detected: fields,
      mandatory_services: services,
      optional_services: [],
      confidence_score: 75,
      processing_details: {
        service_matches: {},
        field_matches: {},
        total_service_keywords_found: services.length,
        total_field_keywords_found: fields.length
      },
      metadata: {
        parser_version: '1.0.0',
        processing_method: 'keyword_matching_rule_based',
        language: 'en'
      }
    };
  };

  const handleParseText = async () => {
    if (!documentText.trim()) {
      setError('Please enter some text to parse');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const result = mockParseDocument(documentText);
      setParseResult(result);
      
      // Automatically match detected services with adapters
      if (result.services_detected && result.services_detected.length > 0) {
        await matchServicesWithAdapters(result.services_detected);
        actions.setParsedData(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse document');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    
    try {
      const text = await uploadedFile.text();
      setDocumentText(text);
    } catch (error) {
      setError('Failed to read file content');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const sampleText = `The system must integrate KYC and GST verification APIs. 
The KYC integration should support customer identity verification with name, date of birth, 
PAN number, email, and phone number validation. The GST integration must validate GSTIN 
and business registration details. Payment processing is required for transaction handling. 
All integrations should be secure and compliant with regulatory requirements.`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NLP Requirement Parser</h1>
          <p className="text-gray-600">AI-powered requirement extraction with keyword matching and rule-based analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentArrowUpIcon className="w-5 h-5 mr-2 text-blue-600" />
                Document Upload
              </h2>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Drag and drop your document here, or click to browse'}
                </p>
                <input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>

            {/* Text Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardDocumentIcon className="w-5 h-5 mr-2 text-blue-600" />
                Requirement Text
              </h2>

              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your requirement text here..."
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setDocumentText(sampleText)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Load Sample Text
                </button>
                <span className="text-sm text-gray-500">
                  {documentText.length} characters
                </span>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleParseText}
                disabled={isParsing || !documentText.trim()}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isParsing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Parsing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Parse Requirements
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {parseResult ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Services Detected</p>
                        <p className="text-2xl font-bold text-gray-900">{parseResult.services_detected.length}</p>
                      </div>
                      <TagIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Fields Detected</p>
                        <p className="text-2xl font-bold text-gray-900">{parseResult.fields_detected.length}</p>
                      </div>
                      <CogIcon className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Services</h3>
                  
                  <div className="space-y-4">
                    {/* Mandatory Services */}
                    {parseResult.mandatory_services.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">Mandatory Services</h4>
                        <div className="space-y-2">
                          {parseResult.mandatory_services.map((service, index) => (
                            <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getServiceInfo(service).color}`}>
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Services */}
                    {parseResult.optional_services.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">Optional Services</h4>
                        <div className="space-y-2">
                          {parseResult.optional_services.map((service, index) => (
                            <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700`}>
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Integrations */}
                {state.selectedAdapters.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                      Selected Integrations
                    </h3>
                    
                    <div className="space-y-4">
                      {state.selectedAdapters.map((integration: any, index: number) => {
                        const serviceInfo = getServiceInfo(integration.service);
                        const IconComponent = serviceInfo.icon;
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-md font-semibold text-gray-900">{integration.service}</h4>
                                <p className="text-sm text-gray-600">
                                  Provider: <span className="font-medium">{integration.provider}</span> | 
                                  Version: <span className="font-medium">{integration.version}</span>
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const updated = state.selectedAdapters.filter((_, i) => i !== index);
                                    actions.setSelectedAdapters(updated);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Available Endpoints:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(integration.endpoints || {}).map(([name, url], idx) => (
                                  <div key={idx} className="bg-gray-50 rounded p-2">
                                    <p className="text-xs font-medium text-gray-600">{name}</p>
                                    <p className="text-sm text-gray-900 break-all">{String(url)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Continue to Field Mapping */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Navigate to field mapping with data
                          actions.setCurrentStep('field-mapping');
                          navigate('/field-mapping');
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                      >
                        Proceed to Mapping →
                      </button>
                    </div>
                  </div>
                )}

                {/* Fields */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Fields</h3>
                  <div className="flex flex-wrap gap-2">
                    {parseResult.fields_detected.map((field) => (
                      <span
                        key={field}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getFieldTypeColor(field)}`}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* JSON Output */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Parsed Output (JSON)</h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(parseResult, null, 2))}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-1" />
                      Copy JSON
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      {JSON.stringify(parseResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <TableCellsIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600">Upload a document or paste text to see parsing results</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RequirementParser;
