import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface ComparisonData {
  manual: number;
  ai: number;
  improvement: number;
}

interface ChartData {
  label: string;
  manual: number;
  ai: number;
}

const BusinessImpactDashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: number }>({});

  // Mock metrics data
  const metrics: MetricCard[] = [
    {
      title: 'Integration Time',
      value: '70%',
      change: 70,
      changeType: 'increase',
      icon: ClockIcon,
      color: 'blue',
      description: 'Faster API integration setup'
    },
    {
      title: 'Error Reduction',
      value: '50%',
      change: 50,
      changeType: 'decrease',
      icon: ExclamationTriangleIcon,
      color: 'red',
      description: 'Fewer configuration errors'
    },
    {
      title: 'Onboarding Speed',
      value: '60%',
      change: 60,
      changeType: 'increase',
      icon: RocketLaunchIcon,
      color: 'green',
      description: 'Quicker team onboarding'
    },
    {
      title: 'Time Saved',
      value: '45 hrs/week',
      change: 45,
      changeType: 'increase',
      icon: ArrowTrendingUpIcon,
      color: 'purple',
      description: 'Productivity hours recovered'
    },
    {
      title: 'Cost Savings',
      value: '$125K',
      change: 125000,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      description: 'Annual operational savings'
    },
    {
      title: 'Team Efficiency',
      value: '85%',
      change: 85,
      changeType: 'increase',
      icon: UserGroupIcon,
      color: 'indigo',
      description: 'Overall team productivity'
    }
  ];

  // Comparison data
  const comparisons: { [key: string]: ComparisonData } = {
    integrationTime: {
      manual: 120,
      ai: 36,
      improvement: 70
    },
    errorRate: {
      manual: 25,
      ai: 12.5,
      improvement: 50
    },
    onboardingDays: {
      manual: 30,
      ai: 12,
      improvement: 60
    },
    deploymentHours: {
      manual: 8,
      ai: 2,
      improvement: 75
    }
  };

  // Chart data for visualizations
  const chartData: ChartData[] = [
    { label: 'Setup Time', manual: 120, ai: 36 },
    { label: 'Error Rate', manual: 25, ai: 12.5 },
    { label: 'Onboarding', manual: 30, ai: 12 },
    { label: 'Deployment', manual: 8, ai: 2 },
    { label: 'Maintenance', manual: 15, ai: 5 }
  ];

  // Animate values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const newValues: { [key: string]: number } = {};
      metrics.forEach((metric, index) => {
        setTimeout(() => {
          newValues[metric.title] = metric.change;
          setAnimatedValues(prev => ({ ...prev, [metric.title]: metric.change }));
        }, index * 200);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; icon: string } } = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
      red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-500' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'text-indigo-500' }
    };
    return colorMap[color] || colorMap.blue;
  };

  const renderMetricCard = (metric: MetricCard, index: number) => {
    const colors = getColorClasses(metric.color);
    const Icon = metric.icon;
    const currentValue = animatedValues[metric.title] || 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            metric.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {metric.changeType === 'increase' ? (
              <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
            )}
            {currentValue}%
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
        <p className="text-sm font-medium text-gray-900 mb-2">{metric.title}</p>
        <p className="text-xs text-gray-500">{metric.description}</p>
      </motion.div>
    );
  };

  const renderComparisonCard = (title: string, data: ComparisonData, index: number) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Manual Process</span>
          <span className="text-lg font-bold text-gray-900">{data.manual}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">AI-Powered</span>
          <span className="text-lg font-bold text-green-600">{data.ai}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Improvement</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600 mr-2">{data.improvement}%</span>
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderBarChart = (data: ChartData[], index: number) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.manual, d.ai)));
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 + index * 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Performance Comparison</h4>
        
        <div className="space-y-4">
          {data.map((item, itemIndex) => (
            <div key={itemIndex} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">Manual: {item.manual}</span>
                  <span className="text-green-600">AI: {item.ai}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 h-8">
                <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 rounded-lg transition-all duration-1000 ease-out"
                    style={{ width: `${(item.manual / maxValue) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-green-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-lg transition-all duration-1000 ease-out"
                    style={{ width: `${(item.ai / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
              <span className="text-gray-600">Manual Process</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-green-600">AI-Powered</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Business Impact Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600"
          >
            Measurable ROI and efficiency gains from ConfigAI implementation
          </motion.p>
        </div>

        {/* Timeframe Selector */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex justify-center"
        >
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {(['7d', '30d', '90d'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {timeframe === '7d' ? 'Last 7 Days' : timeframe === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => renderMetricCard(metric, index))}
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6">
            {renderComparisonCard('Integration Time (Hours)', comparisons.integrationTime, 0)}
            {renderComparisonCard('Error Rate (%)', comparisons.errorRate, 1)}
          </div>
          
          <div className="space-y-6">
            {renderComparisonCard('Onboarding (Days)', comparisons.onboardingDays, 2)}
            {renderComparisonCard('Deployment (Hours)', comparisons.deploymentHours, 3)}
          </div>
        </div>

        {/* Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderBarChart(chartData, 0)}
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Key Achievements</h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">70% Time Savings</p>
                  <p className="text-sm text-green-700">Across all integration processes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">50% Error Reduction</p>
                  <p className="text-sm text-blue-700">Fewer configuration mistakes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <RocketLaunchIcon className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900">60% Faster Onboarding</p>
                  <p className="text-sm text-purple-700">New team members productive faster</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900">$125K Annual Savings</p>
                  <p className="text-sm text-yellow-700">Reduced operational costs</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">ConfigAI Business Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">70%</div>
                <div className="text-blue-100">Faster Integration</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50%</div>
                <div className="text-blue-100">Error Reduction</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">60%</div>
                <div className="text-blue-100">Quick Onboarding</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$125K</div>
                <div className="text-blue-100">Annual Savings</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessImpactDashboard;
