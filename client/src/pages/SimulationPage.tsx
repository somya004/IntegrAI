import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';

interface SimulationResult {
  success: boolean;
  message: string;
  results: any[];
  logs: string[];
  timestamp: string;
}

const SimulationPage: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');

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
    if (!state.finalConfig) {
      navigate('/config');
      return;
    }
  }, [state.parsedData, state.selectedAdapters, state.mappings, state.finalConfig, navigate]);

  // Debug logs
  useEffect(() => {
    console.log('🚀 Simulation - Parsed Data:', state.parsedData);
    console.log('🚀 Simulation - Selected Adapters:', state.selectedAdapters);
    console.log('🚀 Simulation - Schemas:', state.schemas);
    console.log('🚀 Simulation - Mappings:', state.mappings);
    console.log('🚀 Simulation - Final Config:', state.finalConfig);
  }, [state]);

  const runSimulation = async () => {
    setIsSimulating(true);
    setError('');
    setSimulationResult(null);

    try {
      console.log('🚀 Simulation - Starting simulation with config:', state.finalConfig);

      // Simulate API result as specified:
      // Random: Success (80%), Failure (20%)
      const isSuccess = Math.random() < 0.8;

      // Mock simulation logs
      const logs = [
        '[2024-01-01 10:00:00] Simulation started',
        '[2024-01-01 10:00:01] Validating configuration...',
        '[2024-01-01 10:00:02] Configuration validated successfully'
      ];

      // Add service-specific logs
      state.finalConfig?.integrations.forEach((integration: any) => {
        logs.push(`[2024-01-01 10:00:03] ${integration.service} API called...`);
        logs.push(`[2024-01-01 10:00:04] ${integration.service} ${isSuccess ? 'verified' : 'failed'}`);
      });

      logs.push('[2024-01-01 10:00:05] All integrations processed');
      logs.push(`[2024-01-01 10:00:06] Simulation ${isSuccess ? 'completed successfully' : 'failed'}`);

      // Generate mock results
      const results = state.finalConfig?.integrations.map((integration: any) => ({
        service: integration.service,
        status: isSuccess ? 'success' : 'failure',
        responseTime: `${Math.floor(Math.random() * 200) + 50}ms`,
        data: isSuccess ? {
          [integration.service.toLowerCase() === 'kyc' ? 'verificationId' : 'id']: `${integration.service.toUpperCase()}_${Math.random().toString(36).substr(2, 9)}`,
          status: isSuccess ? 'verified' : 'failed'
        } : {
          error: 'API call failed',
          code: 500
        }
      })) || [];

      setSimulationResult({
        success: isSuccess,
        message: isSuccess ? 'Simulation completed successfully' : 'Simulation failed',
        results: results,
        logs: logs,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Simulation error:', error);
      
      // Fallback mock result
      setSimulationResult({
        success: true,
        message: 'Simulation completed successfully (Mock)',
        results: [
          { service: 'KYC', status: 'success', responseTime: '120ms', data: { verificationId: 'KYC_123456', status: 'verified' } },
          { service: 'GST', status: 'success', responseTime: '95ms', data: { gstinVerified: true, businessName: 'Test Business' } }
        ],
        logs: [
          '[2024-01-01 10:00:00] Simulation started',
          '[2024-01-01 10:00:01] KYC API called...',
          '[2024-01-01 10:00:02] KYC verified',
          '[2024-01-01 10:00:03] GST API called...',
          '[2024-01-01 10:00:04] GST verified',
          '[2024-01-01 10:00:05] Simulation completed'
        ],
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadReport = () => {
    const report = {
      configuration: state.finalConfig,
      simulation: simulationResult,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `simulation-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleReset = () => {
    actions.resetState();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Simulation</h1>
              <p className="text-gray-600">Test your integration configuration with simulated API calls</p>
            </div>
            {simulationResult?.success && (
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            )}
            {simulationResult && !simulationResult?.success && (
              <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
            )}
          </div>

          {/* Configuration Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tenant ID</p>
                <p className="font-medium">{state.finalConfig?.tenant_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Integrations</p>
                <p className="font-medium">{state.selectedAdapters.length} services</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Field Mappings</p>
                <p className="font-medium">{Object.keys(state.mappings).length} mappings</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{isSimulating ? 'Running...' : 'Ready'}</p>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isSimulating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Simulation...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Run Simulation
                </>
              )}
            </button>
            
            {simulationResult && (
              <button
                onClick={() => runSimulation()}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Re-run
              </button>
            )}
          </div>

          {/* Results */}
          {simulationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status */}
              <div className={`rounded-lg p-6 border ${
                simulationResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  simulationResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {simulationResult.success ? '✅ Simulation Successful' : '❌ Simulation Failed'}
                </h3>
                <p className={simulationResult.success ? 'text-green-700' : 'text-red-700'}>
                  {simulationResult.message}
                </p>
              </div>

              {/* Results */}
              {simulationResult.results.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Results</h3>
                  <div className="space-y-3">
                    {simulationResult.results.map((result, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.service}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Response Time: {result.responseTime}</p>
                          <pre className="mt-2 text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Logs</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-64">
                  <div className="space-y-1">
                    {simulationResult.logs.map((log, index) => (
                      <div key={index} className="text-green-400 text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDownloadReport}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Download Report
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  Start New Integration
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationPage;
