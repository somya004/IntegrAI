# ConfigAI API Documentation

## Overview
The ConfigAI backend provides a comprehensive simulation API that mimics real-world enterprise integrations with mock API keys and realistic responses.

## Base URL
```
http://localhost:5001
```

## Supported Services
- **KYC** - Know Your Customer verification
- **BUREAU** - Credit bureau integration  
- **PAYMENTS** - Payment gateway processing
- **OPEN_BANKING** - Open banking API
- **GST** - GST verification
- **FRAUD** - Fraud detection

## Endpoints

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

### Test Endpoint
```
GET /api/simulation/test
```
**Response:**
```json
{
  "success": true,
  "message": "Simulation API is working",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "supportedServices": ["KYC", "BUREAU", "PAYMENTS", "OPEN_BANKING", "GST", "FRAUD"]
}
```

### Run Simulation
```
POST /api/simulation/run
```
**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "service": "KYC",
  "payload": {
    "name": "John Doe",
    "dob": "1990-01-15",
    "pan": "ABCDE1234F",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "amount": "1000.00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "service": "KYC",
    "apiKeyUsed": "****_123",
    "responseTime": "1471ms",
    "timestamp": "2026-04-01T12:00:00.000Z",
    "data": {
      "verified": true,
      "name": "John Doe",
      "provider": "VeriKyc",
      "verificationId": "uuid-here",
      "confidence": 95,
      "checks": {
        "nameMatch": true,
        "dobMatch": true,
        "panValid": true,
        "emailVerified": true,
        "phoneVerified": true
      }
    }
  },
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

### Get Supported Services
```
GET /api/simulation/services
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "KYC",
      "description": "Know Your Customer verification",
      "apiKey": "****_123"
    },
    {
      "name": "BUREAU",
      "description": "Credit bureau integration",
      "apiKey": "****_456"
    }
  ],
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Service name is required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to run simulation",
  "message": "Service temporarily unavailable"
}
```

## Testing Examples

### PowerShell
```powershell
# Basic test
$body = '{"service":"KYC","payload":{"name":"John Doe","dob":"1990-01-15"}}'
$response = Invoke-RestMethod -Uri "http://localhost:5001/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
$response.data
```

### cURL
```bash
curl -X POST http://localhost:5001/api/simulation/run \
  -H "Content-Type: application/json" \
  -d '{"service":"KYC","payload":{"name":"John Doe","dob":"1990-01-15"}}'
```

### JavaScript/Fetch
```javascript
fetch('http://localhost:5001/api/simulation/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    service: 'KYC',
    payload: {
      name: 'John Doe',
      dob: '1990-01-15'
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Postman
1. **Method**: POST
2. **URL**: `http://localhost:5001/api/simulation/run`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "service": "KYC",
  "payload": {
    "name": "John Doe",
    "dob": "1990-01-15"
  }
}
```

## Features

### Realistic Simulation
- **1-2 second delay** to simulate real API response times
- **80% success rate** to simulate real-world reliability
- **Mock API keys** with masking for security simulation
- **Provider diversity** (VeriKyc, TrustID, CreditBureau Pro, etc.)

### Security Simulation
- API keys are masked in responses (****_123)
- Environment variable based key management
- CORS enabled for frontend integration

### Error Handling
- Comprehensive validation for required fields
- Clear error messages for debugging
- HTTP status codes for different error types

## Environment Variables
```env
PORT=5001
KYC_API_KEY=mock_kyc_123
BUREAU_API_KEY=mock_bureau_456
PAYMENTS_API_KEY=mock_pay_789
OPEN_BANKING_API_KEY=mock_bank_000
```

## Frontend Integration
The frontend at `http://localhost:3000` provides a complete UI for:
- Document upload and parsing
- Integration configuration
- Real-time simulation testing
- Audit logging

The frontend automatically uses the enhanced simulation API with proper error handling and user feedback.
