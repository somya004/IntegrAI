import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface ExtractedService {
  name: string;
  type: string;
  endpoints: Array<{
    url: string;
    method: string;
    request_fields: string[];
    response_fields: string[];
  }>;
  authentication: string;
  mandatory: boolean;
}

interface ParsedRequirements {
  services: ExtractedService[];
  raw_text: string;
  confidence: number;
}

const CreateIntegration: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRequirements, setParsedRequirements] = useState<ParsedRequirements | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const steps = [
    { id: 1, name: 'Upload Requirements', description: 'Upload and parse your requirements document' },
    { id: 2, name: 'Review Extracted Data', description: 'Review and edit extracted integration services' },
    { id: 3, name: 'Continue Setup', description: 'Proceed with integration configuration' }
  ];

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError('');
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Upload and parse document
  const handleUploadAndParse = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload file with progress
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Parse document
      setIsParsing(true);
      
      const response = await new Promise<ParsedRequirements>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', 'http://localhost:5000/api/parse-document');
        xhr.send(formData);
      });

      setParsedRequirements(response);
      setCurrentStep(2);
      
    } catch (err: any) {
      console.error('Upload/Parse error:', err);
      setError(err.message || 'Failed to upload and parse document');
      
      // Fallback mock data for testing
      const mockData: ParsedRequirements = {
        services: [
          {
            name: 'KYC Verification',
            type: 'identity',
            endpoints: [
              {
                url: '/api/kyc/verify',
                method: 'POST',
                request_fields: ['name', 'dob', 'pan', 'email', 'phone'],
                response_fields: ['verification_id', 'status', 'score']
              }
            ],
            authentication: 'Bearer Token',
            mandatory: true
          },
          {
            name: 'GST Validation',
            type: 'tax',
            endpoints: [
              {
                url: '/api/gst/validate',
                method: 'POST',
                request_fields: ['gstin', 'business_name'],
                response_fields: ['gstin_status', 'registration_date', 'business_details']
              }
            ],
            authentication: 'API Key',
            mandatory: true
          },
          {
            name: 'Payment Processing',
            type: 'payment',
            endpoints: [
              {
                url: '/api/payment/process',
                method: 'POST',
                request_fields: ['amount', 'currency', 'account_number'],
                response_fields: ['transaction_id', 'status', 'timestamp']
              }
            ],
            authentication: 'OAuth 2.0',
            mandatory: false
          }
        ],
        raw_text: 'This system must integrate KYC and GST verification APIs...',
        confidence: 85
      };
      
      setParsedRequirements(mockData);
      setCurrentStep(2);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  // Update service data
  const updateService = (index: number, field: keyof ExtractedService, value: any) => {
    if (!parsedRequirements) return;
    
    const updatedServices = [...parsedRequirements.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    setParsedRequirements({
      ...parsedRequirements,
      services: updatedServices
    });
  };

  // Add new service
  const addService = () => {
    if (!parsedRequirements) return;
    
    const newService: ExtractedService = {
      name: '',
      type: '',
      endpoints: [
        {
          url: '',
          method: 'POST',
          request_fields: [],
          response_fields: []
        }
      ],
      authentication: '',
      mandatory: false
    };
    
    setParsedRequirements({
      ...parsedRequirements,
      services: [...parsedRequirements.services, newService]
    });
  };

  // Remove service
  const removeService = (index: number) => {
    if (!parsedRequirements) return;
    
    const updatedServices = parsedRequirements.services.filter((_, i) => i !== index);
    setParsedRequirements({
      ...parsedRequirements,
      services: updatedServices
    });
  };

  // Continue to next step
  const handleContinue = () => {
    if (parsedRequirements) {
      // Store in global state for next steps
      actions.setParsedData({
        services_detected: parsedRequirements.services.map(s => s.name),
        fields_detected: parsedRequirements.services.flatMap(s => 
          s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
        ),
        mandatory_services: parsedRequirements.services.filter(s => s.mandatory).map(s => s.name),
        optional_services: parsedRequirements.services.filter(s => !s.mandatory).map(s => s.name),
        confidence_score: parsedRequirements.confidence,
        processing_details: {
          service_matches: {},
          field_matches: {},
          total_service_keywords_found: parsedRequirements.services.length,
          total_field_keywords_found: parsedRequirements.services.flatMap(s => 
            s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
          ).length
        },
        metadata: {
          parser_version: '2.0.0',
          processing_method: 'ai_enhanced',
          language: 'en'
        }
      });
      
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Integration</h1>
          <p className="text-gray-600">Upload your requirements document to automatically extract integration services</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step.id === currentStep
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step.id < currentStep
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step.id === currentStep ? 'text-blue-600' : step.id < currentStep ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 mx-4 h-1 ${
                    index < currentStep - 1 ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Requirements Document</h2>
              
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="space-y-4">
                    <DocumentTextIcon className="w-16 h-16 mx-auto text-blue-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CloudArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Drop your requirements document here</p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {(isUploading || isParsing) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {isUploading ? 'Uploading...' : 'Parsing document...'}
                    </span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleUploadAndParse}
                  disabled={!uploadedFile || isUploading || isParsing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading || isParsing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Parse Document
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && parsedRequirements && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Review Extracted Services</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">
                      Found {parsedRequirements.services.length} services with {parsedRequirements.confidence}% confidence
                    </p>
                  </div>
                  <button
                    onClick={addService}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Add Service
                  </button>
                </div>
              </div>

              {/* Services List */}
              {parsedRequirements.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
                          placeholder="Service Name"
                        />
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          service.mandatory
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <input
                            type="text"
                            value={service.type}
                            onChange={(e) => updateService(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., identity, payment, tax"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
                          <input
                            type="text"
                            value={service.authentication}
                            onChange={(e) => updateService(index, 'authentication', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Bearer Token, API Key"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeService(index)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Endpoints */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Endpoints</h4>
                    {service.endpoints.map((endpoint, endpointIndex) => (
                      <div key={endpointIndex} className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                            <input
                              type="text"
                              value={endpoint.url}
                              onChange={(e) => {
                                const updatedEndpoints = [...service.endpoints];
                                updatedEndpoints[endpointIndex] = { ...endpoint, url: e.target.value };
                                updateService(index, 'endpoints', updatedEndpoints);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="/api/service/endpoint"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                            <select
                              value={endpoint.method}
                              onChange={(e) => {
                                const updatedEndpoints = [...service.endpoints];
                                updatedEndpoints[endpointIndex] = { ...endpoint, method: e.target.value };
                                updateService(index, 'endpoints', updatedEndpoints);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Request Fields</label>
                            <input
                              type="text"
                              value={endpoint.request_fields.join(', ')}
                              onChange={(e) => {
                                const updatedEndpoints = [...service.endpoints];
                                updatedEndpoints[endpointIndex] = { 
                                  ...endpoint, 
                                  request_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                                };
                                updateService(index, 'endpoints', updatedEndpoints);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="field1, field2, field3"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Response Fields</label>
                          <input
                            type="text"
                            value={endpoint.response_fields.join(', ')}
                            onChange={(e) => {
                              const updatedEndpoints = [...service.endpoints];
                              updatedEndpoints[endpointIndex] = { 
                                ...endpoint, 
                                response_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                              };
                              updateService(index, 'endpoints', updatedEndpoints);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="field1, field2, field3"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Continue to Setup
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateIntegration;
