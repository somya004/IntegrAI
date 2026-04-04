import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

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
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Integration Flow</h2>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = status === 'completed' || status === 'current';
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isClickable && handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center w-full text-left transition-colors ${
                    isClickable 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    {/* Step Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : status === 'current'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : status === 'current' ? (
                        <ClockIcon className="w-5 h-5" />
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>
                    
                    {/* Step Name */}
                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${
                        status === 'current' 
                          ? 'text-primary-600' 
                          : status === 'completed'
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}>
                        {step.name}
                      </p>
                      {status === 'current' && (
                        <p className="text-xs text-gray-500">In Progress</p>
                      )}
                      {status === 'completed' && (
                        <p className="text-xs text-green-500">Completed</p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
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
