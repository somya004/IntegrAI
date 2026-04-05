class HookEngine {
  constructor() {
    this.preHooks = [];
    this.postHooks = [];
    this.errorHooks = [];
    this.transformHooks = [];
    this.hookStats = {
      pre: { executed: 0, failed: 0, avgTime: 0 },
      post: { executed: 0, failed: 0, avgTime: 0 },
      error: { executed: 0, failed: 0, avgTime: 0 },
      transform: { executed: 0, failed: 0, avgTime: 0 }
    };
    this.executionLog = [];
  }

  addPreHook(hookFunction, options = {}) {
    const hook = {
      id: this.generateHookId(),
      type: 'pre',
      function: hookFunction,
      name: options.name || `pre_hook_${this.preHooks.length + 1}`,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      timeout: options.timeout || 5000,
      createdAt: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    this.preHooks.push(hook);
    this.sortHooksByPriority(this.preHooks);
    
    return hook.id;
  }

  addPostHook(hookFunction, options = {}) {
    const hook = {
      id: this.generateHookId(),
      type: 'post',
      function: hookFunction,
      name: options.name || `post_hook_${this.postHooks.length + 1}`,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      timeout: options.timeout || 5000,
      createdAt: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    this.postHooks.push(hook);
    this.sortHooksByPriority(this.postHooks);
    
    return hook.id;
  }

  addErrorHook(hookFunction, options = {}) {
    const hook = {
      id: this.generateHookId(),
      type: 'error',
      function: hookFunction,
      name: options.name || `error_hook_${this.errorHooks.length + 1}`,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      timeout: options.timeout || 3000,
      createdAt: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    this.errorHooks.push(hook);
    this.sortHooksByPriority(this.errorHooks);
    
    return hook.id;
  }

  addTransformHook(hookFunction, options = {}) {
    const hook = {
      id: this.generateHookId(),
      type: 'transform',
      function: hookFunction,
      name: options.name || `transform_hook_${this.transformHooks.length + 1}`,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      timeout: options.timeout || 5000,
      createdAt: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    this.transformHooks.push(hook);
    this.sortHooksByPriority(this.transformHooks);
    
    return hook.id;
  }

  removeHook(hookId) {
    const allHooks = [...this.preHooks, ...this.postHooks, ...this.errorHooks, ...this.transformHooks];
    const hookIndex = allHooks.findIndex(h => h.id === hookId);
    
    if (hookIndex !== -1) {
      const hook = allHooks[hookIndex];
      
      if (hook.type === 'pre') {
        this.preHooks = this.preHooks.filter(h => h.id !== hookId);
      } else if (hook.type === 'post') {
        this.postHooks = this.postHooks.filter(h => h.id !== hookId);
      } else if (hook.type === 'error') {
        this.errorHooks = this.errorHooks.filter(h => h.id !== hookId);
      } else if (hook.type === 'transform') {
        this.transformHooks = this.transformHooks.filter(h => h.id !== hookId);
      }
      
      return true;
    }
    
    return false;
  }

  async runHooks(type, data, context = {}) {
    const hooks = this.getHooksByType(type);
    let result = data;
    const executionResults = [];

    for (const hook of hooks) {
      if (!hook.enabled) {
        continue;
      }

      const startTime = Date.now();
      const hookResult = await this.executeHook(hook, result, context);
      const endTime = Date.now();

      // Update stats
      this.updateHookStats(type, hookResult.success, endTime - startTime);

      // Log execution
      const logEntry = {
        hookId: hook.id,
        hookName: hook.name,
        type,
        success: hookResult.success,
        executionTime: endTime - startTime,
        timestamp: new Date().toISOString(),
        error: hookResult.error
      };

      this.executionLog.push(logEntry);
      executionResults.push(logEntry);

      if (hookResult.success && hookResult.data !== undefined) {
        result = hookResult.data;
      } else if (!hookResult.success) {
        console.error(`Hook ${hook.name} failed:`, hookResult.error);
      }
    }

    return {
      data: result,
      executionResults,
      hooksExecuted: executionResults.length,
      hooksSuccessful: executionResults.filter(r => r.success).length
    };
  }

  async executeHook(hook, data, context) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Hook execution timeout')), hook.timeout);
      });

      const hookPromise = Promise.resolve(hook.function(data, context));
      
      const result = await Promise.race([hookPromise, timeoutPromise]);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getHooksByType(type) {
    switch (type) {
      case 'pre':
        return this.preHooks;
      case 'post':
        return this.postHooks;
      case 'error':
        return this.errorHooks;
      case 'transform':
        return this.transformHooks;
      default:
        return [];
    }
  }

  sortHooksByPriority(hooks) {
    hooks.sort((a, b) => b.priority - a.priority);
  }

  generateHookId() {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateHookStats(type, success, executionTime) {
    const stats = this.hookStats[type === 'preHooks' ? 'pre' : 
                              type === 'postHooks' ? 'post' : 
                              type === 'errorHooks' ? 'error' : 'transform'];
    
    stats.executed++;
    if (!success) {
      stats.failed++;
    }
    
    // Update average time
    const totalTime = stats.avgTime * (stats.executed - 1) + executionTime;
    stats.avgTime = totalTime / stats.executed;
  }

  getHookStats() {
    return {
      ...this.hookStats,
      totalHooks: this.preHooks.length + this.postHooks.length + this.errorHooks.length + this.transformHooks.length,
      lastUpdated: new Date().toISOString()
    };
  }

  getExecutionLog(limit = 100) {
    return this.executionLog.slice(-limit);
  }

  clearExecutionLog() {
    this.executionLog = [];
  }

  getHookById(hookId) {
    const allHooks = [...this.preHooks, ...this.postHooks, ...this.errorHooks, ...this.transformHooks];
    return allHooks.find(h => h.id === hookId);
  }

  enableHook(hookId) {
    const hook = this.getHookById(hookId);
    if (hook) {
      hook.enabled = true;
      return true;
    }
    return false;
  }

  disableHook(hookId) {
    const hook = this.getHookById(hookId);
    if (hook) {
      hook.enabled = false;
      return true;
    }
    return false;
  }

  // Built-in utility hooks
  static builtInHooks() {
    return {
      // Pre-processing hooks
      validateInput: (data, context) => {
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid input data');
        }
        return data;
      },

      addTimestamp: (data, context) => {
        return {
          ...data,
          _hookProcessed: true,
          _processedAt: new Date().toISOString()
        };
      },

      // Post-processing hooks
      addMetadata: (data, context) => {
        return {
          ...data,
          _metadata: {
            processedBy: 'HookEngine',
            version: '1.0',
            hooksExecuted: context.hooksExecuted || 0
          }
        };
      },

      logExecution: (data, context) => {
        console.log('Hook execution completed:', {
          timestamp: new Date().toISOString(),
          dataSize: JSON.stringify(data).length,
          context: context
        });
        return data;
      },

      // Transform hooks
      normalizeServiceNames: (data, context) => {
        if (data.services && Array.isArray(data.services)) {
          return {
            ...data,
            services: data.services.map(service => ({
              ...service,
              name: service.name ? service.name.toLowerCase().trim() : service.name
            }))
          };
        }
        return data;
      },

      // Error hooks
      logError: (error, context) => {
        console.error('Hook engine error:', {
          error: error.message,
          context,
          timestamp: new Date().toISOString()
        });
        return error;
      }
    };
  }

  // Initialize with common hooks
  initializeCommonHooks() {
    const builtIn = HookEngine.builtInHooks();
    
    this.addPreHook(builtIn.validateInput, { 
      name: 'validate_input', 
      priority: 100 
    });
    
    this.addPreHook(builtIn.addTimestamp, { 
      name: 'add_timestamp', 
      priority: 50 
    });
    
    this.addPostHook(builtIn.addMetadata, { 
      name: 'add_metadata', 
      priority: 50 
    });
    
    this.addPostHook(builtIn.logExecution, { 
      name: 'log_execution', 
      priority: 10 
    });
    
    this.addTransformHook(builtIn.normalizeServiceNames, { 
      name: 'normalize_service_names', 
      priority: 75 
    });
    
    this.addErrorHook(builtIn.logError, { 
      name: 'log_error', 
      priority: 100 
    });
  }

  reset() {
    this.preHooks = [];
    this.postHooks = [];
    this.errorHooks = [];
    this.transformHooks = [];
    this.hookStats = {
      pre: { executed: 0, failed: 0, avgTime: 0 },
      post: { executed: 0, failed: 0, avgTime: 0 },
      error: { executed: 0, failed: 0, avgTime: 0 },
      transform: { executed: 0, failed: 0, avgTime: 0 }
    };
    this.executionLog = [];
  }
}

module.exports = HookEngine;
