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
import AdapterRegistry from './pages/AdapterRegistry';
import FieldMapping from './pages/FieldMapping';
import MultiTenantDashboard from './pages/MultiTenantDashboard';
import EnhancedSimulation from './pages/EnhancedSimulation';
import SecurityAuditDashboard from './pages/SecurityAuditDashboard';
import BusinessImpactDashboard from './pages/BusinessImpactDashboard';
import { useAppState } from './hooks/useAppState';
import TenantProvider from './contexts/MultiTenantContext';

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
    { id: 'registry', name: 'Registry', icon: '🔌' },
    { id: 'mapping', name: 'Mapping', icon: '🔗' },
    { id: 'tenants', name: 'Tenants', icon: '🏢' },
    { id: 'simulation', name: 'Simulation', icon: '🧪' },
    { id: 'enhanced-sim', name: 'Enhanced Sim', icon: '⚡' },
    { id: 'security', name: 'Security', icon: '🔐' },
    { id: 'business', name: 'Business', icon: '📈' },
    { id: 'builder', name: 'Builder', icon: '⚙️' },
    { id: 'audit', name: 'Audit', icon: '📊' }
  ];

  return (
    <TenantProvider>
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
                    element={<Dashboard data={parsedData} onNext={() => setCurrentStep('registry')} />} 
                  />
                  <Route 
                    path="/registry" 
                    element={<AdapterRegistry />} 
                  />
                  <Route 
                    path="/mapping" 
                    element={<FieldMapping />} 
                  />
                  <Route 
                    path="/tenants" 
                    element={<MultiTenantDashboard />} 
                  />
                  <Route 
                    path="/builder" 
                    element={<Builder services={parsedData?.services || []} onConfigGenerated={setConfigs} onNext={() => setCurrentStep('simulation')} />} 
                  />
                  <Route 
                    path="/simulation" 
                    element={<Simulation 
                      configs={configs}
                      onNext={() => setCurrentStep('enhanced-sim')}
                    />} 
                  />
                  <Route 
                    path="/enhanced-sim" 
                    element={<EnhancedSimulation />} 
                  />
                  <Route 
                    path="/security" 
                    element={<SecurityAuditDashboard />} 
                  />
                  <Route 
                    path="/business" 
                    element={<BusinessImpactDashboard />} 
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
    </TenantProvider>
  );
};

export default App;
