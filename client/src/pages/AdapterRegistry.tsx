import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  CogIcon,
  KeyIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Adapter {
  id: string;
  service: string;
  provider: string;
  version: string;
  endpoints: Record<string, string>;
  requiredFields: string[];
  authentication: {
    type: string;
    header: string;
  };
  rateLimit: {
    requests: number;
    period: string;
  };
  description: string;
}

interface GroupedAdapter {
  service: string;
  providers: {
    [provider: string]: {
      provider: string;
      versions: Array<{
        id: string;
        version: string;
        endpoints: Record<string, string>;
        requiredFields: string[];
        authentication: {
          type: string;
          header: string;
        };
        rateLimit: {
          requests: number;
          period: string;
        };
        description: string;
      }>;
    };
  };
}

const AdapterRegistry: React.FC = () => {
  const [adapters, setAdapters] = useState<GroupedAdapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  // Service icons
  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'kyc':
        return <BeakerIcon className="w-5 h-5" />;
      case 'gst':
        return <ServerIcon className="w-5 h-5" />;
      case 'payments':
        return <CreditCardIcon className="w-5 h-5" />;
      case 'fraud':
        return <ShieldCheckIcon className="w-5 h-5" />;
      default:
        return <CogIcon className="w-5 h-5" />;
    }
  };

  // Service colors
  const getServiceColor = (service: string) => {
    switch (service.toLowerCase()) {
      case 'kyc':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gst':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payments':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fraud':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fetch adapters
  useEffect(() => {
    fetchAdapters();
  }, []);

  const fetchAdapters = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5002/adapters');
      const data = await response.json();
      
      if (data.success) {
        setAdapters(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch adapters');
      }
    } catch (err) {
      setError('Failed to connect to adapter registry service');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(service)) {
      newExpanded.delete(service);
      // Collapse all providers under this service
      const serviceData = adapters.find(a => a.service === service);
      if (serviceData) {
        Object.keys(serviceData.providers).forEach(provider => {
          const key = `${service}-${provider}`;
          expandedProviders.delete(key);
        });
      }
    } else {
      newExpanded.add(service);
    }
    setExpandedServices(newExpanded);
  };

  const toggleProvider = (service: string, provider: string) => {
    const key = `${service}-${provider}`;
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedProviders(newExpanded);
  };

  const selectAdapter = (adapterId: string) => {
    setSelectedAdapter(adapterId === selectedAdapter ? null : adapterId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Adapter Registry</h1>
          <p className="text-gray-600">Manage and explore integration adapters for various services</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={fetchAdapters}
                className="ml-auto text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {['KYC', 'GST', 'Payments', 'Fraud'].map((service) => {
            const serviceAdapters = adapters.find(a => a.service === service);
            const count = serviceAdapters ? Object.keys(serviceAdapters.providers).length : 0;
            return (
              <div key={service} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${getServiceColor(service)}`}>
                    {getServiceIcon(service)}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600">{service} Providers</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Adapters List */}
        <div className="space-y-4">
          {adapters.map((serviceGroup) => (
            <motion.div
              key={serviceGroup.service}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Service Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleService(serviceGroup.service)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{ rotate: expandedServices.has(serviceGroup.service) ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    </motion.div>
                    <div className={`p-2 rounded-lg ${getServiceColor(serviceGroup.service)}`}>
                      {getServiceIcon(serviceGroup.service)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{serviceGroup.service}</h3>
                      <p className="text-sm text-gray-600">
                        {Object.keys(serviceGroup.providers).length} providers available
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Providers */}
              <AnimatePresence>
                {expandedServices.has(serviceGroup.service) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-gray-200"
                  >
                    {Object.entries(serviceGroup.providers).map(([providerName, providerData]) => (
                      <div key={providerName} className="border-b border-gray-100 last:border-b-0">
                        {/* Provider Header */}
                        <div
                          className="p-4 pl-12 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleProvider(serviceGroup.service, providerName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <motion.div
                                animate={{ rotate: expandedProviders.has(`${serviceGroup.service}-${providerName}`) ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                              </motion.div>
                              <ServerIcon className="w-5 h-5 text-gray-600" />
                              <div>
                                <h4 className="font-medium text-gray-900">{providerName}</h4>
                                <p className="text-sm text-gray-600">
                                  {providerData.versions.length} version{providerData.versions.length > 1 ? 's' : ''} available
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Versions */}
                        <AnimatePresence>
                          {expandedProviders.has(`${serviceGroup.service}-${providerName}`) && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="bg-gray-50"
                            >
                              {providerData.versions.map((version) => (
                                <div
                                  key={version.id}
                                  className={`p-4 pl-20 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                    selectedAdapter === version.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100'
                                  }`}
                                  onClick={() => selectAdapter(version.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                          {version.version}
                                        </span>
                                        {selectedAdapter === version.id && (
                                          <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 mb-3">{version.description}</p>
                                      
                                      {/* Endpoints */}
                                      <div className="mb-3">
                                        <h5 className="text-xs font-medium text-gray-600 mb-1">Endpoints:</h5>
                                        <div className="space-y-1">
                                          {Object.entries(version.endpoints).map(([name, url]) => (
                                            <div key={name} className="flex items-center space-x-2">
                                              <span className="text-xs font-medium text-gray-500 w-16">{name}:</span>
                                              <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700 truncate max-w-md">
                                                {url}
                                              </code>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Required Fields */}
                                      <div className="mb-3">
                                        <h5 className="text-xs font-medium text-gray-600 mb-1">Required Fields:</h5>
                                        <div className="flex flex-wrap gap-1">
                                          {version.requiredFields.map((field) => (
                                            <span key={field} className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                                              {field}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Auth & Rate Limit */}
                                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                                        <div className="flex items-center space-x-1">
                                          <KeyIcon className="w-3 h-3" />
                                          <span>{version.authentication.type}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <ClockIcon className="w-3 h-3" />
                                          <span>{version.rateLimit.requests}/{version.rateLimit.period}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {adapters.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <ServerIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No adapters found</h3>
            <p className="text-gray-600">No integration adapters are currently available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdapterRegistry;
