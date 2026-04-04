import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon,
  ChartBarIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Credential {
  id: string;
  name: string;
  service: string;
  provider: string;
  type: string;
  masked_value: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  tenant_id: string;
  user_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

interface AuditStats {
  total_logs: number;
  timeframe: string;
  severity_breakdown: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  category_breakdown: { [key: string]: number };
  top_actions: { [key: string]: number };
  tenant_breakdown: { [key: string]: number };
  hourly_distribution: { [key: string]: number };
}

const SecurityAuditDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'audit' | 'stats'>('credentials');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [showCredentialDetails, setShowCredentialDetails] = useState<string | null>(null);
  const [showDecrypted, setShowDecrypted] = useState<{ [key: string]: boolean }>({});
  const [filters, setFilters] = useState({
    tenant_id: '',
    action: '',
    category: '',
    severity: '',
    start_date: '',
    end_date: '',
    limit: 50
  });

  // Load data on component mount
  useEffect(() => {
    loadCredentials();
    loadAuditLogs();
    loadAuditStats();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5007/credentials');
      const data = await response.json();
      if (data.success) {
        setCredentials(data.data);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(`http://localhost:5007/audit-logs?${new URLSearchParams(filters as any)}`);
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await fetch('http://localhost:5007/audit-stats?timeframe=24h');
      const data = await response.json();
      if (data.success) {
        setAuditStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const addCredential = async (credentialData: any) => {
    try {
      const response = await fetch('http://localhost:5007/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialData),
      });

      const data = await response.json();
      if (data.success) {
        await loadCredentials();
        setShowAddCredential(false);
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to add credential:', error);
      throw error;
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5007/credentials/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await loadCredentials();
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to delete credential:', error);
      throw error;
    }
  };

  const createAuditLog = async (action: string, details: any) => {
    try {
      const response = await fetch('http://localhost:5007/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          details,
          tenant_id: 'demo_tenant',
          user_id: 'demo_user'
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadAuditLogs();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'kyc':
        return <KeyIcon className="w-5 h-5 text-blue-600" />;
      case 'payments':
        return <KeyIcon className="w-5 h-5 text-green-600" />;
      case 'gst':
        return <KeyIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <KeyIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return 'bg-red-50 text-red-700';
      case 'CONFIGURATION':
        return 'bg-blue-50 text-blue-700';
      case 'SIMULATION':
        return 'bg-purple-50 text-purple-700';
      case 'TENANT_MANAGEMENT':
        return 'bg-green-50 text-green-700';
      case 'AUTHENTICATION':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security & Audit Dashboard</h1>
          <p className="text-gray-600">Manage credentials securely and monitor all platform activities</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex space-x-8 px-6 pt-6">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credentials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Credential Vault</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5" />
                <span>Audit Logs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Statistics</span>
              </div>
            </button>
          </div>
        </div>

        {/* Credential Vault Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Credential Vault</h2>
              <button
                onClick={() => setShowAddCredential(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Credential
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Stored Credentials</h3>
                  <span className="text-sm text-gray-500">{credentials.length} credentials</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {credentials.map((credential) => (
                  <div key={credential.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getServiceIcon(credential.service)}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{credential.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{credential.service}</span>
                            <span>•</span>
                            <span>{credential.provider}</span>
                            <span>•</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{credential.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowDecrypted(prev => ({
                            ...prev,
                            [credential.id]: !prev[credential.id]
                          }))}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showDecrypted[credential.id] ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button className="text-red-500 hover:text-red-700">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Value:</span>
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                          {showDecrypted[credential.id] ? '***decrypted***' : credential.masked_value}
                        </code>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {formatDate(credential.created_at)} | 
                        Updated: {formatDate(credential.updated_at)} | 
                        Tenant: {credential.tenant_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">All Severities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <button
                  onClick={loadAuditLogs}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <span className="text-sm text-gray-500">{auditLogs.length} logs</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                            {log.category}
                          </span>
                          <h4 className="font-medium text-gray-900">{log.action}</h4>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {log.tenant_id && (
                              <span className="flex items-center">
                                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                                {log.tenant_id}
                              </span>
                            )}
                            {log.user_id && (
                              <span className="flex items-center">
                                <UserIcon className="w-4 h-4 mr-1" />
                                {log.user_id}
                              </span>
                            )}
                          </div>
                          
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2">
                              <details className="cursor-pointer">
                                <summary className="text-xs font-medium text-gray-700">Details</summary>
                                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Audit Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Logs</h3>
                  <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{auditStats?.total_logs || 0}</div>
                <p className="text-sm text-gray-500">Last 24 hours</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">High Severity</h3>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-600">{auditStats?.severity_breakdown?.HIGH || 0}</div>
                <p className="text-sm text-gray-500">Requires attention</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Low Severity</h3>
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">{auditStats?.severity_breakdown?.LOW || 0}</div>
                <p className="text-sm text-gray-500">Routine activities</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(auditStats?.category_breakdown || {}).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Credential Modal */}
        {showAddCredential && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Credential</h3>
              
              <AddCredentialForm
                onSubmit={async (data) => {
                  try {
                    await addCredential(data);
                    await createAuditLog('CREDENTIAL_CREATED', {
                      credential_id: data.id,
                      service: data.service,
                      provider: data.provider
                    });
                  } catch (error) {
                    console.error('Failed to add credential:', error);
                  }
                }}
                onCancel={() => setShowAddCredential(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Credential Form Component
const AddCredentialForm: React.FC<{
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    service: 'KYC',
    provider: '',
    type: 'api_key',
    value: '',
    tenant_id: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
        <input
          type="text"
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <select
            value={formData.service}
            onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="KYC">KYC</option>
            <option value="Payments">Payments</option>
            <option value="GST">GST</option>
            <option value="Fraud">Fraud</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="api_key">API Key</option>
            <option value="secret">Secret</option>
            <option value="token">Token</option>
            <option value="certificate">Certificate</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
        <input
          type="text"
          value={formData.provider}
          onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
        <input
          type="password"
          value={formData.value}
          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">This will be encrypted and stored securely</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Credential'}
        </button>
      </div>
    </form>
  );
};

export default SecurityAuditDashboard;
