const { v4: uuidv4 } = require('uuid');

class SimulationService {
  constructor() {
    this.apiKeys = {
      KYC: process.env.KYC_API_KEY,
      BUREAU: process.env.BUREAU_API_KEY,
      PAYMENTS: process.env.PAYMENTS_API_KEY,
      OPEN_BANKING: process.env.OPEN_BANKING_API_KEY,
      GST: process.env.KYC_API_KEY, // Use KYC for GST simulation
      FRAUD: process.env.BUREAU_API_KEY // Use Bureau for Fraud simulation
    };
  }

  // Mask API key for frontend display
  maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 4) return '****';
    return '****' + apiKey.slice(-4);
  }

  // Simulate API delay (1-2 seconds)
  async simulateDelay() {
    const delay = Math.floor(Math.random() * 1000) + 1000; // 1000-2000ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Simulate success/failure (80% success rate)
  simulateSuccess() {
    return Math.random() < 0.8;
  }

  // Generate KYC response
  generateKYCResponse(payload) {
    const providers = ['VeriKyc', 'TrustID', 'SecureVerify', 'IdentiSafe'];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    return {
      verified: this.simulateSuccess(),
      name: payload.name || 'John Doe',
      provider,
      verificationId: uuidv4(),
      timestamp: new Date().toISOString(),
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100
      checks: {
        nameMatch: this.simulateSuccess(),
        dobMatch: this.simulateSuccess(),
        panValid: this.simulateSuccess(),
        emailVerified: this.simulateSuccess(),
        phoneVerified: this.simulateSuccess()
      }
    };
  }

  // Generate Bureau response
  generateBureauResponse(payload) {
    return {
      creditScore: Math.floor(Math.random() * 150) + 650, // 650-800
      provider: 'CreditBureau Pro',
      reportId: uuidv4(),
      timestamp: new Date().toISOString(),
      riskLevel: this.getRiskLevel(),
      factors: [
        'Payment History',
        'Credit Utilization',
        'Account Age',
        'Recent Inquiries'
      ],
      recommendations: this.getRecommendations()
    };
  }

  // Generate Payments response
  generatePaymentsResponse(payload) {
    const statuses = ['SUCCESS', 'PENDING', 'FAILED'];
    const status = this.simulateSuccess() ? 'SUCCESS' : statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      transactionId: uuidv4(),
      status,
      amount: payload.amount || '1000.00',
      currency: 'USD',
      provider: 'PaySecure Gateway',
      timestamp: new Date().toISOString(),
      processingTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
      fraudCheck: {
        passed: this.simulateSuccess(),
        riskScore: Math.floor(Math.random() * 100),
        flags: []
      }
    };
  }

  // Generate Open Banking response
  generateOpenBankingResponse(payload) {
    return {
      accountId: uuidv4(),
      provider: 'OpenBank Connect',
      accountType: 'CHECKING',
      balance: {
        available: (Math.random() * 50000 + 1000).toFixed(2),
        current: (Math.random() * 55000 + 1000).toFixed(2),
        currency: 'USD'
      },
      accountHolder: payload.name || 'John Doe',
      verified: this.simulateSuccess(),
      timestamp: new Date().toISOString(),
      transactions: this.generateMockTransactions()
    };
  }

  // Generate GST response
  generateGSTResponse(payload) {
    return {
      gstinValid: this.simulateSuccess(),
      provider: 'GST Verify Pro',
      businessName: payload.businessName || 'Demo Business',
      registrationDate: '2020-01-15',
      status: 'ACTIVE',
      complianceScore: Math.floor(Math.random() * 30) + 70, // 70-100
      timestamp: new Date().toISOString(),
      verificationId: uuidv4()
    };
  }

  // Generate Fraud response
  generateFraudResponse(payload) {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
    const riskScore = Math.floor(Math.random() * 100);
    
    return {
      riskScore,
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      provider: 'FraudShield AI',
      decision: riskScore < 70 ? 'APPROVED' : 'REVIEW_REQUIRED',
      factors: this.getFraudFactors(),
      timestamp: new Date().toISOString(),
      caseId: uuidv4()
    };
  }

  // Helper methods
  getRiskLevel() {
    const levels = ['LOW', 'MEDIUM', 'HIGH'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  getRecommendations() {
    const allRecommendations = [
      'Maintain low credit utilization',
      'Pay bills on time',
      'Avoid opening too many accounts',
      'Keep old accounts open',
      'Monitor credit report regularly'
    ];
    
    const count = Math.floor(Math.random() * 3) + 1;
    return allRecommendations.slice(0, count);
  }

  getFraudFactors() {
    const allFactors = [
      'Unusual transaction pattern',
      'High-risk location',
      'New device detected',
      'Velocity check triggered',
      'Account age too recent'
    ];
    
    const count = Math.floor(Math.random() * 2) + 1;
    return allFactors.slice(0, count);
  }

  generateMockTransactions() {
    const transactions = [];
    const count = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < count; i++) {
      transactions.push({
        id: uuidv4(),
        amount: (Math.random() * 1000 + 10).toFixed(2),
        description: ['Payment', 'Transfer', 'Purchase', 'Withdrawal'][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return transactions;
  }

  // Main simulation method
  async simulateIntegration(service, payload) {
    const startTime = Date.now();
    
    // Get API key for the service
    const apiKey = this.apiKeys[service.toUpperCase()];
    if (!apiKey) {
      throw new Error(`No API key configured for service: ${service}`);
    }

    // Simulate API delay
    await this.simulateDelay();

    // Simulate success/failure
    const success = this.simulateSuccess();
    const responseTime = Date.now() - startTime;

    let data;
    switch (service.toUpperCase()) {
      case 'KYC':
        data = this.generateKYCResponse(payload);
        break;
      case 'BUREAU':
        data = this.generateBureauResponse(payload);
        break;
      case 'PAYMENTS':
        data = this.generatePaymentsResponse(payload);
        break;
      case 'OPEN_BANKING':
        data = this.generateOpenBankingResponse(payload);
        break;
      case 'GST':
        data = this.generateGSTResponse(payload);
        break;
      case 'FRAUD':
        data = this.generateFraudResponse(payload);
        break;
      default:
        throw new Error(`Unsupported service: ${service}`);
    }

    return {
      status: success ? 'success' : 'failure',
      service: service.toUpperCase(),
      apiKeyUsed: this.maskApiKey(apiKey),
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      data: success ? data : { error: 'Service temporarily unavailable' }
    };
  }
}

module.exports = new SimulationService();
