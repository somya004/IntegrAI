const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// AI-powered document parsing
async function parseWithAI(text) {
  // In a real implementation, this would call OpenAI or another LLM
  // For now, we'll use a mock implementation with pattern matching
  
  const services = [];
  
  // Service detection patterns
  const servicePatterns = {
    'KYC Verification': {
      keywords: ['kyc', 'identity', 'verification', 'customer', 'pan', 'aadhaar', 'verification'],
      type: 'identity',
      endpoints: [
        {
          url: '/api/kyc/verify',
          method: 'POST',
          request_fields: ['name', 'dob', 'pan', 'email', 'phone', 'address'],
          response_fields: ['verification_id', 'status', 'score', 'verified_at']
        }
      ],
      authentication: 'Bearer Token',
      mandatory: true
    },
    'GST Validation': {
      keywords: ['gst', 'tax', 'registration', 'gstin', 'taxation'],
      type: 'tax',
      endpoints: [
        {
          url: '/api/gst/validate',
          method: 'POST',
          request_fields: ['gstin', 'business_name', 'state'],
          response_fields: ['gstin_status', 'registration_date', 'business_details', 'valid_until']
        }
      ],
      authentication: 'API Key',
      mandatory: true
    },
    'Payment Processing': {
      keywords: ['payment', 'transaction', 'amount', 'currency', 'account', 'transfer'],
      type: 'payment',
      endpoints: [
        {
          url: '/api/payment/process',
          method: 'POST',
          request_fields: ['amount', 'currency', 'account_number', 'ifsc', 'beneficiary'],
          response_fields: ['transaction_id', 'status', 'timestamp', 'reference']
        }
      ],
      authentication: 'OAuth 2.0',
      mandatory: false
    },
    'Fraud Detection': {
      keywords: ['fraud', 'risk', 'detection', 'scam', 'suspicious', 'aml'],
      type: 'security',
      endpoints: [
        {
          url: '/api/fraud/assess',
          method: 'POST',
          request_fields: ['transaction_id', 'amount', 'user_id', 'ip_address', 'device_id'],
          response_fields: ['risk_score', 'risk_level', 'reasons', 'recommended_action']
        }
      ],
      authentication: 'Bearer Token',
      mandatory: false
    },
    'Email Service': {
      keywords: ['email', 'notification', 'smtp', 'mail', 'send'],
      type: 'communication',
      endpoints: [
        {
          url: '/api/email/send',
          method: 'POST',
          request_fields: ['to', 'subject', 'body', 'template_id'],
          response_fields: ['message_id', 'status', 'sent_at']
        }
      ],
      authentication: 'API Key',
      mandatory: false
    },
    'SMS Service': {
      keywords: ['sms', 'text', 'message', 'otp', 'mobile'],
      type: 'communication',
      endpoints: [
        {
          url: '/api/sms/send',
          method: 'POST',
          request_fields: ['phone', 'message', 'template_id'],
          response_fields: ['message_id', 'status', 'sent_at', 'delivery_status']
        }
      ],
      authentication: 'Bearer Token',
      mandatory: false
    }
  };
  
  // Analyze text to find services
  const lowerText = text.toLowerCase();
  const foundServices = [];
  
  Object.entries(servicePatterns).forEach(([serviceName, config]) => {
    const matchCount = config.keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    if (matchCount > 0) {
      foundServices.push({
        name: serviceName,
        matchCount,
        ...config
      });
    }
  });
  
  // Sort by match count and take top services
  foundServices.sort((a, b) => b.matchCount - a.matchCount);
  
  // Calculate confidence based on matches
  const totalMatches = foundServices.reduce((sum, service) => sum + service.matchCount, 0);
  const confidence = Math.min(95, Math.round((totalMatches / text.length) * 1000));
  
  return {
    services: foundServices.map(service => ({
      name: service.name,
      type: service.type,
      endpoints: service.endpoints,
      authentication: service.authentication,
      mandatory: service.mandatory
    })),
    confidence
  };
}

// Extract text from uploaded file
async function extractTextFromFile(filePath, mimeType) {
  try {
    switch (mimeType) {
      case 'application/pdf':
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
        
      case 'text/plain':
        return fs.readFileSync(filePath, 'utf8');
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from file');
  }
}

// Main parsing endpoint
router.post('/parse-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    console.log('Processing file:', req.file.originalname);
    
    // Extract text from file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
    
    // Clean and normalize text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[^\w\s\-.,;:!?()]/g, '')  // Remove special characters except basic punctuation
      .trim();
    
    if (cleanedText.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Document appears to be empty or contains very little text'
      });
    }
    
    // Parse with AI
    const parseResult = await parseWithAI(cleanedText);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    // Return structured data
    res.json({
      success: true,
      data: {
        services: parseResult.services,
        raw_text: cleanedText,
        confidence: parseResult.confidence
      }
    });
    
  } catch (error) {
    console.error('Document parsing error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Return fallback mock data for testing
    const fallbackData = {
      services: [
        {
          name: 'KYC Verification',
          type: 'identity',
          endpoints: [
            {
              url: '/api/kyc/verify',
              method: 'POST',
              request_fields: ['name', 'dob', 'pan', 'email', 'phone'],
              response_fields: ['verification_id', 'status', 'score']
            }
          ],
          authentication: 'Bearer Token',
          mandatory: true
        },
        {
          name: 'GST Validation',
          type: 'tax',
          endpoints: [
            {
              url: '/api/gst/validate',
              method: 'POST',
              request_fields: ['gstin', 'business_name'],
              response_fields: ['gstin_status', 'registration_date']
            }
          ],
          authentication: 'API Key',
          mandatory: true
        }
      ],
      raw_text: 'Fallback parsing due to error',
      confidence: 75
    };
    
    res.json({
      success: true,
      data: fallbackData,
      warning: 'Using fallback data due to parsing error: ' + error.message
    });
  }
});

// Test endpoint for simple text parsing
router.post('/parse-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be at least 10 characters long'
      });
    }
    
    const parseResult = await parseWithAI(text);
    
    res.json({
      success: true,
      data: {
        services: parseResult.services,
        raw_text: text,
        confidence: parseResult.confidence
      }
    });
    
  } catch (error) {
    console.error('Text parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse text: ' + error.message
    });
  }
});

module.exports = router;
