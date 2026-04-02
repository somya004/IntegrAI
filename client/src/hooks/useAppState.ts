import { useState, useCallback } from 'react';
import { GeneratedConfig, ParsedDocument, SimulationResult } from '../types/config';

export const useAppState = () => {
  const [currentStep, setCurrentStep] = useState<string>('upload');
  const [selectedTenant, setSelectedTenant] = useState<string>('Demo Corp');
  const [parsedData, setParsedData] = useState<ParsedDocument | null>(null);
  const [configs, setConfigs] = useState<GeneratedConfig[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  const resetFlow = useCallback(() => {
    setCurrentStep('upload');
    setParsedData(null);
    setConfigs([]);
    setSimulationResults([]);
  }, []);

  const canProceedToStep = useCallback((step: string): boolean => {
    switch (step) {
      case 'dashboard':
        return !!parsedData;
      case 'builder':
        return !!parsedData && parsedData.services.length > 0;
      case 'simulation':
        return configs.length > 0;
      case 'audit':
        return true;
      default:
        return true;
    }
  }, [parsedData, configs]);

  return {
    // State
    currentStep,
    selectedTenant,
    parsedData,
    configs,
    simulationResults,
    
    // Setters
    setCurrentStep,
    setSelectedTenant,
    setParsedData,
    setConfigs,
    setSimulationResults,
    
    // Actions
    resetFlow,
    canProceedToStep
  };
};
