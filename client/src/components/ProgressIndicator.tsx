import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const ProgressIndicator: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  const steps = [
    { id: 1, name: 'Requirement Parser', path: '/parser', completed: !!state.parsedData },
    { id: 2, name: 'Dashboard', path: '/dashboard', completed: !!state.parsedData },
    { id: 3, name: 'Registry', path: '/registry', completed: !!(state.selectedAdapters && state.selectedAdapters.length > 0) },
    { id: 4, name: 'Mapping', path: '/mapping', completed: !!(state.mappings && Object.keys(state.mappings).length > 0) },
    { id: 5, name: 'Config', path: '/config', completed: !!state.finalConfig },
    { id: 6, name: 'Simulation', path: '/simulation', completed: false }
  ];

  const getCurrentStep = () => {
    if (!state.parsedData) return 1;
    if (!state.selectedAdapters?.length) return 2;
    if (!state.mappings || Object.keys(state.mappings).length === 0) return 3;
    if (!state.finalConfig) return 4;
    return 5;
  };

  const currentStep = getCurrentStep();

  const handleStepClick = (step: typeof steps[0]) => {
    // Only allow navigating to completed steps or current step
    const stepIndex = steps.findIndex(s => s.id === step.id);
    if (stepIndex < currentStep - 1 || stepIndex === currentStep - 1) {
      navigate(step.path);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={index > currentStep - 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step.completed
                      ? 'bg-green-600 border-green-600 text-white'
                      : index === currentStep - 1
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  step.completed ? 'text-green-600' : index === currentStep - 1 ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 mx-4 h-1 ${
                  index < currentStep - 1 ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
