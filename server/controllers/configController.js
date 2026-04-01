const mappingEngine = require('../services/mappingEngine');
const { v4: uuidv4 } = require('uuid');

class ConfigController {
  async generateConfig(req, res) {
    try {
      const { services, selectedVersions, fieldMappings, tenant = 'Default Tenant' } = req.body;

      if (!services || !Array.isArray(services)) {
        return res.status(400).json({
          success: false,
          error: 'Services array is required'
        });
      }

      const configs = [];

      services.forEach(service => {
        const serviceName = service.name;
        const version = selectedVersions[serviceName] || 'v1';
        
        // Generate mappings for this service
        const clientFields = ['name', 'dob', 'pan', 'email', 'phone', 'address'];
        const mappings = mappingEngine.generateMappings(serviceName, clientFields);
        
        // Override with user-provided mappings if available
        if (fieldMappings) {
          Object.keys(fieldMappings).forEach(key => {
            if (key.startsWith(serviceName + '_')) {
              const clientField = key.replace(serviceName + '_', '');
              if (mappings[clientField]) {
                mappings[clientField].apiField = fieldMappings[key];
                mappings[clientField].userDefined = true;
              }
            }
          });
        }

        const config = {
          id: uuidv4(),
          tenant,
          service: serviceName,
          version,
          mapping: {},
          metadata: {
            generatedAt: new Date().toISOString(),
            confidence: mappingEngine.calculateMappingScore(mappings),
            totalFields: Object.keys(mappings).length,
            mandatory: service.mandatory || false
          }
        };

        // Convert mappings to simple object
        Object.entries(mappings).forEach(([clientField, mapping]) => {
          config.mapping[clientField] = mapping.apiField;
        });

        configs.push(config);
      });

      res.json({
        success: true,
        data: {
          configs,
          summary: {
            totalConfigs: configs.length,
            totalMappings: configs.reduce((sum, config) => sum + Object.keys(config.mapping).length, 0),
            averageConfidence: Math.round(
              configs.reduce((sum, config) => sum + config.metadata.confidence, 0) / configs.length
            )
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate configuration',
        message: error.message
      });
    }
  }

  async validateConfig(req, res) {
    try {
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'Config is required'
        });
      }

      // Validate the configuration
      const validation = mappingEngine.validateMapping(config.mapping);

      res.json({
        success: true,
        data: {
          isValid: validation.isValid,
          score: validation.score,
          issues: validation.issues,
          recommendations: this.generateRecommendations(config)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error validating config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate configuration'
      });
    }
  }

  generateRecommendations(config) {
    const recommendations = [];
    
    // Check for missing common fields
    const commonFields = ['name', 'email', 'phone'];
    const mappedFields = Object.keys(config.mapping);
    
    commonFields.forEach(field => {
      if (!mappedFields.includes(field)) {
        recommendations.push({
          type: 'missing_field',
          field,
          message: `Consider adding mapping for ${field} field`
        });
      }
    });

    // Check confidence scores
    if (config.metadata && config.metadata.confidence < 70) {
      recommendations.push({
        type: 'low_confidence',
        message: 'Some mappings have low confidence. Manual review recommended'
      });
    }

    return recommendations;
  }
}

module.exports = new ConfigController();
