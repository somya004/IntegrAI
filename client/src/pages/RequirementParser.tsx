import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  CogIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CreditCardIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface IntegrationPlan {
  integration_plan: {
    services: Service[];
    dependencies: Dependency[];
    dataFlow: DataFlow[];
    auth_requirements: AuthRequirement[];
  };
  confidence_score: number;
  processing_metadata: {
    timestamp: string;
    parser_version: string;
    processing_time: number;
  };
}

interface Service {
  name: string;
  type: string;
  endpoints: Endpoint[];
  mandatory: boolean;
  confidence: number;
  description: string;
}

interface Endpoint {
  url: string;
  method: string;
  request_fields: string[];
  response_fields: string[];
  description?: string;
}

interface Dependency {
  service: string;
  depends_on: string;
  type: 'sequential' | 'parallel';
  description?: string;
}

interface DataFlow {
  from_service: string;
  to_service: string;
  data_fields: string[];
  trigger: 'immediate' | 'scheduled' | 'event_based';
}

interface AuthRequirement {
  service: string;
  auth_type: 'Bearer Token' | 'API Key' | 'OAuth 2.0' | 'Basic Auth';
  required_scopes?: string[];
  description?: string;
}

const RequirementParser: React.FC = () => {
  const { actions } = useAppContext();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'upload' | 'parsing' | 'ai_extraction' | 'output_ready' | 'complete' | 'error'>('upload');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [integrationPlan, setIntegrationPlan] = useState<IntegrationPlan | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parserId, setParserId] = useState<string>('');

  const processingSteps = [
    { id: 1, name: 'Upload', stage: 'upload' as const, description: 'Upload your requirements document' },
    { id: 2, name: 'Parsing', stage: 'parsing' as const, description: 'Extract text from document' },
    { id: 3, name: 'AI Extraction', stage: 'ai_extraction' as const, description: 'AI-powered service detection' },
    { id: 4, name: 'Output Ready', stage: 'output_ready' as const, description: 'Review and edit extracted data' }
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

  interface UploadResponse {
    success: boolean;
    extractedText: string;
    filename: string;
    error?: string;
  }

// Process document through the new parser API
  const processDocument = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError('');
    setCurrentStep(2);
    setProcessingStage('upload');
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Upload file and extract text
      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', 'http://localhost:5001/api/parser/upload');
        xhr.send(formData);
      });

      const uploadResult = await uploadPromise;
      setUploadProgress(0);
      setProcessingStage('parsing');

      // Send extracted text to AI API
      const aiResponse = await fetch('http://localhost:5001/api/ai/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: uploadResult.extractedText
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'AI parsing failed');
      }

      const aiResult = await aiResponse.json();

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // Convert AI response to our format
      const integrationPlan = convertToIntegrationPlan(aiResult.data);
      setIntegrationPlan(integrationPlan);
      setProcessingStage('complete');

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessingStage('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert parser API response to our internal format
  const convertToIntegrationPlan = (parserData: any): IntegrationPlan => {
    const services: Service[] = parserData.services.map((service: any) => ({
      name: service.name,
      type: service.type,
      endpoints: service.endpoints,
      mandatory: service.mandatory,
      confidence: service.confidence || 85, // Use AI confidence or default
      description: `${service.type} service for ${service.name.toLowerCase()}`
    }));
    
    const dependencies: Dependency[] = [];
    const dataFlow: DataFlow[] = [];
    const authRequirements: AuthRequirement[] = [];
    
    // Generate dependencies
    if (services.length > 1) {
      services.forEach((service, index) => {
        if (index < services.length - 1) {
          dependencies.push({
            service: service.name,
            depends_on: services[index + 1].name,
            type: 'sequential',
            description: `${service.name} depends on ${services[index + 1].name} completion`
          });
        }
      });
    }
    
    // Generate data flow
    services.forEach((service) => {
      service.endpoints.forEach(endpoint => {
        endpoint.request_fields.forEach(field => {
          dataFlow.push({
            from_service: 'User Input',
            to_service: service.name,
            data_fields: [field],
            trigger: 'immediate' as const
          });
        });
      });
    });
    
    // Generate auth requirements
    parserData.services.forEach((service: any) => {
      authRequirements.push({
        service: service.name,
        auth_type: service.authentication,
        description: `${service.authentication} for ${service.name}`
      });
    });
    
    return {
      integration_plan: {
        services,
        dependencies,
        dataFlow,
        auth_requirements: authRequirements
      },
      confidence_score: Math.min(95, services.reduce((sum, s) => sum + s.confidence, 0) / services.length),
      processing_metadata: {
        timestamp: new Date().toISOString(),
        parser_version: '2.0.0',
        processing_time: Date.now() - Date.now()
      }
    };
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 85) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  // Update service in the plan
  const updateService = (index: number, field: keyof Service, value: any) => {
    if (!integrationPlan) return;
    
    const updatedServices = [...integrationPlan.integration_plan.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    setIntegrationPlan({
      ...integrationPlan,
      integration_plan: {
        ...integrationPlan.integration_plan,
        services: updatedServices
      }
    });
  };

  // Add new service
  const addService = () => {
    if (!integrationPlan) return;
    
    const newService: Service = {
      name: '',
      type: '',
      endpoints: [
        {
          url: '',
          method: 'POST',
          request_fields: [],
          response_fields: [],
          description: ''
        }
      ],
      mandatory: false,
      confidence: 50,
      description: ''
    };
    
    setIntegrationPlan({
      ...integrationPlan,
      integration_plan: {
        ...integrationPlan.integration_plan,
        services: [...integrationPlan.integration_plan.services, newService]
      }
    });
  };

  // Save changes to state
  const saveChanges = () => {
    if (!integrationPlan) return;
    
    // Store in global state for use in other components
    const parsedData = {
      services_detected: integrationPlan.integration_plan.services.map(s => s.name),
      fields_detected: integrationPlan.integration_plan.services.flatMap(s => 
        s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
      ),
      mandatory_services: integrationPlan.integration_plan.services.filter(s => s.mandatory).map(s => s.name),
      optional_services: integrationPlan.integration_plan.services.filter(s => !s.mandatory).map(s => s.name),
      confidence_score: integrationPlan.confidence_score,
      processing_details: {
        service_matches: {},
        field_matches: {},
        total_service_keywords_found: integrationPlan.integration_plan.services.length,
        total_field_keywords_found: integrationPlan.integration_plan.services.flatMap(s => 
          s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
        ).length
      },
      metadata: {
        parser_version: integrationPlan.processing_metadata.parser_version,
        processing_method: 'ai_enhanced_pipeline',
        language: 'en'
      },
      integration_plan: integrationPlan
    };
    
    actions.setParsedData(parsedData);
    
    // Show success message
    alert('Changes saved successfully! Your updated integration plan has been stored.');
  };

  // Reset to original parsed data
  const resetToOriginal = () => {
    // This would reset to the originally parsed data
    // For now, we'll reload the page
    window.location.reload();
  };

  // Remove service
  const removeService = (index: number) => {
    if (!integrationPlan) return;
    
    const updatedServices = integrationPlan.integration_plan.services.filter((_, i) => i !== index);
    
    setIntegrationPlan({
      ...integrationPlan,
      integration_plan: {
        ...integrationPlan.integration_plan,
        services: updatedServices
      }
    });
  };

  // Send to Integration Registry
  const sendToIntegrationRegistry = async () => {
    if (!integrationPlan) return;
    
    // Convert to the format expected by the existing system
    const parsedData = {
      services_detected: integrationPlan.integration_plan.services.map(s => s.name),
      fields_detected: integrationPlan.integration_plan.services.flatMap(s => 
        s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
      ),
      mandatory_services: integrationPlan.integration_plan.services.filter(s => s.mandatory).map(s => s.name),
      optional_services: integrationPlan.integration_plan.services.filter(s => !s.mandatory).map(s => s.name),
      confidence_score: integrationPlan.confidence_score,
      processing_details: {
        service_matches: {},
        field_matches: {},
        total_service_keywords_found: integrationPlan.integration_plan.services.length,
        total_field_keywords_found: integrationPlan.integration_plan.services.flatMap(s => 
          s.endpoints.flatMap(e => [...e.request_fields, ...e.response_fields])
        ).length
      },
      metadata: {
        parser_version: integrationPlan.processing_metadata.parser_version,
        processing_method: 'ai_enhanced_pipeline',
        language: 'en'
      },
      integration_plan: integrationPlan
    };
    
    // Store in global state for use in Integration Registry
    actions.setParsedData(parsedData);
    
    // Store with unique ID for backend persistence
    const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in localStorage for persistence
    localStorage.setItem('currentIntegrationConfig', JSON.stringify({
      id: configId,
      data: parsedData,
      timestamp: new Date().toISOString(),
      parserId: parserId
    }));
    
    // Also save to backend storage
    try {
      const saveResponse = await fetch('http://localhost:5001/api/storage/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: configId,
          parserId: parserId,
          data: parsedData,
          timestamp: new Date().toISOString()
        })
      });
      
      if (saveResponse.ok) {
        // Configuration saved successfully
      } else {
        // Failed to save to backend storage, continuing with local storage
      }
    } catch (error) {
      // Backend storage error
    }
    
    // Configuration saved successfully
    
    // Navigate to Integration Registry
    navigate('/registry');
  };

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'identity':
        return BeakerIcon;
      case 'tax':
        return ServerIcon;
      case 'payment':
        return CreditCardIcon;
      default:
        return CogIcon;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'identity':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tax':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Requirement Parsing Engine</h1>
          <p className="text-gray-600">Convert unstructured documents into structured integration configuration</p>
          {parserId && (
            <p className="text-sm text-gray-500 mt-1">Parser ID: {parserId}</p>
          )}
        </div>

        {/* Processing Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {processingSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isProcessing && processingStage === step.stage
                        ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                        : processingSteps.findIndex(s => s.stage === processingStage) > index
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {processingSteps.findIndex(s => s.stage === processingStage) > index ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : isProcessing && processingStage === step.stage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isProcessing && processingStage === step.stage
                        ? 'text-blue-600'
                        : processingSteps.findIndex(s => s.stage === processingStage) > index
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < processingSteps.length - 1 && (
                  <div className={`flex-1 mx-4 h-1 ${
                    processingSteps.findIndex(s => s.stage === processingStage) > index ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Processing Progress */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing...</span>
                <span className="text-sm text-gray-500">{Math.round(processingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              {/* Upload Progress */}
              {processingStage === 'upload' && uploadProgress > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Uploading file...</span>
                    <span className="text-sm text-blue-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Integration Plan</h2>
              <p className="text-gray-600 mb-6">
                Upload and parse your integration requirements document to extract structured services and endpoints.
              </p>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="space-y-4">
                    <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-blue-600" />
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
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={processDocument}
                  disabled={!uploadedFile || isProcessing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Start Processing
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && integrationPlan && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Integration Plan Ready</h2>
                    <p className="text-gray-600">
                      Found {integrationPlan.integration_plan.services.length} services with {integrationPlan.confidence_score}% confidence
                    </p>
                  </div>
                  <button
                    onClick={addService}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Service
                  </button>
                </div>
              </div>

              {/* Services List */}
              {integrationPlan.integration_plan.services.map((service, index) => (
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
                          className={`text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1 ${
                            service.mandatory ? 'font-bold text-red-700' : ''
                          }`}
                          placeholder="Service Name"
                        />
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getServiceColor(service.type)}`}>
                          {service.type}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          service.mandatory 
                            ? 'bg-red-100 text-red-800 border border-red-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {service.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                        </span>
                        <div className={`px-3 py-1 text-xs font-medium rounded-full ${getConfidenceColor(service.confidence)}`}>
                          {service.confidence}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={service.confidence}
                              onChange={(e) => updateService(index, 'confidence', parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">{service.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={service.type}
                            onChange={(e) => updateService(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select type</option>
                            <option value="identity">Identity</option>
                            <option value="tax">Tax</option>
                            <option value="payment">Payment</option>
                            <option value="communication">Communication</option>
                            <option value="security">Security</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={service.mandatory}
                            onChange={(e) => updateService(index, 'mandatory', e.target.checked)}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700">Mandatory</label>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={service.description || ''}
                          onChange={(e) => updateService(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Service description"
                        />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Structured JSON Output - Cards View */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Integration Services</h2>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Total: <span className="font-bold text-gray-900">{integrationPlan.integration_plan.services.length}</span>
                      </span>
                      <span className="text-red-600">
                        Mandatory: <span className="font-bold text-red-700">
                          {integrationPlan.integration_plan.services.filter(s => s.mandatory).length}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Optional: <span className="font-bold text-gray-900">
                          {integrationPlan.integration_plan.services.filter(s => !s.mandatory).length}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(integrationPlan, null, 2))}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <CodeBracketIcon className="w-4 h-4 mr-1" />
                    Copy JSON
                  </button>
                </div>
                
                <div className="space-y-4">
                  {integrationPlan.integration_plan.services.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className={`text-md font-semibold ${
                            service.mandatory ? 'text-red-700 font-bold' : 'text-gray-900'
                          }`}>
                            {service.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceColor(service.type)}`}>
                            {service.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            service.mandatory 
                              ? 'bg-red-100 text-red-800 border border-red-300' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {service.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 text-xs font-medium rounded-full ${getConfidenceColor(service.confidence)}`}>
                            {service.confidence}% Confidence
                          </div>
                          <span className={`text-xs font-medium ${
                            service.confidence >= 85 ? 'text-green-600' :
                            service.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {getConfidenceLabel(service.confidence)} AI Certainty
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Authentication</p>
                          <p className="text-sm text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                            {integrationPlan.integration_plan.auth_requirements.find(req => req.service === service.name)?.auth_type || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                          <p className="text-sm text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                            {service.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Endpoints</p>
                        <div className="space-y-2">
                          {service.endpoints.map((endpoint, endpointIndex) => (
                            <div key={endpointIndex} className="bg-white rounded border border-gray-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="text"
                                  value={endpoint.url}
                                  onChange={(e) => {
                                    const updatedEndpoints = [...service.endpoints];
                                    updatedEndpoints[endpointIndex] = { 
                                      ...endpoint, 
                                      url: e.target.value 
                                    };
                                    updateService(index, 'endpoints', updatedEndpoints);
                                  }}
                                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                                    service.mandatory ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                  }`}
                                  placeholder="/api/endpoint"
                                />
                                <select
                                  value={endpoint.method}
                                  onChange={(e) => {
                                    const updatedEndpoints = [...service.endpoints];
                                    updatedEndpoints[endpointIndex] = { 
                                      ...endpoint, 
                                      method: e.target.value 
                                    };
                                    updateService(index, 'endpoints', updatedEndpoints);
                                  }}
                                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    service.mandatory ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  <option value="GET">GET</option>
                                  <option value="POST">POST</option>
                                  <option value="PUT">PUT</option>
                                  <option value="DELETE">DELETE</option>
                                </select>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Request Fields</p>
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                      service.mandatory ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                    }`}
                                    placeholder="field1, field2, field3"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Response Fields</p>
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                      service.mandatory ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                    }`}
                                    placeholder="field1, field2, field3"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex justify-between mt-2">
                                <button
                                  onClick={() => {
                                    const updatedEndpoints = [...service.endpoints];
                                    updatedEndpoints.splice(endpointIndex, 1);
                                    updateService(index, 'endpoints', updatedEndpoints);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove Endpoint
                                </button>
                                <button
                                  onClick={() => {
                                    const updatedEndpoints = [...service.endpoints];
                                    const newEndpoint = {
                                      url: '',
                                      method: 'POST',
                                      request_fields: [],
                                      response_fields: []
                                    };
                                    updatedEndpoints.splice(endpointIndex + 1, 0, newEndpoint);
                                    updateService(index, 'endpoints', updatedEndpoints);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Add Endpoint
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    onClick={resetToOriginal}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Reset
                  </button>
                  <button
                    onClick={saveChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                </div>
                <button
                  onClick={sendToIntegrationRegistry}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  Proceed to Integration Registry
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

export default RequirementParser;
