# ConfigAI Deployment Guide

## Overview
ConfigAI is a full-stack enterprise integration orchestration platform with AI-powered configuration generation and realistic API simulation.

## Project Structure
```
ConfigAI/
├── client/          # React frontend (Vercel deployment)
├── server/          # Node.js backend (Render deployment)
├── shared/          # Shared configurations
├── docs/           # Documentation
└── README.md       # Project documentation
```

## Local Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd server
npm install
cp .env.example .env  # Configure your environment variables
npm start
```
Backend runs on `http://localhost:5001`

### Frontend Setup
```bash
cd client
npm install
npm start
```
Frontend runs on `http://localhost:3000`

## Environment Variables

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
KYC_API_KEY=mock_kyc_123
BUREAU_API_KEY=mock_bureau_456
PAYMENTS_API_KEY=mock_pay_789
OPEN_BANKING_API_KEY=mock_bank_000
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5001
```

## Deployment

### Frontend (Vercel)
1. Connect Vercel to GitHub repository
2. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com`
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect Render to GitHub repository
2. Configure environment variables in Render dashboard
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy automatically on push to main branch

## API Endpoints

### Health Check
```
GET /health
```

### Document Parsing
```
POST /api/parse/document
```

### Configuration Generation
```
POST /api/config/generate
```

### Simulation
```
POST /api/simulation/run
GET /api/simulation/services
```

### Audit Logs
```
GET /api/audit/logs
```

## Features

### AI-Powered Integration
- Document parsing with service detection
- Automatic field mapping with confidence scores
- Configuration generation for multiple services

### Realistic Simulation
- Mock API keys with security masking
- 1-2 second response delays
- 80% success rate simulation
- Multiple enterprise service providers

### Enterprise Services
- **KYC** - Customer verification
- **BUREAU** - Credit scoring
- **PAYMENTS** - Transaction processing
- **OPEN_BANKING** - Financial data access
- **GST** - Tax verification
- **FRAUD** - Risk assessment

## Testing

### PowerShell
```powershell
$body = '{"service":"KYC","payload":{"name":"John Doe"}}'
Invoke-RestMethod -Uri "http://localhost:5001/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

### Postman
Import the provided collection or use:
- POST `http://localhost:5001/api/simulation/run`
- Headers: `Content-Type: application/json`
- Body: Raw JSON with service and payload

## Security Considerations

- API keys are masked in responses
- Environment variables are not committed
- CORS is properly configured
- Input validation on all endpoints
- Error handling without exposing sensitive data

## Monitoring

### Health Checks
- Backend: `/health`
- Frontend: Application health monitoring

### Logging
- Comprehensive request/response logging
- Error tracking and reporting
- Audit trail for all actions

## Scaling

### Frontend
- Vercel automatically scales based on traffic
- CDN distribution for static assets
- Edge functions for API calls if needed

### Backend
- Render scales horizontally
- Database connection pooling
- Caching layer for frequent requests

## Support

For issues and questions:
1. Check the API documentation
2. Review the troubleshooting guide
3. Open an issue on GitHub repository
