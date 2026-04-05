import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { useAppContext } from '../contexts/AppContext';

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
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [adapters, setAdapters] = useState<GroupedAdapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGeneratingSchemas, setIsGeneratingSchemas] = useState(false);
  
  // Use global state for selected adapters
  const selectedAdapters = state.selectedAdapters;

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

  // Mock Adapter Registry as specified
  const mockAdapterRegistry = {
    KYC: {
      providers: ["Karza", "Onfido"],
      versions: ["v1", "v2"],
      fields: ["fullName", "date_of_birth", "pan_number"]
    },
    GST: {
      providers: ["ClearTax"],
      versions: ["v1"],
      fields: ["gstin"]
    },
    Payments: {
      providers: ["Razorpay"],
      versions: ["v1"],
      fields: ["amount", "account"]
    }
  };

  // Fetch adapters with mock data
  useEffect(() => {
    setLoading(true);
    try {
      // Transform to the expected structure
      const transformedAdapters: GroupedAdapter[] = state.parsedData?.services_detected?.map(service => {
        const serviceData = mockAdapterRegistry[service as keyof typeof mockAdapterRegistry];
        if (!serviceData) return null;
        
        return {
          service,
          providers: serviceData.providers.reduce((acc, provider) => {
            acc[provider] = {
              provider,
              versions: serviceData.versions.map(version => ({
                id: `${service}-${provider}-${version}`,
                version,
                description: `${provider} ${version} integration for ${service}`,
                endpoints: {
                  verify: `/api/${service.toLowerCase()}/${provider.toLowerCase()}/verify`
                },
                requiredFields: serviceData.fields,
                authentication: {
                  type: "Bearer",
                  header: "Authorization"
                },
                rateLimit: {
                  requests: 1000,
                  period: "hour"
                }
              }))
            };
            return acc;
          }, {} as Record<string, any>)
        };
      }).filter((item): item is GroupedAdapter => item !== null) || [];
      
      setAdapters(transformedAdapters);
      setError('');
    } catch (err) {
      setError('Failed to load adapters');
    } finally {
      setLoading(false);
    }
  }, [state.parsedData]);

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
    // Find the adapter details
    let selectedAdapterDetails: any = null;
    
    for (const service of adapters) {
      for (const provider of Object.values(service.providers)) {
        const version = provider.versions.find(v => v.id === adapterId);
        if (version) {
          selectedAdapterDetails = {
            service: service.service,
            provider: provider.provider,
            version: version.version,
            endpoints: version.endpoints,
            requiredFields: version.requiredFields,
            optionalFields: [],
            authentication: version.authentication,
            rateLimit: version.rateLimit
          };
          break;
        }
      }
      if (selectedAdapterDetails) break;
    }
    
    if (selectedAdapterDetails) {
      // Check if this service is already selected
      const existingIndex = selectedAdapters.findIndex(a => a.service === selectedAdapterDetails.service);
      
      let updatedSelection;
      if (existingIndex >= 0) {
        // Remove if already selected (deselect)
        updatedSelection = selectedAdapters.filter((_, index) => index !== existingIndex);
      } else {
        // Add if not selected (select)
        updatedSelection = [...selectedAdapters, selectedAdapterDetails];
      }
      
      // Update global state
      actions.setSelectedAdapters(updatedSelection);
      setSelectedAdapter(adapterId === selectedAdapter ? null : adapterId);
    }
  };

  // Update adapter selection (for dropdown changes)
  const updateAdapterSelection = (service: string, provider: string, version: string) => {
    // Find the adapter details
    let adapterDetails = null;
    
    for (const serviceGroup of adapters) {
      if (serviceGroup.service === service) {
        const providerData = serviceGroup.providers[provider];
        if (providerData) {
          const versionData = providerData.versions.find(v => v.version === version);
          if (versionData) {
            adapterDetails = {
              service: service,
              provider: provider,
              version: version,
              endpoints: versionData.endpoints,
              requiredFields: versionData.requiredFields,
              optionalFields: [],
              authentication: versionData.authentication,
              rateLimit: versionData.rateLimit
            };
          }
        }
        break;
      }
    }
    
    if (adapterDetails) {
      // Remove existing selection for this service and add new one
      const filteredSelection = selectedAdapters.filter(a => a.service !== service);
      const updatedSelection = [...filteredSelection, adapterDetails];
      
      // Update global state
      actions.setSelectedAdapters(updatedSelection);
    }
  };

  // Generate schemas from selected adapters
  const generateSchemas = async () => {
    setIsGeneratingSchemas(true);
    const schemas: Record<string, any> = {};
    
    try {
      // Generate schemas as specified in requirements
      selectedAdapters.forEach(adapter => {
        const serviceData = mockAdapterRegistry[adapter.service as keyof typeof mockAdapterRegistry];
        if (serviceData) {
          schemas[adapter.service] = serviceData.fields;
        }
      });
      
      // Store schemas in global state
      const formattedSchemas: Record<string, any> = {};
      selectedAdapters.forEach(adapter => {
        const serviceData = mockAdapterRegistry[adapter.service as keyof typeof mockAdapterRegistry];
        if (serviceData) {
          formattedSchemas[adapter.service] = {
            service: adapter.service,
            provider: adapter.provider,
            version: adapter.version,
            requiredFields: serviceData.fields,
            optionalFields: [],
            endpoints: adapter.endpoints,
            authentication: adapter.authentication
          };
        }
      });
      
      actions.setSchemas(formattedSchemas);
      console.log('🔄 Registry - Generated Schemas:', formattedSchemas);
      
    } catch (error) {
      console.error('Error generating schemas:', error);
    } finally {
      setIsGeneratingSchemas(false);
    }
  };

  // Handle proceed to mapping
  const handleProceedToMapping = async () => {
    console.log('🔄 Registry - Selected Adapters:', selectedAdapters);
    
    // Generate schemas before navigation
    await generateSchemas();
    
    console.log('🔄 Registry - Generated Schemas:', state.schemas);
    
    // Navigate to mapping page
    navigate('/mapping');
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

        {/* Adapter Selection Controls */}
        {state.parsedData && state.parsedData.services_detected && state.parsedData.services_detected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adapter Selection</h3>
            <p className="text-sm text-gray-600 mb-4">Select adapters for detected services:</p>
            
            <div className="space-y-4">
              {state.parsedData.services_detected.map((service: string, index: number) => {
                const selectedAdapter = selectedAdapters.find(a => a.service === service);
                const availableProviders = adapters.find(a => a.service === service)?.providers || {};
                
                return (
                  <div key={service} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(service)}
                      <span className="font-medium text-gray-900">{service}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedAdapter?.provider || ''}
                        onChange={(e) => {
                          const provider = e.target.value;
                          const providerData = availableProviders[provider];
                          if (providerData && providerData.versions.length > 0) {
                            updateAdapterSelection(service, provider, providerData.versions[0].version);
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Provider</option>
                        {Object.keys(availableProviders).map(provider => (
                          <option key={provider} value={provider}>{provider}</option>
                        ))}
                      </select>
                      
                      {selectedAdapter && (
                        <select
                          value={selectedAdapter.version}
                          onChange={(e) => {
                            updateAdapterSelection(service, selectedAdapter.provider, e.target.value);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {availableProviders[selectedAdapter.provider]?.versions.map(version => (
                            <option key={version.version} value={version.version}>{version.version}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    {selectedAdapter && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => window.location.reload()}
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
                              {providerData.versions.map((version) => {
                                const isSelected = selectedAdapters.some(a => 
                                  a.service === serviceGroup.service && 
                                  a.provider === providerName && 
                                  a.version === version.version
                                );
                                return (
                                  <div
                                    key={version.id}
                                    className={`p-4 pl-20 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : 'hover:bg-gray-100'
                                    }`}
                                    onClick={() => selectAdapter(version.id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {version.version}
                                          </span>
                                          {isSelected && (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                              Selected
                                            </span>
                                          )}
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
                                );
                              })}
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

        {/* Selected Adapters Summary and Proceed Button */}
        {selectedAdapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Adapters</h3>
                <p className="text-sm text-gray-600">
                  {selectedAdapters.length} adapter{selectedAdapters.length !== 1 ? 's' : ''} selected for integration
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAdapters.map((adapter, index) => (
                    <span key={`${adapter.service}-${adapter.provider}-${adapter.version}`} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {adapter.service} - {adapter.provider} v{adapter.version}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleProceedToMapping}
                disabled={isGeneratingSchemas}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {isGeneratingSchemas ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Schemas...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Mapping</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdapterRegistry;
