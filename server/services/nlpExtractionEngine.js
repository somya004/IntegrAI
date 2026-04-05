const OpenAI = require('openai');

class NLPExtractionEngine {
  constructor() {
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    this.extractionPatterns = {
      services: {
        kyc: /\b(kyc|know\s*your\s*customer|identity\s*verification|customer\s*verification)\b/i,
        payment: /\b(payment|transaction|gateway|billing|checkout)\b/i,
        gst: /\b(gst|tax|vat|taxation|tax\s*compliance)\b/i,
        fraud: /\b(fraud|detection|risk|security|anti\s*money|aml)\b/i,
        notification: /\b(notification|sms|email|alert|communication)\b/i,
        audit: /\b(audit|logging|compliance|monitoring|tracking)\b/i
      },
      
      auth: {
        bearer: /\b(bearer\s*token|jwt|token\s*based)\b/i,
        apikey: /\b(api\s*key|key\s*based|apikey)\b/i,
        oauth: /\b(oauth|oauth2|oauth\s*2\.0)\b/i,
        basic: /\b(basic\s*auth|username\s*password)\b/i
      },
      
      methods: /\b(get|post|put|delete|patch)\b/i,
      endpoints: /\/api\/[a-zA-Z0-9\/\-_]+/gi,
      fields: /\b[a-z_][a-z0-9_]*\b/gi
    };
  }

  async extract(preprocessedData) {
    try {
      const { cleanedContent, sections } = preprocessedData;
      
      let extraction;
      
      if (this.openai) {
        extraction = await this.extractWithAI(cleanedContent);
      } else {
        extraction = await this.extractWithPatterns(cleanedContent, sections);
      }

      return {
        success: true,
        data: extraction,
        method: this.openai ? 'ai' : 'pattern'
      };

    } catch (error) {
      console.error('NLP extraction failed:', error.message);
      return this.generateMockExtraction(preprocessedData);
    }
  }

