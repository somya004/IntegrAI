import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  ServerIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  BeakerIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useTenant } from '../contexts/MultiTenantContext';

const MultiTenantDashboard: React.FC = () => {
  const { 
    currentTenant, 
    tenants, 
    loading, 
    error, 
    setCurrentTenant, 
    getTenantConfig,
    getAuditLogs,
    loadTenants
  } = useTenant();

  const [tenantConfig, setTenantConfig] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load tenant config when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadTenantConfig();
      loadAuditLogs();
    }
  }, [currentTenant]);

  const loadTenantConfig = async () => {
    if (currentTenant) {
      try {
        const config = await getTenantConfig(currentTenant.tenant_id);
        setTenantConfig(config);
      } catch (err) {
        console.error('Failed to load tenant config:', err);
      }
    }
  };

  const loadAuditLogs = async () => {
    if (currentTenant) {
      try {
        const logs = await getAuditLogs(currentTenant.tenant_id, 10);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'kyc':
        return <BeakerIcon className="w-5 h-5" />;
      case 'gst':
        return <ServerIcon className="w-5 h-5" />;
      case 'payments':
        return <CreditCardIcon className="w-5 h-5" />;
      case 'fraud':
        return <ShieldCheckIcon className="w-5 h-5" />;
      default:
        return <CogIcon className="w-5 h-5" />;
    }
  };

  const getServiceColor = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'kyc':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gst':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payments':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fraud':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Tenant Dashboard</h1>
          <p className="text-gray-600">Manage configurations and integrations across different tenants</p>
        </div>

        {/* Tenant Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Tenant</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{tenants.length} tenants</span>
              <button
                onClick={() => loadTenants()}
                className="text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <div
                key={tenant.tenant_id}
                onClick={() => setCurrentTenant(tenant)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentTenant?.tenant_id === tenant.tenant_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="w-8 h-8 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.tenant_name}</h3>
                      <p className="text-sm text-gray-500">{tenant.tenant_type}</p>
                    </div>
                  </div>
                  {currentTenant?.tenant_id === tenant.tenant_id && (
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Integrations:</span>
                    <span className="font-medium">{tenant.integration_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Active:</span>
                    <span className="font-medium">{tenant.active_integrations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentTenant && tenantConfig && (
          <>
            {/* Tenant Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tenant Overview</h3>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant ID:</span>
                    <span className="font-mono text-sm">{currentTenant.tenant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{currentTenant.tenant_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-sm">{formatDate(currentTenant.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-sm">{formatDate(currentTenant.updated_at || currentTenant.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Integrations:</span>
                    <span className="font-medium">{tenantConfig.integrations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active:</span>
                    <span className="font-medium text-green-600">
                      {tenantConfig.integrations.filter((int: any) => int.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inactive:</span>
                    <span className="font-medium text-gray-600">
                      {tenantConfig.integrations.filter((int: any) => int.status !== 'active').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button
                    onClick={() => setShowAuditLogs(!showAuditLogs)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {showAuditLogs ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                <div className="space-y-2">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 3).map((log, index) => (
                      <div key={index} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <span className="text-gray-500">{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{tenantConfig.integrations.length} integrations</span>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Add Integration
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {tenantConfig.integrations.map((integration: any) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getServiceColor(integration.service)}`}>
                          {getServiceIcon(integration.service)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{integration.service}</h4>
                          <p className="text-sm text-gray-500">{integration.provider} v{integration.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                        <button className="text-gray-600 hover:text-gray-800">
                          <CogIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(integration.created_at)}</span>
                      </div>
                      {integration.updated_at && (
                        <div>
                          <span className="text-gray-600">Updated:</span>
                          <span className="font-medium">{formatDate(integration.updated_at)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Configuration</h5>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-600">Endpoints:</span>
                            <div className="mt-1 space-y-1">
                              {Object.entries(integration.config.endpoints).map(([name, url]: [string, any]) => (
                                <div key={name} className="flex items-center space-x-2">
                                  <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{name}:</span>
                                  <code className="text-xs text-gray-700 truncate">{String(url)}</code>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Authentication:</span>
                            <span className="ml-2 text-sm font-medium">{integration.config.authentication.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rate Limit:</span>
                            <span className="ml-2 text-sm font-medium">
                              {integration.config.rate_limit.requests} requests/{integration.config.rate_limit.period}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">API Configuration</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">API Timeout (ms):</label>
                        <input
                          type="number"
                          defaultValue={tenantConfig.settings.api_timeout}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">Retry Attempts:</label>
                        <input
                          type="number"
                          defaultValue={tenantConfig.settings.retry_attempts}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">Webhook Timeout (ms):</label>
                        <input
                          type="number"
                          defaultValue={tenantConfig.settings.webhook_timeout}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Notifications</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={tenantConfig.settings.notification_settings.email}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Email Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={tenantConfig.settings.notification_settings.sms}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">SMS Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={tenantConfig.settings.notification_settings.slack}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Slack Notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Audit Logs */}
            {showAuditLogs && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                  <button
                    onClick={() => setShowAuditLogs(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <EyeSlashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                      </div>
                      {log.details && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <pre className="text-xs">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiTenantDashboard;
