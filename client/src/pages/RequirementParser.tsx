import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentArrowUpIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { ParseResult, ParsedRequirement } from '../types/config';

const RequirementParser: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Simulated AI parsing engine
  const parseDocument = useCallback(async (text: string, fileName: string): Promise<ParseResult> => {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const lines = text.split('\n');
    const requirements: ParsedRequirement[] = [];
    const errors: string[] = [];
    
    // Service detection patterns
    const servicePatterns = [
      { name: 'KYC Provider', keywords: ['kyc', 'know your customer', 'identity', 'verification', 'customer'], category: 'identity' },
      { name: 'GST API', keywords: ['gst', 'goods and services tax', 'gstin', 'tax'], category: 'taxation' },
      { name: 'Payment Gateway', keywords: ['payment', 'transaction', 'gateway', 'upi', 'neft', 'rtgs'], category: 'payment' },
      { name: 'Fraud Detection', keywords: ['fraud', 'detection', 'risk', 'security', 'aml'], category: 'security' },
      { name: 'Credit Bureau', keywords: ['bureau', 'credit', 'score', 'cibil', 'experian'], category: 'credit' }
    ];

    // Field detection patterns
    const fieldPatterns = [
      { name: 'fullName', type: 'string', keywords: ['full name', 'name', 'customer name'], required: true },
      { name: 'dateOfBirth', type: 'date', keywords: ['date of birth', 'dob', 'birth date'], required: true },
      { name: 'panNumber', type: 'string', keywords: ['pan', 'pan number', 'permanent account'], required: true },
      { name: 'email', type: 'string', keywords: ['email', 'email address', 'mail'], required: true },
      { name: 'phoneNumber', type: 'string', keywords: ['phone', 'mobile', 'contact number'], required: true },
      { name: 'address', type: 'string', keywords: ['address', 'location', 'residence'], required: false },
      { name: 'amount', type: 'number', keywords: ['amount', 'transaction amount', 'value'], required: false },
      { name: 'accountNumber', type: 'string', keywords: ['account', 'account number'], required: false },
      { name: 'ifscCode', type: 'string', keywords: ['ifsc', 'bank code'], required: false }
    ];

    // Endpoint detection patterns
    const endpointPatterns = [
      { name: 'kycVerify', method: 'POST', keywords: ['verify', 'validate', 'check'], category: 'identity' },
      { name: 'gstValidate', method: 'POST', keywords: ['validate', 'verify', 'check'], category: 'taxation' },
      { name: 'paymentProcess', method: 'POST', keywords: ['process', 'execute', 'initiate'], category: 'payment' },
      { name: 'fraudDetect', method: 'POST', keywords: ['detect', 'analyze', 'assess'], category: 'security' }
    ];

    // Parse services
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Detect services
      servicePatterns.forEach(service => {
        const matches = service.keywords.filter(keyword => lowerLine.includes(keyword));
        if (matches.length > 0) {
          const existingService = requirements.find(r => r.name === service.name && r.type === 'service');
          if (!existingService) {
            requirements.push({
              id: `service_${requirements.length}`,
              type: 'service',
              category: service.category,
              name: service.name,
              description: `${service.name} integration required`,
              required: service.name === 'KYC Provider' || service.name === 'GST API',
              dataType: 'object',
              confidence: Math.min(0.95, 0.7 + (matches.length * 0.1)),
              examples: [line.trim()],
              source: {
                lineNumber: index + 1,
                context: line.trim(),
                section: 'requirements'
              }
            });
          }
        }
      });

      // Detect fields
      fieldPatterns.forEach(field => {
        const matches = field.keywords.filter(keyword => lowerLine.includes(keyword));
        if (matches.length > 0) {
          const existingField = requirements.find(r => r.name === field.name && r.type === 'field');
          if (!existingField) {
            requirements.push({
              id: `field_${requirements.length}`,
              type: 'field',
              category: 'data',
              name: field.name,
              description: `${field.name} field for processing`,
              required: field.required,
              dataType: field.type,
              confidence: Math.min(0.9, 0.6 + (matches.length * 0.15)),
              validation: field.type === 'string' ? { minLength: 1, maxLength: 255 } : undefined,
              examples: [line.trim()],
              source: {
                lineNumber: index + 1,
                context: line.trim(),
                section: 'data'
              }
            });
          }
        }
      });

      // Detect endpoints
      endpointPatterns.forEach(endpoint => {
        const matches = endpoint.keywords.filter(keyword => lowerLine.includes(keyword));
        if (matches.length > 0) {
          const existingEndpoint = requirements.find(r => r.name === endpoint.name && r.type === 'endpoint');
          if (!existingEndpoint) {
            requirements.push({
              id: `endpoint_${requirements.length}`,
              type: 'endpoint',
              category: endpoint.category,
              name: endpoint.name,
              description: `${endpoint.name} API endpoint`,
              required: true,
              dataType: 'object',
              confidence: Math.min(0.85, 0.5 + (matches.length * 0.2)),
              examples: [line.trim()],
              source: {
                lineNumber: index + 1,
                context: line.trim(),
                section: 'api'
              }
            });
          }
        }
      });
    });

    // Categorize requirements
    const services = requirements.filter(r => r.type === 'service');
    const endpoints = requirements.filter(r => r.type === 'endpoint');
    const fields = requirements.filter(r => r.type === 'field');

    // Determine document type
    const lowerText = text.toLowerCase();
    const docType = lowerText.includes('business requirement') ? 'BRD' : 
                   lowerText.includes('statement of work') ? 'SOW' : 'API_SPEC';

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      document: {
        name: fileName,
        type: docType,
        size: text.length,
        pages: Math.ceil(lines.length / 50)
      },
      parsedAt: new Date().toISOString(),
      processingTime,
      services,
      endpoints,
      fields,
      summary: {
        totalServices: services.length,
        mandatoryServices: services.filter(s => s.required).length,
        totalEndpoints: endpoints.length,
        totalFields: fields.length,
        confidence: requirements.reduce((acc, r) => acc + r.confidence, 0) / requirements.length
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }, []);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    if (uploadedFile) {
      setFile(uploadedFile);
      
      const text = await uploadedFile.text();
      setDocumentText(text);
      
      setIsParsing(true);
      try {
        const result = await parseDocument(text, uploadedFile.name);
        setParseResult(result);
      } catch (error) {
        console.error('Parsing error:', error);
        setParseResult({
          success: false,
          document: {
            name: uploadedFile.name,
            type: 'BRD',
            size: text.length
          },
          parsedAt: new Date().toISOString(),
          processingTime: 0,
          services: [],
          endpoints: [],
          fields: [],
          summary: {
            totalServices: 0,
            mandatoryServices: 0,
            totalEndpoints: 0,
            totalFields: 0,
            confidence: 0
          },
          errors: ['Failed to parse document']
        });
      } finally {
        setIsParsing(false);
      }
    }
  }, [parseDocument]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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

  const handleTextSubmit = useCallback(async () => {
    if (documentText.trim()) {
      setIsParsing(true);
      try {
        const result = await parseDocument(documentText, 'text-input.txt');
        setParseResult(result);
      } catch (error) {
        console.error('Parsing error:', error);
      } finally {
        setIsParsing(false);
      }
    }
  }, [documentText, parseDocument]);

  const clearResults = useCallback(() => {
    setParseResult(null);
    setFile(null);
    setDocumentText('');
  }, []);

  const renderJSON = (obj: any, indent = 0) => {
    const json = JSON.stringify(obj, null, 2);
    return (
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{json}</code>
      </pre>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Requirement Parsing Engine</h1>
        <p className="text-gray-600">Upload BRD/SOW documents to extract API endpoints, fields, and service requirements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentArrowUpIcon className="w-6 h-6 mr-2 text-primary-600" />
            Document Upload
          </h2>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your document here
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports PDF, TXT, DOC files
            </p>
            <label className="inline-block">
              <span className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 cursor-pointer transition-colors">
                Choose File
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}

          {/* Text Input Area */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste document text:
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your BRD/SOW text here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!documentText.trim() || isParsing}
              className="mt-2 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isParsing ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Parsing...
                </div>
              ) : (
                'Parse Document'
              )}
            </button>
          </div>

          {parseResult && (
            <button
              onClick={clearResults}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Clear Results
            </button>
          )}
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CodeBracketIcon className="w-6 h-6 mr-2 text-primary-600" />
            Parsing Results
          </h2>

          {isParsing ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Parsing document with AI...</p>
            </div>
          ) : parseResult ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TableCellsIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-blue-900">Summary</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Services:</span>
                      <span className="font-medium text-blue-900">{parseResult.summary.totalServices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Mandatory:</span>
                      <span className="font-medium text-blue-900">{parseResult.summary.mandatoryServices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Endpoints:</span>
                      <span className="font-medium text-blue-900">{parseResult.summary.totalEndpoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Fields:</span>
                      <span className="font-medium text-blue-900">{parseResult.summary.totalFields}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Confidence:</span>
                      <span className="font-medium text-blue-900">
                        {(parseResult.summary.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-900">Document Info</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Type:</span>
                      <span className="font-medium text-green-900">{parseResult.document.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Size:</span>
                      <span className="font-medium text-green-900">{parseResult.document.size} chars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Pages:</span>
                      <span className="font-medium text-green-900">{parseResult.document.pages || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Processing:</span>
                      <span className="font-medium text-green-900">{parseResult.processingTime}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON Output */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CodeBracketIcon className="w-5 h-5 text-primary-600 mr-2" />
                  Structured Output (JSON)
                </h3>
                {renderJSON(parseResult)}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p>Upload a document or paste text to see parsing results</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RequirementParser;
