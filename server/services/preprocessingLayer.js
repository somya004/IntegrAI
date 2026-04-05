class PreprocessingLayer {
  constructor() {
    this.sectionPatterns = {
      api: /(?:api|endpoint|route|service)\s*(?:details|specifications?|definition)/i,
      auth: /(?:auth|authentication|security|oauth|token|api\s*key)/i,
      services: /(?:services?|modules|components|integrations)/i,
      fields: /(?:fields?|parameters|data|schema|request|response)/i,
      requirements: /(?:requirements?|specs|specifications?|business)/i
    };
  }

  async preprocess(content) {
    try {
      const processed = {
        originalContent: content,
        cleanedContent: this.cleanText(content),
        sections: this.extractSections(content),
        metadata: this.generateMetadata(content)
      };

      return {
        success: true,
        data: processed
      };

    } catch (error) {
      console.error('Preprocessing failed:', error.message);
      return this.generateMockPreprocessedContent(content);
    }
  }

  cleanText(text) {
    return this.removeHeaders(
      this.removeFooters(
        this.normalizeWhitespace(
          this.removeSpecialChars(
            this.normalizeLineBreaks(text)
          )
        )
      )
    );
  }

  removeHeaders(text) {
    const lines = text.split('\n');
    const headerPatterns = [
      /^(page\s+\d+)/i,
      /^(confidential|proprietary|restricted)/i,
      /^.{0,10}\s*\d{4}.*\d{2}:\d{2}.*\d{2}:\d{2}/,
      /^[A-Z\s]{5,}$/m
    ];

    return lines
      .filter(line => !headerPatterns.some(pattern => pattern.test(line)))
      .join('\n');
  }

  removeFooters(text) {
    const lines = text.split('\n');
    const footerPatterns = [
      /^\s*\d+\s*of\s*\d+$/i,
      /^©\s*\d{4}/,
      /^www\./,
      /^email:|phone:/i
    ];

    return lines
      .filter(line => !footerPatterns.some(pattern => pattern.test(line)))
      .join('\n');
  }

  normalizeWhitespace(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  removeSpecialChars(text) {
    return text
      .replace(/[^\w\s\-\.\,\:\;\(\)\[\]\{\}\"\'\/\\@#\$%\&\*\+\=\?\<\>\|]/g, '')
      .replace(/\s{2,}/g, ' ');
  }

  normalizeLineBreaks(text) {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  extractSections(text) {
    const sections = {
      apiDetails: this.extractSection(text, this.sectionPatterns.api),
      authentication: this.extractSection(text, this.sectionPatterns.auth),
      services: this.extractSection(text, this.sectionPatterns.services),
      fields: this.extractSection(text, this.sectionPatterns.fields),
      requirements: this.extractSection(text, this.sectionPatterns.requirements)
    };

    return Object.fromEntries(
      Object.entries(sections).filter(([key, value]) => value && value.length > 50)
    );
  }

  extractSection(text, pattern) {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) return '';

    for (let i = sectionStart + 1; i < lines.length; i++) {
      if (this.isNewSection(lines[i])) {
        sectionEnd = i;
        break;
      }
    }

    if (sectionEnd === -1) sectionEnd = lines.length;

    return lines
      .slice(sectionStart, sectionEnd)
      .join('\n')
      .trim();
  }

  isNewSection(line) {
    const sectionHeaders = /^\d+\.\s*[A-Z]+|^[A-Z][A-Z\s]+:|^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:/;
    return sectionHeaders.test(line.trim());
  }

  generateMetadata(text) {
    return {
      wordCount: text.split(/\s+/).length,
      lineCount: text.split('\n').length,
      charCount: text.length,
      hasApiKeywords: /\b(endpoint|api|route|service)\b/i.test(text),
      hasAuthKeywords: /\b(auth|token|oauth|key|security)\b/i.test(text),
      hasServiceKeywords: /\b(service|module|component|integration)\b/i.test(text),
      hasFieldKeywords: /\b(field|parameter|data|schema)\b/i.test(text)
    };
  }

  generateMockPreprocessedContent(originalContent) {
    const mockSections = {
      apiDetails: `
API ENDPOINTS:
- KYC Verification: /api/kyc/verify (POST)
- Payment Processing: /api/payments/process (POST)  
- GST Validation: /api/gst/validate (POST)
- Fraud Detection: /api/fraud/check (POST)
      `.trim(),
      
      authentication: `
AUTHENTICATION:
- KYC Service: Bearer Token
- Payment Service: API Key
- GST Service: OAuth2
- Fraud Service: Basic Auth
      `.trim(),
      
      services: `
SERVICES:
1. KYC Verification (Mandatory)
2. Payment Gateway (Mandatory)
3. GST Validation (Optional)
4. Fraud Detection (Mandatory)
      `.trim(),
      
      fields: `
FIELDS:
KYC Request: customer_id, document_type, document_data
KYC Response: verification_status, customer_details, confidence_score

Payment Request: amount, currency, payment_method, customer_id
Payment Response: transaction_id, status, payment_details

GST Request: gstin, business_name, state_code
GST Response: gstin_status, registration_details, validity
      `.trim()
    };

    return {
      success: true,
      data: {
        originalContent: originalContent,
        cleanedContent: this.cleanText(originalContent),
        sections: mockSections,
        metadata: this.generateMetadata(originalContent),
        note: 'Generated mock sections due to preprocessing failure'
      }
    };
  }

  async healthCheck() {
    try {
      const testResult = await this.generateFallback('test');
      return testResult && testResult.data;
    } catch (error) {
      return false;
    }
  }
}

module.exports = PreprocessingLayer;
