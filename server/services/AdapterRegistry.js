class AdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.initializeDefaultAdapters();
  }

  initializeDefaultAdapters() {
    const defaultAdapters = [
      {
        id: "kyc_aadhaar",
        service: "KYC",
        provider: "UIDAI",
        supportedVersions: ["v1", "v2"],
        authType: "OAuth2",
        endpoints: {
          verify: "/kyc/verify",
          status: "/kyc/status"
        },
        metadata: {
          latency: "200ms",
          reliability: "99.9%",
          cost: "low",
          description: "Official Aadhaar KYC verification service"
        }
      },
      {
        id: "kyc_pan",
        service: "KYC",
        provider: "NSDL",
        supportedVersions: ["v1"],
        authType: "API Key",
        endpoints: {
          verify: "/pan/verify",
          details: "/pan/details"
        },
        metadata: {
          latency: "300ms",
          reliability: "99.5%",
          cost: "medium",
          description: "PAN card verification service"
        }
      },
      {
        id: "payment_razorpay",
        service: "Payment",
        provider: "Razorpay",
        supportedVersions: ["v1", "v2"],
        authType: "API Key",
        endpoints: {
          create: "/payment/initiate",
          capture: "/payment/capture",
          refund: "/payment/refund"
        },
        metadata: {
          latency: "150ms",
          reliability: "99.8%",
          cost: "low",
          description: "Popular Indian payment gateway"
        }
      },
      {
        id: "payment_stripe",
        service: "Payment",
        provider: "Stripe",
        supportedVersions: ["v1"],
        authType: "API Key",
        endpoints: {
          create: "/v1/charges",
          capture: "/v1/charges/:id/capture",
          refund: "/v1/refunds"
        },
        metadata: {
          latency: "250ms",
          reliability: "99.9%",
          cost: "medium",
          description: "Global payment processing platform"
        }
      },
      {
        id: "gst_gstn",
        service: "GST",
        provider: "GSTN",
        supportedVersions: ["v1", "v2"],
        authType: "OAuth2",
        endpoints: {
          verify: "/gst/verify",
          return: "/gst/return",
          details: "/gst/details"
        },
        metadata: {
          latency: "400ms",
          reliability: "98.5%",
          cost: "high",
          description: "Official GST Network services"
        }
      },
      {
        id: "fraud_fraudnet",
        service: "Fraud Detection",
        provider: "FraudNet",
        supportedVersions: ["v1"],
        authType: "Bearer Token",
        endpoints: {
          assess: "/fraud/assess",
          report: "/fraud/report",
          blacklist: "/fraud/blacklist"
        },
        metadata: {
          latency: "100ms",
          reliability: "99.7%",
          cost: "medium",
          description: "AI-powered fraud detection system"
        }
      },
      {
        id: "notification_sns",
        service: "Notification",
        provider: "AWS",
        supportedVersions: ["v1"],
        authType: "API Key",
        endpoints: {
          send: "/sns/send",
          subscribe: "/sns/subscribe",
          publish: "/sns/publish"
        },
        metadata: {
          latency: "50ms",
          reliability: "99.9%",
          cost: "low",
          description: "Cloud notification service"
        }
      },
      {
        id: "audit_splunk",
        service: "Audit",
        provider: "Splunk",
        supportedVersions: ["v1", "v2"],
        authType: "Bearer Token",
        endpoints: {
          log: "/audit/log",
          search: "/audit/search",
          report: "/audit/report"
        },
        metadata: {
          latency: "200ms",
          reliability: "99.8%",
          cost: "high",
          description: "Enterprise log management and analytics"
        }
      }
    ];

    defaultAdapters.forEach(adapter => {
      this.adapters.set(adapter.id, adapter);
    });
  }

  registerAdapter(adapter) {
    if (!adapter.id || !adapter.service) {
      throw new Error('Adapter must have id and service properties');
    }

    this.adapters.set(adapter.id, {
      ...adapter,
      registeredAt: new Date().toISOString()
    });

    return this.getAdapter(adapter.id);
  }

  getAdapter(id) {
    return this.adapters.get(id);
  }

  findAdaptersByService(serviceName) {
    const results = [];
    const lowerServiceName = serviceName.toLowerCase();

    for (const [id, adapter] of this.adapters) {
      if (adapter.service.toLowerCase() === lowerServiceName) {
        results.push(adapter);
      }
    }

    return results;
  }

  findAdaptersByProvider(providerName) {
    const results = [];
    const lowerProviderName = providerName.toLowerCase();

    for (const [id, adapter] of this.adapters) {
      if (adapter.provider.toLowerCase() === lowerProviderName) {
        results.push(adapter);
      }
    }

    return results;
  }

  searchAdapters(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [id, adapter] of this.adapters) {
      if (
        adapter.id.toLowerCase().includes(lowerQuery) ||
        adapter.service.toLowerCase().includes(lowerQuery) ||
        adapter.provider.toLowerCase().includes(lowerQuery) ||
        (adapter.metadata?.description && adapter.metadata.description.toLowerCase().includes(lowerQuery))
      ) {
        results.push(adapter);
      }
    }

    return results;
  }

  getAllAdapters() {
    return Array.from(this.adapters.values());
  }

  removeAdapter(id) {
    return this.adapters.delete(id);
  }

  getAdapterCount() {
    return this.adapters.size;
  }

  getServices() {
    const services = new Set();
    for (const adapter of this.adapters.values()) {
      services.add(adapter.service);
    }
    return Array.from(services);
  }

  getProviders() {
    const providers = new Set();
    for (const adapter of this.adapters.values()) {
      providers.add(adapter.provider);
    }
    return Array.from(providers);
  }

  getStats() {
    const adapters = this.getAllAdapters();
    const serviceCounts = {};
    const providerCounts = {};
    const versionCounts = {};

    adapters.forEach(adapter => {
      // Count services
      serviceCounts[adapter.service] = (serviceCounts[adapter.service] || 0) + 1;
      
      // Count providers
      providerCounts[adapter.provider] = (providerCounts[adapter.provider] || 0) + 1;
      
      // Count versions
      adapter.supportedVersions.forEach(version => {
        versionCounts[version] = (versionCounts[version] || 0) + 1;
      });
    });

    return {
      totalAdapters: adapters.length,
      services: serviceCounts,
      providers: providerCounts,
      versions: versionCounts,
      averageVersionsPerAdapter: adapters.reduce((sum, a) => sum + a.supportedVersions.length, 0) / adapters.length
    };
  }
}

module.exports = AdapterRegistry;
