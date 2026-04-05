const AdapterRegistry = require('./AdapterRegistry');
const VersionManager = require('./VersionManager');
const HookEngine = require('./HookEngine');
const AdapterMatcher = require('./AdapterMatcher');

class IntegrationRegistrySystem {
  constructor() {
    this.adapterRegistry = new AdapterRegistry();
    this.versionManager = new VersionManager();
    this.hookEngine = new HookEngine();
    this.adapterMatcher = new AdapterMatcher(this.adapterRegistry, this.versionManager);
    
    this.initializeSystem();
  }

  initializeSystem() {
    // Initialize common hooks
    this.hookEngine.initializeCommonHooks();
    
    // Add integration-specific hooks
    this.addIntegrationHooks();
  }

  addIntegrationHooks() {
    // Pre-hooks for validation and enrichment
    this.hookEngine.addPreHook((data, context) => {
      // Validate parsed data structure
      if (!data.services || !Array.isArray(data.services)) {
        throw new Error('Invalid or missing services in parsed data');
      }
      return data;
    }, {
      name: 'validate_parsed_data',
      priority: 100
    });

    this.hookEngine.addPreHook((data, context) => {
      // Add integration metadata
      return {
        ...data,
        _integration: {
          processedAt: new Date().toISOString(),
          system: 'IntegrationRegistry',
          version: '1.0'
        }
      };
    }, {
      name: 'add_integration_metadata',
      priority: 50
    });

    // Post-hooks for final processing
    this.hookEngine.addPostHook((data, context) => {
      // Add execution summary
      return {
        ...data,
        _executionSummary: {
          totalServices: data.services?.length || 0,
          matchedAdapters: data.adapters?.length || 0,
          fallbackAdapters: data.adapters?.filter(a => a.fallbackUsed).length || 0,
          averageConfidence: data.adapters?.reduce((sum, a) => sum + (a.confidence || 0), 0) / (data.adapters?.length || 1) || 0,
          processedAt: new Date().toISOString()
        }
      };
    }, {
      name: 'add_execution_summary',
      priority: 50
    });

    // Transform hooks
    this.hookEngine.addTransformHook((data, context) => {
      // Normalize service names for better matching
      if (data.services && Array.isArray(data.services)) {
        data.services = data.services.map(service => ({
          ...service,
          name: service.name ? service.name.toLowerCase().trim() : service.name,
          originalName: service.name
        }));
      }
      return data;
    }, {
      name: 'normalize_service_names',
      priority: 75
    });
  }

