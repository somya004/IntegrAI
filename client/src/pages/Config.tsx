import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentArrowDownIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

const Config: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();

  // Navigation guards
  useEffect(() => {
    if (!state.parsedData) {
      navigate('/');
      return;
    }
    if (!state.selectedAdapters || state.selectedAdapters.length === 0) {
      navigate('/registry');
      return;
    }
    if (!state.mappings || Object.keys(state.mappings).length === 0) {
      navigate('/mapping');
      return;
    }
  }, [state.parsedData, state.selectedAdapters, state.mappings, navigate]);

  // Generate configuration from mapping page (as specified)
  useEffect(() => {
    if (!state.finalConfig && state.selectedAdapters && state.mappings) {
      // Generate finalConfig as specified:
      // {
      //   tenant_id: "bank_demo",
      //   integrations: selectedAdapters,
      //   mappings: mappings
      // }
      const finalConfig = {
        tenant_id: "bank_demo",
        integrations: state.selectedAdapters,
        mappings: state.mappings
      };
      
      actions.setFinalConfig(finalConfig);
      console.log('🔧 Config - Generated Final Config:', finalConfig);
    }
  }, [state.selectedAdapters, state.mappings, state.finalConfig, actions]);

  if (!state.finalConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Not Available</h2>
          <p className="text-gray-600 mb-6">
            No configuration available. Please complete previous steps.
          </p>
          <button
            onClick={() => navigate('/mapping')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Mapping
          </button>
        </div>
      </div>
    );
  }

  const handleRunSimulation = () => {
    console.log('🚀 Config - Running Simulation with:', state.finalConfig);
    navigate('/simulation');
  };

  const handleDownloadConfig = () => {
    const dataStr = JSON.stringify(state.finalConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `integration-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Generated Configuration</h1>
              <p className="text-gray-600">Final integration configuration ready for deployment</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>

          {/* Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Integrations</h3>
              <p className="text-2xl font-bold text-blue-600">{state.selectedAdapters.length}</p>
              <p className="text-sm text-blue-700">Services configured</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Field Mappings</h3>
              <p className="text-2xl font-bold text-green-600">{Object.keys(state.mappings).length}</p>
              <p className="text-sm text-green-700">Fields mapped</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Tenant ID</h3>
              <p className="text-lg font-bold text-purple-600">{state.finalConfig.tenant_id}</p>
              <p className="text-sm text-purple-700">Organization</p>
            </div>
          </div>

          {/* JSON Preview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration JSON</h2>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono">
                {JSON.stringify(state.finalConfig, null, 2)}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadConfig}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Download Configuration
            </button>
            
            <button
              onClick={handleRunSimulation}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center transition-colors"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Run Simulation →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Config;
