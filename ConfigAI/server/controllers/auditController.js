const { v4: uuidv4 } = require('uuid');

class AuditController {
  constructor() {
    // In-memory storage for demo (in production, use database)
    this.logs = [];
    this.initializeMockLogs();
  }

  initializeMockLogs() {
    const mockLogs = [
      {
        id: uuidv4(),
        action: 'Document Parsed',
        tenant: 'ABC Corp',
        user: 'john.doe@example.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: {
          servicesDetected: 3,
          confidence: 85,
          processingTime: '450ms'
        }
      },
      {
        id: uuidv4(),
        action: 'Config Generated',
        tenant: 'ABC Corp',
        user: 'john.doe@example.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        details: {
          service: 'KYC',
          version: 'v2',
          mappingsCount: 5,
          confidence: 92
        }
      },
      {
        id: uuidv4(),
        action: 'Simulation Run',
        tenant: 'ABC Corp',
        user: 'jane.smith@example.com',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        details: {
          service: 'Payment',
          status: 'success',
          processingTime: '1250ms'
        }
      },
      {
        id: uuidv4(),
        action: 'Config Downloaded',
        tenant: 'XYZ Ltd',
        user: 'admin@xyz.com',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        details: {
          format: 'JSON',
          services: ['GST', 'Fraud'],
          fileSize: '2.4KB'
        }
      }
    ];

    this.logs = mockLogs;
  }

  async getLogs(req, res) {
    try {
      const { 
        tenant, 
        action, 
        user, 
        startDate, 
        endDate,
        page = 1,
        limit = 50 
      } = req.query;

      let filteredLogs = [...this.logs];

      // Apply filters
      if (tenant) {
        filteredLogs = filteredLogs.filter(log => 
          log.tenant.toLowerCase().includes(tenant.toLowerCase())
        );
      }

      if (action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(action.toLowerCase())
        );
      }

      if (user) {
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(user.toLowerCase())
        );
      }

      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= start
        );
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= end
        );
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredLogs.length,
            pages: Math.ceil(filteredLogs.length / limit)
          },
          summary: {
            totalActions: filteredLogs.length,
            uniqueUsers: [...new Set(filteredLogs.map(log => log.user))].length,
            uniqueTenants: [...new Set(filteredLogs.map(log => log.tenant))].length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs'
      });
    }
  }

  async createLog(req, res) {
    try {
      const { action, tenant, user, details } = req.body;

      if (!action || !tenant || !user) {
        return res.status(400).json({
          success: false,
          error: 'Action, tenant, and user are required'
        });
      }

      const newLog = {
        id: uuidv4(),
        action,
        tenant,
        user,
        timestamp: new Date().toISOString(),
        details: details || {}
      };

      this.logs.unshift(newLog);

      res.status(201).json({
        success: true,
        data: newLog,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create audit log'
      });
    }
  }

  async getLogStats(req, res) {
    try {
      const { tenant, days = 30 } = req.query;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      let recentLogs = this.logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );

      if (tenant) {
        recentLogs = recentLogs.filter(log => 
          log.tenant.toLowerCase() === tenant.toLowerCase()
        );
      }

      const stats = {
        totalLogs: recentLogs.length,
        actionsByType: {},
        logsByDay: {},
        topUsers: {},
        topTenants: {}
      };

      recentLogs.forEach(log => {
        // Actions by type
        stats.actionsByType[log.action] = (stats.actionsByType[log.action] || 0) + 1;

        // Logs by day
        const day = new Date(log.timestamp).toISOString().split('T')[0];
        stats.logsByDay[day] = (stats.logsByDay[day] || 0) + 1;

        // Top users
        stats.topUsers[log.user] = (stats.topUsers[log.user] || 0) + 1;

        // Top tenants
        stats.topTenants[log.tenant] = (stats.topTenants[log.tenant] || 0) + 1;
      });

      // Sort and limit top results
      stats.topUsers = Object.entries(stats.topUsers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [user, count]) => ({ ...obj, [user]: count }), {});

      stats.topTenants = Object.entries(stats.topTenants)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [tenant, count]) => ({ ...obj, [tenant]: count }), {});

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting log stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get log statistics'
      });
    }
  }
}

module.exports = new AuditController();
