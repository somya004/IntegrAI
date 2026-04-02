import { AuditLog, AuditLogFilter } from '../types/config';

class AuditService {
  private logs: AuditLog[] = [];
  private listeners: ((logs: AuditLog[]) => void)[] = [];

  constructor() {
    this.initializeLogs();
  }

  // Initialize with sample logs
  private initializeLogs() {
    const sampleLogs: AuditLog[] = [
      {
        id: 'audit_1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'Configuration Created',
        category: 'config',
        severity: 'info',
        userId: 'user_123',
        clientId: 'client-a',
        details: {
          configId: 'config_kyc_v1',
          serviceName: 'KYC Provider',
          newValue: {
            name: 'KYC Provider',
            version: 'v1',
            endpoint: '/api/kyc/verify'
          }
        },
        metadata: {
          sessionId: 'session_abc123',
          requestId: 'req_456',
          source: 'ConfigurationEngine',
          environment: 'production',
          tags: ['configuration', 'kyc', 'v1']
        }
      },
      {
        id: 'audit_2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'Version Updated',
        category: 'version',
        severity: 'warning',
        userId: 'user_123',
        clientId: 'client-a',
        details: {
          serviceName: 'KYC Provider',
          previousVersion: 'v1',
          newVersion: 'v2',
          configId: 'config_kyc_v2'
        },
        metadata: {
          sessionId: 'session_abc123',
          requestId: 'req_457',
          source: 'ConfigurationEngine',
          environment: 'production',
          tags: ['version', 'update', 'kyc']
        }
      },
      {
        id: 'audit_3',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        action: 'Client Switched',
        category: 'client',
        severity: 'info',
        userId: 'user_123',
        clientId: 'client-b',
        details: {
          oldValue: 'client-a',
          newValue: 'client-b'
        },
        metadata: {
          sessionId: 'session_abc123',
          requestId: 'req_458',
          source: 'TenantContext',
          environment: 'production',
          tags: ['client', 'switch']
        }
      },
      {
        id: 'audit_4',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        action: 'API Configuration Modified',
        category: 'config',
        severity: 'info',
        userId: 'user_123',
        clientId: 'client-a',
        details: {
          configId: 'config_payment_v1',
          field: 'endpoint',
          oldValue: '/api/payment/process',
          newValue: '/api/payment/v2/process'
        },
        metadata: {
          sessionId: 'session_abc123',
          requestId: 'req_459',
          source: 'ConfigurationEngine',
          environment: 'production',
          tags: ['configuration', 'payment', 'endpoint']
        }
      },
      {
        id: 'audit_5',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        action: 'Field Mapping Updated',
        category: 'config',
        severity: 'info',
        userId: 'user_123',
        clientId: 'client-b',
        details: {
          configId: 'config_gst_v1',
          field: 'businessName',
          oldValue: 'companyName',
          newValue: 'businessName'
        },
        metadata: {
          sessionId: 'session_abc123',
          requestId: 'req_460',
          source: 'ConfigurationEngine',
          environment: 'production',
          tags: ['configuration', 'mapping', 'gst']
        }
      }
    ];

    this.logs = sampleLogs;
    this.notifyListeners();
  }

