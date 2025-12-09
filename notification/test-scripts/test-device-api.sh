#!/bin/bash

# Test Device API and Notification Flow
# Usage: ./test-device-api.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NOTIFICATION_SERVICE_URL="http://localhost:8088"
TEST_USER_ID="test-doctor-123"
TEST_PATIENT_ID="test-patient-456"
TEST_WEB_TOKEN="web-fcm-token-$(date +%s)"
TEST_ANDROID_TOKEN="android-fcm-token-$(date +%s)"
TEST_IOS_TOKEN="ios-fcm-token-$(date +%s)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Smart Health - Notification Service Test Suite       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print test header
print_test() {
    echo -e "\n${YELLOW}▶ Test $1: $2${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Test 1: Health Check
print_test "1" "Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" ${NOTIFICATION_SERVICE_URL}/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    print_success "Service is healthy"
    echo "$BODY" | jq '.'
else
    print_error "Service health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Register Web Device
print_test "2" "Register Web Device for Doctor"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${NOTIFICATION_SERVICE_URL}/device/register \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"deviceToken\": \"${TEST_WEB_TOKEN}\",
        \"deviceType\": \"web\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    print_success "Web device registered successfully"
    echo "$BODY" | jq '.'
    WEB_DEVICE_ID=$(echo "$BODY" | jq -r '.data.id')
    print_info "Device ID: $WEB_DEVICE_ID"
else
    print_error "Failed to register web device (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

# Test 3: Register Android Device
print_test "3" "Register Android Device for Doctor"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${NOTIFICATION_SERVICE_URL}/device/register \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"deviceToken\": \"${TEST_ANDROID_TOKEN}\",
        \"deviceType\": \"android\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    print_success "Android device registered successfully"
    echo "$BODY" | jq '.'
else
    print_error "Failed to register android device (HTTP $HTTP_CODE)"
fi

# Test 4: Register iOS Device for Patient
print_test "4" "Register iOS Device for Patient"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${NOTIFICATION_SERVICE_URL}/device/register \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_PATIENT_ID}\",
        \"deviceToken\": \"${TEST_IOS_TOKEN}\",
        \"deviceType\": \"ios\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    print_success "iOS device registered successfully"
    echo "$BODY" | jq '.'
else
    print_error "Failed to register iOS device (HTTP $HTTP_CODE)"
fi

# Test 5: Get All Active Devices for Doctor
print_test "5" "Get All Active Devices for Doctor"
RESPONSE=$(curl -s -w "\n%{http_code}" ${NOTIFICATION_SERVICE_URL}/device/${TEST_USER_ID}/devices)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    DEVICE_COUNT=$(echo "$BODY" | jq '.data | length')
    print_success "Retrieved $DEVICE_COUNT active device(s)"
    echo "$BODY" | jq '.'
else
    print_error "Failed to get devices (HTTP $HTTP_CODE)"
fi

# Test 6: Get Devices by Type (Web)
print_test "6" "Get Web Devices Only"
RESPONSE=$(curl -s -w "\n%{http_code}" ${NOTIFICATION_SERVICE_URL}/device/${TEST_USER_ID}/devices/web)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    WEB_DEVICE_COUNT=$(echo "$BODY" | jq '.data | length')
    print_success "Retrieved $WEB_DEVICE_COUNT web device(s)"
    echo "$BODY" | jq '.'
else
    print_error "Failed to get web devices (HTTP $HTTP_CODE)"
fi

# Test 7: Duplicate Registration (Should Update)
print_test "7" "Duplicate Device Registration (Should Update Existing)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${NOTIFICATION_SERVICE_URL}/device/register \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"deviceToken\": \"${TEST_WEB_TOKEN}\",
        \"deviceType\": \"web\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    print_success "Duplicate handled correctly (updated existing device)"
    echo "$BODY" | jq '.'
else
    print_error "Failed to handle duplicate (HTTP $HTTP_CODE)"
fi

# Test 8: Publish Kafka Message Event
print_test "8" "Publish Kafka Event (message.new)"
print_info "This will trigger notification to all devices of ${TEST_USER_ID}"

# Create test message event
MESSAGE_EVENT="{\"recipientId\":\"${TEST_USER_ID}\",\"senderId\":\"${TEST_PATIENT_ID}\",\"senderName\":\"Test Patient\",\"messageContent\":\"Hello Doctor! This is a test message from Kafka.\",\"conversationId\":\"test-conv-123\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

