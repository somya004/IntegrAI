# Simple API Test Script
$baseUrl = "http://localhost:5001"

Write-Host "Testing ConfigAI API..." -ForegroundColor Green

# Test 1: Health Check
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "Health Check: OK" -ForegroundColor Green
} catch {
    Write-Host "Health Check Failed" -ForegroundColor Red
}

# Test 2: KYC Simulation
try {
    $body = '{"service":"KYC","payload":{"name":"John Doe","dob":"1990-01-15"}}'
    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "KYC Simulation: SUCCESS" -ForegroundColor Green
    Write-Host "Service: $($response.data.service)" -ForegroundColor Cyan
    Write-Host "Status: $($response.data.status)" -ForegroundColor Cyan
    Write-Host "API Key: $($response.data.apiKeyUsed)" -ForegroundColor Cyan
    Write-Host "Response Time: $($response.data.responseTime)" -ForegroundColor Cyan
} catch {
    Write-Host "KYC Simulation Failed" -ForegroundColor Red
}

# Test 3: BUREAU Simulation
try {
    $body = '{"service":"BUREAU","payload":{"name":"Jane Smith"}}'
    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "BUREAU Simulation: SUCCESS" -ForegroundColor Green
    Write-Host "Service: $($response.data.service)" -ForegroundColor Cyan
    Write-Host "Status: $($response.data.status)" -ForegroundColor Cyan
} catch {
    Write-Host "BUREAU Simulation Failed" -ForegroundColor Red
}

# Test 4: Error Test (Invalid Service)
try {
    $body = '{"service":"INVALID","payload":{"name":"John Doe"}}'
    $response = Invoke-RestMethod -Uri "$baseUrl/api/simulation/run" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "Error Test: Should have failed" -ForegroundColor Red
} catch {
    Write-Host "Error Test: Correctly rejected invalid service" -ForegroundColor Green
}

Write-Host "API Testing Complete!" -ForegroundColor Green
