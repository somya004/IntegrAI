import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  WrenchScrewdriverIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { Service, GeneratedConfig } from '../types/config';

interface BuilderProps {
  services: Service[];
  onConfigGenerated: (configs: GeneratedConfig[]) => void;
  onNext: () => void;
}

const Builder: React.FC<BuilderProps> = ({ services, onConfigGenerated, onNext }) => {
  const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
  const [fieldMappings, setFieldMappings] = useState<{ [key: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [configs, setConfigs] = useState<GeneratedConfig[]>([]);

  const versions: { [key: string]: string[] } = {
    'KYC': ['v1', 'v2'],
    'GST': ['v1'],
    'Payment': ['v1', 'v2', 'v3'],
    'Fraud': ['v1', 'v2']
  };

  const defaultMappings: { [key: string]: { [key: string]: string } } = {
    'KYC': {
      'name': 'fullName',
      'dob': 'dateOfBirth',
      'pan': 'panNumber',
      'email': 'emailAddress',
      'phone': 'phoneNumber'
    },
    'GST': {
      'name': 'businessName',
      'pan': 'panCard',
      'email': 'emailId',
      'phone': 'mobileNumber'
    },
    'Payment': {
      'name': 'customerName',
      'email': 'email',
      'phone': 'contactNumber',
      'amount': 'transactionAmount'
    },
    'Fraud': {
      'name': 'userName',
      'dob': 'birthDate',
      'pan': 'permanentAccountNumber',
      'email': 'mailAddress'
    }
  };

  React.useEffect(() => {
    // Set default versions
    const defaults: { [key: string]: string } = {};
    services.forEach(service => {
      defaults[service.name] = versions[service.name]?.[0] || 'v1';
    });
    setSelectedVersions(defaults);

    // Set default mappings
    const mappings: { [key: string]: string } = {};
    services.forEach(service => {
      const serviceMappings = defaultMappings[service.name] || {};
      Object.entries(serviceMappings).forEach(([clientField, apiField]) => {
        mappings[`${service.name}_${clientField}`] = apiField;
      });
    });
    setFieldMappings(mappings);
  }, [services]);

  const handleVersionChange = (service: string, version: string) => {
    setSelectedVersions(prev => ({ ...prev, [service]: version }));
  };

  const handleMappingChange = (key: string, value: string) => {
    setFieldMappings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateConfig = async () => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateConfig({
        services,
        selectedVersions,
        fieldMappings
      });
      setConfigs(result.configs);
      onConfigGenerated(result.configs);
    } catch (error) {
      console.error('Error generating config:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadConfig = () => {
    const dataStr = JSON.stringify(configs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `config_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
        >
          <WrenchScrewdriverIcon className="w-8 h-8 text-blue-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Integration Builder
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configure adapters and field mappings for your detected services
        </p>
      </div>

      <div className="space-y-6">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">{service.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name} Service</h3>
                  <p className="text-sm text-gray-500">Configuration</p>
                </div>
              </div>
              {service.mandatory && (
                <span className="status-badge status-error">Mandatory</span>
              )}
            </div>

            {/* Version Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Version
              </label>
              <select
                value={selectedVersions[service.name] || ''}
                onChange={(e) => handleVersionChange(service.name, e.target.value)}
                className="input-field"
              >
                {versions[service.name]?.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Mappings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Field Mappings</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Client Field</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">API Field</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['name', 'dob', 'pan', 'email', 'phone'].map((field) => {
                      const mappingKey = `${service.name}_${field}`;
                      const mappedField = fieldMappings[mappingKey] || '';
                      const isAutoMapped = mappedField !== '';
                      
                      return (
                        <tr key={field} className="border-b border-gray-100">
                          <td className="py-3 px-3">
                            <span className="text-gray-900 font-mono text-sm">{field}</span>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={mappedField}
                              onChange={(e) => handleMappingChange(mappingKey, e.target.value)}
                              className={`input-field text-sm ${isAutoMapped ? 'border-green-300' : 'border-gray-300'}`}
                              placeholder="API field name"
                            />
                          </td>
                          <td className="py-3 px-3">
                            {isAutoMapped ? (
                              <span className="status-badge status-success">Auto-mapped</span>
                            ) : (
                              <span className="status-badge status-warning">Manual</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={handleGenerateConfig}
          disabled={isGenerating}
          className="btn-primary px-8 py-3 text-lg disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Configuration'}
        </button>
        
        {configs.length > 0 && (
          <button
            onClick={handleDownloadConfig}
            className="btn-secondary px-6 py-3 text-lg"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2 inline" />
            Download JSON
          </button>
        )}
      </div>

      {/* Generated Config Preview */}
      {configs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Configuration</h3>
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          </div>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(configs, null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Next Button */}
      {configs.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onNext}
            className="btn-primary px-8 py-3 text-lg"
          >
            Continue to Simulation →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Builder;
