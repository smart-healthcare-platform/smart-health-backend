#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Doctor Service Admin API Tests      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
BASE_URL="http://localhost:8083"
ADMIN_BASE_URL="${BASE_URL}/v1/admin/doctors"

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo -e "${YELLOW}Testing: ${name}${NC}"
    echo -e "${BLUE}URL: ${url}${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${url}" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ HTTP ${http_code} - Success${NC}"
        echo -e "${GREEN}Response:${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ HTTP ${http_code} - Failed${NC}"
        echo -e "${RED}Response:${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    
    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo ""
}

# Check if service is running
echo -e "${BLUE}Checking if Doctor Service is running on port 8083...${NC}"
if ! lsof -Pi :8083 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Doctor Service is not running on port 8083${NC}"
    echo -e "${YELLOW}Please start the service first:${NC}"
    echo -e "${YELLOW}  cd doctor && npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Doctor Service is running${NC}"
echo ""

# Wait a moment for service to be ready
sleep 2

# Test 1: Get Doctor Stats
test_endpoint \
    "Doctor Statistics" \
    "${ADMIN_BASE_URL}/stats"

# Test 2: Get Top Doctors
test_endpoint \
    "Top Doctors (default limit=10)" \
    "${ADMIN_BASE_URL}/top"

# Test 3: Get Top Doctors with custom limit
test_endpoint \
    "Top Doctors (limit=5)" \
    "${ADMIN_BASE_URL}/top?limit=5"

# Test 4: Get Department Performance
test_endpoint \
    "Department/Specialty Performance" \
    "${ADMIN_BASE_URL}/departments/performance"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           Test Summary                 ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo -e "${YELLOW}Key Endpoints:${NC}"
echo "  1. GET ${ADMIN_BASE_URL}/stats"
echo "  2. GET ${ADMIN_BASE_URL}/top?limit=10"
echo "  3. GET ${ADMIN_BASE_URL}/departments/performance"
echo ""
echo -e "${YELLOW}Expected Metrics:${NC}"
echo "  - totalDoctors"
echo "  - activeDoctors"
echo "  - inactiveDoctors"
echo "  - newDoctorsThisMonth"
echo "  - doctorsWorkingToday (doctors with slots today)"
echo "  - averageRating"
echo "  - mostPopularSpecialty"
echo ""
echo -e "${YELLOW}Note:${NC}"
echo "  - 'Online doctors' metric removed (no presence tracking)"
echo "  - 'doctorsWorkingToday' = doctors with appointment slots today"
echo "  - 'activeDoctors' = doctors with active=true in database"
echo ""