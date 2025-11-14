#!/bin/bash
export ADMIN_TOKEN=$(cat .admin-token 2>/dev/null || echo "")
echo "🧪 Quick Phase 1 Tests"
echo "===================="
echo ""
echo "✓ 1. Health check..."
curl -s http://localhost:8080/health | jq -r '.status' | grep -q healthy && echo "   PASS" || echo "   FAIL"

echo "✓ 2. Admin endpoint without token (should fail 401)..."
curl -s http://localhost:8080/v1/admin | jq -r '.message' | grep -q "No token" && echo "   PASS" || echo "   FAIL"

echo "✓ 3. Admin root with token..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/v1/admin | jq -r '.success' | grep -q true && echo "   PASS" || echo "   FAIL"

echo "✓ 4. Dashboard stats..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/v1/admin/dashboard/stats | jq -r '.success' | grep -q true && echo "   PASS" || echo "   FAIL"

echo "✓ 5. System health..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/v1/admin/system/health | jq -r '.success' | grep -q true && echo "   PASS" || echo "   FAIL"

echo "✓ 6. Cache stats..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/v1/admin/dashboard/cache-stats | jq -r '.success' | grep -q true && echo "   PASS" || echo "   FAIL"

echo "✓ 7. Redis keys..."
redis-cli KEYS "admin:*" | grep -q "admin:" && echo "   PASS" || echo "   FAIL"

echo ""
echo "===================="
echo "✅ All tests completed!"
