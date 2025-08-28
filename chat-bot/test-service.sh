#!/bin/bash

# Test script for Chatbot Service

echo "Testing Chatbot Service..."

# Test 1: Health endpoint
echo "Test 1: Health endpoint"
curl -X GET http://localhost:3001/health
echo -e "\n"

# Test 2: Chat endpoint with valid data
echo "Test 2: Chat endpoint with valid data"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "userId": "test_user_001",
    "language": "en"
  }'
echo -e "\n"

# Test 3: Chat endpoint with missing required field
echo "Test 3: Chat endpoint with missing required field"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello"
  }'
echo -e "\n"

# Test 4: Chat endpoint with empty message
echo "Test 4: Chat endpoint with empty message"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "userId": "test_user_001"
  }'
echo -e "\n"

echo "Testing completed."