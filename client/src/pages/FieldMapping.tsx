import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  SparklesIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  mappingType: 'exact' | 'strong' | 'moderate' | 'weak';
  transformation: string | null;
}

interface MappingResponse {
  suggestions: FieldMapping[];
  totalSourceFields: number;
  totalTargetFields: number;
  mappedFields: number;
  unmappedSource: string[];
  unmappedTarget: string[];
}

const FieldMappingEngine: React.FC = () => {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<string[]>([]);
  const [sourceInput, setSourceInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [confirmedMappings, setConfirmedMappings] = useState<FieldMapping[]>([]);
  const [threshold, setThreshold] = useState(0.3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showTransformations, setShowTransformations] = useState(true);

  // Sample data for testing
  const loadSampleData = () => {
    const sampleSource = [
      'customer_name',
      'dob',
      'pan_number',
      'email_address',
      'phone_number',
      'permanent_address',
      'annual_income',
      'company_name',
      'job_title'
    ];
    
    const sampleTarget = [
      'fullName',
      'date_of_birth',
      'pan',
      'email',
      'mobile',
      'address',
      'income',
      'organization',
      'position'
    ];
    
    setSourceFields(sampleSource);
    setTargetFields(sampleTarget);
    setSourceInput(sampleSource.join('\n'));
    setTargetInput(sampleTarget.join('\n'));
  };

  // Generate mapping suggestions
  const generateMappings = useCallback(async () => {
    if (sourceFields.length === 0 || targetFields.length === 0) {
      setError('Please provide both source and target fields');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5004/suggest-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceFields,
          targetFields,
          threshold
        }),
      });

      if (!response.ok) {
        throw new Error('Mapping service unavailable');
      }

      const result = await response.json();
      if (result.success) {
        setMappings(result.data.suggestions);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate mappings');
    } finally {
      setIsGenerating(false);
    }
  }, [sourceFields, targetFields, threshold]);

  // Parse input fields
  const parseFields = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  // Handle source input change
  const handleSourceInputChange = (value: string) => {
    setSourceInput(value);
    const fields = parseFields(value);
    setSourceFields(fields);
  };

  // Handle target input change
  const handleTargetInputChange = (value: string) => {
    setTargetInput(value);
    const fields = parseFields(value);
    setTargetFields(fields);
  };

  // Update mapping target field
  const updateMappingTarget = (index: number, newTarget: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index].targetField = newTarget;
    setMappings(updatedMappings);
  };

  // Remove mapping
  const removeMapping = (index: number) => {
    const updatedMappings = mappings.filter((_, i) => i !== index);
    setMappings(updatedMappings);
  };

  // Add manual mapping
  const addManualMapping = () => {
    const unmappedSource = sourceFields.filter(f => 
      !mappings.find(m => m.sourceField === f) && 
      !confirmedMappings.find(m => m.sourceField === f)
    );
    const unmappedTarget = targetFields.filter(f => 
      !mappings.find(m => m.targetField === f) && 
      !confirmedMappings.find(m => m.targetField === f)
    );

    if (unmappedSource.length > 0 && unmappedTarget.length > 0) {
      const newMapping: FieldMapping = {
        sourceField: unmappedSource[0],
        targetField: unmappedTarget[0],
        confidence: 0.5,
        mappingType: 'moderate',
        transformation: 'case_normalization'
      };
      setMappings([...mappings, newMapping]);
    }
  };

  // Confirm all mappings
  const confirmMappings = () => {
    setConfirmedMappings([...confirmedMappings, ...mappings]);
    setMappings([]);
  };

  // Clear all mappings
  const clearMappings = () => {
    setMappings([]);
    setConfirmedMappings([]);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.7) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Get mapping type icon
  const getMappingTypeIcon = (type: string) => {
    switch (type) {
      case 'exact': return CheckCircleIcon;
      case 'strong': return LinkIcon;
      case 'moderate': return CogIcon;
      case 'weak': return ExclamationTriangleIcon;
      default: return LinkIcon;
    }
  };

  // Get transformation display
  const getTransformationDisplay = (transformation: string | null) => {
    if (!transformation) return 'None';
    
    const displays: { [key: string]: string } = {
      'snake_to_camel': 'Camel Case',
      'camel_to_snake': 'Snake Case',
      'spaces_to_underscores': 'Spaces → Underscores',
      'underscores_to_spaces': 'Underscores → Spaces',
      'case_normalization': 'Case Normalization'
    };
    
    return displays[transformation] || transformation;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Field Mapping Suggestion Engine</h1>
          <p className="text-gray-600">AI-powered field mapping with fuzzy matching and transformation suggestions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Source Fields */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Source Fields</h2>
                <span className="text-sm text-gray-500">{sourceFields.length} fields</span>
              </div>
              
              <textarea
                value={sourceInput}
                onChange={(e) => handleSourceInputChange(e.target.value)}
                placeholder="Enter source fields (one per line)&#10;customer_name&#10;dob&#10;pan_number"
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            {/* Target Fields */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Target Fields</h2>
                <span className="text-sm text-gray-500">{targetFields.length} fields</span>
              </div>
              
              <textarea
                value={targetInput}
                onChange={(e) => handleTargetInputChange(e.target.value)}
                placeholder="Enter target fields (one per line)&#10;fullName&#10;date_of_birth&#10;pan"
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapping Controls</h3>
              
              <div className="space-y-4">
                {/* Threshold Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Threshold: {threshold.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More matches</span>
                    <span>Better matches</span>
                  </div>
                </div>

                {/* Show Transformations Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-transformations"
                    checked={showTransformations}
                    onChange={(e) => setShowTransformations(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="show-transformations" className="text-sm text-gray-700">
                    Show transformation suggestions
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={loadSampleData}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Load Sample
                  </button>
                  <button
                    onClick={generateMappings}
                    disabled={isGenerating || sourceFields.length === 0 || targetFields.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Generate Mappings
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Mapping Suggestions */}
            {(mappings.length > 0 || confirmedMappings.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mapping Suggestions</h3>
                  <div className="flex space-x-2">
                    {mappings.length > 0 && (
                      <>
                        <button
                          onClick={addManualMapping}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Add Manual
                        </button>
                        <button
                          onClick={confirmMappings}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Confirm All
                        </button>
                      </>
                    )}
                    <button
                      onClick={clearMappings}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Confirmed Mappings */}
                  {confirmedMappings.map((mapping, index) => (
                    <div
                      key={`confirmed-${index}`}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                              {mapping.sourceField}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-green-600" />
                            <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                              {mapping.targetField}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(mapping.confidence)}`}>
                              {(mapping.confidence * 100).toFixed(0)}% match
                            </span>
                            {showTransformations && mapping.transformation && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {getTransformationDisplay(mapping.transformation)}
                              </span>
                            )}
                          </div>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  ))}

                  {/* Suggested Mappings */}
                  {mappings.map((mapping, index) => (
                    <div
                      key={`suggested-${index}`}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {mapping.sourceField}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-gray-600" />
                            <input
                              type="text"
                              value={mapping.targetField}
                              onChange={(e) => updateMappingTarget(index, e.target.value)}
                              className="font-mono text-sm bg-blue-100 px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(mapping.confidence)}`}>
                              {(mapping.confidence * 100).toFixed(0)}% match
                            </span>
                            {showTransformations && mapping.transformation && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {getTransformationDisplay(mapping.transformation)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const Icon = getMappingTypeIcon(mapping.mappingType);
                            return <Icon className="w-5 h-5 text-gray-600" />;
                          })()}
                          <button
                            onClick={() => removeMapping(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <EyeSlashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmapped Fields */}
            {(mappings.length > 0 || confirmedMappings.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unmapped Fields</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Unmapped Source Fields</h4>
                    <div className="space-y-1">
                      {sourceFields
                        .filter(f => !mappings.find(m => m.sourceField === f) && !confirmedMappings.find(m => m.sourceField === f))
                        .map(field => (
                          <span key={field} className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs mr-1 mb-1">
                            {field}
                          </span>
                        ))}
                      {sourceFields.filter(f => !mappings.find(m => m.sourceField === f) && !confirmedMappings.find(m => m.sourceField === f)).length === 0 && (
                        <p className="text-gray-500 text-sm">All source fields mapped</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Unmapped Target Fields</h4>
                    <div className="space-y-1">
                      {targetFields
                        .filter(f => !mappings.find(m => m.targetField === f) && !confirmedMappings.find(m => m.targetField === f))
                        .map(field => (
                          <span key={field} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs mr-1 mb-1">
                            {field}
                          </span>
                        ))}
                      {targetFields.filter(f => !mappings.find(m => m.targetField === f) && !confirmedMappings.find(m => m.targetField === f)).length === 0 && (
                        <p className="text-gray-500 text-sm">All target fields mapped</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {mappings.length === 0 && confirmedMappings.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <LinkIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Mappings Yet</h3>
                <p className="text-gray-600">Enter source and target fields, then generate mapping suggestions</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FieldMappingEngine;
