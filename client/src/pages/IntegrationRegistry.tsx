import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Service } from '../types/config';

interface IntegrationRegistryProps {
  onServiceSelect: (service: Service, version: string) => void;
}

const IntegrationRegistry: React.FC<IntegrationRegistryProps> = ({ onServiceSelect }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with default services
    const defaultServices: Service[] = [
      {
        name: 'KYC Provider',
        confidence: 0.95,
        mandatory: true,
        keywords: ['kyc', 'verification', 'identity', 'customer'],
        versions: ['v1', 'v2', 'v3'],
        status: 'active',
        endpoint: '/api/kyc/verify',
        description: 'Know Your Customer verification service for identity validation'
      },
      {
        name: 'GST API',
        confidence: 0.90,
        mandatory: true,
        keywords: ['gst', 'tax', 'india', 'gstin'],
        versions: ['v1', 'v2'],
        status: 'active',
        endpoint: '/api/gst/validate',
        description: 'Goods and Services Tax validation for Indian businesses'
      },
      {
        name: 'Payment Gateway',
        confidence: 0.92,
        mandatory: true,
        keywords: ['payment', 'transaction', 'gateway', 'upi'],
        versions: ['v1', 'v2', 'v3'],
        status: 'active',
        endpoint: '/api/payment/process',
        description: 'Secure payment processing gateway for multiple payment methods'
      },
      {
        name: 'Fraud Detection API',
        confidence: 0.88,
        mandatory: false,
        keywords: ['fraud', 'detection', 'risk', 'security'],
        versions: ['v1'],
        status: 'active',
        endpoint: '/api/fraud/detect',
        description: 'Advanced fraud detection and risk assessment service'
      },
      {
        name: 'Credit Bureau API',
        confidence: 0.85,
        mandatory: false,
        keywords: ['bureau', 'credit', 'score', 'cibil'],
        versions: ['v1'],
        status: 'deprecated',
        endpoint: '/api/bureau/score',
        description: 'Credit bureau score checking service (Legacy)'
      }
    ];
    
    setServices(defaultServices);
    setLoading(false);
  }, []);

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    // Reset version when service changes
    setSelectedVersion('');
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
  };

  const handleConfirmSelection = () => {
    if (selectedService && selectedVersion) {
      const service = services.find(s => s.name === selectedService);
      if (service) {
        onServiceSelect(service, selectedVersion);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'deprecated':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <CogIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'deprecated':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading integration registry...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Registry</h1>
        <p className="text-gray-600">Select and configure integration services for your enterprise needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl cursor-pointer ${
              selectedService === service.name
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-300'
            }`}
            onClick={() => handleServiceSelect(service.name)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ServerIcon className="w-6 h-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(service.status || 'active')}
                  <span className={getStatusBadge(service.status || 'active')}>
                    {service.status || 'active'}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{service.description}</p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Versions:</span>
                  <div className="flex space-x-1">
                    {service.versions?.map((version) => (
                      <span
                        key={version}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {version}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Confidence:</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(service.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {Math.round((service.confidence || 0) * 100)}%
                  </span>
                </div>
                {service.mandatory && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    Required
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Service Configuration Panel */}
      {selectedService && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configure {selectedService}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Version
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => handleVersionSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a version...</option>
                {services
                  .find(s => s.name === selectedService)
                  ?.versions?.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Details
              </label>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={getStatusBadge(
                      services.find(s => s.name === selectedService)?.status || 'active'
                    )}>
                      {services.find(s => s.name === selectedService)?.status || 'active'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Endpoint:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {services.find(s => s.name === selectedService)?.endpoint || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mandatory:</span>
                    <span className={`text-sm font-medium ${
                      services.find(s => s.name === selectedService)?.mandatory
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {services.find(s => s.name === selectedService)?.mandatory ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => {
                setSelectedService('');
                setSelectedVersion('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedVersion}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default IntegrationRegistry;
