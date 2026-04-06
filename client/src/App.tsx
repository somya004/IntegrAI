import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ProgressIndicator from './components/ProgressIndicator';
import WorkflowContainer from './pages/WorkflowContainer';
import RequirementParser from './pages/RequirementParser';
import Dashboard from './pages/Dashboard';
import SimulationPage from './pages/SimulationPage';
import AuditLogs from './pages/AuditLogs';
import AdapterRegistry from './pages/AdapterRegistry';
import FieldMappingEnhanced from './pages/FieldMappingEnhanced';
import Config from './pages/Config';
import MultiTenantDashboard from './pages/MultiTenantDashboard';
import BusinessImpactDashboard from './pages/BusinessImpactDashboard';
import IntegrationRegistry from './pages/IntegrationRegistry';
import FinalOutput from './pages/FinalOutput';
import TenantProvider from './contexts/MultiTenantContext';
import { AppProvider, useAppContext } from './contexts/AppContext';

// Inner component that uses the context
const AppContent: React.FC = () => {
  const { state } = useAppContext();
  
  const [selectedTenant, setSelectedTenant] = useState('Demo Corp');
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ProgressIndicator />
        <Navbar 
          selectedTenant={selectedTenant}
          onTenantChange={setSelectedTenant}
        />
        
        <div className="w-full">
          <main className="w-full px-6 py-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
              <Routes>
                <Route path="/" element={<WorkflowContainer />} />
                <Route path="/workflow" element={<WorkflowContainer />} />
                <Route path="/parser" element={<RequirementParser />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/registry" element={<AdapterRegistry />} />
                <Route path="/field-mapping" element={<FieldMappingEnhanced />} />
                <Route path="/config" element={<Config />} />
                <Route path="/tenants" element={<MultiTenantDashboard />} />
                <Route path="/business" element={<BusinessImpactDashboard />} />
                <Route 
                  path="/audit" 
                  element={<AuditLogs selectedTenant={selectedTenant} />} 
                />
                <Route 
                  path="/simulation-engine" 
                  element={<SimulationPage onNext={() => {}} />} 
                />
              </Routes>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
};

// Main App component that provides the context
const App: React.FC = () => {
  return (
    <AppProvider>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </AppProvider>
  );
};

export default App;
