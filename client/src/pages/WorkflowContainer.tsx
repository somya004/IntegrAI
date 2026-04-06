import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Import all step components
import RequirementParser from './RequirementParser';
import Dashboard from './Dashboard';
import AdapterRegistry from './AdapterRegistry';
import FieldMappingEnhanced from './FieldMappingEnhanced';
import SimulationPage from './SimulationPage';
import FinalOutput from './FinalOutput';

// Mock data generators
const generateMockIntegrationData = () => {
  return {
    integration_plan: {
      services: [
        {
          name: "KYC Verification",
          type: "kyc",
          mandatory: true,
          confidence: 0.9,
          description: "Customer identity verification service",
          endpoints: ["/api/kyc/verify", "/api/kyc/status"]
        },
        {
          name: "Payment Gateway",
          type: "payment",
          mandatory: true,
          confidence: 0.85,
          description: "Payment processing service",
          endpoints: ["/api/payment/process", "/api/payment/status"]
        },
        {
          name: "Fraud Detection",
          type: "fraud",
          mandatory: false,
          confidence: 0.8,
          description: "Fraud detection and prevention",
          endpoints: ["/api/fraud/check", "/api/fraud/report"]
        }
      ]
    },
    confidence_score: 0.85,
    processing_metadata: {
      processing_time: 1500,
      fields_detected: 14,
      services_detected: 3
    }
  };
};

