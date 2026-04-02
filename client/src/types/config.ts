export interface Service {
  name: string;
  confidence: number;
  mandatory: boolean;
  keywords: string[];
  versions?: string[];
  status?: 'active' | 'deprecated';
  endpoint?: string;
  description?: string;
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

export interface ParsedRequirement {
  id: string;
  type: 'endpoint' | 'field' | 'service';
  category: string;
  name: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  examples?: string[];
  confidence: number;
  source: {
    lineNumber?: number;
    context?: string;
    section?: string;
  };
}

export interface ParseResult {
  success: boolean;
  document: {
    name: string;
    type: 'BRD' | 'SOW' | 'API_SPEC';
    size: number;
    pages?: number;
  };
  parsedAt: string;
  processingTime: number;
  services: ParsedRequirement[];
  endpoints: ParsedRequirement[];
  fields: ParsedRequirement[];
  summary: {
    totalServices: number;
    mandatoryServices: number;
    totalEndpoints: number;
    totalFields: number;
    confidence: number;
  };
  errors?: string[];
}

export interface FieldMapping {
  clientField: string;
  apiField: string;
  confidence: number;
  transformation?: TransformationRule;
}

export interface TransformationRule {
  id: string;
  name: string;
  type: 'format' | 'validate' | 'convert' | 'default';
  source: {
    field: string;
    format: string;
    example: string;
  };
  target: {
    field: string;
    format: string;
    example: string;
  };
  rule: string;
  enabled: boolean;
}

export interface APIConfiguration {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  parameters: FieldMapping[];
  response: {
    format: 'json' | 'xml' | 'text';
    schema: Record<string, any>;
  };
  authentication: {
    type: 'none' | 'apikey' | 'oauth' | 'bearer';
    location: 'header' | 'query' | 'body';
  };
  rateLimit?: {
    requests: number;
    period: 'second' | 'minute' | 'hour' | 'day';
  };
  transformations: TransformationRule[];
  metadata: {
    generatedAt: string;
    confidence: number;
    source: 'auto' | 'manual';
  };
}

export interface ConfigurationEngineProps {
  parsedRequirements: ParseResult | null;
  onConfigurationGenerated: (config: APIConfiguration[]) => void;
}

export interface GeneratedConfig {
  service: string;
  version: string;
  mappings: Record<string, string>;
  endpoint: string;
  method: string;
}

export interface SimulationRequest {
  config: APIConfiguration;
  payload: Record<string, any>;
  testType: 'success' | 'error' | 'latency' | 'load' | 'auth';
}

export interface SimulationResponse {
  id: string;
  timestamp: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size: number;
  };
  performance: {
    responseTime: number;
    latency: number;
    throughput: number;
  };
  metadata: {
    version: string;
    environment: 'test';
    testType: string;
    success: boolean;
    error?: string;
  };
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  configId: string;
  configName: string;
  version: string;
  testType: 'success' | 'error' | 'latency' | 'load' | 'auth';
  status: 'running' | 'completed' | 'failed';
  request: SimulationRequest;
  response?: SimulationResponse;
  performance?: {
    responseTime: number;
    latency: number;
  };
  error?: string;
}

export interface SimulationEngineProps {
  configurations: APIConfiguration[];
  currentClient?: Client | null;
  onSimulationComplete?: (logs: SimulationLog[]) => void;
}

export interface Client {
  id: string;
  name: string;
  displayName: string;
  domain?: string;
  logo?: string;
  theme?: 'light' | 'dark';
  settings: {
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    isDefault: boolean;
  };
}

export interface ClientConfiguration {
  clientId: string;
  configurations: {
    services: APIConfiguration[];
    integrations: any[];
    customMappings: Record<string, string>;
    settings: {
      notifications: boolean;
      logging: boolean;
      debugging: boolean;
    };
  };
  lastUpdated: string;
  version: string;
}

export interface TenantContext {
  currentClient: Client | null;
  clients: Client[];
  configurations: Record<string, ClientConfiguration>;
  switchClient: (clientId: string) => void;
  updateClientSettings: (clientId: string, settings: Partial<Client['settings']>) => void;
  getClientConfiguration: (clientId: string) => ClientConfiguration | null;
  saveClientConfiguration: (clientId: string, config: ClientConfiguration) => void;
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
  timestamp: string;
  action: string;
  category: 'config' | 'version' | 'client' | 'system' | 'security' | 'integration';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  user?: string;
  tenant?: string;
  clientId?: string;
  details: {
    oldValue?: any;
    newValue?: any;
    field?: string;
    previousVersion?: string;
    newVersion?: string;
    configId?: string;
    serviceName?: string;
    errorMessage?: string;
    stackTrace?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  metadata: {
    sessionId: string;
    requestId: string;
    source: string;
    environment: string;
    tags?: string[];
  };
}

export interface AuditLogFilter {
  category?: string;
  severity?: string;
  clientId?: string;
  userId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  search?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogExport {
  exportedAt: string;
  totalLogs: number;
  logs: AuditLog[];
  summary: {
    totalByCategory: Record<string, number>;
    totalBySeverity: Record<string, number>;
    totalByClient: Record<string, number>;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    filters: AuditLogFilter;
  };
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
