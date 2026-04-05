// Minimal ConfigAI Server - Lightweight alternative without heavy dependencies
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

console.log('Starting Minimal ConfigAI Server...');

// Simple in-memory storage
let storedConfigs = [];

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
  });
}

// CORS headers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Mock AI service for testing without API keys
function mockAIService(text) {
  return {
    success: true,
    data: {
      services: [
        {
          name: "User Authentication",
          type: "identity",
          mandatory: true,
          confidence: 95,
          authentication: "Bearer Token",
          endpoints: [
            {
              url: "/api/auth/login",
              method: "POST",
              request_fields: ["email", "password"],
              response_fields: ["token", "user_id"]
            }
          ]
        },
        {
          name: "Payment Processing",
          type: "payment",
          mandatory: true,
          confidence: 88,
          authentication: "API Key",
          endpoints: [
            {
              url: "/api/payments/process",
              method: "POST",
              request_fields: ["amount", "currency", "payment_method"],
              response_fields: ["transaction_id", "status"]
            }
          ]
        }
      ]
    },
    metadata: {
      provider: 'mock',
      model: 'mock-model',
      text_length: text.length,
      services_count: 2,
      timestamp: new Date().toISOString()
    }
  };
}

// Request router
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  setCORS(res);

  // Handle OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    // Health check
    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'minimal-configai'
      }));
      return;
    }

    // AI parsing endpoint
    if (path === '/api/ai/parse' && method === 'POST') {
      const body = await parseBody(req);
      const result = mockAIService(body.text || '');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Storage endpoint
    if (path === '/api/storage/save' && method === 'POST') {
      const body = await parseBody(req);
      const config = {
        id: body.configId || `config_${Date.now()}`,
        data: body.data,
        timestamp: body.timestamp || new Date().toISOString(),
        parserId: body.parserId || 'minimal'
      };
      
      storedConfigs.push(config);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Configuration saved',
        id: config.id
      }));
      return;
    }

    // File upload simulation
    if (path === '/api/parser/upload' && method === 'POST') {
      const body = await parseBody(req);
      const mockText = "This is a sample business requirements document. The system needs user authentication and payment processing capabilities.";
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        extractedText: mockText,
        filename: body.filename || 'sample.txt',
        size: mockText.length
      }));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Create server
const server = http.createServer(handleRequest);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Minimal ConfigAI Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`AI Parse: POST http://localhost:${PORT}/api/ai/parse`);
  console.log(`File Upload: POST http://localhost:${PORT}/api/parser/upload`);
  console.log(`Save Config: POST http://localhost:${PORT}/api/storage/save`);
  console.log('\nServer ready - no npm install required');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
