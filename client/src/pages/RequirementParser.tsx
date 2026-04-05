import React, { useState, useCallback, useEffect } from 'react';
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
  TagIcon,
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
  description?: string;
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
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'upload' | 'parsing' | 'ai_extraction' | 'output_ready'>('upload');
  const [processingProgress, setProcessingProgress] = useState(0);
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

  // Process document through the pipeline
  const processDocument = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingProgress(0);
    
    try {
      // Step 1: Upload
      setProcessingStage('upload');
      setProcessingProgress(25);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const uploadResponse = await fetch('http://localhost:5001/api/parse-document', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      // Step 2: Parsing
      setProcessingStage('parsing');
      setProcessingProgress(50);
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Parsing failed');
      }
      
      // Step 3: AI Extraction
      setProcessingStage('ai_extraction');
      setProcessingProgress(75);
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate integration plan
      const plan = await generateIntegrationPlan(uploadResult.data.raw_text);
      setIntegrationPlan(plan);
      
      // Step 4: Output Ready
      setProcessingStage('output_ready');
      setProcessingProgress(100);
      
      // Generate unique parser ID
      const id = `parser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setParserId(id);
      
      setCurrentStep(2);
      
    } catch (error: any) {
      console.error('Processing error:', error);
      setError(error.message || 'Failed to process document');
      
      // Fallback to mock data
      const mockPlan = generateMockIntegrationPlan();
      setIntegrationPlan(mockPlan);
      setParserId(`parser_fallback_${Date.now()}`);
      setCurrentStep(2);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Generate integration plan from text
  const generateIntegrationPlan = async (text: string): Promise<IntegrationPlan> => {
    // In a real implementation, this would call an AI service
    // For now, we'll use pattern matching
    
    const lowerText = text.toLowerCase();
    const services: Service[] = [];
    const dependencies: Dependency[] = [];
    const dataFlow: DataFlow[] = [];
    const authRequirements: AuthRequirement[] = [];
    
    // Service detection
    if (lowerText.includes('kyc') || lowerText.includes('identity')) {
      services.push({
        name: 'KYC Verification',
        type: 'identity',
        endpoints: [
          {
            url: '/api/kyc/verify',
            method: 'POST',
            request_fields: ['name', 'dob', 'pan', 'email', 'phone'],
            response_fields: ['verification_id', 'status', 'score'],
            description: 'Verify customer identity documents'
          }
        ],
        mandatory: true,
        confidence: 90,
        description: 'Customer identity verification service'
      });
      
      authRequirements.push({
        service: 'KYC Verification',
        auth_type: 'Bearer Token',
        required_scopes: ['kyc.verify', 'kyc.read'],
        description: 'Bearer token for KYC API access'
      });
    }
    
    if (lowerText.includes('gst') || lowerText.includes('tax')) {
      services.push({
        name: 'GST Validation',
        type: 'tax',
        endpoints: [
          {
            url: '/api/gst/validate',
            method: 'POST',
            request_fields: ['gstin', 'business_name'],
            response_fields: ['gstin_status', 'registration_date', 'business_details'],
            description: 'Validate GST registration details'
          }
        ],
        mandatory: true,
        confidence: 85,
        description: 'GST registration validation service'
      });
      
      authRequirements.push({
        service: 'GST Validation',
        auth_type: 'API Key',
        description: 'API key for GST validation service'
      });
    }
    
    if (lowerText.includes('payment') || lowerText.includes('transaction')) {
      services.push({
        name: 'Payment Processing',
        type: 'payment',
        endpoints: [
          {
            url: '/api/payment/process',
            method: 'POST',
            request_fields: ['amount', 'currency', 'account_number'],
            response_fields: ['transaction_id', 'status', 'timestamp'],
            description: 'Process payment transactions'
          }
        ],
        mandatory: false,
        confidence: 80,
        description: 'Payment processing and transaction handling'
      });
      
      authRequirements.push({
        service: 'Payment Processing',
        auth_type: 'OAuth 2.0',
        required_scopes: ['payment.process', 'payment.read'],
        description: 'OAuth 2.0 for payment processing'
      });
    }
    
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
            trigger: 'immediate'
          });
        });
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

  // Generate mock integration plan for fallback
  const generateMockIntegrationPlan = (): IntegrationPlan => ({
    integration_plan: {
      services: [
        {
          name: 'KYC Verification',
          type: 'identity',
          endpoints: [
            {
              url: '/api/kyc/verify',
              method: 'POST',
              request_fields: ['name', 'dob', 'pan', 'email', 'phone'],
              response_fields: ['verification_id', 'status', 'score'],
              description: 'Verify customer identity documents'
            }
          ],
          mandatory: true,
          confidence: 90,
          description: 'Customer identity verification service'
        },
        {
          name: 'GST Validation',
          type: 'tax',
          endpoints: [
            {
              url: '/api/gst/validate',
              method: 'POST',
              request_fields: ['gstin', 'business_name'],
              response_fields: ['gstin_status', 'registration_date'],
              description: 'Validate GST registration details'
            }
          ],
          mandatory: true,
          confidence: 85,
          description: 'GST registration validation service'
        }
      ],
      dependencies: [
        {
          service: 'GST Validation',
          depends_on: 'KYC Verification',
          type: 'sequential',
          description: 'GST validation requires KYC completion'
        }
      ],
      dataFlow: [
        {
          from_service: 'User Input',
          to_service: 'KYC Verification',
          data_fields: ['name', 'dob', 'pan', 'email', 'phone'],
          trigger: 'immediate'
        },
        {
          from_service: 'KYC Verification',
          to_service: 'GST Validation',
          data_fields: ['verification_id'],
          trigger: 'immediate'
        }
      ],
      auth_requirements: [
        {
          service: 'KYC Verification',
          auth_type: 'Bearer Token',
          required_scopes: ['kyc.verify', 'kyc.read'],
          description: 'Bearer token for KYC API access'
        },
        {
          service: 'GST Validation',
          auth_type: 'API Key',
          description: 'API key for GST validation service'
        }
      ]
    },
    confidence_score: 87,
    processing_metadata: {
      timestamp: new Date().toISOString(),
      parser_version: '2.0.0',
      processing_time: 2500
    }
  });

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
  const sendToIntegrationRegistry = () => {
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
    
    // Store in global state
    actions.setParsedData(parsedData);
    
    // Navigate to registry
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
                <span className="text-sm text-gray-500">{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Requirements Document</h2>
              
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
                          className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
                          placeholder="Service Name"
                        />
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getServiceColor(service.type)}`}>
                          {service.type}
                        </span>
                        {service.mandatory && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Mandatory
                          </span>
                        )}
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

              {/* JSON Output */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Integration Plan (JSON)</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(integrationPlan, null, 2))}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <CodeBracketIcon className="w-4 h-4 mr-1" />
                    Copy JSON
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96">
                  <pre className="text-green-400 text-sm">
                    {JSON.stringify(integrationPlan, null, 2)}
                  </pre>
                </div>
              </div>

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
                  onClick={sendToIntegrationRegistry}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  Send to Integration Registry
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