  // Add new audit log
  addLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log
    };

    this.logs.unshift(newLog);
    this.notifyListeners();
  }

  // Log configuration change
  logConfigChange(
    action: string,
    configId: string,
    serviceName: string,
    oldValue?: any,
    newValue?: any,
    userId?: string,
    clientId?: string
  ): void {
    this.addLog({
      action,
      category: 'config',
      severity: 'info',
      userId,
      clientId,
      details: {
        configId,
        serviceName,
        oldValue,
        newValue
      },
      metadata: {
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        source: 'ConfigurationEngine',
        environment: 'production',
        tags: ['configuration', serviceName.toLowerCase()]
      }
    });
  }

  // Log version update
  logVersionUpdate(
    serviceName: string,
    previousVersion: string,
    newVersion: string,
    userId?: string,
    clientId?: string
  ): void {
    this.addLog({
      action: 'Version Updated',
      category: 'version',
      severity: previousVersion === newVersion ? 'info' : 'warning',
      userId,
      clientId,
      details: {
        serviceName,
        previousVersion,
        newVersion
      },
      metadata: {
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        source: 'ConfigurationEngine',
        environment: 'production',
        tags: ['version', 'update', serviceName.toLowerCase()]
      }
    });
  }

  // Log client action
  logClientAction(
    action: string,
    oldValue?: any,
    newValue?: any,
    userId?: string,
    clientId?: string
  ): void {
    this.addLog({
      action,
      category: 'client',
      severity: 'info',
      userId,
      clientId,
      details: {
        oldValue,
        newValue
      },
      metadata: {
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        source: 'TenantContext',
        environment: 'production',
        tags: ['client', action.toLowerCase()]
      }
    });
  }

  // Log system event
  logSystemEvent(
    action: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    errorMessage?: string,
    stackTrace?: string,
    userId?: string,
    clientId?: string
  ): void {
    this.addLog({
      action,
      category: 'system',
      severity,
      userId,
      clientId,
      details: {
        errorMessage,
        stackTrace
      },
      metadata: {
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        source: 'System',
        environment: 'production',
        tags: ['system', action.toLowerCase()]
      }
    });
  }

  // Log security event
  logSecurityEvent(
    action: string,
    severity: 'warning' | 'error' | 'critical',
    ipAddress?: string,
    userAgent?: string,
    userId?: string,
    clientId?: string
  ): void {
    this.addLog({
      action,
      category: 'security',
      severity,
      userId,
      clientId,
      details: {
        ipAddress,
        userAgent
      },
      metadata: {
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        source: 'SecurityModule',
        environment: 'production',
        tags: ['security', action.toLowerCase()]
      }
    });
  }

  // Get all logs
  getLogs(): AuditLog[] {
    return [...this.logs];
  }

  // Get filtered logs
  getFilteredLogs(filter: AuditLogFilter): AuditLog[] {
    let filteredLogs = [...this.logs];

    // Filter by category
    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    // Filter by severity
    if (filter.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filter.severity);
    }

    // Filter by client
    if (filter.clientId) {
      filteredLogs = filteredLogs.filter(log => log.clientId === filter.clientId);
    }

    // Filter by user
    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    // Filter by date range
    if (filter.dateRange) {
      const startDate = new Date(filter.dateRange.startDate);
      const endDate = new Date(filter.dateRange.endDate);
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchTerm) ||
        log.details.serviceName?.toLowerCase().includes(searchTerm) ||
        log.details.field?.toLowerCase().includes(searchTerm) ||
        log.details.errorMessage?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by action
    if (filter.action) {
      filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(filter.action.toLowerCase()));
    }

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    filteredLogs = filteredLogs.slice(offset, offset + limit);

    return filteredLogs;
  }

  // Subscribe to log updates
  subscribe(listener: (logs: AuditLog[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.logs);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Export logs
  exportLogs(filter?: AuditLogFilter): AuditLogExport {
    const logsToExport = filter ? this.getFilteredLogs(filter) : this.getLogs();
    
    // Calculate summary statistics
    const totalByCategory: Record<string, number> = {};
    const totalBySeverity: Record<string, number> = {};
    const totalByClient: Record<string, number> = {};

    logsToExport.forEach(log => {
      totalByCategory[log.category] = (totalByCategory[log.category] || 0) + 1;
      totalBySeverity[log.severity] = (totalBySeverity[log.severity] || 0) + 1;
      if (log.clientId) {
        totalByClient[log.clientId] = (totalByClient[log.clientId] || 0) + 1;
      }
    });

    // Determine date range
    let dateRange = { startDate: '', endDate: '' };
    if (logsToExport.length > 0) {
      const timestamps = logsToExport.map(log => log.timestamp);
      dateRange.startDate = Math.min(...timestamps.map(t => new Date(t).getTime())).toString();
      dateRange.endDate = Math.max(...timestamps.map(t => new Date(t).getTime())).toString();
    }

    return {
      exportedAt: new Date().toISOString(),
      totalLogs: logsToExport.length,
      logs: logsToExport,
      summary: {
        totalByCategory,
        totalBySeverity,
        totalByClient,
        dateRange,
        filters: filter || {}
      }
    };
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  // Get log statistics
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byClient: Record<string, number>;
    recent: AuditLog[];
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byClient: Record<string, number> = {};

    this.logs.forEach(log => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      if (log.clientId) {
        byClient[log.clientId] = (byClient[log.clientId] || 0) + 1;
      }
    });

    return {
      total: this.logs.length,
      byCategory,
      bySeverity,
      byClient,
      recent: this.logs.slice(0, 10) // Last 10 logs
    };
  }

  // Private helper methods
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.logs));
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const auditService = new AuditService();

export default auditService;
