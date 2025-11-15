#!/bin/bash

# Integration Test Script for API Gateway Dashboard Endpoints
# Tests the integration between API Gateway and Patient/Appointment services

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="http://localhost:8080"
ADMIN_TOKEN_FILE=".admin-token"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}API Gateway Dashboard Integration Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if API Gateway is running
echo -e "${YELLOW}Checking if API Gateway is running...${NC}"
if ! curl -s "${API_GATEWAY_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ API Gateway is not running at ${API_GATEWAY_URL}${NC}"
    echo -e "${YELLOW}Please start the API Gateway first:${NC}"
    echo "  cd api-gateway"
    echo "  npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ API Gateway is running${NC}"
echo ""

# Get admin token
echo -e "${YELLOW}Reading admin token...${NC}"
if [ ! -f "$ADMIN_TOKEN_FILE" ]; then
    echo -e "${RED}✗ Admin token file not found: ${ADMIN_TOKEN_FILE}${NC}"
    echo -e "${YELLOW}Generate token first:${NC}"
    echo "  node generate-admin-token.js"
    exit 1
fi

ADMIN_TOKEN=$(cat "$ADMIN_TOKEN_FILE")
echo -e "${GREEN}✓ Admin token loaded${NC}"
echo ""

# Function to make authenticated request
make_request() {
    local endpoint=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo -e "Endpoint: ${endpoint}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        "${API_GATEWAY_URL}${endpoint}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Success (HTTP ${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed (HTTP ${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Test 1: Dashboard Stats (Aggregated)
echo -e "${BLUE}=== Test 1: Dashboard Stats (Aggregated) ===${NC}"
make_request "/v1/admin/dashboard/stats" "Get Aggregated Dashboard Statistics"

# Test 2: Appointment Trends
echo -e "${BLUE}=== Test 2: Appointment Trends ===${NC}"
make_request "/v1/admin/dashboard/appointments/trends?period=daily&days=30" "Get Appointment Daily Trends (30 days)"

# Test 3: Appointment Distribution
echo -e "${BLUE}=== Test 3: Appointment Distribution ===${NC}"
make_request "/v1/admin/dashboard/appointments/distribution" "Get Appointment Status Distribution"

# Test 4: Recent Appointments
echo -e "${BLUE}=== Test 4: Recent Appointments ===${NC}"
make_request "/v1/admin/dashboard/appointments/recent?page=1&limit=5" "Get Recent Appointments (Page 1, 5 items)"

# Test 5: Patient Growth
echo -e "${BLUE}=== Test 5: Patient Growth ===${NC}"
make_request "/v1/admin/dashboard/patients/growth?period=daily&days=30" "Get Patient Growth (30 days)"

# Test 6: Patient Demographics
echo -e "${BLUE}=== Test 6: Patient Demographics ===${NC}"
make_request "/v1/admin/dashboard/patients/demographics" "Get Patient Demographics"

# Test 7: Recent Patients
echo -e "${BLUE}=== Test 7: Recent Patients ===${NC}"
make_request "/v1/admin/dashboard/patients/recent?page=1&limit=5" "Get Recent Patients (Page 1, 5 items)"

# Test 8: System Health
echo -e "${BLUE}=== Test 8: System Health ===${NC}"
make_request "/v1/admin/system/health" "Get System Health Status"

# Test 9: Cache Stats
echo -e "${BLUE}=== Test 9: Cache Stats ===${NC}"
make_request "/v1/admin/dashboard/cache-stats" "Get Cache Statistics"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "All dashboard endpoints tested!"
echo ""
echo "Endpoints tested:"
echo "  - GET /v1/admin/dashboard/stats"
echo "  - GET /v1/admin/dashboard/appointments/trends"
echo "  - GET /v1/admin/dashboard/appointments/distribution"
echo "  - GET /v1/admin/dashboard/appointments/recent"
echo "  - GET /v1/admin/dashboard/patients/growth"
echo "  - GET /v1/admin/dashboard/patients/demographics"
echo "  - GET /v1/admin/dashboard/patients/recent"
echo "  - GET /v1/admin/system/health"
echo "  - GET /v1/admin/dashboard/cache-stats"
echo ""
echo "Required services:"
echo "  ✓ API Gateway (port 3000)"
echo "  ✓ Patient Service (port 8082)"
echo "  ✓ Appointment Service (port 8084)"
echo "  ✓ Redis (port 6379)"
echo ""
echo -e "${GREEN}Integration testing complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify all endpoints returned 200 OK"
echo "2. Check data is real (not mock)"
echo "3. Test on frontend dashboard"
echo "4. Monitor cache hit rates"