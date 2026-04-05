import React, { useState } from 'react';
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
  confidence: number;
}

interface ParsedRequirements {
  services: ExtractedService[];
  raw_text: string;
  confidence: number;
}

const CreateIntegration: React.FC = () => {
  const { state } = useAppContext();
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
  const handleFileUpload = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError('');
  };

  // Handle drag and drop
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

  // Upload and parse document
  const handleUploadAndParse = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setIsParsing(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload file with progress
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e: any) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Parse document
      const response = await new Promise<ParsedRequirements>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e: any) {
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
            name: 'KYC Verification Service',
            type: 'authentication',
            endpoints: [
              {
                url: '/api/kyc/verify',
                method: 'POST',
                request_fields: ['customer_id', 'document_type', 'document_data'],
                response_fields: ['verification_status', 'customer_details', 'confidence_score']
              }
            ],
            authentication: 'OAuth2',
            mandatory: true,
            confidence: 0.85
          }
        ],
        raw_text: 'Sample requirements document content...',
        confidence: 0.85
      };
      
      setParsedRequirements(mockData);
      setCurrentStep(2);
      
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  // Service management functions
  const addService = () => {
    const newService: ExtractedService = {
      name: 'New Service',
      type: 'api',
      endpoints: [],
      authentication: 'OAuth2',
      mandatory: false,
      confidence: 0
    };
    setParsedRequirements((prev: any) => ({
      ...prev,
      services: [...(prev?.services || []), newService]
    }));
  };

  const updateService = (index: number, service: ExtractedService) => {
    setParsedRequirements((prev: any) => ({
      ...prev,
      services: prev?.services?.map((s: any, i: any) => i === index ? service : s) || []
    }));
  };

  const removeService = (index: number) => {
    setParsedRequirements((prev: any) => ({
      ...prev,
      services: prev?.services?.filter((_: any, i: any) => i !== index) || []
    }));
  };

  const handleContinue = () => {
    navigate('/create-integration');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {state.parsedData ? (
          // Show integration UI directly using shared parsed data
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create Integration</h1>
              <p className="text-gray-600 mt-2">
                Using previously uploaded requirement document
              </p>
            </div>

            {/* User Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                <p className="text-blue-700">
                  Using previously uploaded requirement document
                </p>
              </div>
            </div>

            {/* Continue to Integration Setup */}
            <div className="text-center">
              <button
                onClick={handleContinue}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue to Integration Setup
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Show original upload UI when no parsed data exists
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create Integration</h1>
              <p className="text-gray-600 mt-2">
                Upload your requirements document to get started
              </p>
            </div>

            {/* Upload New Document Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/requirement-parser')}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Upload New Document
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateIntegration;
