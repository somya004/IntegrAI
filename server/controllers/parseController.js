const aiParser = require('../services/aiParser');

class ParseController {
  async parseDocument(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      // Parse the document
      const result = aiParser.parseDocument(text);
      
      // Extract additional requirements
      const requirements = aiParser.extractRequirements(text);

      res.json({
        success: true,
        data: {
          ...result,
          requirements,
          summary: {
            totalServices: result.totalDetected,
            mandatoryServices: result.services.filter(s => s.mandatory).length,
            totalRequirements: requirements.length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error parsing document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse document',
        message: error.message
      });
    }
  }

  async getSupportedServices(req, res) {
    try {
      const supportedServices = [
        {
          name: 'KYC',
          description: 'Know Your Customer verification',
          commonFields: ['name', 'dob', 'pan', 'email', 'phone', 'address'],
          versions: ['v1', 'v2'],
          category: 'Verification'
        },
        {
          name: 'GST',
          description: 'Goods and Services Tax verification',
          commonFields: ['name', 'pan', 'email', 'phone', 'address'],
          versions: ['v1'],
          category: 'Tax'
        },
        {
          name: 'Payment',
          description: 'Payment processing and transactions',
          commonFields: ['name', 'email', 'phone', 'amount', 'account'],
          versions: ['v1', 'v2', 'v3'],
          category: 'Financial'
        },
        {
          name: 'Fraud',
          description: 'Fraud detection and risk assessment',
          commonFields: ['name', 'dob', 'pan', 'email', 'phone'],
          versions: ['v1', 'v2'],
          category: 'Security'
        }
      ];

      res.json({
        success: true,
        data: supportedServices,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting supported services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get supported services'
      });
    }
  }
}

module.exports = new ParseController();
