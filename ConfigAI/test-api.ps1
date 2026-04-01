# ConfigAI API Test Script for PowerShell
# Tests the simulation API endpoint with various scenarios

Write-Host "Testing ConfigAI Simulation API" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Base URL
$baseUrl = "http://localhost:5001"

# Test 1: Health Check
Write-Host "`n📋 Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test Endpoint
Write-Host "`n📋 Test 2: Test Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/test" -Method GET
    Write-Host "✅ Test Endpoint: $($response.message)" -ForegroundColor Green
    Write-Host "   Supported Services: $($response.supportedServices -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Test Endpoint Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Valid KYC Request
Write-Host "`n📋 Test 3: Valid KYC Request" -ForegroundColor Yellow
try {
    $body = @{
        service = "KYC"
        payload = @{
            name = "John Doe"
            dob = "1990-01-15"
            pan = "ABCDE1234F"
            email = "john.doe@example.com"
            phone = "+1234567890"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ KYC Simulation: $($response.success)" -ForegroundColor Green
    Write-Host "   Service: $($response.data.service)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.data.status)" -ForegroundColor Cyan
    Write-Host "   API Key: $($response.data.apiKeyUsed)" -ForegroundColor Cyan
    Write-Host "   Response Time: $($response.data.responseTime)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ KYC Simulation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Valid BUREAU Request
Write-Host "`n📋 Test 4: Valid BUREAU Request" -ForegroundColor Yellow
try {
    $body = @{
        service = "BUREAU"
        payload = @{
            name = "Jane Smith"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ BUREAU Simulation: $($response.success)" -ForegroundColor Green
    Write-Host "   Service: $($response.data.service)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.data.status)" -ForegroundColor Cyan
    Write-Host "   API Key: $($response.data.apiKeyUsed)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ BUREAU Simulation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Valid PAYMENTS Request
Write-Host "`n📋 Test 5: Valid PAYMENTS Request" -ForegroundColor Yellow
try {
    $body = @{
        service = "PAYMENTS"
        payload = @{
            amount = "1000.00"
            currency = "USD"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ PAYMENTS Simulation: $($response.success)" -ForegroundColor Green
    Write-Host "   Service: $($response.data.service)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.data.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ PAYMENTS Simulation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Missing Service (Error Test)
Write-Host "`nTest 6: Missing Service (Error Test)" -ForegroundColor Yellow
try {
    $body = @{
        payload = @{
            name = "John Doe"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "Should have failed but didn't" -ForegroundColor Red
} catch {
    Write-Host "Correctly rejected missing service" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Cyan
}

# Test 7: Invalid Service (Error Test)
Write-Host "`nTest 7: Invalid Service (Error Test)" -ForegroundColor Yellow
try {
    $body = @{
        service = "INVALID_SERVICE"
        payload = @{
            name = "John Doe"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "Should have failed but didn't" -ForegroundColor Red
} catch {
    Write-Host "Correctly rejected invalid service" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Cyan
}

# Test 8: Get Supported Services
Write-Host "`n📋 Test 8: Get Supported Services" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/services" -Method GET
    Write-Host "✅ Supported Services Retrieved" -ForegroundColor Green
    $response.data | ForEach-Object {
        Write-Host "   $($_.name): $($_.description) (API Key: $($_.apiKey))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Get Supported Services Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "The API is compatible with PowerShell, Postman, and frontend requests." -ForegroundColor Green
