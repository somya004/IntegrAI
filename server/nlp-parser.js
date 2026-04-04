const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// NLP Simulation - Keyword-based extraction
class NLPRequirementParser {
  constructor() {
    // Service keywords and their variations
    this.serviceKeywords = {
      'KYC': [
        'kyc', 'know your customer', 'identity verification', 'customer verification',
        'identity check', 'customer identification', 'pan verification', 'aadhaar verification',
        'identity proof', 'customer onboarding', 'document verification'
      ],
      'GST': [
        'gst', 'goods and services tax', 'tax verification', 'gst verification',
        'gstin verification', 'tax registration', 'tax compliance', 'gst filing',
        'gst return', 'tax identification', 'business registration'
      ],
      'Payments': [
        'payment', 'transaction', 'payment processing', 'transaction processing',
        'payment gateway', 'online payment', 'digital payment', 'payment integration',
        'razorpay', 'stripe', 'payment method', 'checkout', 'payment collection'
      ],
      'Fraud': [
        'fraud', 'fraud detection', 'risk assessment', 'fraud check',
        'risk analysis', 'fraud prevention', 'security check', 'verification',
        'background check', 'risk management', 'anti-fraud'
      ]
    };

    // Field keywords and their variations
    this.fieldKeywords = {
      'name': [
        'name', 'full name', 'customer name', 'applicant name', 'user name',
        'first name', 'last name', 'person name', 'individual name'
      ],
      'dob': [
        'dob', 'date of birth', 'birth date', 'birth day', 'born on',
        'age', 'birthday', 'date_of_birth'
      ],
      'PAN': [
        'pan', 'pan number', 'permanent account number', 'pan card',
        'permanent account', 'pan_no', 'pan_id'
      ],
      'GSTIN': [
        'gstin', 'gst identification number', 'gst number', 'gst id',
        'goods and services tax identification', 'gstin_no'
      ],
      'phone': [
        'phone', 'mobile', 'mobile number', 'telephone', 'contact number',
        'phone number', 'cell phone', 'contact', 'mobile_no'
      ],
      'email': [
        'email', 'email address', 'mail', 'email_id', 'email address',
        'electronic mail', 'e-mail', 'mail id'
      ],
      'address': [
        'address', 'postal address', 'residential address', 'office address',
        'location', 'street address', 'permanent address'
      ],
      'aadhaar': [
        'aadhaar', 'aadhaar number', 'aadhaar card', 'uid', 'uid number',
        'unique identification', 'aadhaar_no', 'aadhaar_id'
      ],
      'bankAccount': [
        'bank account', 'account number', 'bank details', 'account',
        'bank account number', 'bank_ac', 'account_no'
      ],
      'amount': [
        'amount', 'transaction amount', 'payment amount', 'price',
        'cost', 'fee', 'charge', 'transaction value'
      ]
    };

    // Mandatory keywords
    this.mandatoryKeywords = [
      'must', 'required', 'mandatory', 'essential', 'compulsory',
      'necessary', 'need to', 'should', 'shall', 'will'
    ];

    // Optional keywords
    this.optionalKeywords = [
      'optional', 'if needed', 'if required', 'can', 'may', 'could',
      'preferably', 'nice to have', 'good to have', 'additional'
    ];
  }

  // Normalize text for processing
  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  // Detect services using keyword matching
  detectServices(text) {
    const normalizedText = this.normalizeText(text);
    const detectedServices = [];
    const serviceMatches = {};

    Object.entries(this.serviceKeywords).forEach(([service, keywords]) => {
      const matches = keywords.filter(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      );
      
      if (matches.length > 0) {
        detectedServices.push(service);
        serviceMatches[service] = matches;
      }
    });

    return {
      services: detectedServices,
      matches: serviceMatches
    };
  }

  // Detect fields using keyword matching
  detectFields(text) {
    const normalizedText = this.normalizeText(text);
    const detectedFields = [];
    const fieldMatches = {};

    Object.entries(this.fieldKeywords).forEach(([field, keywords]) => {
      const matches = keywords.filter(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      );
      
      if (matches.length > 0) {
        detectedFields.push(field);
        fieldMatches[field] = matches;
      }
    });

    return {
      fields: detectedFields,
      matches: fieldMatches
    };
  }

