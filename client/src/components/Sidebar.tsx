// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

interface Step {
  id: string;
  name: string;
  icon: string;
}

interface SidebarProps {
  steps: Step[];
  currentStep: string;
  onStepChange: (step: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ steps, currentStep, onStepChange }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleStepClick = (stepId: string) => {
    onStepChange(stepId);
    navigate(`/${stepId === 'upload' ? '' : stepId}`);
  };

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-64 backdrop-blur-xl bg-white/60 dark:bg-black/60 border-r border-white/20 dark:border-white/10 min-h-screen">
      <div className="p-6">
        <motion.h2 
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Integration Flow
        </motion.h2>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <motion.button
                  onClick={() => handleStepClick(step.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105 hover:shadow-lg'
                  }`}
                  whileHover={{ scale: isCurrent ? 1.02 : 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    {/* Step Icon */}
                    <motion.div
                      className={`text-2xl ${
                        isCurrent ? 'animate-pulse' : ''
                      }`}
                      animate={isCurrent ? { 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: isCurrent ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      {step.icon}
                    </motion.div>
                    
                    {/* Step Content */}
                    <div className="flex-1">
                      <motion.p 
                        className={`font-medium ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        animate={isCurrent ? {
                          textShadow: [
                            "0 0 10px rgba(59, 130, 246, 0.5)",
                            "0 0 20px rgba(59, 130, 246, 0.3)",
                            "0 0 30px rgba(59, 130, 246, 0.1)"
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                      >
                        {step.name}
                      </motion.p>
                      
                      {/* Status Indicator */}
                      {isCompleted && (
                        <motion.div
                          className="flex items-center space-x-1 text-green-600 dark:text-green-400"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="text-xs">Completed</span>
                        </motion.div>
                      )}
                      
                      {isCurrent && (
                        <motion.div
                          className="flex items-center space-x-1 text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <ClockIcon className="w-4 h-4" />
                          <span className="text-xs">In Progress</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Line */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="absolute left-8 top-12 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: isCompleted ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  )}
                  
                  {/* Hover Glow Effect */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/20 dark:to-purple-600/20 pointer-events-none"
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round((steps.findIndex(s => s.id === currentStep) + 1) / steps.length * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(steps.findIndex(s => s.id === currentStep) + 1) / steps.length * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left text-xs text-gray-600 hover:text-primary-600 transition-colors">
              📚 View Documentation
            </button>
            <button className="w-full text-left text-xs text-gray-600 hover:text-primary-600 transition-colors">
              💬 Get Support
            </button>
            <button className="w-full text-left text-xs text-gray-600 hover:text-primary-600 transition-colors">
              🔄 Start New Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
