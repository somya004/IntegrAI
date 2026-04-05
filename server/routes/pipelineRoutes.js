const express = require('express');
const multer = require('multer');
const PipelineController = require('../services/pipelineController');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const pipelineController = new PipelineController();

router.post('/process', upload.single('document'), async (req, res) => {
  try {
    let input;
    
    if (req.file) {
      input = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype
      };
    } else if (req.body.text) {
      input = req.body.text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document or text provided'
      });
    }

    const options = {
      enableRetry: true,
      enableFallback: true,
      enableLoop: true,
      maxRetries: 3,
      outputFormat: req.body.format || 'json',
      includeExplanations: req.body.includeExplanations === 'true',
      includeMetrics: req.body.includeMetrics !== 'false',
      onProgress: (stage, status, data) => {
        console.log(`Pipeline ${stage}: ${status}`);
      },
      onStageComplete: (stage, result) => {
        console.log(`Pipeline stage ${stage} completed`);
      },
      onError: (stage, error) => {
        console.error(`Pipeline stage ${stage} error:`, error.message);
      }
    };

    const result = await pipelineController.runPipeline(input, options);

    res.json({
      success: true,
      data: result.result,
      pipeline_state: result.pipeline_state,
      execution_summary: result.execution_summary
    });

  } catch (error) {
    console.error('Pipeline processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      pipeline_state: pipelineController.getPipelineState()
    });
  }
});

router.post('/reprocess', async (req, res) => {
  try {
    const { originalInput, previousResult, options = {} } = req.body;

    if (!originalInput) {
      return res.status(400).json({
        success: false,
        error: 'Original input required for reprocessing'
      });
    }

    const reprocessOptions = {
      ...options,
      enableRetry: true,
      enableFallback: true,
      enableLoop: true,
      maxRetries: options.maxRetries || 3,
      outputFormat: options.format || 'detailed',
      includeExplanations: true,
      includeMetrics: true
    };

    const result = await pipelineController.runPipeline(originalInput, reprocessOptions);

    res.json({
      success: true,
      data: result.result,
      pipeline_state: result.pipeline_state,
      execution_summary: result.execution_summary,
      reprocessing: true
    });

  } catch (error) {
    console.error('Pipeline reprocessing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      pipeline_state: pipelineController.getPipelineState()
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = pipelineController.getPipelineStatus();
    const health = await pipelineController.healthCheck();

    res.json({
      success: true,
      status: status,
      health: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    const health = await pipelineController.healthCheck();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      health: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const { result, question } = req.body;

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Result data required for explanation'
      });
    }

    const explanation = await generateExplanation(result, question);

    res.json({
      success: true,
      explanation: explanation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Explanation generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function generateExplanation(result, question) {
  const summary = result.summary || {};
  const data = result.data || {};

  let explanation = {
    overview: "The AI Requirement Parsing Engine analyzed your document and extracted integration requirements.",
    key_findings: [],
    confidence_analysis: {},
    recommendations: []
  };

  if (summary.overview) {
    explanation.key_findings.push(
      `Identified ${summary.overview.total_services} services`,
      `Defined ${summary.overview.total_apis} API endpoints`,
      `Overall confidence: ${Math.round((summary.overview.confidence_score || 0) * 100)}%`
    );
  }

  if (summary.services_breakdown) {
    const mandatory = summary.services_breakdown.by_priority?.high || 0;
    if (mandatory > 0) {
      explanation.key_findings.push(`${mandatory} mandatory services identified`);
    }
  }

  if (data.integration_plan?.services) {
    const highConfidenceServices = data.integration_plan.services.filter(s => (s.confidence || 0) >= 0.8);
    explanation.confidence_analysis = {
      high_confidence_items: highConfidenceServices.length,
      average_confidence: summary.overview?.confidence_score || 0,
      confidence_factors: ["Clear service definitions", "Detailed API specifications", "Explicit requirements"]
    };
  }

  explanation.recommendations = [
    "Start with implementing mandatory services first",
    "Set up proper authentication for all endpoints",
    "Create comprehensive test suites for each API",
    "Implement monitoring and logging from the beginning"
  ];

  if (question) {
    explanation.custom_answer = generateCustomAnswer(result, question);
  }

  return explanation;
}

function generateCustomAnswer(result, question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('service') || lowerQuestion.includes('services')) {
    const services = result.data?.integration_plan?.services || [];
    return `Found ${services.length} services: ${services.map(s => s.name).join(', ')}`;
  }
  
  if (lowerQuestion.includes('api') || lowerQuestion.includes('endpoint')) {
    const apis = result.data?.integration_plan?.apis || [];
    return `Defined ${apis.length} APIs: ${apis.map(a => `${a.method} ${a.endpoint}`).join(', ')}`;
  }
  
  if (lowerQuestion.includes('confidence') || lowerQuestion.includes('accuracy')) {
    const confidence = result.summary?.overview?.confidence_score || 0;
    return `Overall confidence is ${Math.round(confidence * 100)}% based on clarity of requirements and specificity of definitions`;
  }
  
  if (lowerQuestion.includes('time') || lowerQuestion.includes('effort') || lowerQuestion.includes('duration')) {
    const estimate = result.summary?.implementation_estimate;
    if (estimate) {
      return `Estimated implementation time: ${estimate.total_days} days (${estimate.breakdown.services} days for services, ${estimate.breakdown.apis} days for APIs)`;
    }
  }
  
  return "Based on the analysis, the requirements are well-structured and suitable for implementation. Focus on the mandatory services first and ensure proper authentication is in place.";
}

module.exports = router;
