import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { GeneratedConfig } from '../types/config';

interface SimulationProps {
  configs: GeneratedConfig[];
  onNext: () => void;
}

interface EnhancedSimulationResult {
  status: string;
  service: string;
  apiKeyUsed: string;
  responseTime: string;
  timestamp: string;
  data: any;
}

const Simulation: React.FC<SimulationProps> = ({ configs, onNext }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<EnhancedSimulationResult | null>(null);
  const [selectedService, setSelectedService] = useState('KYC');

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const payload = {
        name: "John Doe",
        dob: "1990-01-15",
        pan: "ABCDE1234F",
        email: "john.doe@example.com",
        phone: "+1234567890",
        amount: "1000.00"
      };

      const simulationResult = await apiService.runEnhancedSimulation(selectedService, payload);
      setResult(simulationResult);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4"
        >
          <PlayIcon className="w-8 h-8 text-purple-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Simulation Lab
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Test your integration configuration with mock API calls
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Running Simulation...
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5 mr-2" />
                Run Simulation
              </>
            )}
          </button>
        </div>

        {/* Service Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-field"
            disabled={isRunning}
          >
            <option value="KYC">KYC Verification</option>
            <option value="BUREAU">Credit Bureau</option>
            <option value="PAYMENTS">Payment Processing</option>
            <option value="OPEN_BANKING">Open Banking</option>
            <option value="GST">GST Verification</option>
            <option value="FRAUD">Fraud Detection</option>
          </select>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center mb-6">
              {result.status === 'success' ? (
                <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Success
                </div>
              ) : (
                <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Failed
                </div>
              )}
            </div>

            {/* Simulation Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <KeyIcon className="w-4 h-4 mr-1" />
                  API Key Used
                </div>
                <div className="font-mono text-sm">{result.apiKeyUsed}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Response Time
                </div>
                <div className="font-mono text-sm">{result.responseTime}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Service</div>
                <div className="font-mono text-sm">{result.service}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Response</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {result && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onNext}
            className="btn-primary px-8 py-3 text-lg"
          >
            Continue to Audit →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Simulation;
