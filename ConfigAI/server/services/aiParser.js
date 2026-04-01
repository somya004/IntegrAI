class AIParser {
  constructor() {
    this.serviceKeywords = {
      'KYC': ['kyc', 'know your customer', 'identity verification', 'customer verification', 'identity check'],
      'GST': ['gst', 'goods and services tax', 'tax verification', 'tax registration', 'gstin'],
      'Payment': ['payment', 'transaction', 'payment gateway', 'payment processing', 'transaction processing'],
      'Fraud': ['fraud', 'fraud detection', 'risk assessment', 'fraud check', 'security check'],
      'Compliance': ['compliance', 'regulatory', 'audit', 'legal compliance', 'regulation']
    };
  }

  parseDocument(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    const detectedServices = [];
    const textLower = text.toLowerCase();

    // Check for each service
    Object.entries(this.serviceKeywords).forEach(([service, keywords]) => {
      const foundKeywords = keywords.filter(keyword => textLower.includes(keyword));
      
      if (foundKeywords.length > 0) {
        detectedServices.push({
          name: service,
          confidence: this.calculateConfidence(foundKeywords.length, keywords.length),
          keywords: foundKeywords,
          mandatory: this.isMandatory(service, textLower)
        });
      }
    });

    // Sort by confidence
    detectedServices.sort((a, b) => b.confidence - a.confidence);

    return {
      services: detectedServices,
      totalDetected: detectedServices.length,
      processedAt: new Date().toISOString()
    };
  }

  calculateConfidence(foundCount, totalCount) {
    const baseConfidence = (foundCount / totalCount) * 100;
    // Add bonus for multiple keyword matches
    const bonus = foundCount > 1 ? Math.min(foundCount * 10, 30) : 0;
    return Math.min(Math.round(baseConfidence + bonus), 100);
  }

  isMandatory(service, text) {
    const mandatoryKeywords = ['must', 'required', 'mandatory', 'essential', 'critical'];
    return mandatoryKeywords.some(keyword => 
      text.includes(keyword) && text.toLowerCase().includes(service.toLowerCase())
    );
  }

  extractRequirements(text) {
    const requirements = [];
    
    // Extract common requirements patterns
    const patterns = [
      { regex: /must\s+(.+?)(?:\.|$)/gi, type: 'mandatory' },
      { regex: /should\s+(.+?)(?:\.|$)/gi, type: 'recommended' },
      { regex: /will\s+(.+?)(?:\.|$)/gi, type: 'functional' },
      { regex: /shall\s+(.+?)(?:\.|$)/gi, type: 'requirement' }
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          requirements.push({
            text: match.trim(),
            type: pattern.type,
            category: this.categorizeRequirement(match)
          });
        });
      }
    });

    return requirements;
  }

  categorizeRequirement(requirement) {
    const lowerReq = requirement.toLowerCase();
    
    if (lowerReq.includes('api') || lowerReq.includes('endpoint')) return 'API';
    if (lowerReq.includes('security') || lowerReq.includes('auth')) return 'Security';
    if (lowerReq.includes('data') || lowerReq.includes('field')) return 'Data';
    if (lowerReq.includes('integration') || lowerReq.includes('connect')) return 'Integration';
    if (lowerReq.includes('validation') || lowerReq.includes('verify')) return 'Validation';
    
    return 'General';
  }
}

module.exports = new AIParser();
