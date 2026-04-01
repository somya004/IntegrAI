import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { AuditLog } from '../types/config';
import { Table, StatusBadge } from '../components/Table';

interface AuditLogsProps {
  selectedTenant: string;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ selectedTenant }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [selectedTenant]);

  const loadAuditLogs = async () => {
    try {
      const result = await apiService.getAuditLogs({ tenant: selectedTenant });
      setLogs(result.logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4"
        >
          <ChartBarIcon className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Audit Logs
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track all integration activities and system events
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tenant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="status-badge status-info">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{log.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{log.tenant}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {log.details && (
                      <div className="flex items-center space-x-2">
                        {Object.entries(log.details).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {key}: {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLogs;
