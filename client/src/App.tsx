import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Simulation from './pages/Simulation';
import AuditLogs from './pages/AuditLogs';
import { useAppState } from './hooks/useAppState';

const App: React.FC = () => {
  const { 
    currentStep, 
    setCurrentStep,
    parsedData,
    setParsedData,
    configs,
    setConfigs,
    selectedTenant,
    setSelectedTenant
  } = useAppState();

  const steps = [
    { id: 'upload', name: 'Upload', icon: '📄' },
    { id: 'dashboard', name: 'Dashboard', icon: '🔍' },
    { id: 'builder', name: 'Builder', icon: '⚙️' },
    { id: 'simulation', name: 'Test', icon: '🧪' },
    { id: 'audit', name: 'Audit', icon: '📊' }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          selectedTenant={selectedTenant}
          onTenantChange={setSelectedTenant}
        />
        
        <div className="flex">
          <Sidebar 
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
          
          <main className="flex-1 p-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              <Routes>
                <Route 
                  path="/" 
                  element={<Upload onParsed={setParsedData} onNext={() => setCurrentStep('dashboard')} />} 
                />
                <Route 
                  path="/upload" 
                  element={<Upload onParsed={setParsedData} onNext={() => setCurrentStep('dashboard')} />} 
                />
                <Route 
                  path="/dashboard" 
                  element={<Dashboard data={parsedData} onNext={() => setCurrentStep('builder')} />} 
                />
                <Route 
                  path="/builder" 
                  element={<Builder 
                    services={parsedData?.services || []} 
                    onConfigGenerated={setConfigs}
                    onNext={() => setCurrentStep('simulation')}
                  />} 
                />
                <Route 
                  path="/simulation" 
                  element={<Simulation 
                    configs={configs}
                    onNext={() => setCurrentStep('audit')}
                  />} 
                />
                <Route 
                  path="/audit" 
                  element={<AuditLogs selectedTenant={selectedTenant} />} 
                />
              </Routes>
            </motion.div>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