  async integrationLoop(parsedOutput, options = {}) {
    const startTime = Date.now();
    let enriched = parsedOutput;
    let executionLog = [];

    try {
      // Step 1: Run pre-hooks
      console.log('Running pre-hooks...');
      const preHookResult = await this.hookEngine.runHooks('pre', enriched, { 
        phase: 'pre_processing',
        options 
      });
      
      enriched = preHookResult.data;
      executionLog.push({
        phase: 'pre_hooks',
        hooksExecuted: preHookResult.hooksExecuted,
        hooksSuccessful: preHookResult.hooksSuccessful,
        timestamp: new Date().toISOString()
      });

      // Step 2: Match adapters
      console.log('Matching adapters to services...');
      const adapterMatchingResult = await this.adapterMatcher.matchAdapters(enriched, options);
      
      enriched.adapters = adapterMatchingResult.matches;
      executionLog.push({
        phase: 'adapter_matching',
        servicesProcessed: adapterMatchingResult.totalProcessed,
        matchesFound: adapterMatchingResult.matches.length,
        averageConfidence: adapterMatchingResult.averageConfidence,
        executionTime: adapterMatchingResult.executionTime,
        timestamp: new Date().toISOString()
      });

      // Step 3: Attach version info and metadata
      console.log('Attaching version information...');
      enriched.adapters = enriched.adapters.map(adapterMatch => {
        const versionInfo = this.versionManager.estimateVersionPerformance(
          adapterMatch.adapter, 
          adapterMatch.version
        );
        
        return {
          ...adapterMatch,
          performance: versionInfo,
          recommendationScore: this.calculateRecommendationScore(adapterMatch),
          integrationComplexity: this.assessIntegrationComplexity(adapterMatch)
        };
      });

      // Step 4: Run transform hooks
      console.log('Running transform hooks...');
      const transformResult = await this.hookEngine.runHooks('transform', enriched, { 
        phase: 'transformation',
        options 
      });
      
      enriched = transformResult.data;
      executionLog.push({
        phase: 'transform_hooks',
        hooksExecuted: transformResult.hooksExecuted,
        hooksSuccessful: transformResult.hooksSuccessful,
        timestamp: new Date().toISOString()
      });

      // Step 5: Run post-hooks
      console.log('Running post-hooks...');
      const postHookResult = await this.hookEngine.runHooks('post', enriched, { 
        phase: 'post_processing',
        options 
      });
      
      enriched = postHookResult.data;
      executionLog.push({
        phase: 'post_hooks',
        hooksExecuted: postHookResult.hooksExecuted,
        hooksSuccessful: postHookResult.hooksSuccessful,
        timestamp: new Date().toISOString()
      });

      // Step 6: Generate final integration summary
      const integrationSummary = this.generateIntegrationSummary(enriched, Date.now() - startTime);
      enriched._integrationSummary = integrationSummary;

      return {
        success: true,
        data: enriched,
        executionLog,
        integrationSummary,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Integration loop failed:', error);
      
      // Run error hooks
      const errorHookResult = await this.hookEngine.runHooks('error', { 
        error: error.message,
        data: enriched,
        context: { phase: 'error_handling' }
      });

      executionLog.push({
        phase: 'error_handling',
        error: error.message,
        hooksExecuted: errorHookResult.hooksExecuted,
        hooksSuccessful: errorHookResult.hooksSuccessful,
        timestamp: new Date().toISOString()
      });

      // Return fallback response
      return {
        success: false,
        error: error.message,
        data: this.generateFallbackIntegration(parsedOutput),
        executionLog,
        processingTime: Date.now() - startTime
      };
    }
  }

  calculateRecommendationScore(adapterMatch) {
    let score = 0;
    
    // Base confidence
    score += adapterMatch.confidence * 40;
    
    // Version confidence
    score += (adapterMatch.versionConfidence || 0.5) * 20;
    
    // Provider reliability
    if (adapterMatch.adapter.metadata?.reliability) {
      const reliability = parseFloat(adapterMatch.adapter.metadata.reliability) / 100;
      score += reliability * 20;
    }
    
    // Cost factor (lower cost = higher score)
    const costScore = this.getCostScore(adapterMatch.adapter.metadata?.cost || 'medium');
    score += costScore * 10;
    
    // Latency factor (lower latency = higher score)
    const latencyScore = this.getLatencyScore(adapterMatch.adapter.metadata?.latency || '200ms');
    score += latencyScore * 10;
    
    return Math.min(100, Math.round(score));
  }

  getCostScore(cost) {
    const costLevels = { 'low': 10, 'medium': 6, 'high': 2 };
    return costLevels[cost.toLowerCase()] || 6;
  }

  getLatencyScore(latency) {
    const latencyMs = parseInt(latency) || 200;
    if (latencyMs <= 100) return 10;
    if (latencyMs <= 200) return 8;
    if (latencyMs <= 300) return 6;
    if (latencyMs <= 500) return 4;
    return 2;
  }

  assessIntegrationComplexity(adapterMatch) {
    let complexity = 'low';
    let factors = [];
    
    // Check auth complexity
    if (adapterMatch.adapter.authType === 'OAuth2') {
      factors.push('OAuth2 authentication');
      complexity = 'medium';
    } else if (adapterMatch.adapter.authType === 'SAML') {
      factors.push('SAML authentication');
      complexity = 'high';
    }
    
    // Check endpoint complexity
    const endpointCount = Object.keys(adapterMatch.adapter.endpoints).length;
    if (endpointCount > 5) {
      factors.push('Multiple endpoints');
      complexity = 'high';
    } else if (endpointCount > 2) {
      factors.push('Multiple endpoints');
      if (complexity === 'low') complexity = 'medium';
    }
    
    // Check version complexity
    if (adapterMatch.adapter.supportedVersions.length > 2) {
      factors.push('Multiple versions');
      if (complexity === 'low') complexity = 'medium';
    }
    
    return {
      level: complexity,
      factors,
      estimatedDays: complexity === 'low' ? 1 : complexity === 'medium' ? 3 : 7
    };
  }

  generateIntegrationSummary(enriched, processingTime) {
    const adapters = enriched.adapters || [];
    const realAdapters = adapters.filter(a => !a.fallbackUsed);
    const fallbackAdapters = adapters.filter(a => a.fallbackUsed);
    
    return {
      totalServices: enriched.services?.length || 0,
      totalAdapters: adapters.length,
      realAdapters: realAdapters.length,
      fallbackAdapters: fallbackAdapters.length,
      averageConfidence: adapters.reduce((sum, a) => sum + (a.confidence || 0), 0) / adapters.length || 0,
      averageRecommendationScore: adapters.reduce((sum, a) => sum + (a.recommendationScore || 0), 0) / adapters.length || 0,
      processingTime,
      providers: [...new Set(adapters.map(a => a.adapter.provider))],
      services: [...new Set(adapters.map(a => a.serviceName))],
      complexityBreakdown: {
        low: adapters.filter(a => a.integrationComplexity?.level === 'low').length,
        medium: adapters.filter(a => a.integrationComplexity?.level === 'medium').length,
        high: adapters.filter(a => a.integrationComplexity?.level === 'high').length
      },
      readinessScore: this.calculateReadinessScore(enriched)
    };
  }

  calculateReadinessScore(enriched) {
    const adapters = enriched.adapters || [];
    if (adapters.length === 0) return 0;
    
    let score = 0;
    
    // Real adapter availability (40%)
    const realAdapterRatio = adapters.filter(a => !a.fallbackUsed).length / adapters.length;
    score += realAdapterRatio * 40;
    
    // Average confidence (30%)
    const avgConfidence = adapters.reduce((sum, a) => sum + (a.confidence || 0), 0) / adapters.length;
    score += avgConfidence * 30;
    
    // Version confidence (20%)
    const avgVersionConfidence = adapters.reduce((sum, a) => sum + (a.versionConfidence || 0), 0) / adapters.length;
    score += avgVersionConfidence * 20;
    
    // Low complexity bonus (10%)
    const lowComplexityRatio = adapters.filter(a => a.integrationComplexity?.level === 'low').length / adapters.length;
    score += lowComplexityRatio * 10;
    
    return Math.round(score);
  }

  generateFallbackIntegration(parsedOutput) {
    const fallbackAdapters = (parsedOutput.services || []).map(service => 
      this.adapterMatcher.createFallbackAdapter(service)
    );

    return {
      ...parsedOutput,
      adapters: fallbackAdapters,
      _integration: {
        processedAt: new Date().toISOString(),
        system: 'IntegrationRegistry',
        version: '1.0',
        fallbackUsed: true
      },
      _executionSummary: {
        totalServices: parsedOutput.services?.length || 0,
        matchedAdapters: fallbackAdapters.length,
        fallbackAdapters: fallbackAdapters.length,
        averageConfidence: 0.3,
        processedAt: new Date().toISOString()
      }
    };
  }

  // Public API methods
  getAdapterRegistry() {
    return this.adapterRegistry;
  }

  getVersionManager() {
    return this.versionManager;
  }

  getHookEngine() {
    return this.hookEngine;
  }

  getAdapterMatcher() {
    return this.adapterMatcher;
  }

  getSystemStats() {
    return {
      adapterRegistry: this.adapterRegistry.getStats(),
      hookEngine: this.hookEngine.getHookStats(),
      adapterMatcher: this.adapterMatcher.getMatchStats(),
      versionManager: {
        cacheSize: this.versionManager.versionCache.size,
        parallelTestResults: this.versionManager.parallelTestResults.size
      }
    };
  }

  async explainMatching(serviceName, options = {}) {
    const explanations = [];
    
    // Get all adapters for this service
    const adapters = this.adapterRegistry.findAdaptersByService(serviceName);
    
    for (const adapter of adapters) {
      const explanation = await this.adapterMatcher.explainMatch(serviceName, adapter.id);
      explanations.push(explanation);
    }

    return {
      serviceName,
      totalAdapters: adapters.length,
      explanations,
      recommendations: this.generateServiceRecommendations(explanations)
    };
  }

  generateServiceRecommendations(explanations) {
    if (explanations.length === 0) {
      return [{
        type: 'no_adapters',
        text: `No adapters found for this service. Consider creating a custom adapter.`,
        priority: 'high'
      }];
    }

    const bestMatch = explanations.reduce((best, current) => 
      current.matchScore > best.matchScore ? current : best
    );

    const recommendations = [];

    if (bestMatch.matchScore >= 0.9) {
      recommendations.push({
        type: 'high_confidence',
        text: `Excellent match: ${bestMatch.adapter.provider}`,
        priority: 'high'
      });
    } else if (bestMatch.matchScore >= 0.7) {
      recommendations.push({
        type: 'medium_confidence',
        text: `Good match: ${bestMatch.adapter.provider}. Consider testing first.`,
        priority: 'medium'
      });
    } else {
      recommendations.push({
        type: 'low_confidence',
        text: `Limited match: ${bestMatch.adapter.provider}. Manual configuration recommended.`,
        priority: 'low'
      });
    }

    return recommendations;
  }
}

module.exports = IntegrationRegistrySystem;
