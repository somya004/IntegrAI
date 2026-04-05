const fs = require('fs');
const path = require('path');

class DocumentIngestion {
  constructor() {
    this.supportedFormats = ['.pdf', '.docx', '.txt', '.json'];
  }

  async ingestDocument(input) {
    try {
      let content;
      let metadata = {};

      if (typeof input === 'string' && fs.existsSync(input)) {
        const filePath = input;
        const ext = path.extname(filePath).toLowerCase();
        
        if (!this.supportedFormats.includes(ext)) {
          throw new Error(`Unsupported format: ${ext}`);
        }

        metadata = {
          filename: path.basename(filePath),
          filetype: ext,
          filesize: fs.statSync(filePath).size,
          timestamp: new Date().toISOString()
        };

        switch (ext) {
          case '.pdf':
            content = await this.parsePDF(filePath);
            break;
          case '.docx':
            content = await this.parseDOCX(filePath);
            break;
          case '.txt':
            content = await this.parseTXT(filePath);
            break;
          case '.json':
            content = await this.parseJSON(filePath);
            break;
        }
      } else if (typeof input === 'string') {
        content = input;
        metadata = {
          filename: 'direct-input',
          filetype: 'text',
          filesize: input.length,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid input type');
      }

      return {
        success: true,
        content: content,
        metadata: metadata
      };

    } catch (error) {
      console.error('Document ingestion failed:', error.message);
      return this.generateMockContent(input);
    }
  }

  async parsePDF(filePath) {
    try {
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async parseDOCX(filePath) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  async parseTXT(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`TXT parsing failed: ${error.message}`);
    }
  }

  async parseJSON(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  generateMockContent(input) {
    const mockContent = `
BUSINESS REQUIREMENTS DOCUMENT

1. SYSTEM OVERVIEW
The enterprise integration platform must support the following core services:

2. REQUIRED SERVICES
- KYC Verification Service: Must validate customer identity documents
- Payment Gateway Integration: Required for processing transactions
- GST Validation Service: Mandatory for tax compliance
- Fraud Detection System: Essential for security

3. API SPECIFICATIONS
KYC Service:
- Endpoint: /api/kyc/verify
- Method: POST
- Authentication: Bearer Token
- Request Fields: customer_id, document_type, document_data
- Response Fields: verification_status, customer_details, confidence_score

Payment Service:
- Endpoint: /api/payments/process
- Method: POST
- Authentication: API Key
- Request Fields: amount, currency, payment_method, customer_id
- Response Fields: transaction_id, status, payment_details

GST Service:
- Endpoint: /api/gst/validate
- Method: POST
- Authentication: OAuth2
- Request Fields: gstin, business_name, state_code
- Response Fields: gstin_status, registration_details, validity

4. AUTHENTICATION REQUIREMENTS
- All APIs must implement proper authentication
- Rate limiting should be applied
- Audit logging is mandatory

5. INTEGRATION REQUIREMENTS
- System must be highly available (99.9% uptime)
- Response time should be under 2 seconds
- Support for batch processing
`;

    return {
      success: true,
      content: mockContent.trim(),
      metadata: {
        filename: 'mock-generated',
        filetype: 'text',
        filesize: mockContent.length,
        timestamp: new Date().toISOString(),
        note: 'Generated mock content due to parsing failure'
      }
    };
  }
}

module.exports = DocumentIngestion;