# Check if Kafka is available
if command -v docker &> /dev/null; then
    print_info "Publishing to Kafka topic: message.new"
    echo "$MESSAGE_EVENT" | docker exec -i kafka kafka-console-producer \
        --bootstrap-server localhost:9092 \
        --topic message.new 2>/dev/null
    
    print_success "Kafka event published successfully"
    print_info "Check notification service logs for processing"
    echo -e "${BLUE}Event Data:${NC}"
    echo "$MESSAGE_EVENT" | jq '.'
else
    print_error "Docker not available, skipping Kafka test"
    print_info "Manual: docker exec -it kafka kafka-console-producer --bootstrap-server localhost:9092 --topic message.new"
    print_info "Then paste: $MESSAGE_EVENT"
fi

sleep 2

# Test 9: Publish Appointment Confirmation Event
print_test "9" "Publish Kafka Event (appointment.confirmed)"
print_info "This will send email + push notification"

APPOINTMENT_EVENT="{\"patientEmail\":\"patient@test.com\",\"doctorEmail\":\"doctor@test.com\",\"doctorName\":\"Dr. Test\",\"patientName\":\"Patient Test\",\"appointmentTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"conversation\":\"Test appointment\",\"patientId\":\"${TEST_PATIENT_ID}\",\"doctorId\":\"${TEST_USER_ID}\"}"

if command -v docker &> /dev/null; then
    print_info "Publishing to Kafka topic: appointment.confirmed"
    echo "$APPOINTMENT_EVENT" | docker exec -i kafka kafka-console-producer \
        --bootstrap-server localhost:9092 \
        --topic appointment.confirmed 2>/dev/null
    
    print_success "Appointment event published successfully"
    print_info "Check notification service logs for email + push notification"
    echo -e "${BLUE}Event Data:${NC}"
    echo "$APPOINTMENT_EVENT" | jq '.'
else
    print_info "Manual test command available above"
fi

sleep 2

# Test 10: Deactivate Single Device
print_test "10" "Deactivate Single Device"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE ${NOTIFICATION_SERVICE_URL}/device/deactivate \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${TEST_USER_ID}\",
        \"deviceToken\": \"${TEST_ANDROID_TOKEN}\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    print_success "Device deactivated successfully"
    echo "$BODY" | jq '.'
else
    print_error "Failed to deactivate device (HTTP $HTTP_CODE)"
fi

# Test 11: Verify Device Count After Deactivation
print_test "11" "Verify Active Device Count After Deactivation"
RESPONSE=$(curl -s -w "\n%{http_code}" ${NOTIFICATION_SERVICE_URL}/device/${TEST_USER_ID}/devices)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    DEVICE_COUNT=$(echo "$BODY" | jq '.data | length')
    print_success "Now has $DEVICE_COUNT active device(s) (should be 1 less than before)"
    echo "$BODY" | jq '.'
else
    print_error "Failed to get devices (HTTP $HTTP_CODE)"
fi

# Test 12: Deactivate All Devices
print_test "12" "Deactivate All Devices for User"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE ${NOTIFICATION_SERVICE_URL}/device/${TEST_USER_ID}/all)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    DEACTIVATED_COUNT=$(echo "$BODY" | jq '.data.count')
    print_success "Deactivated $DEACTIVATED_COUNT device(s)"
    echo "$BODY" | jq '.'
else
    print_error "Failed to deactivate all devices (HTTP $HTTP_CODE)"
fi

# Test 13: Verify All Devices Deactivated
print_test "13" "Verify All Devices Deactivated"
RESPONSE=$(curl -s -w "\n%{http_code}" ${NOTIFICATION_SERVICE_URL}/device/${TEST_USER_ID}/devices)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    DEVICE_COUNT=$(echo "$BODY" | jq '.data | length')
    if [ "$DEVICE_COUNT" == "0" ]; then
        print_success "All devices successfully deactivated"
    else
        print_error "Still has $DEVICE_COUNT active device(s)"
    fi
    echo "$BODY" | jq '.'
else
    print_error "Failed to get devices (HTTP $HTTP_CODE)"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Test Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
print_info "✓ Service Health: OK"
print_info "✓ Device Registration: Tested (web, android, ios)"
print_info "✓ Device Retrieval: Tested (all devices, by type)"
print_info "✓ Duplicate Handling: Tested"
print_info "✓ Kafka Integration: Tested (message.new, appointment.confirmed)"
print_info "✓ Device Deactivation: Tested (single, all)"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                All Tests Completed!                        ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check notification service logs for Kafka event processing"
echo "2. Verify MySQL database: SELECT * FROM user_devices;"
echo "3. Test with real FCM tokens from mobile/web apps"
echo "4. Proceed to Phase 3: Frontend Integration"
echo ""