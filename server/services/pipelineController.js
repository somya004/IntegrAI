const DocumentIngestion = require('./documentIngestion');
const PreprocessingLayer = require('./preprocessingLayer');
const NLPExtractionEngine = require('./nlpExtractionEngine');
const ClassificationEngine = require('./classificationEngine');
const StructuringEngine = require('./structuringEngine');
const ValidationLayer = require('./validationLayer');
const OutputGenerator = require('./outputGenerator');

class PipelineController {
  constructor() {
    this.stages = {
      ingestion: new DocumentIngestion(),
      preprocessing: new PreprocessingLayer(),
      extraction: new NLPExtractionEngine(),
      classification: new ClassificationEngine(),
      structuring: new StructuringEngine(),
      validation: new ValidationLayer(),
      output: new OutputGenerator()
    };

    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.pipelineState = {
      currentStage: null,
      completedStages: [],
      errors: [],
      retries: {},
      startTime: null,
      endTime: null
    };
  }

  async runPipeline(input, options = {}) {
    try {
      this.resetPipelineState();
      this.pipelineState.startTime = Date.now();

      const pipelineOptions = {
        enableRetry: options.enableRetry !== false,
        enableFallback: options.enableFallback !== false,
        enableLoop: options.enableLoop !== false,
        maxRetries: options.maxRetries || this.maxRetries,
        outputFormat: options.outputFormat || 'json',
        includeExplanations: options.includeExplanations || false,
        includeMetrics: options.includeMetrics || true,
        onProgress: options.onProgress || (() => {}),
        onStageComplete: options.onStageComplete || (() => {}),
        onError: options.onError || (() => {})
      };

      let result = await this.executePipeline(input, pipelineOptions);

      if (pipelineOptions.enableLoop && !this.isResultSatisfactory(result)) {
        result = await this.runPipelineLoop(input, result, pipelineOptions);
      }

      this.pipelineState.endTime = Date.now();

      return {
        success: true,
        result: result,
        pipeline_state: this.getPipelineState(),
        execution_summary: this.generateExecutionSummary()
      };

    } catch (error) {
      console.error('Pipeline execution failed:', error.message);
      this.pipelineState.endTime = Date.now();
      this.pipelineState.errors.push({
        stage: 'pipeline_controller',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        pipeline_state: this.getPipelineState(),
        fallback_result: await this.generateFallbackResult(input)
      };
    }
  }

  async executePipeline(input, options) {
    let pipelineData = { input };
    let stageResults = {};

    const stages = [
      { name: 'ingestion', handler: this.executeStage.bind(this) },
      { name: 'preprocessing', handler: this.executeStage.bind(this) },
      { name: 'extraction', handler: this.executeStage.bind(this) },
      { name: 'classification', handler: this.executeStage.bind(this) },
      { name: 'structuring', handler: this.executeStage.bind(this) },
      { name: 'validation', handler: this.executeStage.bind(this) },
      { name: 'output', handler: this.executeStage.bind(this) }
    ];

    for (const stage of stages) {
      try {
        this.pipelineState.currentStage = stage.name;
        options.onProgress(stage.name, 'starting', pipelineData);

        const stageResult = await this.executeStageWithRetry(
          stage.name,
          () => stage.handler(stage.name, pipelineData, options),
          options
        );

        stageResults[stage.name] = stageResult;
        pipelineData[stage.name] = stageResult.success ? stageResult.data : stageResult;

        this.pipelineState.completedStages.push(stage.name);
        options.onStageComplete(stage.name, stageResult);
        options.onProgress(stage.name, 'completed', pipelineData);

      } catch (error) {
        this.pipelineState.errors.push({
          stage: stage.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        options.onError(stage.name, error);

        if (options.enableFallback) {
          const fallbackResult = await this.executeStageFallback(stage.name, pipelineData);
          stageResults[stage.name] = fallbackResult;
          pipelineData[stage.name] = fallbackResult.data;
        } else {
          throw error;
        }
      }
    }

    return pipelineData.output;
  }

  async executeStage(stageName, pipelineData, options) {
    const stage = this.stages[stageName];
    let input = pipelineData.input;

    if (stageName === 'preprocessing') {
      input = pipelineData.ingestion?.data || input;
    } else if (stageName === 'extraction') {
      input = pipelineData.preprocessing?.data || input;
    } else if (stageName === 'classification') {
      input = pipelineData.extraction?.data || input;
    } else if (stageName === 'structuring') {
      input = pipelineData.classification?.data || input;
    } else if (stageName === 'validation') {
      input = pipelineData.structuring?.data || input;
    } else if (stageName === 'output') {
      input = pipelineData.validation?.data || input;
    }

    const stageOptions = this.getStageOptions(stageName, options);
    return await stage[input ? 'process' : 'ingest'](input, stageOptions);
  }

  async executeStageWithRetry(stageName, stageFunction, options) {
    if (!options.enableRetry) {
      return await stageFunction();
    }

    let lastError;
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        const result = await stageFunction();
        
        if (this.isStageResultSuccessful(result)) {
          this.pipelineState.retries[stageName] = attempt - 1;
          return result;
        }

        if (attempt === options.maxRetries) {
          throw new Error(`Stage ${stageName} failed after ${options.maxRetries} attempts`);
        }

        lastError = new Error(`Stage ${stageName} attempt ${attempt} unsuccessful`);
        
      } catch (error) {
        lastError = error;
        
        if (attempt < options.maxRetries) {
          await this.delay(this.retryDelay * attempt);
          
          if (attempt > 1 && options.enableFallback) {
            try {
              const fallbackResult = await this.executeStageFallback(stageName, {});
              if (this.isStageResultSuccessful(fallbackResult)) {
                return fallbackResult;
              }
            } catch (fallbackError) {
              console.warn(`Fallback for ${stageName} also failed:`, fallbackError.message);
            }
          }
        }
      }
    }

    throw lastError;
  }

  async executeStageFallback(stageName, pipelineData) {
    console.warn(`Executing fallback for stage: ${stageName}`);
    
    const fallbackMethods = {
      ingestion: () => this.stages.ingestion.generateMockContent(pipelineData.input || ''),
      preprocessing: () => this.stages.preprocessing.generateMockPreprocessedContent(pipelineData.input || ''),
      extraction: () => this.stages.extraction.generateMockExtraction(pipelineData.preprocessing?.data || {}),
      classification: () => this.stages.classification.generateMockClassification(pipelineData.extraction?.data || {}),
      structuring: () => this.stages.structuring.generateMockStructure(pipelineData.classification?.data || {}),
      validation: () => this.stages.validation.generateMockValidation(pipelineData.structuring?.data || {}),
      output: () => this.stages.output.generateMockOutput(pipelineData.validation?.data || {})
    };

    const fallbackMethod = fallbackMethods[stageName];
    if (fallbackMethod) {
      return await fallbackMethod();
    }

    throw new Error(`No fallback available for stage: ${stageName}`);
  }

  async runPipelineLoop(input, initialResult, options) {
    let currentResult = initialResult;
    let loopCount = 0;
    const maxLoops = 3;

    while (!this.isResultSatisfactory(currentResult) && loopCount < maxLoops) {
      loopCount++;
      console.log(`Running pipeline loop iteration ${loopCount}`);

      const loopOptions = {
        ...options,
        enableRetry: loopCount > 1,
        outputFormat: 'detailed',
        includeExplanations: true
      };

      try {
        currentResult = await this.executePipeline(input, loopOptions);
        
        if (this.isResultSatisfactory(currentResult)) {
          console.log(`Pipeline loop succeeded on iteration ${loopCount}`);
          break;
        }

      } catch (error) {
        console.warn(`Pipeline loop iteration ${loopCount} failed:`, error.message);
        
        if (loopCount === maxLoops) {
          console.warn('Pipeline loop exhausted, using best available result');
          break;
        }
      }
    }

    return currentResult;
  }

  isStageResultSuccessful(result) {
    return result && result.success === true;
  }

  isResultSatisfactory(result) {
    if (!result || !result.success) return false;

    const validation = result.validation;
    if (validation && !validation.is_valid) return false;

    const summary = result.summary;
    if (summary && summary.overview) {
      const { confidence_score, total_services, total_apis } = summary.overview;
      
      if (confidence_score < 0.5) return false;
      if (total_services === 0) return false;
      if (total_apis === 0) return false;
    }

    return true;
  }

  getStageOptions(stageName, globalOptions) {
    const stageSpecificOptions = {
      ingestion: {},
      preprocessing: {},
      extraction: {
        useAI: true,
        fallbackToPatterns: true
      },
      classification: {
        enableConfidenceScoring: true,
        enableRiskAssessment: true
      },
      structuring: {
        includeSchemas: true,
        includeDependencies: true
      },
      validation: {
        strictMode: false,
        enableCorrections: true
      },
      output: {
        format: globalOptions.outputFormat,
        includeExplanations: globalOptions.includeExplanations,
        includeMetrics: globalOptions.includeMetrics
      }
    };

    return stageSpecificOptions[stageName] || {};
  }

  resetPipelineState() {
    this.pipelineState = {
      currentStage: null,
      completedStages: [],
      errors: [],
      retries: {},
      startTime: null,
      endTime: null
    };
  }

  getPipelineState() {
    return {
      ...this.pipelineState,
      duration: this.pipelineState.endTime ? this.pipelineState.endTime - this.pipelineState.startTime : null,
      success_rate: this.calculateSuccessRate(),
      error_count: this.pipelineState.errors.length,
      retry_count: Object.values(this.pipelineState.retries).reduce((sum, count) => sum + count, 0)
    };
  }

  calculateSuccessRate() {
    const totalStages = Object.keys(this.stages).length;
    const completedStages = this.pipelineState.completedStages.length;
    return totalStages > 0 ? completedStages / totalStages : 0;
  }

  generateExecutionSummary() {
    return {
      pipeline_version: '1.0',
      execution_id: this.generateExecutionId(),
      start_time: new Date(this.pipelineState.startTime).toISOString(),
      end_time: this.pipelineState.endTime ? new Date(this.pipelineState.endTime).toISOString() : null,
      duration_ms: this.pipelineState.endTime ? this.pipelineState.endTime - this.pipelineState.startTime : null,
      stages_completed: this.pipelineState.completedStages,
      stages_failed: this.pipelineState.errors.map(e => e.stage),
      total_retries: Object.values(this.pipelineState.retries).reduce((sum, count) => sum + count, 0),
      success_rate: this.calculateSuccessRate(),
      error_summary: this.generateErrorSummary()
    };
  }

  generateErrorSummary() {
    const errorCounts = {};
    this.pipelineState.errors.forEach(error => {
      errorCounts[error.stage] = (errorCounts[error.stage] || 0) + 1;
    });

    return {
      total_errors: this.pipelineState.errors.length,
      errors_by_stage: errorCounts,
      most_failed_stage: Object.keys(errorCounts).reduce((a, b) => 
        errorCounts[a] > errorCounts[b] ? a : b, null
      )
    };
  }

  generateExecutionId() {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateFallbackResult(input) {
    console.warn('Generating fallback result due to pipeline failure');

    const mockData = {
      integration_plan: {
        services: [
          {
            id: 'fallback_service_1',
            name: 'Fallback Service',
            type: 'other',
            mandatory: false,
            confidence: 0.3,
            priority: 'low',
            description: 'Fallback generated service due to pipeline failure'
          }
        ],
        apis: [
          {
            id: 'fallback_api_1',
            name: 'Fallback API',
            endpoint: '/api/fallback',
            method: 'POST',
            confidence: 0.3,
            description: 'Fallback generated API due to pipeline failure'
          }
        ],
        authentication: [
          {
            id: 'fallback_auth_1',
            type: 'API Key',
            confidence: 0.5,
            applies_to: ['fallback']
          }
        ]
      },
      metadata: {
        version: '1.0',
        generated_at: new Date().toISOString(),
        confidence_score: 0.3,
        processing_time: 0,
        fallback_mode: true
      }
    };

    const outputGenerator = this.stages.output;
    return await outputGenerator.generate({ data: mockData, validation: { is_valid: false, errors: ['Pipeline failed'] } }, {
      format: 'json',
      includeExplanations: true,
      includeMetrics: true
    });
  }

  getPipelineStatus() {
    return {
      is_running: this.pipelineState.currentStage !== null,
      current_stage: this.pipelineState.currentStage,
      completed_stages: this.pipelineState.completedStages,
      total_stages: Object.keys(this.stages).length,
      progress_percentage: (this.pipelineState.completedStages.length / Object.keys(this.stages).length) * 100,
      errors: this.pipelineState.errors,
      retries: this.pipelineState.retries
    };
  }

  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stages: {},
      overall_health: 100
    };

    for (const [stageName, stage] of Object.entries(this.stages)) {
      try {
        const testResult = await this.testStage(stageName, stage);
        health.stages[stageName] = {
          status: 'healthy',
          response_time_ms: testResult.responseTime,
          last_test: new Date().toISOString()
        };
      } catch (error) {
        health.stages[stageName] = {
          status: 'unhealthy',
          error: error.message,
          last_test: new Date().toISOString()
        };
        health.overall_health -= 14.28; // 100 / 7 stages
      }
    }

    if (health.overall_health < 70) {
      health.status = 'degraded';
    }
    if (health.overall_health < 50) {
      health.status = 'unhealthy';
    }

    return health;
  }

  async testStage(stageName, stage) {
    const startTime = Date.now();
    
    const testData = {
      input: 'Test input for health check',
      content: 'Test content for health check',
      data: { test: true }
    };

    const testInput = this.getTestInputForStage(stageName, testData);
    await stage[testInput.method](testInput.data, {});
    
    return {
      responseTime: Date.now() - startTime,
      status: 'success'
    };
  }

  getTestInputForStage(stageName, testData) {
    const testInputs = {
      ingestion: { method: 'ingestDocument', data: testData.input },
      preprocessing: { method: 'preprocess', data: testData.content },
      extraction: { method: 'extract', data: { cleanedContent: testData.content } },
      classification: { method: 'classify', data: { services: [], apis: [] } },
      structuring: { method: 'structure', data: { services: [], apis: [] } },
      validation: { method: 'validate', data: { integration_plan: {}, metadata: {} } },
      output: { method: 'generate', data: { data: {} } }
    };

    return testInputs[stageName] || { method: 'test', data: testData };
  }
}

module.exports = PipelineController;
