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
  ServerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import ConfidenceVisualization from '../components/ConfidenceVisualization';

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
}

interface Dependency {
  service: string;
  depends_on: string;
  type: string;
  critical: boolean;
}

interface DataFlow {
  source: string;
  target: string;
  data_type: string;
  frequency: string;
}

interface AuthRequirement {
  service: string;
  auth_type: string;
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
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  const processingSteps = [
    { id: 1, name: 'Upload', stage: 'upload' as const, description: 'Upload your requirements document' },
    { id: 2, name: 'AI Processing', stage: 'ai_extraction' as const, description: 'AI-powered requirement extraction' },
    { id: 3, name: 'Validation', stage: 'parsing' as const, description: 'Validate and structure requirements' },
    { id: 4, name: 'Output Ready', stage: 'output_ready' as const, description: 'Review and edit extracted data' }
  ];

  const handleFileUpload = useCallback((file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/json'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, TXT, or JSON file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    setParserId(`parser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

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

  // Process document through the new AI pipeline
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
      formData.append('document', uploadedFile);
      formData.append('format', 'detailed');
      formData.append('includeExplanations', 'true');
      formData.append('includeMetrics', 'true');

      // Upload and process through pipeline
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseError) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });

        xhr.open('POST', 'http://localhost:5001/api/pipeline/process');
        xhr.send(formData);
      });

      const uploadResult = await uploadPromise;
      setUploadProgress(0);
      setProcessingStage('ai_extraction');

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Pipeline processing failed');
      }

      // Convert pipeline result to our format
      const pipelineData = uploadResult.data;
      const integrationPlan = convertPipelineToIntegrationPlan(pipelineData);
      setIntegrationPlan(integrationPlan);
      setProcessingStage('complete');
      setPipelineResult(pipelineData);
      setCurrentStep(3);

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessingStage('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert pipeline result to integration plan format
  const convertPipelineToIntegrationPlan = (pipelineData: any): IntegrationPlan => {
    const data = pipelineData.data || pipelineData;
    const services = data.integration_plan?.services || [];
    
    return {
      integration_plan: {
        services: services.map((service: any) => ({
          name: service.name,
          type: service.type || 'other',
          endpoints: service.endpoints || [],
          mandatory: service.mandatory || false,
          confidence: service.confidence || 0.5,
          description: service.description || ''
        })),
        dependencies: data.integration_plan?.dependencies || [],
        dataFlow: data.integration_plan?.data_flow || [],
        auth_requirements: data.integration_plan?.authentication || []
      },
      confidence_score: data.metadata?.confidence_score || 0.5,
      processing_metadata: {
        timestamp: data.metadata?.generated_at || new Date().toISOString(),
        parser_version: data.metadata?.version || '2.0',
        processing_time: data.metadata?.processing_time || 0
      }
    };
  };

  const handleReprocess = async () => {
    if (!pipelineResult) return;
    
    setIsProcessing(true);
    setProcessingStage('parsing');

    try {
      const response = await fetch('http://localhost:5001/api/pipeline/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalInput: uploadedFile?.name || 'text_input',
          previousResult: pipelineResult,
          options: {
            format: 'detailed',
            includeExplanations: true,
            maxRetries: 2
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        const integrationPlan = convertPipelineToIntegrationPlan(result.data);
        setIntegrationPlan(integrationPlan);
        setPipelineResult(result.data);
        setProcessingStage('complete');
      } else {
        throw new Error(result.error || 'Reprocessing failed');
      }

    } catch (err) {
      console.error('Reprocessing error:', err);
      setError(err instanceof Error ? err.message : 'Reprocessing failed');
      setProcessingStage('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExplain = async () => {
    if (!pipelineResult) return;

    try {
      const response = await fetch('http://localhost:5001/api/pipeline/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: pipelineResult,
          question: 'Explain the key findings and recommendations'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.explanation.overview + '\n\nKey Findings:\n' + result.explanation.key_findings.join('\n'));
      }

    } catch (err) {
      console.error('Explanation error:', err);
      setError('Failed to generate explanation');
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      kyc: ShieldCheckIcon,
      payment: CreditCardIcon,
      gst: DocumentTextIcon,
      fraud: ShieldCheckIcon,
      notification: DocumentTextIcon,
      audit: ChartBarIcon
    };
    
    return iconMap[serviceType.toLowerCase()] || ServerIcon;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleNext = () => {
    if (currentStep < processingSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setIntegrationPlan(null);
    setError('');
    setProcessingStage('upload');
    setPipelineResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Requirement Parsing Engine
            </h1>
            <p className="text-gray-600">
              Upload your requirements document for automated integration analysis
            </p>
          </div>

          {/* Processing Steps */}
          <div className="flex justify-between items-center mb-8">
            {processingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep > index ? 'bg-green-500' : 
                  currentStep === index + 1 ? 'bg-blue-500' : 'bg-gray-300'
                } text-white font-semibold`}>
                  {currentStep > index ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-2">
                  <p className={`text-sm font-medium ${
                    currentStep >= index + 1 ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < processingSteps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your document here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports PDF, DOCX, TXT, and JSON files up to 10MB
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.docx,.txt,.json"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                    Select File
                  </label>
                </div>

                {uploadedFile && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-8 h-8 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={processDocument}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Process Document'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && isProcessing && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {processingStage === 'upload' && 'Uploading document...'}
                  {processingStage === 'ai_extraction' && 'AI processing...'}
                  {processingStage === 'parsing' && 'Structuring requirements...'}
                </p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && integrationPlan && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Integration Plan</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReprocess}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Re-process
                    </button>
                    <button
                      onClick={handleExplain}
                      className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Explain
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Services</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {integrationPlan.integration_plan.services.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Mandatory</p>
                    <p className="text-2xl font-bold text-green-900">
                      {integrationPlan.integration_plan.services.filter(s => s.mandatory).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Confidence</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.round(integrationPlan.confidence_score * 100)}%
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Processing Time</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {integrationPlan.processing_metadata.processing_time}ms
                    </p>
                  </div>
                </div>

                {/* Confidence Visualization */}
                <ConfidenceVisualization 
                  data={{
                    services: integrationPlan.integration_plan.services,
                    overall_confidence: integrationPlan.confidence_score,
                    processing_metrics: pipelineResult?.output?.metrics?.quality_metrics
                  }}
                />

                {/* Services */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Services</h3>
                  <div className="space-y-3">
                    {integrationPlan.integration_plan.services.map((service, index) => {
                      const IconComponent = getServiceIcon(service.type);
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <IconComponent className="w-6 h-6 text-blue-500 mr-3 mt-1" />
                              <div>
                                <h4 className="font-medium text-gray-900">{service.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    service.mandatory 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {service.mandatory ? 'Mandatory' : 'Optional'}
                                  </span>
                                  <span className={getConfidenceColor(service.confidence)}>
                                    {Math.round(service.confidence * 100)}% confidence
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <button
                    onClick={handlePrevious}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => navigate('/create')}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Continue to Configuration
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RequirementParser;
