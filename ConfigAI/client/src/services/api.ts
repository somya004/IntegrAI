import axios from 'axios';
import { 
  Service, 
  ParsedDocument, 
  GeneratedConfig, 
  SimulationRequest, 
  SimulationResult, 
  AuditLog,
  ApiResponse 
} from '../types/config';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Functions
export const apiService = {
  // Document Parsing
  async parseDocument(text: string): Promise<ParsedDocument> {
    const response = await api.post('/api/parse/document', { text });
    return response.data.data;
  },

  async getSupportedServices(): Promise<any[]> {
    const response = await api.get('/api/parse/services');
    return response.data.data;
  },

  // Configuration Management
  async generateConfig(data: {
    services: Service[];
    selectedVersions: { [key: string]: string };
    fieldMappings?: { [key: string]: string };
    tenant?: string;
  }): Promise<{ configs: GeneratedConfig[]; summary: any }> {
    const response = await api.post('/api/config/generate', data);
    return response.data.data;
  },

  async validateConfig(config: GeneratedConfig): Promise<{
    isValid: boolean;
    score: number;
    issues: Array<{
      field: string;
      issue: string;
      suggestion?: string;
    }>;
    recommendations: Array<{
      type: string;
      field?: string;
      message: string;
    }>;
  }> {
    const response = await api.post('/api/config/validate', { config });
    return response.data.data;
  },

  // Enhanced Simulation
  async runEnhancedSimulation(service: string, payload: Record<string, any>): Promise<{
    status: string;
    service: string;
    apiKeyUsed: string;
    responseTime: string;
    timestamp: string;
    data: any;
  }> {
    const response = await api.post('/api/simulation/run', { service, payload });
    return response.data.data;
  },

  async getSupportedServicesWithKeys(): Promise<Array<{
    name: string;
    description: string;
    apiKey: string;
  }>> {
    const response = await api.get('/api/simulation/services');
    return response.data.data;
  },

  // Simulation
  async runSimulation(request: SimulationRequest): Promise<SimulationResult> {
    const response = await api.post('/api/simulation/run', request);
    return response.data.data;
  },

  async getSimulationHistory(): Promise<Array<{
    id: string;
    service: string;
    status: string;
    timestamp: string;
    processingTime: string;
  }>> {
    const response = await api.get('/api/simulation/history');
    return response.data.data;
  },

  // Audit Logs
  async getAuditLogs(params?: {
    tenant?: string;
    action?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      totalActions: number;
      uniqueUsers: number;
      uniqueTenants: number;
    };
  }> {
    const response = await api.get('/api/audit/logs', { params });
    return response.data.data;
  },

  async createAuditLog(data: {
    action: string;
    tenant: string;
    user: string;
    details?: { [key: string]: any };
  }): Promise<AuditLog> {
    const response = await api.post('/api/audit/logs', data);
    return response.data.data;
  },

  async getAuditStats(tenant?: string, days: number = 30): Promise<{
    totalLogs: number;
    actionsByType: { [key: string]: number };
    logsByDay: { [key: string]: number };
    topUsers: { [key: string]: number };
    topTenants: { [key: string]: number };
  }> {
    const response = await api.get('/api/audit/stats', {
      params: { tenant, days }
    });
    return response.data.data;
  },

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  }
};

export default apiService;
