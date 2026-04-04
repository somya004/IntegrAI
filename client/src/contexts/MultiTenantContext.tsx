import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  created_at: string;
  updated_at?: string;
  integration_count: number;
  active_integrations: number;
}

export interface TenantConfig {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  created_at: string;
  updated_at?: string;
  integrations: Array<{
    id: string;
    service: string;
    provider: string;
    version: string;
    status: string;
    config: any;
    created_at: string;
    updated_at?: string;
  }>;
  audit_logs: Array<{
    id?: string;
    action: string;
    details: any;
    timestamp: string;
    tenant_id: string;
  }>;
  settings: {
    api_timeout: number;
    retry_attempts: number;
    webhook_timeout: number;
    notification_settings: {
      email: boolean;
      sms: boolean;
      slack: boolean;
    };
  };
}

export interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  loadTenants: () => Promise<void>;
  getTenantConfig: (tenantId: string) => Promise<TenantConfig | null>;
  updateTenantSettings: (tenantId: string, settings: any) => Promise<void>;
  addIntegration: (tenantId: string, integration: any) => Promise<void>;
  removeIntegration: (tenantId: string, integrationId: string) => Promise<void>;
  updateIntegration: (tenantId: string, integrationId: string, updates: any) => Promise<void>;
  getAuditLogs: (tenantId: string, limit?: number) => Promise<any[]>;
  addAuditLog: (tenantId: string, logEntry: any) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all tenants
  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5005/tenants');
      const data = await response.json();
      
      if (data.success) {
        setTenants(data.data);
        
        // Set default tenant if none selected
        if (!currentTenant && data.data.length > 0) {
          setCurrentTenant(data.data[0]);
        }
      } else {
        setError(data.error || 'Failed to load tenants');
      }
    } catch (err) {
      setError('Failed to connect to tenant service');
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  // Get tenant configuration
  const getTenantConfig = useCallback(async (tenantId: string): Promise<TenantConfig | null> => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to load tenant configuration');
      }
    } catch (err) {
      console.error('Failed to load tenant config:', err);
      return null;
    }
  }, []);

  // Update tenant settings
  const updateTenantSettings = useCallback(async (tenantId: string, settings: any) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }
      
      // Update local state
      if (currentTenant && currentTenant.tenant_id === tenantId) {
        const updatedConfig = await getTenantConfig(tenantId);
        if (updatedConfig) {
          // Update tenant in the list
          setTenants(prev => prev.map(tenant => 
            tenant.tenant_id === tenantId 
              ? { ...tenant, updated_at: updatedConfig.updated_at }
              : tenant
          ));
        }
      }
    } catch (err) {
      console.error('Failed to update tenant settings:', err);
      throw err;
    }
  }, [currentTenant, getTenantConfig]);

  // Add integration
  const addIntegration = useCallback(async (tenantId: string, integration: any) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integration),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add integration');
      }
      
      // Update local state if current tenant
      if (currentTenant && currentTenant.tenant_id === tenantId) {
        const updatedConfig = await getTenantConfig(tenantId);
        if (updatedConfig) {
          setTenants(prev => prev.map(tenant => 
            tenant.tenant_id === tenantId 
              ? { 
                  ...tenant, 
                  integration_count: updatedConfig.integrations.length,
                  active_integrations: updatedConfig.integrations.filter(int => int.status === 'active').length
                }
              : tenant
          ));
        }
      }
    } catch (err) {
      console.error('Failed to add integration:', err);
      throw err;
    }
  }, [currentTenant, getTenantConfig]);

  // Remove integration
  const removeIntegration = useCallback(async (tenantId: string, integrationId: string) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove integration');
      }
      
      // Update local state if current tenant
      if (currentTenant && currentTenant.tenant_id === tenantId) {
        const updatedConfig = await getTenantConfig(tenantId);
        if (updatedConfig) {
          setTenants(prev => prev.map(tenant => 
            tenant.tenant_id === tenantId 
              ? { 
                  ...tenant, 
                  integration_count: updatedConfig.integrations.length,
                  active_integrations: updatedConfig.integrations.filter(int => int.status === 'active').length
                }
              : tenant
          ));
        }
      }
    } catch (err) {
      console.error('Failed to remove integration:', err);
      throw err;
    }
  }, [currentTenant, getTenantConfig]);

  // Update integration
  const updateIntegration = useCallback(async (tenantId: string, integrationId: string, updates: any) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update integration');
      }
      
      // Update local state if current tenant
      if (currentTenant && currentTenant.tenant_id === tenantId) {
        const updatedConfig = await getTenantConfig(tenantId);
        if (updatedConfig) {
          setTenants(prev => prev.map(tenant => 
            tenant.tenant_id === tenantId 
              ? { 
                  ...tenant, 
                  updated_at: updatedConfig.updated_at
                }
              : tenant
          ));
        }
      }
    } catch (err) {
      console.error('Failed to update integration:', err);
      throw err;
    }
  }, [currentTenant, getTenantConfig]);

  // Get audit logs
  const getAuditLogs = useCallback(async (tenantId: string, limit = 50) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/audit-logs?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to load audit logs');
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      return [];
    }
  }, []);

  // Add audit log
  const addAuditLog = useCallback(async (tenantId: string, logEntry: any) => {
    try {
      const response = await fetch(`http://localhost:5005/tenants/${tenantId}/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add audit log');
      }
    } catch (err) {
      console.error('Failed to add audit log:', err);
      throw err;
    }
  }, []);

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  const contextValue: TenantContextType = {
    currentTenant,
    tenants,
    loading,
    error,
    setCurrentTenant,
    loadTenants,
    getTenantConfig,
    updateTenantSettings,
    addIntegration,
    removeIntegration,
    updateIntegration,
    getAuditLogs,
    addAuditLog
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantProvider;
