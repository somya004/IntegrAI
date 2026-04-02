// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { GeneratedConfig } from '../types/config';

interface SimulationEngineProps {
  configs?: GeneratedConfig[];
  onConfigGenerated?: (config: GeneratedConfig[]) => void;
}

const SimulationEngine: React.FC<SimulationEngineProps> = ({ configs, onConfigGenerated }) => {
  const [selectedConfig, setSelectedConfig] = useState<GeneratedConfig | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v2');
  const [testType, setTestType] = useState<string>('success');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const runTest = useCallback(async () => {
    if (!selectedConfig) return;
    
    setIsTestRunning(true);
    setTestResults([]);
    
    try {
      let result;
      switch (testType) {
        case 'success':
          result = {
            success: true,
            request: {
              endpoint: selectedConfig.endpoint,
              method: selectedConfig.method,
              headers: selectedConfig.headers,
              body: { test: 'data' }
            },
            response: {
              status: 200,
              data: {
                id: 'test_123',
                status: 'verified',
                timestamp: new Date().toISOString()
              }
            },
            timestamp: new Date().toISOString(),
            responseTime: Math.random() * 1000 + 500,
            metadata: {
              testType: 'success',
              configId: selectedConfig.id
            }
          };
          break;
          
        case 'error':
          result = {
            success: false,
            request: {
              endpoint: selectedConfig.endpoint,
              method: selectedConfig.method,
              headers: selectedConfig.headers,
              body: { test: 'data' }
            },
            response: {
              status: 500,
              error: 'Internal server error',
              data: null
            },
            timestamp: new Date().toISOString(),
            responseTime: Math.random() * 1000 + 2000,
            metadata: {
              testType: 'error',
              configId: selectedConfig.id,
              errorMessage: 'Failed to process request'
            }
          };
          break;
          
        default:
          result = {
            success: true,
            request: {
              endpoint: selectedConfig.endpoint,
              method: selectedConfig.method,
              headers: selectedConfig.headers,
              body: { test: 'data' }
            },
            response: {
              status: 200,
              data: {
                id: 'test_789',
                status: 'completed',
                timestamp: new Date().toISOString()
              }
            },
            timestamp: new Date().toISOString(),
            responseTime: Math.random() * 1000 + 300,
            metadata: {
              testType: 'default',
              configId: selectedConfig.id
            }
          };
      }
      
      setTestResults(prev => [...prev, result]);
      
      if (onConfigGenerated) {
        onConfigGenerated([...(configs || []), selectedConfig]);
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  }, [selectedConfig, testType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulation & Testing Engine</h1>
          <p className="text-gray-600">Test API configurations with mock responses and comprehensive logging</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            
            {(!configs || configs.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <CogIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
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
                      const config = configs.find(c => c.id === e.target.value);
                      setSelectedConfig(config || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose a configuration...</option>
                    {configs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name} ({config.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </motion.div>

          {selectedConfig && (
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="latency">Latency</option>
                    <option value="default">Default</option>
                  </select>
                </div>
                
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
              </div>

              <button
                onClick={runTest}
                disabled={isTestRunning || !selectedConfig}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isTestRunning ? 'Running Test...' : 'Run Test'}
              </button>
            </div>
          </motion.div>
          )}

          {testResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
              
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.success ? 'Success' : 'Error'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Response Time:</strong> {result.responseTime}ms
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Status:</strong> {result.response.status}
                  </div>
                  
                  {result.metadata && (
                    <div className="text-sm text-gray-600">
                      <strong>Test Type:</strong> {result.metadata.testType}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationEngine;
