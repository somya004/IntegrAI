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
import { APIConfiguration, SimulationRequest, SimulationResponse, SimulationLog } from '../types/config';

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

  // Mock response generators for different services
  const generateMockResponse = useCallback(async (config: APIConfiguration, request: SimulationRequest): Promise<SimulationResponse> => {
    const startTime = Date.now();
    
    // Simulate network delay
    const baseDelay = Math.random() * 1000 + 500; // 500-1500ms
    const delay = testType === 'latency' ? baseDelay + 2000 : baseDelay;
    await new Promise(resolve => setTimeout(resolve, delay));

    const responseTime = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    let responseBody: any;
    let status = 200;
    let statusText = 'OK';

    switch (config.name) {
      case 'KYC Provider':
        if (testType === 'success') {
          responseBody = {
            status: 'verified',
            customer: {
              id: `CUST_${Date.now()}`,
              name: request.payload.fullName || 'John Doe',
              verified: true,
              verificationScore: 0.95
            }
          };
        } else if (testType === 'error') {
          status = 400;
          statusText = 'Bad Request';
          responseBody = {
            error: 'INVALID_PAN_FORMAT',
            message: 'PAN number must be 10 characters alphanumeric',
            code: 'KYC_001'
          };
        } else if (testType === 'auth') {
          status = 401;
          statusText = 'Unauthorized';
          responseBody = {
            error: 'INVALID_API_KEY',
            message: 'API key is invalid or expired'
          };
        }
        break;

      case 'GST API':
        if (testType === 'success') {
          responseBody = {
            status: 'valid',
            business: {
              gstin: request.payload.gstin || '27AAAPL1234C1Z',
              name: request.payload.businessName || 'Example Business',
              valid: true,
              registrationDate: '2020-01-01'
            }
          };
        } else if (testType === 'error') {
          status = 422;
          statusText = 'Unprocessable Entity';
          responseBody = {
            error: 'INVALID_GSTIN',
            message: 'GSTIN number is not valid'
          };
        }
        break;

      case 'Payment Gateway':
        if (testType === 'success') {
          responseBody = {
            transactionId: `TXN_${Date.now()}`,
            status: 'success',
            amount: request.payload.amount || 1000,
            currency: 'INR',
            customer: {
              name: request.payload.customerName || 'John Doe',
              email: request.payload.email || 'john@example.com'
            }
          };
        } else if (testType === 'error') {
          status = 402;
          statusText = 'Payment Failed';
          responseBody = {
            error: 'INSUFFICIENT_FUNDS',
            message: 'Account balance is insufficient'
          };
        } else if (testType === 'load') {
          // Simulate high latency for load testing
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        break;

      case 'Fraud Detection API':
        if (testType === 'success') {
          responseBody = {
            riskScore: Math.floor(Math.random() * 100),
            decision: Math.random() > 0.3 ? 'approve' : 'review',
            factors: [
              { type: 'transaction_pattern', weight: 0.3 },
              { type: 'location_anomaly', weight: 0.2 },
              { type: 'velocity_check', weight: 0.25 }
            ]
          };
        } else if (testType === 'error') {
          status = 503;
          statusText = 'Service Unavailable';
          responseBody = {
            error: 'SERVICE_UNAVAILABLE',
            message: 'Fraud detection service is temporarily down'
          };
        }
        break;

      case 'Credit Bureau':
        if (testType === 'success') {
          responseBody = {
            score: Math.floor(Math.random() * 300 + 600),
            report: {
              generatedAt: timestamp,
              factors: [
                { name: 'Payment History', impact: 'positive' },
                { name: 'Credit Utilization', impact: 'negative' },
                { name: 'Account Age', impact: 'positive' }
              ]
            }
          };
        } else if (testType === 'error') {
          status = 404;
          statusText = 'Not Found';
          responseBody = {
            error: 'CUSTOMER_NOT_FOUND',
            message: 'Customer record not found in bureau database'
          };
        }
        break;

      default:
        responseBody = { message: 'Service not available' };
        status = 501;
        statusText = 'Not Implemented';
    }

    const responseSize = JSON.stringify(responseBody).length;

    return {
      id: `resp_${Date.now()}`,
      timestamp,
      request: {
        url: `https://api.example.com${config.endpoint}`,
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ConfigAI-Simulator/1.0',
          'X-API-Version': config.version
        },
        body: request.payload
      },
      response: {
        status,
        statusText,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`,
          'X-API-Version': config.version,
          'X-Test-Type': testType
        },
        body: responseBody,
        size: responseSize
      },
      performance: {
        responseTime,
        latency: Math.max(0, responseTime - 500),
        throughput: Math.round((responseSize * 1000) / responseTime)
      },
      metadata: {
        version: config.version,
        environment: 'test',
        testType,
        success: status >= 200 && status < 300
      }
    };
  }, [testType]);

  // Run simulation
  const runSimulation = useCallback(async () => {
    if (!selectedConfig) return;

    setIsRunning(true);
    
    try {
      const request: SimulationRequest = {
        config: selectedConfig,
        payload: customPayload,
        testType
      };

      const response = await generateMockResponse(selectedConfig, request);
      
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
        performance: {
          responseTime: response.performance.responseTime,
          latency: response.performance.latency
        }
      };

      setLogs(prev => [log, ...prev]);
      setIsRunning(false);
      
      if (onSimulationComplete) {
        onSimulationComplete([...logs, log]);
      }
    } catch (error) {
      const errorLog: SimulationLog = {
        id: `log_error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        configId: selectedConfig.id,
        configName: selectedConfig.name,
        version: selectedVersion,
        testType,
        status: 'failed',
        request: {
          config: selectedConfig,
          payload: customPayload,
          testType
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setLogs(prev => [errorLog, ...prev]);
      setIsRunning(false);
    }
  }, [selectedConfig, selectedVersion, customPayload, testType, generateMockResponse]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs
  const exportLogs = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs,
      summary: {
        successfulTests: logs.filter(log => log.status === 'completed').length,
        failedTests: logs.filter(log => log.status === 'failed').length,
        averageResponseTime: logs.length > 0 
          ? logs.reduce((sum, log) => sum + (log.performance?.responseTime || 0), 0) / logs.length 
          : 0
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_logs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  // Generate default payload based on selected config
  useEffect(() => {
    if (selectedConfig) {
      const defaultPayload: Record<string, any> = {};
      
      selectedConfig.parameters.forEach(param => {
        switch (param.clientField) {
          case 'fullName':
            defaultPayload.fullName = 'John Doe';
            break;
          case 'dateOfBirth':
            defaultPayload.dateOfBirth = '1990-01-15';
            break;
          case 'panNumber':
            defaultPayload.panNumber = 'ABCDE1234F';
            break;
          case 'email':
            defaultPayload.email = 'john.doe@example.com';
            break;
          case 'phoneNumber':
            defaultPayload.phoneNumber = '+919876543210';
            break;
          case 'amount':
            defaultPayload.amount = 1000;
            break;
          case 'businessName':
            defaultPayload.businessName = 'Example Business';
            break;
          case 'gstin':
            defaultPayload.gstin = '27AAAPL1234C1Z';
            break;
        }
      });
      
      setCustomPayload(defaultPayload);
    }
  }, [selectedConfig]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
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
                  onChange={(e) => {
                    const config = configurations.find(c => c.id === e.target.value);
                    setSelectedConfig(config || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Choose a configuration...</option>
                  {configurations.map(config => (
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
                    <option value="v1">v1</option>
                    <option value="v2">v2</option>
                    <option value="v3">v3</option>
                  </select>
                </div>
              )}
            </div>

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
                  <option value="latency">Latency Test</option>
                  <option value="load">Load Test</option>
                  <option value="auth">Authentication Test</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Payload
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
                    placeholder="Edit JSON payload..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
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
                  <div className="flex items-center">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Run Simulation
                  </div>
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
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 ${
                    log.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : log.status === 'failed'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {log.configName} ({log.version})
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.testType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {log.status === 'completed' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      )}
                      {log.status === 'failed' && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      )}
                      {log.status === 'running' && (
                        <ClockIcon className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="font-mono text-gray-900">{log.timestamp}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-mono text-gray-900">
                        {log.performance?.responseTime || 'N/A'}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Latency:</span>
                      <span className="font-mono text-gray-900">
                        {log.performance?.latency || 'N/A'}ms
                      </span>
                    </div>
                  </div>

                  {log.response && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Response:</div>
                      <div className="bg-gray-900 p-3 rounded overflow-x-auto">
                        <pre className="text-green-400 text-xs">
                          {JSON.stringify(log.response.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {log.error && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-red-700 mb-2">Error:</div>
                      <div className="bg-red-900 p-3 rounded">
                        <pre className="text-red-400 text-xs">
                          {log.error}
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
    </motion.div>
  );
};

export default SimulationEngine;
