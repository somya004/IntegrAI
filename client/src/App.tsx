import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import Hero from './components/Hero';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Simulation from './pages/Simulation';
import AuditLogs from './pages/AuditLogs';
import { useAppState } from './hooks/useAppState';
import { ThemeProvider } from './contexts/ThemeContext';
import MotionWrapper, { pageTransition } from './components/MotionWrapper';

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
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
          {/* Animated background blobs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
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
            <motion.div
              className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear"
              }}
            />
          </div>

          {/* Theme Toggle */}
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <ThemeToggle />
          </motion.div>

          {/* Navbar with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-white/20 dark:border-white/10"
          >
            <Navbar 
              selectedTenant={selectedTenant}
              onTenantChange={setSelectedTenant}
            />
          </motion.div>
          
          <div className="flex">
            {/* Sidebar with glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="backdrop-blur-xl bg-white/60 dark:bg-black/60 border-r border-white/20 dark:border-white/10"
            >
              <Sidebar 
                steps={steps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            </motion.div>
            
            {/* Main content area */}
            <main className="flex-1 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={pageTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="max-w-7xl mx-auto"
                >
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <MotionWrapper>
                          <Hero />
                        </MotionWrapper>
                      } 
                    />
                    <Route 
                      path="/upload" 
                      element={
                        <MotionWrapper>
                          <Upload onParsed={setParsedData} onNext={() => setCurrentStep('dashboard')} />
                        </MotionWrapper>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <MotionWrapper>
                          <Dashboard data={parsedData} onNext={() => setCurrentStep('builder')} />
                        </MotionWrapper>
                      } 
                    />
                    <Route 
                      path="/builder" 
                      element={
                        <MotionWrapper>
                          <Builder 
                            services={parsedData?.services || []} 
                            onConfigGenerated={setConfigs}
                            onNext={() => setCurrentStep('simulation')}
                          />
                        </MotionWrapper>
                      } 
                    />
                    <Route 
                      path="/simulation" 
                      element={
                        <MotionWrapper>
                          <Simulation 
                            configs={configs}
                            onNext={() => setCurrentStep('audit')}
                          />
                        </MotionWrapper>
                      } 
                    />
                    <Route 
                      path="/audit" 
                      element={
                        <MotionWrapper>
                          <AuditLogs selectedTenant={selectedTenant} />
                        </MotionWrapper>
                      } 
                    />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
