import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ProgressIndicator from './components/ProgressIndicator';
import CreateIntegration from './pages/CreateIntegration';
import RequirementParser from './pages/RequirementParser';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Simulation from './pages/Simulation';
import SimulationPage from './pages/SimulationPage';
import AuditLogs from './pages/AuditLogs';
import AdapterRegistry from './pages/AdapterRegistry';
import FieldMapping from './pages/FieldMapping';
import FieldMappingEnhanced from './pages/FieldMappingEnhanced';
import Config from './pages/Config';
import MultiTenantDashboard from './pages/MultiTenantDashboard';
import EnhancedSimulation from './pages/EnhancedSimulation';
import SecurityAuditDashboard from './pages/SecurityAuditDashboard';
import BusinessImpactDashboard from './pages/BusinessImpactDashboard';
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
                <Route path="/" element={<RequirementParser />} />
                <Route path="/parser" element={<RequirementParser />} />
                <Route path="/create" element={<CreateIntegration />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/registry" element={<AdapterRegistry />} />
                <Route path="/mapping" element={<FieldMapping />} />
                <Route path="/field-mapping" element={<FieldMappingEnhanced />} />
                <Route path="/config" element={<Config />} />
                <Route path="/tenants" element={<MultiTenantDashboard />} />
                <Route path="/builder" element={<Builder services={[]} onConfigGenerated={() => {}} onNext={() => {}} />} />
                <Route path="/business" element={<BusinessImpactDashboard />} />
                <Route 
                  path="/audit" 
                  element={<AuditLogs selectedTenant={selectedTenant} />} 
                />
                <Route 
                  path="/simulation-engine" 
                  element={<Simulation configs={[]} onNext={() => {}} />} 
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
