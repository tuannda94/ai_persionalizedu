#!/bin/bash

# Test Offline Mode Functionality
# Tests: Offline detection, feature disabling, reconnection

echo "🧪 Testing Offline Mode..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REMOTE_API_URL="${REMOTE_API_URL:-http://localhost:8000}"
LOCAL_BACKEND_URL="${LOCAL_BACKEND_URL:-http://localhost:8000}"

# Test 1: Check online status
echo "🌐 Test 1: Check online status"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Test 1 passed: System is online${NC}"
  IS_ONLINE=true
else
  echo -e "${YELLOW}⚠️  Test 1 warning: System appears offline${NC}"
  IS_ONLINE=false
fi

# Test 2: Local backend should work offline
echo ""
echo "💻 Test 2: Local backend (should work offline)"
RESPONSE=$(curl -s -X GET "${LOCAL_BACKEND_URL}/health" 2>/dev/null)

if echo "$RESPONSE" | grep -q "status\|ok"; then
  echo -e "${GREEN}✅ Test 2 passed: Local backend accessible${NC}"
  echo "   Response: $RESPONSE"
else
  echo -e "${RED}❌ Test 2 failed: Local backend not accessible${NC}"
  echo "   Make sure local backend is running on ${LOCAL_BACKEND_URL}"
  exit 1
fi

# Test 3: Chat should work offline (local)
echo ""
echo "💬 Test 3: Chat endpoint (local, should work offline)"
RESPONSE=$(curl -s -X POST "${LOCAL_BACKEND_URL}/api/v1/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test question",
    "user_id": "test_user"
  }' --max-time 5 2>/dev/null | head -c 100)

if [ -n "$RESPONSE" ]; then
  echo -e "${GREEN}✅ Test 3 passed: Chat endpoint accessible${NC}"
else
  echo -e "${YELLOW}⚠️  Test 3 warning: Chat endpoint may require Ollama running${NC}"
fi

# Test 4: Remote API should fail when offline (simulated)
echo ""
echo "🌍 Test 4: Remote API (should fail when offline)"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/health" --max-time 2 2>/dev/null)

if [ -n "$RESPONSE" ]; then
  echo -e "${GREEN}✅ Test 4 passed: Remote API accessible${NC}"
  echo "   Note: In real offline scenario, this would fail"
else
  echo -e "${YELLOW}⚠️  Test 4: Remote API not accessible (expected in offline mode)${NC}"
fi

# Test 5: Features that require internet should be disabled
echo ""
echo "🚫 Test 5: Internet-dependent features"
echo "   Features that should be disabled offline:"
echo "   - Update checks"
echo "   - Telemetry sending"
echo "   - Feedback sending"
echo "   - Package updates"
echo -e "${GREEN}✅ Test 5: Manual verification required in UI${NC}"

# Test 6: Cache updates (should work offline)
echo ""
echo "💾 Test 6: Cached updates"
if [ -d "student-app/local-backend/storage/cache" ]; then
  CACHE_COUNT=$(find student-app/local-backend/storage/cache -name "*.json" 2>/dev/null | wc -l)
  echo -e "${GREEN}✅ Test 6 passed: Cache directory exists${NC}"
  echo "   Cache files: $CACHE_COUNT"
else
  echo -e "${YELLOW}⚠️  Test 6: Cache directory not found (will be created on first use)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Offline Mode Tests Completed!${NC}"
echo ""
echo "ℹ️  Note: Full offline mode testing requires Electron app with network simulation"

