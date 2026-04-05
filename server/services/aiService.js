const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize AI providers based on environment
let geminiClient = null;
let openaiClient = null;

// Initialize Gemini if configured
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Initialize OpenAI if configured
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Get current AI provider from environment
const getCurrentProvider = () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  return provider;
};

// Standardized prompt for both providers
const getStandardPrompt = (text) => {
  return `
You are an enterprise integration architect. Analyze the following business requirements document and extract integration services with confidence scoring.

DOCUMENT TEXT:
${text}

ANALYSIS REQUIREMENTS:
1. Return ONLY valid JSON - no explanations, no markdown, no code blocks
2. Use this exact schema:
{
  "services": [
    {
      "name": "Service Name",
      "type": "identity|tax|payment|communication|security|other",
      "mandatory": true|false,
      "confidence": 0-100,
      "authentication": "Bearer Token|API Key|OAuth 2.0|Basic Auth",
      "endpoints": [
        {
          "url": "/api/endpoint",
          "method": "GET|POST|PUT|DELETE",
          "request_fields": ["field1", "field2"],
          "response_fields": ["field1", "field2"]
        }
      ]
    }
  ]
}

CONFIDENCE SCORING RULES:
- 95-100: Explicit requirements with clear implementation details
- 85-94: Strong keyword matches with business context
- 70-84: Moderate keyword matches, some ambiguity
- 50-69: Weak keyword matches, limited details
- 0-49: Very low confidence, guesswork

CONFIDENCE FACTORS:
- Keyword frequency and density in document
- Context clarity and specificity
- Business terminology usage
- Implementation detail availability
- Regulatory requirement explicitness

MANDATORY VS OPTIONAL CLASSIFICATION:

CRITICAL SERVICES (mandatory: true):
- KYC/Identity Verification → ALWAYS mandatory for compliance
- Payment Processing → ALWAYS mandatory for business operations
- Core Banking Services → ALWAYS mandatory for financial operations
- Regulatory Reporting → ALWAYS mandatory for compliance

OPTIONAL SERVICES (mandatory: false):
- Fraud Detection → optional, depends on risk assessment
- Email/SMS Services → optional, secondary communication
- Analytics/Reporting → optional, enhancement services
- Backup/Archive → optional, data recovery services
- Notification Services → optional, user experience enhancement

SERVICE DETECTION PATTERNS:
- KYC/Identity verification → type: "identity", auth: "Bearer Token", mandatory: true, confidence: 85-95
- GST/Tax validation → type: "tax", auth: "API Key", mandatory: true, confidence: 80-90
- Payment processing → type: "payment", auth: "OAuth 2.0", mandatory: true, confidence: 85-95
- Fraud detection → type: "security", auth: "Bearer Token", mandatory: false, confidence: 60-80
- Email/SMS services → type: "communication", auth: "API Key", mandatory: false, confidence: 65-85
- AML/Compliance → type: "security", auth: "Bearer Token", mandatory: true, confidence: 85-95
- Core Banking → type: "payment", auth: "OAuth 2.0", mandatory: true, confidence: 85-95

RESPONSE FORMAT:
- Return ONLY JSON object
- No additional text, explanations, or formatting
- Valid JSON that can be parsed directly
- Ensure confidence field accurately reflects detection certainty
- Provide realistic confidence scores based on available evidence
`;
};

// Call Gemini API
async function callGemini(prompt) {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No valid JSON found in Gemini response');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Call OpenAI API
async function callOpenAI(prompt) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
  }

  try {
    let response;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: retryCount === 0 
              ? "You are an expert enterprise integration architect. Return ONLY valid JSON. Do not include explanation or text outside JSON. Your entire response must be a valid JSON object that can be parsed directly."
              : "CRITICAL: Return ONLY valid JSON. No explanations. No markdown. No code blocks. Your entire response must be a JSON object starting with { and ending with }."
          },
          {
            role: "user",
            content: retryCount === 0 ? prompt : prompt + "\n\nIMPORTANT: Return ONLY JSON object. No other text."
          }
        ],
        temperature: retryCount === 0 ? 0.1 : 0.0, // Lower temperature for retry
        max_tokens: retryCount === 0 ? 2000 : 1500,
      });

      response = completion.choices[0].message.content;

      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON wrapper found, try parsing the entire response
          const parsed = JSON.parse(response);
          if (parsed && parsed.services && Array.isArray(parsed.services)) {
            return parsed;
          }
          throw new Error('No valid JSON structure found');
        }
      } catch (parseError) {
        if (retryCount < maxRetries) {
          console.error(`JSON parsing attempt ${retryCount + 1} failed, retrying...`);
        } else {
          throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }
      }

      retryCount++;
    }

    throw new Error('Failed to get valid JSON after all retries');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Call OpenAI API via our backend route (new method)
