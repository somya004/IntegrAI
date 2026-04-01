export interface Service {
  name: string;
  confidence: number;
  mandatory: boolean;
  keywords: string[];
}

export interface Requirement {
  text: string;
  type: string;
  category: string;
}

export interface ParsedDocument {
  services: Service[];
  requirements: Requirement[];
  summary: {
    mandatoryServices: number;
    totalRequirements: number;
  };
  totalDetected: number;
}

export interface FieldMapping {
  clientField: string;
  apiField: string;
  confidence: number;
}

export interface GeneratedConfig {
  service: string;
  version: string;
  mappings: Record<string, string>;
  endpoint: string;
  method: string;
}

export interface SimulationRequest {
  config: GeneratedConfig;
  payload: Record<string, any>;
}

export interface SimulationResult {
  success: boolean;
  request: Record<string, any>;
  response: Record<string, any>;
  timestamp: string;
  responseTime: number;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  tenant: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppState {
  currentStep: string;
  selectedTenant: string;
  parsedData: ParsedDocument | null;
  configs: GeneratedConfig[];
  simulationResults: SimulationResult[];
}

export interface Step {
  id: string;
  name: string;
  icon: string;
}
