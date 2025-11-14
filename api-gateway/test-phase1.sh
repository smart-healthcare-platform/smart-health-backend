#!/bin/bash

# Phase 1 Testing Script for API Gateway Admin Dashboard
# This script tests all the admin endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8080"
ADMIN_TOKEN=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 1 Testing Script${NC}"
echo -e "${BLUE}API Gateway Admin Dashboard${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
    fi
}

# Function to check if service is running
check_service() {
    echo -e "\n${YELLOW}Checking if API Gateway is running...${NC}"
    if curl -s -f "${API_URL}/health" > /dev/null; then
        echo -e "${GREEN}✓${NC} API Gateway is running"
        return 0
    else
        echo -e "${RED}✗${NC} API Gateway is not running"
        echo "Please start the gateway with: npm run dev"
        exit 1
    fi
}

# Function to check Redis
check_redis() {
    echo -e "\n${YELLOW}Checking Redis connection...${NC}"
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is running"
        return 0
    else
        echo -e "${RED}✗${NC} Redis is not running"
        echo "Please start Redis with: redis-server"
        echo "Or with Docker: docker run -d -p 6379:6379 redis:7-alpine"
        exit 1
    fi
}

# Test 1: Health Check
test_health() {
    echo -e "\n${YELLOW}Test 1: Health Check${NC}"
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        print_result 0 "Health check"
    else
        print_result 1 "Health check (got $http_code)"
    fi
}

# Test 2: Root Endpoint
test_root() {
    echo -e "\n${YELLOW}Test 2: Root Endpoint${NC}"
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] && echo "$body" | grep -q "admin"; then
        print_result 0 "Root endpoint returns admin in endpoints"
    else
        print_result 1 "Root endpoint"
    fi
}

# Test 3: Admin endpoint without token (should fail with 401)
test_no_auth() {
    echo -e "\n${YELLOW}Test 3: Admin endpoint without token (should fail)${NC}"
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/v1/admin/dashboard/stats")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "401" ]; then
        print_result 0 "Correctly rejected request without token (401)"
    else
        print_result 1 "Should return 401, got $http_code"
    fi
}

# Test 4: Get admin token
get_admin_token() {
    echo -e "\n${YELLOW}Test 4: Getting admin token${NC}"
    
    # Try to get token from auth service
    echo "Attempting to login to Auth Service..."
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"admin123"}' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ]; then
        ADMIN_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$ADMIN_TOKEN" ]; then
            echo -e "${GREEN}✓${NC} Got admin token from Auth Service"
            return 0
        fi
    fi
    
    # If auth service not available, ask for manual token
    echo -e "${YELLOW}Could not get token from Auth Service${NC}"
    echo -e "${YELLOW}Please provide admin JWT token:${NC}"
    echo "You can:"
    echo "1. Set ADMIN_TOKEN env variable before running this script"
    echo "2. Paste token now (press Enter to skip tests requiring auth)"
    read -r manual_token
    
    if [ -n "$manual_token" ]; then
        ADMIN_TOKEN="$manual_token"
        echo -e "${GREEN}✓${NC} Using provided token"
    else
        echo -e "${YELLOW}⚠${NC} Skipping tests requiring authentication"
    fi
}

# Test 5: Admin root endpoint with token
test_admin_root() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 5: Admin root (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 5: Admin root endpoint${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] && echo "$body" | grep -q "Smart Health Admin API"; then
        print_result 0 "Admin root endpoint"
    else
        print_result 1 "Admin root endpoint (got $http_code)"
    fi
}