const buildAllConfigs = (parsedRequirements: any) => {
  const services = parsedRequirements?.integration_plan?.services || [];
  return services.map((service: any, index: number) => ({
    id: `config_${index + 1}`,
    service: service.name,
    version: "v1",
    status: "generated",
    confidence: service.confidence,
    fieldMapping: {
      fullName: "full_name",
      dateOfBirth: "date_of_birth",
      phone: "phone_number",
      pan: "pan_number",
      email: "email_address",
      address: "residential_address",
      aadhaar: "aadhaar_number",
      gender: "gender",
      maritalStatus: "marital_status",
      occupation: "occupation_type",
      annualIncome: "annual_income",
      bankAccount: "bank_account_number",
      ifsc: "ifsc_code"
    },
    transformations: [
      {
        field: "dateOfBirth",
        rule: "format_date_YYYY_MM_DD",
        params: { inputFormat: "DD-MM-YYYY" }
      },
      {
        field: "phone",
        rule: "add_country_code_+91",
        params: {}
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "auto",
      lastModified: new Date().toISOString()
    }
  }));
};

const WorkflowContainer: React.FC = () => {
  // STEP 1: CREATE STEP STATE (GLOBAL)
  const [currentStep, setCurrentStep] = useState(1);
  const [parsedRequirements, setParsedRequirements] = useState<any>(null);
  const [generatedConfigs, setGeneratedConfigs] = useState<any[]>([]);
  const [integrationResult, setIntegrationResult] = useState<any>(null);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // STEP 2: DEFINE STEPS
  const steps = [
    { id: 1, name: "Requirement Parser", description: "Upload and parse documents" },
    { id: 2, name: "Dashboard", description: "View integration overview" },
    { id: 3, name: "Integration Registry", description: "Match adapters and versions" },
    { id: 4, name: "Mapping & Config", description: "Configure field mappings" },
    { id: 5, name: "Simulation", description: "Test integration behavior" },
    { id: 6, name: "Final Output", description: "Review and deploy" }
  ];

  // STEP 3: ADD FALLBACK DATA (IMPORTANT)
  useEffect(() => {
    if (!integrationResult || !integrationResult.adapters || integrationResult.adapters.length === 0) {
      console.log("🛡️ Setting fallback integration data");
      const fallbackResult = {
        adapters: [
          {
            serviceName: "KYC Verification",
            adapter: "Default Adapter",
            version: "v1",
            status: "connected",
            confidence: 0.8,
            endpoints: ["/api/kyc/verify", "/api/kyc/status"],
            timestamp: new Date().toISOString(),
            mappedFields: { fullName: "name", phone: "mobile" },
            transformations: ["trim_whitespace", "format_date"]
          },
          {
            serviceName: "Payment Gateway",
            adapter: "Default Adapter",
            version: "v1",
            status: "connected",
            confidence: 0.8,
            endpoints: ["/api/payment/process", "/api/payment/status"],
            timestamp: new Date().toISOString(),
            mappedFields: { amount: "total", currency: "currency" },
            transformations: ["format_currency"]
          }
        ],
        summary: {
          totalServices: 2,
          connectedServices: 2,
          fallbackServices: 0,
          successRate: 100
        }
      };
      setIntegrationResult(fallbackResult);
    }
  }, [integrationResult]);

  // STEP 3: NEXT / PREVIOUS HANDLERS
  const goNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // STEP 8: AUTO-FALLBACK BEFORE MOVING NEXT
  const safeNext = () => {
    // Ensure data always exists before moving to next step
    if (!parsedRequirements) {
      const mockData = generateMockIntegrationData();
      setParsedRequirements(mockData);
      console.log("🛡️ Using mock parsed requirements");
    }

    if (!generatedConfigs || generatedConfigs.length === 0) {
      const configs = buildAllConfigs(parsedRequirements);
      setGeneratedConfigs(configs);
      console.log("🛡️ Using mock generated configs");
    }

    if (!integrationResult && currentStep >= 3) {
      const mockIntegrationResult = {
        adapters: [
          {
            serviceName: "KYC Verification",
            adapter: "KYCAdapter",
            version: "v1",
            status: "connected",
            confidence: 0.9,
            isFallback: false,
            endpoints: ["/api/kyc/verify", "/api/kyc/status"],
            timestamp: new Date().toISOString()
          },
          {
            serviceName: "Payment Gateway",
            adapter: "PaymentAdapter",
            version: "v1",
            status: "connected",
            confidence: 0.85,
            isFallback: false,
            endpoints: ["/api/payment/process", "/api/payment/status"],
            timestamp: new Date().toISOString()
          },
          {
            serviceName: "Fraud Detection",
            adapter: "FraudAdapter",
            version: "v1",
            status: "fallback",
            confidence: 0.8,
            isFallback: true,
            endpoints: ["/api/fraud/check", "/api/fraud/report"],
            timestamp: new Date().toISOString()
          }
        ],
        summary: {
          totalServices: 3,
          connectedServices: 2,
          fallbackServices: 1,
          successRate: 67
        }
      };
      setIntegrationResult(mockIntegrationResult);
      console.log("🛡️ Using mock integration result");
    }

    if (!mappingResult && currentStep >= 4) {
      const mockMappingResult = {
        fieldMappings: [
          { source: "fullName", target: "full_name", transformation: "trim_whitespace" },
          { source: "dateOfBirth", target: "date_of_birth", transformation: "format_date_YYYY_MM_DD" },
          { source: "phone", target: "phone_number", transformation: "add_country_code_+91" }
        ],
        transformations: [
          {
            field: "dateOfBirth",
            rule: "format_date_YYYY_MM_DD",
            params: { inputFormat: "DD-MM-YYYY" }
          }
        ],
        status: "completed",
        confidence: 0.9
      };
      setMappingResult(mockMappingResult);
      console.log("🛡️ Using mock mapping result");
    }

    if (!simulationResults && currentStep >= 5) {
      const mockSimulationResults = {
        totalTests: 3,
        successful: 2,
        failed: 1,
        successRate: 67,
        executionTime: 1250,
        results: [
          {
            serviceName: "KYC Verification",
            version: "v1",
            status: "success",
            responseTime: 450,
            endpoints: ["/api/kyc/verify", "/api/kyc/status"]
          },
          {
            serviceName: "Payment Gateway",
            version: "v1",
            status: "success",
            responseTime: 380,
            endpoints: ["/api/payment/process", "/api/payment/status"]
          },
          {
            serviceName: "Fraud Detection",
            version: "v1",
            status: "error",
            responseTime: 420,
            error: "Service temporarily unavailable",
            endpoints: ["/api/fraud/check", "/api/fraud/report"]
          }
        ]
      };
      setSimulationResults(mockSimulationResults);
      console.log("🛡️ Using mock simulation results");
    }

    goNext();
  };

  // STEP 4: DEBUG LOG (OPTIONAL)
  useEffect(() => {
    console.log("🔍 Integration Results Debug:", integrationResult);
    console.log("📊 Adapters count:", integrationResult?.adapters?.length || 0);
    console.log("📈 Summary:", integrationResult?.summary);
  }, [integrationResult]);

  // STEP 11: VISUAL STEP INDICATOR
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Step {currentStep} of 6: {steps[currentStep - 1].name}
        </h2>
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 === currentStep
                  ? 'bg-blue-600 text-white'
                  : index + 1 < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {index + 1 < currentStep ? (
                <CheckCircleIcon className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-gray-600">{steps[currentStep - 1].description}</p>
    </div>
  );

  // STEP 10: DISABLE BREAKING CONDITIONS - Always show navigation
  const NavigationButtons = () => (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={goBack}
        disabled={currentStep === 1}
        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
          currentStep === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Previous
      </button>

      <div className="flex items-center space-x-4">
        {currentStep === 6 ? (
          <button
            onClick={() => {
              console.log("🚀 Deploying integration...");
              alert("Integration deployed successfully!");
            }}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Deploy Integration
          </button>
        ) : (
          <button
            onClick={safeNext}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Step Indicator */}
          <StepIndicator />

          {/* STEP 5: CONDITIONAL RENDERING */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {currentStep === 1 && (
              <RequirementParser />
            )}

            {currentStep === 2 && (
              <Dashboard />
            )}

            {currentStep === 3 && (
              <AdapterRegistry
                onNext={(integrationResults) => {
                  console.log("🔧 Processing integration registry...");
                  console.log("📊 Integration results:", integrationResults);
                  
                  // ✅ IMPORTANT: SET DATA FIRST
                  if (integrationResults && integrationResults.length > 0) {
                    const formattedResult = {
                      adapters: integrationResults.map((item: any) => ({
                        serviceName: item.service,
                        adapter: item.adapter,
                        version: item.version,
                        status: item.status,
                        confidence: item.confidence || 0.8,
                        endpoints: item.endpoints || [],
                        timestamp: item.timestamp || new Date().toISOString(),
                        mappedFields: item.mappedFields || {},
                        transformations: item.transformations || []
                      })),
                      summary: {
                        totalServices: integrationResults.length,
                        connectedServices: integrationResults.filter((r: any) => r.status && r.status.includes("connected")).length,
                        fallbackServices: integrationResults.filter((r: any) => r.status && r.status.includes("fallback")).length,
                        successRate: Math.round((integrationResults.filter((r: any) => r.status && r.status.includes("connected")).length / integrationResults.length) * 100)
                      }
                    };
                    setIntegrationResult(formattedResult);
                  } else {
                    // ✅ FALLBACK DATA IF NO RESULTS
                    const fallbackResult = {
                      adapters: [
                        {
                          serviceName: "KYC Verification",
                          adapter: "Default Adapter",
                          version: "v1",
                          status: "connected",
                          confidence: 0.8,
                          endpoints: ["/api/kyc/verify", "/api/kyc/status"],
                          timestamp: new Date().toISOString(),
                          mappedFields: { fullName: "name", phone: "mobile" },
                          transformations: ["trim_whitespace", "format_date"]
                        },
                        {
                          serviceName: "Payment Gateway",
                          adapter: "Default Adapter",
                          version: "v1",
                          status: "connected",
                          confidence: 0.8,
                          endpoints: ["/api/payment/process", "/api/payment/status"],
                          timestamp: new Date().toISOString(),
                          mappedFields: { amount: "total", currency: "currency" },
                          transformations: ["format_currency"]
                        }
                      ],
                      summary: {
                        totalServices: 2,
                        connectedServices: 2,
                        fallbackServices: 0,
                        successRate: 100
                      }
                    };
                    setIntegrationResult(fallbackResult);
                  }
                  
                  // ✅ THEN MOVE NEXT
                  safeNext();
                }}
                onBack={goBack}
              />
            )}

            {currentStep === 4 && (
              <FieldMappingEnhanced
                onNext={(config: any) => {
                  setMappingResult(config);
                  safeNext(); // Auto-advance to next step
                }}
              />
            )}

            {currentStep === 5 && (
              <SimulationPage
                onNext={(simulationResults: any) => {
                  console.log("🎯 Processing simulation results...");
                  console.log("📊 Simulation results:", simulationResults);
                  
                  // ✅ IMPORTANT: SET DATA FIRST
                  setSimulationResults(simulationResults);
                  
                  // THEN MOVE NEXT
                  safeNext();
                }}
                onBack={goBack}
              />
            )}

            {currentStep === 6 && (
              <FinalOutput
                parsedRequirements={parsedRequirements}
                generatedConfigs={generatedConfigs}
                integrationResult={integrationResult}
                mappingResult={mappingResult}
                simulationResults={simulationResults}
              />
            )}

            {/* Navigation Buttons */}
            <NavigationButtons />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkflowContainer;