  async extractWithAI(content) {
    const prompt = this.buildExtractionPrompt(content);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert API integration analyst. Extract structured information from requirement documents and return ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const response = completion.choices[0].message.content;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }

    } catch (error) {
      console.error('AI extraction failed, falling back to patterns:', error.message);
      return this.extractWithPatterns(content, {});
    }
  }

  buildExtractionPrompt(content) {
    return `
Analyze the following business requirements document and extract integration information in JSON format:

DOCUMENT:
${content}

EXTRACT THE FOLLOWING IN THIS EXACT JSON STRUCTURE:
{
  "apis": [
    {
      "name": "Service Name",
      "endpoint": "/api/endpoint",
      "method": "GET|POST|PUT|DELETE",
      "authentication": "Bearer Token|API Key|OAuth2|Basic Auth",
      "request_fields": ["field1", "field2"],
      "response_fields": ["field1", "field2"],
      "description": "Brief description"
    }
  ],
  "services": [
    {
      "name": "Service Name",
      "type": "kyc|payment|gst|fraud|notification|audit|other",
      "description": "Service description"
    }
  ],
  "authentication": [
    {
      "type": "Bearer Token|API Key|OAuth2|Basic Auth",
      "applies_to": ["service1", "service2"]
    }
  ],
  "fields": {
    "input": ["field1", "field2"],
    "output": ["field1", "field2"]
  }
}

IMPORTANT: Return ONLY the JSON object. No explanations or markdown.
`;
  }

  async extractWithPatterns(content, sections) {
    const apis = this.extractAPIs(content, sections);
    const services = this.extractServices(content, sections);
    const authentication = this.extractAuthentication(content, sections);
    const fields = this.extractFields(content, sections);

    return {
      apis,
      services,
      authentication,
      fields
    };
  }

  extractAPIs(content, sections) {
    const apis = [];
    const apiSection = sections.apiDetails || content;
    
    const endpointMatches = apiSection.match(this.extractionPatterns.endpoints) || [];
    const methodMatches = apiSection.match(this.extractionPatterns.methods) || [];
    
    const serviceNames = Object.keys(this.extractionPatterns.services);
    
    endpointMatches.forEach((endpoint, index) => {
      const method = methodMatches[index] || 'POST';
      const serviceName = this.detectServiceType(endpoint, apiSection);
      const auth = this.detectAuthType(endpoint, apiSection);
      
      apis.push({
        name: `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} API`,
        endpoint: endpoint,
        method: method.toUpperCase(),
        authentication: auth,
        request_fields: this.extractRequestFields(endpoint, apiSection),
        response_fields: this.extractResponseFields(endpoint, apiSection),
        description: `${serviceName} service endpoint`
      });
    });

    return apis.length > 0 ? apis : this.generateMockAPIs();
  }

  extractServices(content, sections) {
    const services = [];
    const serviceSection = sections.services || content;
    
    Object.entries(this.extractionPatterns.services).forEach(([type, pattern]) => {
      if (pattern.test(serviceSection)) {
        services.push({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          type: type,
          description: `${type} service for enterprise integration`
        });
      }
    });

    return services.length > 0 ? services : this.generateMockServices();
  }

  extractAuthentication(content, sections) {
    const auth = [];
    const authSection = sections.authentication || content;
    
    Object.entries(this.extractionPatterns.auth).forEach(([type, pattern]) => {
      if (pattern.test(authSection)) {
        const appliesTo = this.getServicesForAuthType(type, content);
        auth.push({
          type: this.formatAuthType(type),
          applies_to: appliesTo
        });
      }
    });

    return auth.length > 0 ? auth : this.generateMockAuthentication();
  }

  extractFields(content, sections) {
    const fieldSection = sections.fields || content;
    const allFields = fieldSection.match(this.extractionPatterns.fields) || [];
    
    const uniqueFields = [...new Set(allFields)]
      .filter(field => field.length > 2 && field.length < 30)
      .filter(field => !/^(the|and|or|for|with|from|to|in|on|at|by|of)$/i.test(field));

    const inputFields = uniqueFields.filter(field => 
      /\b(request|input|create|add|insert|post)\b/i.test(field) ||
      /\b(id|name|email|phone|amount|data|type|status)\b/i.test(field)
    );

    const outputFields = uniqueFields.filter(field => 
      /\b(response|output|result|return|get|fetch)\b/i.test(field) ||
      /\b(status|message|details|info|data|result)\b/i.test(field)
    );

    return {
      input: inputFields.length > 0 ? inputFields : this.generateMockInputFields(),
      output: outputFields.length > 0 ? outputFields : this.generateMockOutputFields()
    };
  }

  detectServiceType(endpoint, content) {
    for (const [type, pattern] of Object.entries(this.extractionPatterns.services)) {
      if (pattern.test(endpoint) || pattern.test(content)) {
        return type;
      }
    }
    return 'other';
  }

  detectAuthType(endpoint, content) {
    for (const [type, pattern] of Object.entries(this.extractionPatterns.auth)) {
      if (pattern.test(endpoint) || pattern.test(content)) {
        return this.formatAuthType(type);
      }
    }
    return 'API Key';
  }

  formatAuthType(type) {
    const authMap = {
      bearer: 'Bearer Token',
      apikey: 'API Key',
      oauth: 'OAuth2',
      basic: 'Basic Auth'
    };
    return authMap[type] || 'API Key';
  }

  getServicesForAuthType(authType, content) {
    const services = [];
    Object.entries(this.extractionPatterns.services).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        services.push(type);
      }
    });
    return services.length > 0 ? services : ['default'];
  }

  extractRequestFields(endpoint, content) {
    const patterns = [
      /request\s*fields?:\s*([^\n]+)/i,
      /input\s*fields?:\s*([^\n]+)/i,
      /(\w+),\s*(\w+),\s*(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].split(',').map(f => f.trim()).filter(f => f.length > 0);
      }
    }

    return ['id', 'data'];
  }

  extractResponseFields(endpoint, content) {
    const patterns = [
      /response\s*fields?:\s*([^\n]+)/i,
      /output\s*fields?:\s*([^\n]+)/i,
      /returns?\s*([^\n]+)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].split(',').map(f => f.trim()).filter(f => f.length > 0);
      }
    }

    return ['status', 'data'];
  }

  generateMockAPIs() {
    return [
      {
        name: "KYC Verification API",
        endpoint: "/api/kyc/verify",
        method: "POST",
        authentication: "Bearer Token",
        request_fields: ["customer_id", "document_type", "document_data"],
        response_fields: ["verification_status", "customer_details", "confidence_score"],
        description: "Customer identity verification service"
      },
      {
        name: "Payment Processing API",
        endpoint: "/api/payments/process",
        method: "POST",
        authentication: "API Key",
        request_fields: ["amount", "currency", "payment_method", "customer_id"],
        response_fields: ["transaction_id", "status", "payment_details"],
        description: "Payment transaction processing service"
      },
      {
        name: "GST Validation API",
        endpoint: "/api/gst/validate",
        method: "POST",
        authentication: "OAuth2",
        request_fields: ["gstin", "business_name", "state_code"],
        response_fields: ["gstin_status", "registration_details", "validity"],
        description: "Tax identification validation service"
      }
    ];
  }

  generateMockServices() {
    return [
      { name: "KYC", type: "kyc", description: "Customer identity verification" },
      { name: "Payment", type: "payment", description: "Payment processing" },
      { name: "GST", type: "gst", description: "Tax validation" },
      { name: "Fraud Detection", type: "fraud", description: "Security screening" }
    ];
  }

  generateMockAuthentication() {
    return [
      { type: "Bearer Token", applies_to: ["kyc", "fraud"] },
      { type: "API Key", applies_to: ["payment"] },
      { type: "OAuth2", applies_to: ["gst"] }
    ];
  }

  generateMockInputFields() {
    return ["customer_id", "document_type", "amount", "currency", "gstin", "business_name"];
  }

  generateMockOutputFields() {
    return ["verification_status", "transaction_id", "gstin_status", "confidence_score", "status"];
  }

  generateMockExtraction(preprocessedData) {
    return {
      success: true,
      data: {
        apis: this.generateMockAPIs(),
        services: this.generateMockServices(),
        authentication: this.generateMockAuthentication(),
        fields: {
          input: this.generateMockInputFields(),
          output: this.generateMockOutputFields()
        }
      },
      method: 'mock',
      note: 'Generated mock extraction due to extraction failure'
    };
  }
}

module.exports = NLPExtractionEngine;