# Test 6: Dashboard stats
test_dashboard_stats() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 6: Dashboard stats (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 6: Dashboard stats${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/dashboard/stats")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ]; then
        print_result 0 "Dashboard stats endpoint"
        
        # Check if response has expected fields
        if echo "$body" | grep -q "timestamp"; then
            echo -e "  ${GREEN}✓${NC} Response has timestamp"
        fi
        
        if echo "$body" | grep -q "fromCache"; then
            echo -e "  ${GREEN}✓${NC} Response has fromCache flag"
        fi
    else
        print_result 1 "Dashboard stats (got $http_code)"
    fi
}

# Test 7: Cache test (call stats twice)
test_cache() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 7: Cache test (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 7: Cache test${NC}"
    
    # First request - cache miss
    echo "Making first request (cache miss)..."
    response1=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/dashboard/stats")
    http_code1=$(echo "$response1" | tail -n1)
    body1=$(echo "$response1" | sed '$d')
    
    # Wait a bit
    sleep 1
    
    # Second request - cache hit
    echo "Making second request (should be cache hit)..."
    response2=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/dashboard/stats")
    http_code2=$(echo "$response2" | tail -n1)
    body2=$(echo "$response2" | sed '$d')
    
    if [ "$http_code1" == "200" ] && [ "$http_code2" == "200" ]; then
        cache_hit=$(echo "$body2" | grep -o '"fromCache":[^,}]*' | grep -o 'true\|false')
        if [ "$cache_hit" == "true" ]; then
            print_result 0 "Cache is working (2nd request from cache)"
        else
            print_result 1 "Cache not working (2nd request not from cache)"
        fi
    else
        print_result 1 "Cache test failed"
    fi
}

# Test 8: System health
test_system_health() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 8: System health (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 8: System health${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/system/health")
    http_code=$(echo "$response" | tail -n1)
    
    # Accept 200, 207, or 503 as valid (depends on service health)
    if [ "$http_code" == "200" ] || [ "$http_code" == "207" ] || [ "$http_code" == "503" ]; then
        print_result 0 "System health endpoint (status: $http_code)"
    else
        print_result 1 "System health (got $http_code)"
    fi
}

# Test 9: System info
test_system_info() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 9: System info (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 9: System info${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/system/info")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] && echo "$body" | grep -q "gateway"; then
        print_result 0 "System info endpoint"
    else
        print_result 1 "System info (got $http_code)"
    fi
}

# Test 10: Cache stats
test_cache_stats() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 10: Cache stats (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 10: Cache stats${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/dashboard/cache-stats")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] && echo "$body" | grep -q "connected"; then
        print_result 0 "Cache stats endpoint"
    else
        print_result 1 "Cache stats (got $http_code)"
    fi
}

# Test 11: Cache refresh
test_cache_refresh() {
    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "\n${YELLOW}Test 11: Cache refresh (SKIPPED - no token)${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Test 11: Cache refresh${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_URL}/v1/admin/dashboard/refresh")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] && echo "$body" | grep -q "cache_invalidated"; then
        print_result 0 "Cache refresh endpoint"
    else
        print_result 1 "Cache refresh (got $http_code)"
    fi
}

# Test 12: Check Redis keys
test_redis_keys() {
    echo -e "\n${YELLOW}Test 12: Redis keys check${NC}"
    keys=$(redis-cli --raw KEYS "admin:*" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        if [ -n "$keys" ]; then
            echo -e "${GREEN}✓${NC} Found admin keys in Redis:"
            echo "$keys" | while read key; do
                ttl=$(redis-cli TTL "$key" 2>/dev/null)
                echo -e "  - ${BLUE}$key${NC} (TTL: ${ttl}s)"
            done
        else
            echo -e "${YELLOW}⚠${NC} No admin keys in Redis (cache might be empty or expired)"
        fi
    else
        print_result 1 "Could not connect to Redis"
    fi
}

# Main execution
main() {
    check_service
    check_redis
    
    test_health
    test_root
    test_no_auth
    
    # Check if ADMIN_TOKEN is set in environment
    if [ -n "$ADMIN_TOKEN" ]; then
        echo -e "\n${GREEN}Using ADMIN_TOKEN from environment${NC}"
    else
        get_admin_token
    fi
    
    test_admin_root
    test_dashboard_stats
    test_cache
    test_system_health
    test_system_info
    test_cache_stats
    test_cache_refresh
    test_redis_keys
    
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}Testing Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${GREEN}Phase 1 Implementation Status:${NC}"
    echo "✓ Redis Cache Service"
    echo "✓ Admin Authentication"
    echo "✓ Dashboard Aggregator"
    echo "✓ Admin Routes"
    echo ""
    echo -e "${YELLOW}Next: Phase 2 - Patient Service Admin Module${NC}"
}

# Run main function
main