import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  PlusIcon,
  ChartBarIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { APIConfiguration, SimulationRequest, SimulationResponse, SimulationLog, SimulationEngineProps } from '../types/config';

const SimulationEngine: React.FC<SimulationEngineProps> = ({ 
  configurations, 
  onSimulationComplete 
}) => {
  const [selectedConfig, setSelectedConfig] = useState<APIConfiguration | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');
  const [testType, setTestType] = useState<'success' | 'error' | 'latency' | 'load' | 'auth'>('success');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [customPayload, setCustomPayload] = useState<Record<string, any>>({});
  const [showPayloadEditor, setShowPayloadEditor] = useState(false);

  // Generate mock response based on test type
  const generateMockResponse = useCallback((config: APIConfiguration, type: string): SimulationResponse => {
    const timestamp = new Date().toISOString();
    
    switch (type) {
      case 'success':
        return {
          id: `resp_${Date.now()}`,
          timestamp,
          request: {
            url: config.endpoint,
            method: config.method,
            headers: config.headers,
            body: customPayload
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
            body: {
              success: true,
              data: { message: 'Request processed successfully' },
              timestamp
            },
            size: 256
          },
          performance: {
            responseTime: Math.random() * 1000 + 100,
            latency: Math.random() * 50 + 10,
            throughput: Math.random() * 1000 + 500
          },
          metadata: {
            version: selectedVersion,
            environment: 'test',
            testType: type,
            success: true
          }
        };
      
      case 'error':
        return {
          id: `resp_${Date.now()}`,
          timestamp,
          request: {
            url: config.endpoint,
            method: config.method,
            headers: config.headers,
            body: customPayload
          },
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'Content-Type': 'application/json' },
            body: {
              success: false,
              error: 'Internal server error occurred',
              timestamp
            },
            size: 128
          },
          performance: {
            responseTime: Math.random() * 2000 + 500,
            latency: Math.random() * 100 + 20,
            throughput: Math.random() * 500 + 100
          },
          metadata: {
            version: selectedVersion,
            environment: 'test',
            testType: type,
            success: false,
            error: 'Internal server error'
          }
        };
      
      case 'latency':
        return {
          id: `resp_${Date.now()}`,
          timestamp,
          request: {
            url: config.endpoint,
            method: config.method,
            headers: config.headers,
            body: customPayload
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
            body: {
              success: true,
              data: { message: 'Request processed with high latency' },
              timestamp,
              latency: 'high'
            },
            size: 256
          },
          performance: {
            responseTime: Math.random() * 5000 + 2000,
            latency: Math.random() * 500 + 100,
            throughput: Math.random() * 200 + 50
          },
          metadata: {
            version: selectedVersion,
            environment: 'test',
            testType: type,
            success: true
          }
        };
      
      case 'auth':
        return {
          id: `resp_${Date.now()}`,
          timestamp,
          request: {
            url: config.endpoint,
            method: config.method,
            headers: config.headers,
            body: customPayload
          },
          response: {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'application/json' },
            body: {
              success: false,
              error: 'Authentication failed',
              timestamp
            },
            size: 128
          },
          performance: {
            responseTime: Math.random() * 500 + 100,
            latency: Math.random() * 20 + 5,
            throughput: Math.random() * 800 + 200
          },
          metadata: {
            version: selectedVersion,
            environment: 'test',
            testType: type,
            success: false,
            error: 'Authentication failed'
          }
        };
      
      case 'load':
        return {
          id: `resp_${Date.now()}`,
          timestamp,
          request: {
            url: config.endpoint,
            method: config.method,
            headers: config.headers,
            body: customPayload
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
            body: {
              success: true,
              data: { message: 'Request processed under load' },
              timestamp,
              loadTest: true
            },
            size: 256
          },
          performance: {
            responseTime: Math.random() * 1500 + 300,
            latency: Math.random() * 80 + 15,
            throughput: Math.random() * 1500 + 800
          },
          metadata: {
            version: selectedVersion,
            environment: 'test',
            testType: type,
            success: true
          }
        };
      
      default:
        return generateMockResponse(config, 'success');
    }
  }, [customPayload, selectedVersion]);

  // Run simulation
  const runSimulation = useCallback(async () => {
    if (!selectedConfig) return;

    setIsRunning(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const request: SimulationRequest = {
        config: selectedConfig,
        payload: customPayload,
        testType
      };
      
      const response = generateMockResponse(selectedConfig, testType);
      
      const log: SimulationLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        configId: selectedConfig.id,
        configName: selectedConfig.name,
        version: selectedVersion,
        testType,
        status: 'completed',
        request,
        response,
        performance: response.performance
      };
      
      setLogs(prev => [log, ...prev]);
      
      if (onSimulationComplete) {
        onSimulationComplete([log]);
      }
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [selectedConfig, customPayload, testType, selectedVersion, generateMockResponse, onSimulationComplete]);

  // Export logs
  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `simulation-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [logs]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulation & Testing Engine</h1>
          <p className="text-gray-600">Test API configurations with mock responses and comprehensive logging</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="w-6 h-6 mr-2 text-primary-600" />
              Configuration Selection
            </h2>

            {configurations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ServerIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>No configurations available</p>
                <p className="text-sm">Generate configurations first</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Configuration
                  </label>
                  <select
                    value={selectedConfig?.id || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const config = configurations.find((c: APIConfiguration) => c.id === e.target.value);
                      setSelectedConfig(config || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose a configuration...</option>
                    {configurations.map((config: APIConfiguration) => (
                      <option key={config.id} value={config.id}>
                        {config.name} ({config.version})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedConfig && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Version
                    </label>
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="v1">Version 1.0</option>
                      <option value="v2">Version 2.0</option>
                      <option value="v3">Version 3.0</option>
                    </select>
                  </div>
                )}

                {selectedConfig && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Configuration Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Endpoint:</span>
                        <span className="font-mono text-gray-900">{selectedConfig.endpoint}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Method:</span>
                        <span className="font-mono text-gray-900">{selectedConfig.method}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Authentication:</span>
                        <span className="font-mono text-gray-900">{selectedConfig.authentication.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate Limit:</span>
                        <span className="font-mono text-gray-900">
                          {selectedConfig.rateLimit?.requests}/{selectedConfig.rateLimit?.period}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Test Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <PlayIcon className="w-6 h-6 mr-2 text-primary-600" />
              Test Controls
            </h2>

            {!selectedConfig ? (
              <div className="text-center py-12 text-gray-500">
                <PlayIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>Select a configuration to test</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="success">Success Response</option>
                    <option value="error">Error Response</option>
                    <option value="latency">High Latency</option>
                    <option value="load">Load Test</option>
                    <option value="auth">Authentication Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Payload (JSON)
                  </label>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      {JSON.stringify(customPayload, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => setShowPayloadEditor(!showPayloadEditor)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {showPayloadEditor ? 'Hide Editor' : 'Show Editor'}
                  </button>
                </div>

                {showPayloadEditor && (
                  <div className="mt-4">
                    <textarea
                      value={JSON.stringify(customPayload, null, 2)}
                      onChange={(e) => {
                        try {
                          setCustomPayload(JSON.parse(e.target.value));
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter JSON payload..."
                    />
                  </div>
                )}

                <button
                  onClick={runSimulation}
                  disabled={isRunning}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Running Simulation...
                    </div>
                  ) : (
                    'Run Test'
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Response Logs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3 bg-white rounded-lg shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <DocumentArrowDownIcon className="w-6 h-6 mr-2 text-primary-600" />
                Response Logs
              </span>
              <div className="flex items-center space-x-2">
                {logs.length > 0 && (
                  <button
                    onClick={exportLogs}
                    className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Export JSON
                  </button>
                )}
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <TrashIcon className="w-3 h-3 inline mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </h2>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DocumentArrowDownIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>No simulation logs yet</p>
                <p className="text-sm">Run a simulation to see logs</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log: SimulationLog) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${
                      log.status === 'completed' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {log.status === 'completed' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-gray-900">{log.configName}</span>
                        <span className="text-sm text-gray-500">({log.version})</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Test Type:</span>
                        <span className="ml-2 font-medium">{log.testType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${
                          log.response?.response.status === 200 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.response?.response.status} {log.response?.response.statusText}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Response Time:</span>
                        <span className="ml-2 font-medium">
                          {log.performance?.responseTime.toFixed(0)}ms
                        </span>
                      </div>
                    </div>

                    {log.response && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Response:</div>
                        <div className="bg-gray-900 p-3 rounded overflow-x-auto">
                          <pre className="text-green-400 text-xs">
                            {JSON.stringify(log.response.response.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SimulationEngine;
