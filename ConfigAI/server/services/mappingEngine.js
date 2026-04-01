class MappingEngine {
  constructor() {
    this.fieldMappings = {
      // Common client fields to API field mappings
      'name': {
        'KYC': ['fullName', 'customerName', 'applicantName', 'userName'],
        'GST': ['businessName', 'companyName', 'entityName', 'tradeName'],
        'Payment': ['customerName', 'accountHolder', 'beneficiaryName'],
        'Fraud': ['userName', 'customerName', 'applicantName']
      },
      'dob': {
        'KYC': ['dateOfBirth', 'birthDate', 'dob', 'dateOfbirth'],
        'GST': ['incorporationDate', 'establishmentDate', 'registrationDate'],
        'Payment': ['birthDate', 'dateOfBirth'],
        'Fraud': ['birthDate', 'dateOfBirth']
      },
      'pan': {
        'KYC': ['panNumber', 'panCard', 'permanentAccountNumber', 'pan'],
        'GST': ['panCard', 'panNumber', 'permanentAccountNumber'],
        'Payment': ['panCard', 'panNumber'],
        'Fraud': ['panNumber', 'permanentAccountNumber']
      },
      'email': {
        'KYC': ['emailAddress', 'emailId', 'email', 'mailAddress'],
        'GST': ['emailId', 'emailAddress', 'email'],
        'Payment': ['email', 'emailAddress', 'mailId'],
        'Fraud': ['emailAddress', 'mailAddress', 'email']
      },
      'phone': {
        'KYC': ['phoneNumber', 'mobileNumber', 'contactNumber', 'telephone'],
        'GST': ['mobileNumber', 'contactNumber', 'phoneNumber'],
        'Payment': ['contactNumber', 'phoneNumber', 'mobile'],
        'Fraud': ['telephoneNumber', 'phoneNumber', 'mobileNumber']
      },
      'address': {
        'KYC': ['residentialAddress', 'permanentAddress', 'fullAddress'],
        'GST': ['businessAddress', 'registeredAddress', 'officeAddress'],
        'Payment': ['billingAddress', 'address', 'location'],
        'Fraud': ['address', 'location', 'residence']
      },
      'amount': {
        'Payment': ['transactionAmount', 'paymentAmount', 'amount', 'value'],
        'GST': ['taxAmount', 'amount', 'paymentValue']
      },
      'account': {
        'Payment': ['accountNumber', 'bankAccount', 'account'],
        'KYC': ['accountNumber', 'bankAccount']
      }
    };

    this.similarityThreshold = 0.7;
  }

  generateMappings(service, clientFields) {
    const mappings = {};
    const serviceMappings = this.getServiceMappings(service);

    clientFields.forEach(clientField => {
      const clientFieldLower = clientField.toLowerCase();
      let bestMatch = null;
      let bestScore = 0;

      // Direct mapping
      if (serviceMappings[clientField]) {
        bestMatch = serviceMappings[clientField][0];
        bestScore = 1.0;
      } else {
        // Fuzzy matching
        Object.keys(serviceMappings).forEach(serviceField => {
          serviceMappings[serviceField].forEach(apiField => {
            const score = this.calculateSimilarity(clientFieldLower, apiField.toLowerCase());
            if (score > bestScore && score >= this.similarityThreshold) {
              bestScore = score;
              bestMatch = apiField;
            }
          });
        });
      }

      if (bestMatch) {
        mappings[clientField] = {
          apiField: bestMatch,
          confidence: Math.round(bestScore * 100),
          method: bestScore === 1.0 ? 'direct' : 'fuzzy'
        };
      }
    });

    return mappings;
  }

  getServiceMappings(service) {
    return this.fieldMappings[service] || {};
  }

  calculateSimilarity(str1, str2) {
    // Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  suggestAdditionalFields(service, existingMappings) {
    const serviceMappings = this.getServiceMappings(service);
    const suggestions = [];

    Object.keys(serviceMappings).forEach(clientField => {
      if (!existingMappings[clientField]) {
        serviceMappings[clientField].forEach(apiField => {
          suggestions.push({
            clientField,
            apiField,
            reason: 'Common field for this service type'
          });
        });
      }
    });

    return suggestions;
  }

  validateMapping(mapping) {
    const issues = [];

    Object.entries(mapping).forEach(([clientField, apiMapping]) => {
      if (!apiMapping.apiField) {
        issues.push({
          field: clientField,
          issue: 'Missing API field mapping'
        });
      }

      if (apiMapping.confidence < 50) {
        issues.push({
          field: clientField,
          issue: 'Low confidence mapping',
          suggestion: 'Please verify this mapping manually'
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      score: this.calculateMappingScore(mapping)
    };
  }

  calculateMappingScore(mapping) {
    const fields = Object.values(mapping);
    if (fields.length === 0) return 0;

    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    return Math.round(totalConfidence / fields.length);
  }
}

module.exports = new MappingEngine();
