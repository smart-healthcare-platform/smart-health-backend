#!/bin/bash

echo "=== End-to-End Test ==="

# Start services
echo "Starting services with docker-compose..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 15

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | jq .

# Test chat endpoint
echo "Testing chat endpoint..."
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I have chest pain",
    "userId": "test_user_001",
    "language": "vi"
  }' | jq .

# Test history endpoint
echo "Testing history endpoint..."
curl -s http://localhost:3001/api/history/test_user_001 | jq .

echo "=== End-to-End Test Completed ==="

# Stop services
echo "Stopping services..."
docker-compose down