import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface AdapterRegistryProps {
  onNext?: (integrationResults: any[]) => void;
  onBack?: () => void;
}

const AdapterRegistry: React.FC<AdapterRegistryProps> = ({ onNext, onBack }) => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  // STEP 1: CREATE DEFAULT SERVICES
  const defaultServices = [
    {
      id: 1,
      name: "KYC Verification",
      adapters: ["Onfido", "IDfy", "HyperVerge"]
    },
    {
      id: 2,
      name: "API Integration", 
      adapters: ["REST Adapter", "GraphQL Adapter"]
    },
    {
      id: 3,
      name: "Document Management",
      adapters: ["AWS S3", "Firebase Storage"]
    }
  ];

  // STEP 2: SAFE DATA MERGE
  const getRegistryData = (parsedRequirements: any) => {
    console.log("🔍 Getting registry data from:", parsedRequirements);
    
    if (!parsedRequirements || !parsedRequirements.services) {
      console.log("🛡️ Using default services - no parsed requirements");
      return defaultServices;
    }

    const mappedServices = parsedRequirements.services.map((service: any, index: number) => ({
      id: service.id || index + 1,
      name: service.name || defaultServices[index]?.name || `Service ${index + 1}`,
      adapters: service.adapters || defaultServices[index]?.adapters || ["Default Adapter"]
    }));

    console.log("✅ Mapped services:", mappedServices);
    return mappedServices.length > 0 ? mappedServices : defaultServices;
  };

  // STEP 3: STATE FOR SELECTED ADAPTERS
  const [selectedAdapters, setSelectedAdapters] = useState<Record<string, string>>({});

  // STEP 4: HANDLE SELECTION
  const handleSelect = (serviceName: string, adapter: string) => {
    console.log("🎯 Selecting adapter:", serviceName, adapter);
    setSelectedAdapters(prev => ({
      ...prev,
      [serviceName]: adapter
    }));
  };

  // STEP 7: AUTO SELECT DEFAULT
  useEffect(() => {
    const services = getRegistryData((state as any).parsedRequirements);
    const defaults: Record<string, string> = {};
    
    services.forEach((service: any) => {
      defaults[service.name] = service.adapters[0];
    });
    
    console.log("🎯 Setting default adapters:", defaults);
    setSelectedAdapters(defaults);
  }, [(state as any).parsedRequirements]);

  // STEP 5: RENDER REGISTRY UI
  const services = getRegistryData((state as any).parsedRequirements);

  // STEP 8: ENABLE NEXT BUTTON
  const safeNext = () => {
    console.log("🚀 Processing integration with selected adapters:", selectedAdapters);
    
    // Process integration using existing data
    const safe = getSafeData((state as any).parsedRequirements, (state as any).generatedConfigs);
    
    const result = safe.generatedConfigs.map((config: any) => ({
      service: config.service,
      adapter: selectedAdapters[config.service] || "Default Adapter",
      status: "connected",
      version: config.version,
      mappedFields: config.fieldMapping,
      transformations: config.transformations
    }));
    
    console.log("✅ Integration processed:", result);
    
    // Save to global state
    if (actions.setSelectedAdapters) {
      const adapterSelections = Object.entries(selectedAdapters).map(([serviceName, adapter]) => ({
        service: serviceName,
        provider: adapter,
        version: "v1",
        status: "selected",
        endpoints: {
          "api": `https://api.${adapter.toLowerCase().replace(/\s+/g, '-')}.com/v1`,
          "webhook": `https://webhook.${adapter.toLowerCase().replace(/\s+/g, '-')}.com/v1`
        },
        requiredFields: ["customerId", "apiKey"],
        optionalFields: ["metadata", "callback"],
        authentication: {
          type: "Bearer",
          header: "Authorization"
        },
        rateLimit: {
          requests: 1000,
          period: "hour"
        }
      }));
      actions.setSelectedAdapters(adapterSelections);
    }
    
    // Save integration results
    if (actions.setParsedData) {
      actions.setParsedData({
        ...(state as any).parsedData,
        integrationResults: result
      });
    }
    
    // MOVE FORWARD to next step (not backward)
    // Use provided onNext or fallback to navigate
    if (onNext) {
      onNext(result); // ✅ PASS INTEGRATION RESULTS
    } else {
      navigate('/field-mapping');
    }
  };

  // Helper function to get safe data
  const getSafeData = (parsedRequirements: any, generatedConfigs: any) => {
    const safeParsed = parsedRequirements || {
      services: defaultServices.map(s => ({ name: s.name, type: s.name.toLowerCase().replace(/\s+/g, '_') }))
    };
    
    const safeConfigs = generatedConfigs && generatedConfigs.length > 0 
      ? generatedConfigs 
      : defaultServices.map(service => ({
          service: service.name,
          version: "v1",
          fieldMapping: {},
          transformations: []
        }));
    
    return {
      parsedRequirements: safeParsed,
      generatedConfigs: safeConfigs
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* STEP 6: PREVENT EMPTY SCREEN - ALWAYS SHOW */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Adapter Registry</h1>
          <p className="text-gray-600">Select integration adapters for your services</p>
        </div>

        {/* Services and Adapters */}
        <div className="space-y-6">
          {services.map((service: any) => (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600">Choose an adapter for this service</p>
              </div>

              {/* Adapter Selection Buttons */}
              <div className="flex flex-wrap gap-2">
                {service.adapters.map((adapter: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(service.name, adapter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedAdapters[service.name] === adapter
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {adapter}
                    {selectedAdapters[service.name] === adapter && (
                      <CheckCircleIcon className="w-4 h-4 ml-2 inline" />
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Adapter Display */}
              {selectedAdapters[service.name] && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                    Selected: <strong>{selectedAdapters[service.name]}</strong>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary and Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Selection Summary</h3>
              <p className="text-sm text-gray-600">
                {Object.keys(selectedAdapters).length} of {services.length} services configured
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </button>
              
              <button
                onClick={safeNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Process Integration →
              </button>
            </div>
          </div>

          {/* Selected Adapters List */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Adapters:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedAdapters).map(([serviceName, adapter]) => (
                <span
                  key={serviceName}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {serviceName}: {adapter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdapterRegistry;