  // Determine service priority based on context
  determineServicePriority(text, services) {
    const normalizedText = this.normalizeText(text);
    const mandatoryServices = [];
    const optionalServices = [];

    services.forEach(service => {
      // Check for mandatory indicators
      const isMandatory = this.mandatoryKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b.*\\b${service.toLowerCase()}\\b|\\b${service.toLowerCase()}\\b.*\\b${keyword}\\b`, 'i');
        return regex.test(normalizedText);
      });

      // Check for optional indicators
      const isOptional = this.optionalKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b.*\\b${service.toLowerCase()}\\b|\\b${service.toLowerCase()}\\b.*\\b${keyword}\\b`, 'i');
        return regex.test(normalizedText);
      });

      if (isMandatory) {
        mandatoryServices.push(service);
      } else if (isOptional) {
        optionalServices.push(service);
      } else {
        // Default to mandatory if no specific indicator found
        mandatoryServices.push(service);
      }
    });

    return { mandatoryServices, optionalServices };
  }

  // Extract confidence scores
  calculateConfidence(detectionResult, text) {
    const wordCount = text.split(/\s+/).length;
    const totalKeywords = Object.values(this.serviceKeywords).flat().length + 
                          Object.values(this.fieldKeywords).flat().length;
    const foundKeywords = detectionResult.services.matches ? 
      Object.values(detectionResult.services.matches).flat().length : 0;

    const confidence = Math.min((foundKeywords / Math.max(wordCount * 0.1, 1)) * 100, 100);
    return Math.round(confidence);
  }

  // Main parsing function
  parseRequirements(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text is required and must be a string');
    }

    // Detect services
    const serviceDetection = this.detectServices(text);
    
    // Detect fields
    const fieldDetection = this.detectFields(text);
    
    // Determine service priority
    const priority = this.determineServicePriority(text, serviceDetection.services);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(serviceDetection, text);

    // Build structured result
    const result = {
      timestamp: new Date().toISOString(),
      input_text: text,
      input_length: text.length,
      word_count: text.split(/\s+/).length,
      services_detected: serviceDetection.services,
      fields_detected: fieldDetection.fields,
      mandatory_services: priority.mandatoryServices,
      optional_services: priority.optionalServices,
      confidence_score: confidence,
      processing_details: {
        service_matches: serviceDetection.matches,
        field_matches: fieldDetection.matches,
        total_service_keywords_found: Object.values(serviceDetection.matches).flat().length,
        total_field_keywords_found: Object.values(fieldDetection.matches).flat().length
      },
      metadata: {
        parser_version: '1.0.0',
        processing_method: 'keyword_matching_rule_based',
        language: 'en'
      }
    };

    return result;
  }
}

// Initialize parser
const parser = new NLPRequirementParser();

// API Routes

// POST /parse - Parse requirements text
app.post('/parse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required in request body'
      });
    }

    const result = parser.parseRequirements(text);
    
    res.json({
      success: true,
      data: result,
      message: 'Requirements parsed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /parse/services - Get available service keywords
app.get('/parse/services', (req, res) => {
  res.json({
    success: true,
    data: parser.serviceKeywords,
    message: 'Service keywords retrieved successfully'
  });
});

// GET /parse/fields - Get available field keywords
app.get('/parse/fields', (req, res) => {
  res.json({
    success: true,
    data: parser.fieldKeywords,
    message: 'Field keywords retrieved successfully'
  });
});

// POST /parse/test - Test with sample texts
app.post('/parse/test', (req, res) => {
  try {
    const sampleTexts = [
      "The system must integrate KYC and GST verification APIs. The KYC integration should support customer identity verification with name, date of birth, PAN number, email, and phone number validation. The GST integration must validate GSTIN and business registration details. Payment processing is required for transaction handling. All integrations should be secure and compliant with regulatory requirements.",
      
      "We need optional fraud detection services if needed. Payment gateway integration is mandatory with Razorpay. Customer verification should include PAN and Aadhaar verification. GST filing can be optional based on business requirements.",
      
      "The platform should support multiple payment methods including credit cards and UPI. KYC verification is essential for onboarding. GST compliance is nice to have for tax purposes. Address verification is optional for premium users."
    ];

    const results = sampleTexts.map((text, index) => ({
      sample_id: index + 1,
      text: text,
      parsed: parser.parseRequirements(text)
    }));

    res.json({
      success: true,
      data: results,
      message: 'Test parsing completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NLP Requirement Parser API',
    version: '1.0.0',
    capabilities: {
      service_detection: true,
      field_extraction: true,
      priority_analysis: true,
      confidence_scoring: true
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NLP Requirement Parser API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Parse endpoint: http://localhost:${PORT}/parse`);
});

module.exports = app;
