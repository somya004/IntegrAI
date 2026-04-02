// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { ParsedDocument } from '../types/config';

interface DashboardProps {
  data: ParsedDocument | null;
  onNext: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNext }) => {
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available. Please upload a document first.</p>
      </div>
    );
  }

  const getServiceIcon = (serviceName: string) => {
    const icons: { [key: string]: string } = {
      'KYC': '🔍',
      'GST': '📋',
      'Payment': '💳',
      'Fraud': '🛡️',
      'Compliance': '⚖️'
    };
    return icons[serviceName] || '📦';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
        >
          <EyeIcon className="w-8 h-8 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Parsed Insights
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered analysis of your requirements document
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Services Detected</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalDetected}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Mandatory</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.mandatoryServices}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Requirements</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalRequirements}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">AI</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(data.services.reduce((sum, s) => sum + s.confidence, 0) / data.services.length)}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detected Services */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Detected Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getServiceIcon(service.name)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(service.confidence)}`}>
                      {service.confidence}% confidence
                    </span>
                  </div>
                </div>
                {service.mandatory && (
                  <span className="status-badge status-error">Mandatory</span>
                )}
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Keywords found:</p>
                <div className="flex flex-wrap gap-1">
                  {service.keywords.map((keyword, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      {data.requirements.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Extracted Requirements</h2>
          <div className="space-y-4">
            {data.requirements.map((req, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{req.text}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="status-badge status-info">{req.type}</span>
                      <span className="status-badge status-warning">{req.category}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          className="btn-primary px-8 py-3 text-lg"
        >
          Continue to Builder →
        </button>
      </div>
    </motion.div>
  );
};

export default Dashboard;