async function callOpenAIViaBackend(text) {
  try {
    const response = await fetch('http://localhost:5001/api/ai/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OpenAI backend request failed');
    }

    return result.data;
  } catch (error) {
    console.error('OpenAI backend API error:', error);
    throw error;
  }
}

// Main function to generate structured output
async function generateStructuredOutput(text) {
  const provider = getCurrentProvider();
  const prompt = getStandardPrompt(text);
  
  try {
    let result;
    
    if (provider === 'gemini') {
      result = await callGemini(prompt);
    } else if (provider === 'openai') {
      result = await callOpenAIViaBackend(text);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}. Supported providers: gemini, openai`);
    }
    
    // Validate the result structure
    if (!result || !result.services || !Array.isArray(result.services)) {
      throw new Error('Invalid response structure from AI provider');
    }
    
    // Ensure each service has required fields
    result.services = result.services.map(service => ({
      ...service,
      confidence: service.confidence || 75, // Default confidence if not provided
      mandatory: service.mandatory !== undefined ? service.mandatory : true, // Default to mandatory
    }));
    
    console.log(`Processed ${result.services.length} services from ${provider}`);
    return result;
    
  } catch (error) {
    console.error(`Error with ${provider} provider:`, error.message);
    
    return fallbackPatternExtraction(text);
  }
}

// Fallback pattern-based extraction (same as original logic)
function fallbackPatternExtraction(text) {
  const services = [];
  const lowerText = text.toLowerCase();
  
  // Calculate text density and keyword strength
  const calculateConfidence = (keywords, context, hasDetails = false) => {
    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    const textLength = text.length;
    const density = keywordCount / Math.max(textLength / 100, 1); // Keywords per 100 chars
    
    let confidence = Math.min(50 + (density * 20), 85); // Base 50, density bonus
    
    if (hasDetails) confidence += 10; // Implementation details bonus
    if (context) confidence += 5; // Business context bonus
    
    return Math.min(Math.round(confidence), 100);
  };
  
  // Enhanced service detection with business context analysis and confidence scoring
  if (lowerText.includes('kyc') || lowerText.includes('identity') || lowerText.includes('verification')) {
    const keywords = ['kyc', 'identity', 'verification', 'customer', 'pan', 'aadhaar', 'background'];
    const hasDetails = lowerText.includes('pan') || lowerText.includes('aadhaar') || lowerText.includes('background check');
    const confidence = calculateConfidence(keywords, true, hasDetails);
    
    services.push({
      name: 'KYC Verification',
      type: 'identity',
      mandatory: true,
      confidence: confidence,
      authentication: 'Bearer Token',
      endpoints: [
        {
          url: '/api/kyc/verify',
          method: 'POST',
          request_fields: ['name', 'dob', 'pan', 'email', 'phone', 'address'],
          response_fields: ['verification_id', 'status', 'score', 'verified_at']
        }
      ]
    });
  }
  
  if (lowerText.includes('gst') || lowerText.includes('tax') || lowerText.includes('gstin')) {
    const keywords = ['gst', 'tax', 'gstin', 'registration', 'business', 'return'];
    const hasDetails = lowerText.includes('gstin') || lowerText.includes('registration number');
    const confidence = calculateConfidence(keywords, true, hasDetails);
    
    services.push({
      name: 'GST Validation',
      type: 'tax',
      mandatory: true,
      confidence: confidence,
      authentication: 'API Key',
      endpoints: [
        {
          url: '/api/gst/validate',
          method: 'POST',
          request_fields: ['gstin', 'business_name', 'state'],
          response_fields: ['gstin_status', 'registration_date', 'business_details', 'valid_until']
        }
      ]
    });
  }
  
  if (lowerText.includes('payment') || lowerText.includes('transaction') || lowerText.includes('amount')) {
    const keywords = ['payment', 'transaction', 'amount', 'transfer', 'bank', 'account', 'ifsc'];
    const hasDetails = lowerText.includes('account number') || lowerText.includes('ifsc') || lowerText.includes('beneficiary');
    const confidence = calculateConfidence(keywords, true, hasDetails);
    
    services.push({
      name: 'Payment Processing',
      type: 'payment',
      mandatory: true,
      confidence: confidence,
      authentication: 'OAuth 2.0',
      endpoints: [
        {
          url: '/api/payment/process',
          method: 'POST',
          request_fields: ['amount', 'currency', 'account_number', 'ifsc', 'beneficiary'],
          response_fields: ['transaction_id', 'status', 'timestamp', 'reference']
        }
      ]
    });
  }
  
  if (lowerText.includes('fraud') || lowerText.includes('risk') || lowerText.includes('detection')) {
    const keywords = ['fraud', 'risk', 'detection', 'aml', 'suspicious', 'monitoring'];
    const hasDetails = lowerText.includes('fraud detection') || lowerText.includes('risk assessment');
    const context = lowerText.includes('compliance') || lowerText.includes('regulatory');
    const confidence = calculateConfidence(keywords, context, hasDetails);
    
    services.push({
      name: 'Fraud Detection',
      type: 'security',
      mandatory: false,
      confidence: confidence,
      authentication: 'Bearer Token',
      endpoints: [
        {
          url: '/api/fraud/assess',
          method: 'POST',
          request_fields: ['transaction_id', 'amount', 'user_id', 'ip_address', 'device_id'],
          response_fields: ['risk_score', 'risk_level', 'reasons', 'recommended_action']
        }
      ]
    });
  }
  
  if (lowerText.includes('email') || lowerText.includes('notification') || lowerText.includes('smtp')) {
    const keywords = ['email', 'notification', 'smtp', 'alert', 'communication'];
    const hasDetails = lowerText.includes('email service') || lowerText.includes('notification system');
    const confidence = calculateConfidence(keywords, false, hasDetails);
    
    services.push({
      name: 'Email Service',
      type: 'communication',
      mandatory: false,
      confidence: confidence,
      authentication: 'API Key',
      endpoints: [
        {
          url: '/api/email/send',
          method: 'POST',
          request_fields: ['to', 'subject', 'body', 'template_id'],
          response_fields: ['message_id', 'status', 'sent_at']
        }
      ]
    });
  }
  
  if (lowerText.includes('sms') || lowerText.includes('text') || lowerText.includes('otp')) {
    const keywords = ['sms', 'text', 'otp', 'mobile', 'phone'];
    const hasDetails = lowerText.includes('otp service') || lowerText.includes('sms gateway');
    const confidence = calculateConfidence(keywords, false, hasDetails);
    
    services.push({
      name: 'SMS Service',
      type: 'communication',
      mandatory: false,
      confidence: confidence,
      authentication: 'Bearer Token',
      endpoints: [
        {
          url: '/api/sms/send',
          method: 'POST',
          request_fields: ['phone', 'message', 'template_id'],
          response_fields: ['message_id', 'status', 'sent_at', 'delivery_status']
        }
      ]
    });
  }
  
  if (lowerText.includes('aml') || lowerText.includes('anti money laundering') || lowerText.includes('compliance')) {
    const keywords = ['aml', 'anti money laundering', 'compliance', 'regulatory', 'reporting'];
    const hasDetails = lowerText.includes('aml check') || lowerText.includes('compliance report');
    const confidence = calculateConfidence(keywords, true, hasDetails);
    
    services.push({
      name: 'AML Compliance',
      type: 'security',
      mandatory: true,
      confidence: confidence,
      authentication: 'Bearer Token',
      endpoints: [
        {
          url: '/api/aml/check',
          method: 'POST',
          request_fields: ['customer_id', 'transaction_amount', 'transaction_pattern'],
          response_fields: ['aml_status', 'risk_level', 'compliance_score', 'flagged_reasons']
        }
      ]
    });
  }
  
  if (lowerText.includes('banking') || lowerText.includes('core banking') || lowerText.includes('account management')) {
    const keywords = ['banking', 'core banking', 'account', 'balance', 'deposit', 'withdrawal'];
    const hasDetails = lowerText.includes('account management') || lowerText.includes('core banking system');
    const confidence = calculateConfidence(keywords, true, hasDetails);
    
    services.push({
      name: 'Core Banking',
      type: 'payment',
      mandatory: true,
      confidence: confidence,
      authentication: 'OAuth 2.0',
      endpoints: [
        {
          url: '/api/banking/account',
          method: 'POST',
          request_fields: ['account_number', 'customer_id', 'operation_type'],
          response_fields: ['account_status', 'balance', 'available_limit', 'last_transaction']
        }
      ]
    });
  }
  
  return { services };
}

// Get provider status
function getProviderStatus() {
  const provider = getCurrentProvider();
  const status = {
    current_provider: provider,
    gemini_available: !!geminiClient,
    openai_available: !!openaiClient,
    environment_variables: {
      AI_PROVIDER: process.env.AI_PROVIDER || 'not_set',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'set' : 'not_set',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'not_set'
    }
  };
  
  return status;
}

module.exports = {
  generateStructuredOutput,
  getProviderStatus,
  getCurrentProvider
};
