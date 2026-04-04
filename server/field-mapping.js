const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// Fuzzy matching algorithm
class FuzzyMatcher {
  // Calculate Levenshtein distance between two strings
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

  // Calculate similarity score (0-1)
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();
    
    if (str1 === str2) return 1;
    
    const maxLen = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    const similarity = 1 - (distance / maxLen);
    
    return Math.max(0, similarity);
  }

  // Check if strings contain common words/patterns
  containsCommonWords(str1, str2) {
    const words1 = str1.toLowerCase().split(/[\s_-]/);
    const words2 = str2.toLowerCase().split(/[\s_-]/);
    
    const commonWords = words1.filter(word => 
      word.length > 2 && words2.includes(word)
    );
    
    return commonWords.length > 0;
  }

  // Advanced similarity calculation with multiple factors
  advancedSimilarity(str1, str2) {
    const baseSimilarity = this.calculateSimilarity(str1, str2);
    const hasCommonWords = this.containsCommonWords(str1, str2);
    
    // Boost score if they have common words
    if (hasCommonWords) {
      return Math.min(1, baseSimilarity + 0.2);
    }
    
    return baseSimilarity;
  }
}

// Field mapping engine
class FieldMappingEngine {
  constructor() {
    this.matcher = new FuzzyMatcher();
    
    // Common field name patterns and their canonical forms
    this.fieldPatterns = {
      'name': ['full name', 'first name', 'last name', 'customer name', 'client name', 'user name', 'applicant name', 'person name'],
      'firstName': ['first name', 'given name', 'forename', 'fname'],
      'lastName': ['last name', 'surname', 'family name', 'lname'],
      'dob': ['date of birth', 'birth date', 'dob', 'birthday', 'born'],
      'age': ['age', 'years', 'years old'],
      'email': ['email', 'email address', 'mail', 'email_id', 'e-mail'],
      'phone': ['phone', 'mobile', 'telephone', 'contact', 'phone number', 'mobile number', 'contact number'],
      'address': ['address', 'location', 'residence', 'postal address', 'street address'],
      'pan': ['pan', 'pan number', 'permanent account number', 'pan_no', 'pan_id', 'pan_card'],
      'aadhaar': ['aadhaar', 'aadhaar number', 'uid', 'uid number', 'aadhaar_no', 'aadhaar_card'],
      'gstin': ['gstin', 'gst identification number', 'gst number', 'gst_id', 'gstin_no'],
      'amount': ['amount', 'price', 'cost', 'fee', 'charge', 'transaction amount', 'value'],
      'account': ['account', 'account number', 'bank account', 'acc_no', 'bank_ac'],
      'ifsc': ['ifsc', 'ifsc code', 'bank code', 'branch code'],
      'gender': ['gender', 'sex', 'male female'],
      'nationality': ['nationality', 'citizenship', 'country'],
      'occupation': ['occupation', 'job', 'profession', 'employment'],
      'income': ['income', 'salary', 'earnings', 'revenue'],
      'city': ['city', 'town', 'location'],
      'state': ['state', 'region', 'province'],
      'country': ['country', 'nation'],
      'zipcode': ['zipcode', 'postal code', 'pin code', 'zip'],
      'company': ['company', 'organization', 'organisation', 'firm', 'business'],
      'department': ['department', 'dept', 'division'],
      'position': ['position', 'role', 'designation', 'job title'],
      'education': ['education', 'qualification', 'degree'],
      'maritalStatus': ['marital status', 'married single', 'marriage'],
      'id': ['id', 'identification', 'identifier']
    };

    // Common transformations
    this.transformations = {
      camelToSnake: (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
      snakeToCamel: (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      removeUnderscores: (str) => str.replace(/_/g, ''),
      addUnderscores: (str) => str.replace(/\s+/g, '_'),
      toLowerCase: (str) => str.toLowerCase(),
      toUpperCase: (str) => str.toUpperCase(),
      capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    };
  }

  // Normalize field name for better matching
  normalizeFieldName(fieldName) {
    let normalized = fieldName.toLowerCase();
    normalized = normalized.replace(/[_\-\s]/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ');
    return normalized.trim();
  }

  // Find canonical form for a field
  findCanonicalForm(fieldName) {
    const normalized = this.normalizeFieldName(fieldName);
    
    for (const [canonical, variations] of Object.entries(this.fieldPatterns)) {
      for (const variation of variations) {
        if (this.normalizeFieldName(variation) === normalized) {
          return canonical;
        }
      }
    }
    
    return fieldName.toLowerCase().replace(/\s+/g, '_');
  }

  // Calculate mapping confidence
  calculateMappingConfidence(sourceField, targetField) {
    const sourceNormalized = this.normalizeFieldName(sourceField);
    const targetNormalized = this.normalizeFieldName(targetField);
    
    // Direct match
    if (sourceNormalized === targetNormalized) {
      return 1.0;
    }
    
    // Check if they map to same canonical form
    const sourceCanonical = this.findCanonicalForm(sourceField);
    const targetCanonical = this.findCanonicalForm(targetField);
    
    if (sourceCanonical === targetCanonical) {
      return 0.9;
    }
    
    // Fuzzy matching
    const similarity = this.matcher.advancedSimilarity(sourceNormalized, targetNormalized);
    
    return similarity;
  }

  // Suggest mappings between source and target fields
  suggestMappings(sourceFields, targetFields, threshold = 0.3) {
    const suggestions = [];
    const usedTargets = new Set();
    
    for (const sourceField of sourceFields) {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const targetField of targetFields) {
        if (usedTargets.has(targetField)) continue;
        
        const score = this.calculateMappingConfidence(sourceField, targetField);
        
        if (score > bestScore && score >= threshold) {
          bestMatch = targetField;
          bestScore = score;
        }
      }
      
      if (bestMatch) {
        suggestions.push({
          sourceField,
          targetField: bestMatch,
          confidence: bestScore,
          mappingType: this.getMappingType(sourceField, bestMatch, bestScore),
          transformation: this.suggestTransformation(sourceField, bestMatch)
        });
        
        usedTargets.add(bestMatch);
      }
    }
    
    // Sort by confidence score
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    return suggestions;
  }

  // Determine mapping type based on confidence
  getMappingType(sourceField, targetField, confidence) {
    if (confidence >= 0.9) {
      return 'exact';
    } else if (confidence >= 0.7) {
      return 'strong';
    } else if (confidence >= 0.5) {
      return 'moderate';
    } else {
      return 'weak';
    }
  }

  // Suggest transformation if needed
  suggestTransformation(sourceField, targetField) {
    const sourceNorm = sourceField.toLowerCase();
    const targetNorm = targetField.toLowerCase();
    
    // Check case differences
    if (sourceNorm === targetNorm) {
      return null;
    }
    
    // Check for camelCase vs snake_case
    if (sourceNorm.includes('_') && !targetNorm.includes('_')) {
      return 'snake_to_camel';
    } else if (!sourceNorm.includes('_') && targetNorm.includes('_')) {
      return 'camel_to_snake';
    }
    
    // Check for spacing vs underscores
    if (sourceNorm.includes(' ') && !targetNorm.includes(' ')) {
      return 'spaces_to_underscores';
    } else if (!sourceNorm.includes(' ') && targetNorm.includes(' ')) {
      return 'underscores_to_spaces';
    }
    
    return 'case_normalization';
  }

  // Apply transformation to field value
  applyTransformation(value, transformation) {
    if (!value || !transformation) {
      return value;
    }
    
    const strValue = String(value);
    
    switch (transformation) {
      case 'snake_to_camel':
        return this.transformations.snakeToCamel(strValue);
      case 'camel_to_snake':
        return this.transformations.camelToSnake(strValue);
      case 'spaces_to_underscores':
        return this.transformations.addUnderscores(strValue);
      case 'underscores_to_spaces':
        return this.transformations.removeUnderscores(strValue);
      case 'case_normalization':
        return this.transformations.capitalize(strValue);
      default:
        return strValue;
    }
  }
}

// Initialize mapping engine
const mappingEngine = new FieldMappingEngine();

// API Routes

// POST /suggest-mappings - Generate field mapping suggestions
app.post('/suggest-mappings', (req, res) => {
  try {
    const { sourceFields, targetFields, threshold = 0.3 } = req.body;
    
    if (!Array.isArray(sourceFields) || !Array.isArray(targetFields)) {
      return res.status(400).json({
        success: false,
        error: 'sourceFields and targetFields must be arrays'
      });
    }
    
    const suggestions = mappingEngine.suggestMappings(sourceFields, targetFields, threshold);
    
    res.json({
      success: true,
      data: {
        suggestions,
        totalSourceFields: sourceFields.length,
        totalTargetFields: targetFields.length,
        mappedFields: suggestions.length,
        unmappedSource: sourceFields.filter(f => !suggestions.find(s => s.sourceField === f)),
        unmappedTarget: targetFields.filter(f => !suggestions.find(s => s.targetField === f))
      },
      message: 'Field mapping suggestions generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /apply-transformation - Apply suggested transformation
app.post('/apply-transformation', (req, res) => {
  try {
    const { value, transformation } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'value is required'
      });
    }
    
    const transformedValue = mappingEngine.applyTransformation(value, transformation);
    
    res.json({
      success: true,
      data: {
        originalValue: value,
        transformedValue,
        transformation
      },
      message: 'Transformation applied successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /field-patterns - Get available field patterns
app.get('/field-patterns', (req, res) => {
  res.json({
    success: true,
    data: mappingEngine.fieldPatterns,
    message: 'Field patterns retrieved successfully'
  });
});

// POST /test-similarity - Test similarity between two field names
app.post('/test-similarity', (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    if (!field1 || !field2) {
      return res.status(400).json({
        success: false,
        error: 'field1 and field2 are required'
      });
    }
    
    const confidence = mappingEngine.calculateMappingConfidence(field1, field2);
    const mappingType = mappingEngine.getMappingType(field1, field2, confidence);
    const transformation = mappingEngine.suggestTransformation(field1, field2);
    
    res.json({
      success: true,
      data: {
        field1,
        field2,
        confidence,
        mappingType,
        transformation
      },
      message: 'Similarity test completed successfully'
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
    service: 'Field Mapping Suggestion Engine',
    version: '1.0.0',
    capabilities: {
      fuzzy_matching: true,
      field_patterns: true,
      transformation_suggestions: true,
      confidence_scoring: true
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Field Mapping Suggestion Engine running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Suggest endpoint: http://localhost:${PORT}/suggest-mappings`);
});

module.exports = app;
