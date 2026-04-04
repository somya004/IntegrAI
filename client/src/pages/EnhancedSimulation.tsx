import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  ArrowUturnLeftIcon,
  DocumentArrowDownIcon,
  ServerIcon,
  BeakerIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface SimulationConfig {
  id: string;
  service: string;
  provider: string;
  version: string;
  status: string;
  config: {
    endpoints: Record<string, string>;
    authentication: {
      type: string;
      header: string;
      credentials: any;
    };
    rate_limit: {
      requests: number;
      period: string;
    };
    required_fields: string[];
  };
}

interface SimulationLog {
  id: string;
  integrationId: string;
  service: string;
  version: string;
  scenario: string;
  timestamp: string;
  request: {
    method: string;
    url: string;
    headers: any;
    body: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: any;
    body: any;
  };
  performance: {
    request_time: number;
    response_size: number;
    status_code: number;
  };
  success: boolean;
  metadata: any;
}

interface Version {
  version: string;
  description: string;
  features: string[];
  status: string;
}

interface Scenario {
  name: string;
  description: string;
  status_code: number;
  probability: number;
}

const EnhancedSimulationEngine: React.FC = () => {
  const [configs, setConfigs] = useState<SimulationConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SimulationConfig | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('v2');
  const [selectedScenario, setSelectedScenario] = useState('success');
  const [versions, setVersions] = useState<Version[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [simulationLogs, setSimulationLogs] = useState<SimulationLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<SimulationLog | null>(null);
  const [showConsole, setShowConsole] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSnapshotId, setLastSnapshotId] = useState<string | null>(null);

  // Load available versions and scenarios
  useEffect(() => {
    loadVersions();
    loadScenarios();
    loadSampleConfigs();
  }, []);

  const loadVersions = async () => {
    try {
      const response = await fetch('http://localhost:5006/versions');
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetch('http://localhost:5006/scenarios');
      const data = await response.json();
      if (data.success) {
        setScenarios(data.data);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const loadSampleConfigs = () => {
    const sampleConfigs: SimulationConfig[] = [
      {
        id: 'kyc-karza',
        service: 'KYC',
        provider: 'Karza',
        version: 'v2',
        status: 'active',
        config: {
          endpoints: {
            verify: 'https://api.karza.in/v2/kyc/verify',
            status: 'https://api.karza.in/v2/kyc/status',
            enhanced: 'https://api.karza.in/v2/kyc/enhanced'
          },
          authentication: {
            type: 'API Key',
            header: 'X-API-Key',
            credentials: {
              api_key: 'karza_api_key_12345'
            }
          },
          rate_limit: {
            requests: 200,
            period: 'minute'
          },
          required_fields: ['panNumber', 'aadhaarNumber', 'fullName', 'dateOfBirth', 'mobileNumber']
        }
      },
      {
        id: 'payments-razorpay',
        service: 'Payments',
        provider: 'Razorpay',
        version: 'v2',
        status: 'active',
        config: {
          endpoints: {
            create: 'https://api.razorpay.com/v2/payments',
            capture: 'https://api.razorpay.com/v2/payments/:id/capture',
            refund: 'https://api.razorpay.com/v2/payments/:id/refund',
            webhooks: 'https://api.razorpay.com/v2/webhooks'
          },
          authentication: {
            type: 'Bearer Token',
            header: 'Authorization',
            credentials: {
              token: 'rzp_test_token_67890'
            }
          },
          rate_limit: {
            requests: 500,
            period: 'minute'
          },
          required_fields: ['amount', 'currency', 'receipt', 'notes', 'callbackUrl']
        }
      },
      {
        id: 'gst-cleartax',
        service: 'GST',
        provider: 'ClearTax',
        version: 'v2',
        status: 'active',
        config: {
          endpoints: {
            verify: 'https://api.cleartax.in/v2/gst/verify',
            details: 'https://api.cleartax.in/v2/gst/details',
            returns: 'https://api.cleartax.in/v2/gst/returns'
          },
          authentication: {
            type: 'API Key',
            header: 'X-API-Key',
            credentials: {
              api_key: 'cleartax_api_key_54321'
            }
          },
          rate_limit: {
            requests: 100,
            period: 'minute'
          },
          required_fields: ['gstin', 'businessName', 'state', 'registrationType']
        }
      }
    ];
    setConfigs(sampleConfigs);
    setSelectedConfig(sampleConfigs[0]);
  };

  const runSimulation = async () => {
    if (!selectedConfig) {
      return;
    }

    setIsSimulating(true);
    setCurrentSimulation(null);

    try {
      const response = await fetch('http://localhost:5006/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: selectedConfig,
          version: selectedVersion,
          scenario: selectedScenario
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const simulation = data.data.simulation;
        setCurrentSimulation(simulation);
        setSimulationLogs(prev => [simulation, ...prev.slice(0, 9)]);
        setLastSnapshotId(data.data.snapshot_id);
        
        // Load updated history
        loadSimulationHistory(selectedConfig.id);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Simulation failed:', error);
      // Create error simulation log
      const errorLog: SimulationLog = {
        id: 'error_' + Date.now(),
        integrationId: selectedConfig.id,
        service: selectedConfig.service,
        version: selectedVersion,
        scenario: 'error',
        timestamp: new Date().toISOString(),
        request: {
          method: 'POST',
          url: (selectedConfig.config.endpoints as Record<string, string>).verify || (selectedConfig.config.endpoints as Record<string, string>).create,
          headers: {},
          body: {}
        },
        response: {
          status: 500,
          statusText: 'Simulation Error',
          headers: {},
          body: { error: error.message }
        },
        performance: {
          request_time: 0,
          response_size: 0,
          status_code: 500
        },
        success: false,
        metadata: {
          simulation_engine_version: '2.0.0',
          mock_data: false,
          error: true
        }
      };
      setCurrentSimulation(errorLog);
      setSimulationLogs(prev => [errorLog, ...prev.slice(0, 9)]);
    } finally {
      setIsSimulating(false);
    }
  };

  const rollbackVersion = async () => {
    if (!lastSnapshotId) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5006/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshot_id: lastSnapshotId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Rollback successful:', data.data);
        // Reload simulation history
        if (selectedConfig) {
          loadSimulationHistory(selectedConfig.id);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Rollback failed:', error);
    }
  };

  const loadSimulationHistory = async (integrationId: string) => {
    try {
      const response = await fetch(`http://localhost:5006/simulations/${integrationId}`);
      const data = await response.json();
      
      if (data.success) {
        setSimulationLogs(data.data.history);
      }
    } catch (error) {
      console.error('Failed to load simulation history:', error);
    }
  };

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

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-red-600';
    if (status >= 500) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failure':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'server_error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) {
      return `${time}ms`;
    } else {
      return `${(time / 1000).toFixed(2)}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Simulation Engine</h1>
          <p className="text-gray-600">Test API integrations with version control and rollback capabilities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="space-y-6">
            {/* Configuration Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Integration</label>
                  <select
                    value={selectedConfig?.id || ''}
                    onChange={(e) => {
                      const config = configs.find(c => c.id === e.target.value);
                      setSelectedConfig(config || null);
                      if (config) {
                        loadSimulationHistory(config.id);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {configs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.service} - {config.provider}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedConfig && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      {getServiceIcon(selectedConfig.service)}
                      <span className="font-medium">{selectedConfig.service}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Provider: {selectedConfig.provider}</p>
                      <p>Current Version: {selectedConfig.version}</p>
                      <p>Status: {selectedConfig.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Simulation Controls</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Version</label>
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {versions.map(version => (
                      <option key={version.version} value={version.version}>
                        {version.version} - {version.status}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-500">
                    {versions.find(v => v.version === selectedVersion)?.description}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scenario</label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {scenarios.map(scenario => (
                      <option key={scenario.name} value={scenario.name}>
                        {scenario.name} - {scenario.status_code}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-500">
                    {scenarios.find(s => s.name === selectedScenario)?.description}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating || !selectedConfig}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSimulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Simulating...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Run Simulation
                      </>
                    )}
                  </button>

                  <button
                    onClick={rollbackVersion}
                    disabled={!lastSnapshotId}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                    Rollback
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowConsole(!showConsole)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {showConsole ? (
                      <>
                        <EyeSlashIcon className="w-4 h-4 mr-1" />
                        Hide Console
                      </>
                    ) : (
                      <>
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Show Console
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {showDetails ? (
                      <>
                        <CogIcon className="w-4 h-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <CogIcon className="w-4 h-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Simulation Status */}
            {currentSimulation && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Simulation</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center space-x-2">
                      {currentSimulation.success ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${getStatusColor(currentSimulation.response.status)}`}>
                        {currentSimulation.response.statusText}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time:</span>
                    <span className="font-medium">{formatResponseTime(currentSimulation.performance.request_time)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scenario:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScenarioColor(currentSimulation.scenario)}`}>
                      {currentSimulation.scenario}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="font-medium">{currentSimulation.version}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Console Output */}
          {showConsole && (
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Console Output</h2>
                  <button
                    onClick={() => setSimulationLogs([])}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {simulationLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="font-mono text-sm"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>
                        <div className="flex-1">
                          <div className="text-green-400">
                            POST {log.request.url}
                          </div>
                          <div className={`ml-4 ${getStatusColor(log.response.status)}`}>
                            {log.response.status} {log.response.statusText}
                          </div>
                          {showDetails && (
                            <div className="ml-4 text-gray-400">
                              <div>Version: {log.version}</div>
                              <div>Scenario: {log.scenario}</div>
                              <div>Response Time: {formatResponseTime(log.performance.request_time)}</div>
                              <div>Response Size: {log.performance.response_size} bytes</div>
                              <div className="mt-2">
                                <div className="text-blue-400">Response Body:</div>
                                <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(log.response.body, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {simulationLogs.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                      No simulation logs yet. Run a simulation to see the output.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSimulationEngine;
