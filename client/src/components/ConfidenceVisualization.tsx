import React from 'react';
import { ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ConfidenceVisualizationProps {
  data: {
    services: Array<{
      name: string;
      confidence: number;
      mandatory: boolean;
    }>;
    overall_confidence: number;
    processing_metrics?: {
      completeness: number;
      consistency: number;
      accuracy: number;
      reliability: number;
    };
  };
}

const ConfidenceVisualization: React.FC<ConfidenceVisualizationProps> = ({ data }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfienceTextColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Overall Confidence Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Confidence</h3>
          <SparklesIcon className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Confidence Score</span>
              <span className={`text-sm font-medium ${getConfienceTextColor(data.overall_confidence)}`}>
                {Math.round(data.overall_confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getConfidenceColor(data.overall_confidence)}`}
                style={{ width: `${data.overall_confidence * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className={`text-xs font-medium ${getConfienceTextColor(data.overall_confidence)}`}>
                {getConfidenceLabel(data.overall_confidence)}
              </span>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>
          
          <div className="ml-4 text-center">
            <div className={`text-3xl font-bold ${getConfienceTextColor(data.overall_confidence)}`}>
              {Math.round(data.overall_confidence * 100)}%
            </div>
            <div className="text-xs text-gray-500">Overall</div>
          </div>
        </div>
      </div>

      {/* Service Confidence Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Service Confidence</h3>
          <ChartBarIcon className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="space-y-4">
          {data.services.map((service, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{service.name}</span>
                  {service.mandatory && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Mandatory
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getConfienceTextColor(service.confidence)}`}>
                    {Math.round(service.confidence * 100)}%
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium ${getConfidenceColor(service.confidence)} text-white rounded`}>
                    {getConfidenceLabel(service.confidence)}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(service.confidence)}`}
                  style={{ width: `${service.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Metrics */}
      {data.processing_metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quality Metrics</h3>
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.processing_metrics).map(([metric, value]) => (
              <div key={metric} className="text-center">
                <div className={`text-2xl font-bold ${getConfienceTextColor(value as number)}`}>
                  {Math.round((value as number) * 100)}%
                </div>
                <div className="text-sm text-gray-600 capitalize">{metric.replace('_', ' ')}</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div
                    className={`h-1 rounded-full ${getConfidenceColor(value as number)}`}
                    style={{ width: `${(value as number) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h3>
        
        <div className="space-y-3">
          {['High', 'Medium', 'Low'].map((level, index) => {
            const threshold = level === 'High' ? 0.8 : level === 'Medium' ? 0.6 : 0;
            const nextThreshold = level === 'High' ? 1 : level === 'Medium' ? 0.8 : 0.6;
            const count = data.services.filter(s => 
              s.confidence >= threshold && s.confidence < nextThreshold
            ).length;
            const percentage = data.services.length > 0 ? (count / data.services.length) * 100 : 0;
            
            return (
              <div key={level} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-700">{level}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          level === 'High' ? 'bg-green-500' : 
                          level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Confidence Insights</h3>
        <div className="space-y-2">
          {data.overall_confidence >= 0.8 && (
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-blue-800">
                High overall confidence indicates reliable extraction results. Ready for implementation.
              </p>
            </div>
          )}
          
          {data.overall_confidence >= 0.6 && data.overall_confidence < 0.8 && (
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-sm text-blue-800">
                Moderate confidence. Consider manual review of low-confidence services before implementation.
              </p>
            </div>
          )}
          
          {data.overall_confidence < 0.6 && (
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <p className="text-sm text-blue-800">
                Low confidence detected. Recommend reprocessing with clearer requirements document.
              </p>
            </div>
          )}
          
          {data.services.some(s => s.mandatory && s.confidence < 0.7) && (
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm text-blue-800">
                Some mandatory services have low confidence. Pay special attention to these during implementation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceVisualization;
