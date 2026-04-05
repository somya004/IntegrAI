const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Standardized prompt for structured data extraction
const getExtractionPrompt = (text) => {
  return `
You are an enterprise integration architect. Analyze the following business requirements document and extract integration services in strict JSON format.

DOCUMENT TEXT:
${text}

REQUIREMENTS:
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

SERVICE DETECTION PATTERNS:
- KYC/Identity verification → type: "identity", auth: "Bearer Token", mandatory: true, confidence: 85-95
- GST/Tax validation → type: "tax", auth: "API Key", mandatory: true, confidence: 80-90
- Payment processing → type: "payment", auth: "OAuth 2.0", mandatory: true, confidence: 85-95
- Fraud detection → type: "security", auth: "Bearer Token", mandatory: false, confidence: 60-80
- Email/SMS services → type: "communication", auth: "API Key", mandatory: false, confidence: 65-85
- AML/Compliance → type: "security", auth: "Bearer Token", mandatory: true, confidence: 85-95
- Core Banking → type: "payment", auth: "OAuth 2.0", mandatory: true, confidence: 85-95

RESPONSE FORMAT:
- Return ONLY the JSON object
- No additional text, explanations, or formatting
- Valid JSON that can be parsed directly
- Ensure confidence field reflects detection certainty (0-100)
`;
};

// POST /api/ai/parse - Parse text with OpenAI
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert enterprise integration architect. Return ONLY valid JSON. Do not include explanation or text outside JSON. Your entire response must be a valid JSON object that can be parsed directly."
        },
        {
          role: "user",
          content: getExtractionPrompt(text)
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    let response = completion.choices[0].message.content;

    // Try to extract JSON from response
    let parsedData;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON wrapper found, try parsing the entire response
          parsedData = JSON.parse(response);
        }

        // Validate the parsed data structure
        if (parsedData && parsedData.services && Array.isArray(parsedData.services)) {
          break;
        } else {
          throw new Error('Invalid JSON structure - missing services array');
        }
      } catch (parseError) {
        console.error(`JSON parsing attempt ${retryCount + 1} failed:`, parseError.message);
        
        if (retryCount < maxRetries) {
          const retryCompletion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "CRITICAL: Return ONLY valid JSON. No explanations. No markdown. No code blocks. Your entire response must be a JSON object starting with { and ending with }."
              },
              {
                role: "user",
                content: getExtractionPrompt(text) + "\n\nIMPORTANT: Return ONLY the JSON object. No other text."
              }
            ],
            temperature: 0.0, // Lower temperature for more deterministic output
            max_tokens: 1500,
          });
          
          response = retryCompletion.choices[0].message.content;
        } else {
          throw new Error(`Failed to parse JSON after ${maxRetries + 1} attempts: ${parseError.message}`);
        }
      }
      
      retryCount++;
    }

    // Final validation
    if (!parsedData || !parsedData.services || !Array.isArray(parsedData.services)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get valid JSON from OpenAI after multiple attempts',
        raw_response: response
      });
    }

    // Ensure each service has required fields with defaults
    parsedData.services = parsedData.services.map(service => ({
      name: service.name || 'Unknown Service',
      type: service.type || 'other',
      mandatory: service.mandatory !== undefined ? service.mandatory : true,
      confidence: service.confidence || 75,
      authentication: service.authentication || 'API Key',
      endpoints: Array.isArray(service.endpoints) ? service.endpoints : []
    }));

    res.json({
      success: true,
      data: parsedData,
      metadata: {
        provider: 'openai',
        model: 'gpt-4',
        text_length: text.length,
        services_count: parsedData.services.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('OpenAI API error:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing and usage limits.'
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'OpenAI rate limit exceeded. Please try again later.'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Failed to process text with OpenAI: ' + error.message
    });
  }
});

// GET /api/ai/status - Check OpenAI API status
router.get('/status', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        status: 'not_configured',
        message: 'OpenAI API key not configured',
        provider: 'openai',
        api_key_set: false
      });
    }

    // Test API connectivity with a simple request
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Respond with just the word 'OK'"
        }
      ],
      max_tokens: 10,
    });

    const response = completion.choices[0].message.content;
    
    res.json({
      success: true,
      status: 'connected',
      message: 'OpenAI API is working correctly',
      provider: 'openai',
      api_key_set: true,
      model: 'gpt-4',
      test_response: response.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI status check error:', error);

    let status = 'error';
    let message = 'Failed to connect to OpenAI API';

    if (error.code === 'invalid_api_key') {
      status = 'invalid_key';
      message = 'Invalid OpenAI API key';
    } else if (error.code === 'insufficient_quota') {
      status = 'quota_exceeded';
      message = 'OpenAI API quota exceeded';
    } else if (error.code === 'rate_limit_exceeded') {
      status = 'rate_limited';
      message = 'OpenAI API rate limit exceeded';
    }

    res.json({
      success: false,
      status: status,
      message: message,
      provider: 'openai',
      api_key_set: !!process.env.OPENAI_API_KEY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
