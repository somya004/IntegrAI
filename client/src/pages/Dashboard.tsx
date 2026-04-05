import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  
  // Add debug logging
  React.useEffect(() => {
    console.log('📊 Dashboard - Global state parsedData:', state.parsedData);
    console.log('📊 Dashboard - Selected Adapters:', state.selectedAdapters);
    console.log('📊 Dashboard - Schemas:', state.schemas);
    console.log('📊 Dashboard - Mappings:', state.mappings);
  }, [state.parsedData, state.selectedAdapters, state.schemas, state.mappings]);

  if (!state.parsedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No data available. Please upload a document first.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Input
          </button>
        </div>
      </div>
    );
  }

  // Access parsed data from global state
  const parsedData = state.parsedData;
  
  // Use the actual parsed data structure
  const servicesDetected = parsedData?.services_detected || [];
  const fieldsDetected = parsedData?.fields_detected || [];
  const mandatoryServices = parsedData?.mandatory_services || [];
  const optionalServices = parsedData?.optional_services || [];
  const confidenceScore = parsedData?.confidence_score || 0;

  const getServiceIcon = (serviceName: string) => {
    const icons: { [key: string]: string } = {
      'KYC': '🔍',
      'GST': '📋',
      'Payment': '💳',
      'Fraud': '🛡️',
      'Compliance': '⚖️'
    };
    return icons[serviceName] || '📦';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Calculate counts as specified
  const totalServices = state.parsedData.services_detected?.length || 0;
  const totalFields = state.parsedData.fields_detected?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
        <p className="text-gray-600">Document analysis completed successfully</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Services</h3>
          <p className="text-3xl font-bold text-blue-600">{totalServices}</p>
          <p className="text-sm text-blue-700">Integration services detected</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Total Fields</h3>
          <p className="text-3xl font-bold text-green-600">{totalFields}</p>
          <p className="text-sm text-green-700">Data fields identified</p>
        </div>
      </div>

      {/* Detected Services */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detected Services</h2>
        <div className="flex flex-wrap gap-2">
          {state.parsedData.services_detected?.map((service: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Detected Fields */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detected Fields</h2>
        <div className="flex flex-wrap gap-2">
          {state.parsedData.fields_detected?.map((field: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => {
            navigate('/registry');
          }}
          className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium flex items-center"
        >
          Go to Integration Setup →
        </button>
      </div>
    </motion.div>
  );
};

export default Dashboard;
