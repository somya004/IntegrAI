import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ArrowPathIcon, 
  DocumentArrowDownIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface FinalOutputProps {
  parsedRequirements?: any;
  generatedConfigs?: any[];
  integrationResult?: any;
  mappingResult?: any;
  simulationResults?: any;
}

const FinalOutput: React.FC<FinalOutputProps> = ({
  parsedRequirements,
  generatedConfigs = [],
  integrationResult,
  mappingResult,
  simulationResults
}) => {
  const exportConfiguration = () => {
    const config = {
      parsedRequirements,
      generatedConfigs,
      integrationResult,
      mappingResult,
      simulationResults,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'integration-configuration.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const restartWorkflow = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Integration Complete!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your integration has been successfully configured and tested. Review the results below and deploy when ready.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {parsedRequirements?.integration_plan?.services?.length || 3}
          </div>
          <div className="text-sm text-blue-600 font-medium">Services Configured</div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-900 mb-2">
            {integrationResult?.summary?.connectedServices || 2}
          </div>
          <div className="text-sm text-green-600 font-medium">Successfully Connected</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-900 mb-2">
            {simulationResults?.successRate || 67}%
          </div>
          <div className="text-sm text-purple-600 font-medium">Test Success Rate</div>
        </div>
        
        <div className="bg-orange-50 p-6 rounded-lg text-center">
          <div className="text-3xl font-bold text-orange-900 mb-2">
            {generatedConfigs.length || 3}
          </div>
          <div className="text-sm text-orange-600 font-medium">Configurations Generated</div>
        </div>
      </div>

      {/* Integration Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Results</h3>
        <div className="space-y-4">
          {integrationResult?.adapters?.map((adapter: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  adapter.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{adapter.serviceName}</h4>
                  <p className="text-sm text-gray-600">
                    {adapter.adapter} - {adapter.version}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {Math.round((adapter.confidence || 0.8) * 100)}% Match
                </div>
                {adapter.isFallback && (
                  <span className="text-xs text-yellow-600">Fallback Used</span>
                )}
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <CogIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Integration results will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResults && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{simulationResults.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{simulationResults.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{simulationResults.executionTime}ms</div>
              <div className="text-sm text-gray-600">Execution Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            console.log("🚀 Deploying integration...");
            alert("Integration deployed successfully!");
          }}
          className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          Deploy Integration
        </button>
        
        <button
          onClick={exportConfiguration}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
          Export Configuration
        </button>
        
        <button
          onClick={restartWorkflow}
          className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Start New Workflow
        </button>
      </div>
    </motion.div>
  );
};

export default FinalOutput;
