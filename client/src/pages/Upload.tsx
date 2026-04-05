import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentArrowUpIcon,
  ClipboardDocumentIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

const Upload: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [documentText, setDocumentText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Navigation guards - if data exists, redirect to appropriate step
  React.useEffect(() => {
    if (state.finalConfig) {
      navigate('/simulation');
      return;
    }
    if (state.mappings && Object.keys(state.mappings).length > 0) {
      navigate('/config');
      return;
    }
    if (state.selectedAdapters && state.selectedAdapters.length > 0) {
      navigate('/mapping');
      return;
    }
    if (state.schemas && Object.keys(state.schemas).length > 0) {
      navigate('/mapping');
      return;
    }
    if (state.parsedData) {
      navigate('/dashboard');
      return;
    }
  }, [state, navigate]);

  const sampleText = `This system must integrate KYC and GST verification APIs. The KYC integration should support name, dob, PAN. GST should validate GSTIN. Payment processing is required.`;

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      setError('Please enter or paste your document text');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Mock parsing result as specified
      const mockResult = {
        services_detected: ["KYC", "GST", "Payments"],
        fields_detected: ["name", "dob", "pan", "gstin"],
        mandatory_services: ["KYC", "GST"],
        optional_services: ["Payments"],
        confidence_score: 85,
        processing_details: {
          service_matches: {
            'KYC': ['kyc', 'verification', 'identity'],
            'GST': ['gst', 'tax', 'registration'],
            'Payments': ['payment', 'transaction', 'amount']
          },
          field_matches: {
            'name': ['name', 'fullname'],
            'dob': ['dob', 'birth', 'date'],
            'pan': ['pan', 'pannumber'],
            'gstin': ['gstin', 'gst']
          },
          total_service_keywords_found: 6,
          total_field_keywords_found: 4
        },
        metadata: {
          parser_version: '1.0.0',
          processing_method: 'keyword_matching_rule_based',
          language: 'en'
        }
      };
      
      // Store parsed data in global state
      console.log('📝 Upload - Generated Parsed Data:', mockResult);
      actions.setParsedData(mockResult);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = () => {
    setDocumentText(sampleText);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4"
        >
          <DocumentArrowUpIcon className="w-8 h-8 text-primary-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Requirements Document
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Paste your Business Requirements Document (BRD) and let our AI analyze and extract integration requirements.
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Document Text
            </label>
            <button
              onClick={handleLoadSample}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              <ClipboardDocumentIcon className="w-4 h-4 mr-1 inline" />
              Load Sample
            </button>
          </div>
          
          <textarea
            value={documentText}
            onChange={(e) => {
              setDocumentText(e.target.value);
              setError('');
            }}
            placeholder="Paste your BRD text here... 
Example: 'This system must integrate KYC and GST verification APIs...'"
            className="input-field h-64 resize-none"
          />
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !documentText.trim()}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Analyze Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-6 bg-white rounded-lg border border-gray-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
          <p className="text-sm text-gray-600">
            Advanced NLP extracts services and requirements automatically
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center p-6 bg-white rounded-lg border border-gray-200"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DocumentArrowUpIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Detection</h3>
          <p className="text-sm text-gray-600">
            Identifies KYC, GST, Payment, and other integration needs
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center p-6 bg-white rounded-lg border border-gray-200"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardDocumentIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Instant Results</h3>
          <p className="text-sm text-gray-600">
            Get parsed insights and suggested configurations in seconds
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Upload;
