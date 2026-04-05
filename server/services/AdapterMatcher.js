class AdapterMatcher {
  constructor(adapterRegistry, versionManager) {
    this.adapterRegistry = adapterRegistry;
    this.versionManager = versionManager;
    this.matchHistory = [];
    this.matchingRules = [];
    this.initializeDefaultRules();
  }

  initializeDefaultRules() {
    // Default matching rules
    this.matchingRules = [
      {
        name: 'exact_service_match',
        priority: 100,
        condition: (service, adapter) => 
          service.name.toLowerCase() === adapter.service.toLowerCase(),
        score: 1.0
      },
      {
        name: 'partial_service_match',
        priority: 80,
        condition: (service, adapter) => 
          adapter.service.toLowerCase().includes(service.name.toLowerCase()) ||
          service.name.toLowerCase().includes(adapter.service.toLowerCase()),
        score: 0.8
      },
      {
        name: 'endpoint_match',
        priority: 60,
        condition: (service, adapter) => {
          if (!service.endpoints || !adapter.endpoints) return false;
          const serviceEndpoints = Object.keys(service.endpoints);
          const adapterEndpoints = Object.keys(adapter.endpoints);
          return serviceEndpoints.some(ep => adapterEndpoints.includes(ep));
        },
        score: 0.6
      },
      {
        name: 'auth_type_match',
        priority: 40,
        condition: (service, adapter) => {
          if (!service.auth || !adapter.authType) return false;
          return service.auth.toLowerCase() === adapter.authType.toLowerCase();
        },
        score: 0.4
      },
      {
        name: 'description_match',
        priority: 30,
        condition: (service, adapter) => {
          if (!service.description || !adapter.metadata?.description) return false;
          const serviceDesc = service.description.toLowerCase();
          const adapterDesc = adapter.metadata.description.toLowerCase();
          const serviceWords = serviceDesc.split(' ');
          const adapterWords = adapterDesc.split(' ');
          const commonWords = serviceWords.filter(word => 
            word.length > 3 && adapterWords.includes(word)
          );
          return commonWords.length >= 2;
        },
        score: 0.3
      }
    ];
  }

  async matchAdapters(parsedData, options = {}) {
    const matches = [];
    const startTime = Date.now();

    if (!parsedData.services || !Array.isArray(parsedData.services)) {
      return {
        matches: [],
        totalProcessed: 0,
        executionTime: Date.now() - startTime,
        warning: 'No services found in parsed data'
      };
    }

    for (const service of parsedData.services) {
      const serviceMatch = await this.matchServiceToAdapter(service, options);
      matches.push(serviceMatch);
    }

    const executionTime = Date.now() - startTime;
    
    // Store match history
    this.matchHistory.push({
      timestamp: new Date().toISOString(),
      inputServices: parsedData.services.length,
      matches: matches.length,
      executionTime,
      successRate: matches.filter(m => m.confidence > 0.5).length / matches.length
    });

    return {
      matches,
      totalProcessed: parsedData.services.length,
      executionTime,
      averageConfidence: matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length,
      matchHistory: this.matchHistory.slice(-10) // Last 10 matches
    };
  }

  async matchServiceToAdapter(service, options = {}) {
    const candidates = [];
    const allAdapters = this.adapterRegistry.getAllAdapters();

    // Find candidate adapters
    for (const adapter of allAdapters) {
      const matchResult = this.evaluateMatch(service, adapter);
      if (matchResult.score > 0) {
        candidates.push({
          adapter,
          ...matchResult
        });
      }
    }

    // Sort candidates by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    // Select best match or create fallback
    let selectedMatch;
    if (candidates.length > 0 && candidates[0].score >= (options.minScore || 0.3)) {
      const bestCandidate = candidates[0];
      const versionSelection = this.versionManager.selectBestVersion(
        bestCandidate.adapter, 
        service
      );

      selectedMatch = {
        serviceName: service.name,
        adapterId: bestCandidate.adapter.id,
        adapter: bestCandidate.adapter,
        version: versionSelection.version,
        confidence: bestCandidate.score,
        matchReasons: bestCandidate.reasons,
        versionReason: versionSelection.reason,
        versionConfidence: versionSelection.confidence,
        recommendation: this.generateRecommendation(bestCandidate, service, versionSelection),
        fallbackUsed: false
      };
    } else {
      // Create fallback mock adapter
      selectedMatch = this.createFallbackAdapter(service);
    }

    return selectedMatch;
  }

  evaluateMatch(service, adapter) {
    let totalScore = 0;
    let matchedRules = [];
    let maxPossibleScore = 0;

    for (const rule of this.matchingRules) {
      maxPossibleScore += rule.score;
      if (rule.condition(service, adapter)) {
        totalScore += rule.score;
        matchedRules.push(rule.name);
      }
    }

    // Normalize score
    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    return {
      score: normalizedScore,
      reasons: matchedRules,
      details: {
        totalScore,
        maxPossibleScore,
        matchedRules: matchedRules.length,
        totalRules: this.matchingRules.length
      }
    };
  }

  createFallbackAdapter(service) {
    const fallbackAdapter = {
      id: `mock_${service.name.toLowerCase().replace(/\s+/g, '_')}`,
      service: service.name,
      provider: 'Mock Provider',
      supportedVersions: ['v1'],
      authType: service.auth || 'API Key',
      endpoints: service.endpoints || {},
      metadata: {
        latency: '100ms',
        reliability: '95.0%',
        cost: 'low',
        description: `Auto-generated mock adapter for ${service.name}`,
        isFallback: true
      },
      isMock: true
    };

    return {
      serviceName: service.name,
      adapterId: fallbackAdapter.id,
      adapter: fallbackAdapter,
      version: 'v1',
      confidence: 0.3,
      matchReasons: ['fallback_adapter'],
      versionReason: 'Default version for mock adapter',
      versionConfidence: 0.5,
      recommendation: {
        text: `Using mock adapter for ${service.name}. Consider configuring a real adapter for production use.`,
        priority: 'medium',
        action: 'configure_real_adapter'
      },
      fallbackUsed: true
    };
  }

  generateRecommendation(match, service, versionSelection) {
    const recommendations = [];

    if (match.score >= 0.9) {
      recommendations.push({
        text: `Excellent match found: ${match.adapter.provider} ${match.adapter.service}`,
        priority: 'high',
        action: 'use_recommended'
      });
    } else if (match.score >= 0.7) {
      recommendations.push({
        text: `Good match found: ${match.adapter.provider} ${match.adapter.service}. Consider testing before production.`,
        priority: 'medium',
        action: 'test_before_use'
      });
    } else {
      recommendations.push({
        text: `Partial match found: ${match.adapter.provider} ${match.adapter.service}. Manual review recommended.`,
        priority: 'low',
        action: 'manual_review'
      });
    }

    // Add version-specific recommendations
    if (versionSelection.confidence < 0.8) {
      recommendations.push({
        text: `Version selection may not be optimal: ${versionSelection.reason}`,
        priority: 'medium',
        action: 'review_version'
      });
    }

    return recommendations[0]; // Return primary recommendation
  }

  addMatchingRule(rule) {
    if (!rule.name || !rule.condition || rule.score === undefined) {
      throw new Error('Matching rule must have name, condition, and score');
    }

    rule.priority = rule.priority || 50;
    this.matchingRules.push(rule);
    this.sortRulesByPriority();
    
    return rule.name;
  }

  removeMatchingRule(ruleName) {
    const index = this.matchingRules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.matchingRules.splice(index, 1);
      return true;
    }
    return false;
  }

  sortRulesByPriority() {
    this.matchingRules.sort((a, b) => b.priority - a.priority);
  }

  getMatchingRules() {
    return [...this.matchingRules];
  }

  getMatchHistory(limit = 50) {
    return this.matchHistory.slice(-limit);
  }

  getMatchStats() {
    if (this.matchHistory.length === 0) {
      return {
        totalMatches: 0,
        averageConfidence: 0,
        averageExecutionTime: 0
      };
    }

    const totalMatches = this.matchHistory.reduce((sum, h) => sum + h.matches, 0);
    const avgConfidence = this.matchHistory.reduce((sum, h) => sum + h.successRate, 0) / this.matchHistory.length;
    const avgExecutionTime = this.matchHistory.reduce((sum, h) => sum + h.executionTime, 0) / this.matchHistory.length;

    return {
      totalMatches,
      averageConfidence: avgConfidence,
      averageExecutionTime: avgExecutionTime,
      recentPerformance: this.matchHistory.slice(-10)
    };
  }

  async explainMatch(serviceName, adapterId) {
    const adapter = this.adapterRegistry.getAdapter(adapterId);
    if (!adapter) {
      return { error: 'Adapter not found' };
    }

    // Create a mock service for explanation
    const mockService = { name: serviceName };
    const matchResult = this.evaluateMatch(mockService, adapter);

    return {
      service: serviceName,
      adapter: adapter,
      matchScore: matchResult.score,
      matchedRules: matchResult.reasons,
      explanation: this.generateExplanation(mockService, adapter, matchResult),
      recommendations: this.generateDetailedRecommendations(matchResult)
    };
  }

  generateExplanation(service, adapter, matchResult) {
    const explanations = [];

    if (matchResult.reasons.includes('exact_service_match')) {
      explanations.push(`Perfect service name match: "${service.name}" matches "${adapter.service}"`);
    }

    if (matchResult.reasons.includes('partial_service_match')) {
      explanations.push(`Partial service name match detected between "${service.name}" and "${adapter.service}"`);
    }

    if (matchResult.reasons.includes('endpoint_match')) {
      explanations.push(`Compatible endpoints found between service and adapter`);
    }

    if (matchResult.reasons.includes('auth_type_match')) {
      explanations.push(`Authentication types match: both use ${adapter.authType}`);
    }

    if (matchResult.reasons.includes('description_match')) {
      explanations.push(`Service and adapter descriptions share common keywords`);
    }

    if (explanations.length === 0) {
      explanations.push('No strong matching criteria found, but adapter selected as best available option');
    }

    return explanations;
  }

  generateDetailedRecommendations(matchResult) {
    const recommendations = [];

    if (matchResult.score >= 0.9) {
      recommendations.push({
        category: 'confidence',
        text: 'High confidence match - suitable for immediate use',
        action: 'implement'
      });
    } else if (matchResult.score >= 0.7) {
      recommendations.push({
        category: 'confidence',
        text: 'Moderate confidence - recommend testing before production',
        action: 'test'
      });
    } else {
      recommendations.push({
        category: 'confidence',
        text: 'Low confidence - manual configuration required',
        action: 'configure'
      });
    }

    if (matchResult.details.matchedRules < 3) {
      recommendations.push({
        category: 'coverage',
        text: 'Limited matching criteria - consider adding more specific rules',
        action: 'enhance_rules'
      });
    }

    return recommendations;
  }

  clearHistory() {
    this.matchHistory = [];
  }
}

module.exports = AdapterMatcher;
