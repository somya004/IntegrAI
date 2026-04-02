// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ParsedDocument } from '../types/config';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedCard from '../components/AnimatedCard';

interface DashboardProps {
  data: ParsedDocument | null;
  onNext: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNext }) => {
  const { isDark } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateTilt = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const tiltX = ((mousePosition.y - centerY) / rect.height) * 15;
    const tiltY = ((mousePosition.x - centerX) / rect.width) * -15;
    
    return { tiltX: Math.max(-15, Math.min(15, tiltX)), tiltY: Math.max(-15, Math.min(15, tiltY)) };
  };

  if (!data) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No data available. Please upload a document first.</p>
          </div>
        </motion.div>
      </div>
    );
  }

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
    if (confidence >= 80) return 'from-green-500 to-green-600';
    if (confidence >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-block">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Integration Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              AI-powered configuration management for your services
            </p>
          </div>
        </motion.div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'Total Services', value: data.services?.length || 0, icon: '🔧', color: 'blue' },
            { title: 'High Confidence', value: data.services?.filter(s => s.confidence >= 80).length || 0, icon: '✅', color: 'green' },
            { title: 'Medium Confidence', value: data.services?.filter(s => s.confidence >= 60 && s.confidence < 80).length || 0, icon: '⚠️', color: 'yellow' },
            { title: 'Low Confidence', value: data.services?.filter(s => s.confidence < 60).length || 0, icon: '❌', color: 'red' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <AnimatedCard glassmorphism={true}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  </div>
                  <motion.div
                    className="text-4xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {stat.icon}
                  </motion.div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>

        {/* Services Cards with 3D Tilt Effect */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {data.services?.map((service, index) => (
            <motion.div
              key={service.serviceName}
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="relative h-full"
                whileHover={{
                  rotateX: 0,
                  rotateY: 0,
                  scale: 1.05,
                  z: 50
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <AnimatedCard glassmorphism={true} gradient={true}>
                  {/* Service Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="text-3xl"
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        {getServiceIcon(service.serviceName)}
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {service.serviceName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {service.category} Service
                        </p>
                      </div>
                    </div>
                    
                    {/* Confidence Badge */}
                    <motion.div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceBg(service.confidence)}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className={`bg-gradient-to-r ${getConfidenceColor(service.confidence)} bg-clip-text text-transparent`}>
                        {service.confidence}% Confidence
                      </span>
                    </motion.div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    {/* API Endpoint */}
                    <div className="flex items-center space-x-2">
                      <RocketLaunchIcon className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">API Endpoint</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.apiEndpoint}</p>
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="flex items-center space-x-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentication</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.authentication}</p>
                      </div>
                    </div>

                    {/* Data Format */}
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Format</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.dataFormat}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <motion.button
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </motion.button>
                    
                    <motion.button
                      className="flex-1 px-4 py-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:scale-105 hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-2" />
                      Configure
                    </motion.button>
                  </div>

                  {/* Hover Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 pointer-events-none"
                    animate={{
                      opacity: [0.1, 0.3, 0.1],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </AnimatedCard>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center"
        >
          <AnimatedCard glassmorphism={true} className="max-w-2xl mx-auto">
            <div className="p-8">
              <motion.div
                className="flex items-center justify-center mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <SparklesIcon className="w-12 h-12 text-yellow-500 mr-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Ready to Configure
                </h2>
              </motion.div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your services have been analyzed and are ready for configuration. Let's build your integration workflows.
              </p>
              
              <motion.button
                onClick={onNext}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center">
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  Start Configuration
                </div>
                
                {/* Button Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0"
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </div>
          </AnimatedCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
