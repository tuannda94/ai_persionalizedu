#!/bin/bash

# Test Feedback Mechanism
# Tests: API endpoints, auto-feedback, admin dashboard

echo "🧪 Testing Feedback Mechanism..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REMOTE_API_URL="${REMOTE_API_URL:-http://localhost:8000}"
LOCAL_BACKEND_URL="${LOCAL_BACKEND_URL:-http://localhost:8000}"

# Test 1: Create feedback (manual)
echo "📝 Test 1: Create manual feedback"
RESPONSE=$(curl -s -X POST "${REMOTE_API_URL}/api/v1/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "category": "ui",
    "title": "Test Feedback",
    "message": "This is a test feedback message",
    "priority": 3
  }')

if echo "$RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✅ Test 1 passed: Feedback created${NC}"
  FEEDBACK_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "   Feedback ID: $FEEDBACK_ID"
else
  echo -e "${RED}❌ Test 1 failed: Failed to create feedback${NC}"
  echo "   Response: $RESPONSE"
  exit 1
fi

# Test 2: List feedbacks
echo ""
echo "📋 Test 2: List feedbacks"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/feedback?page=1&page_size=10" \
  -H "Authorization: Bearer ${AUTH_TOKEN:-}")

if echo "$RESPONSE" | grep -q "items"; then
  echo -e "${GREEN}✅ Test 2 passed: Feedbacks listed${NC}"
else
  echo -e "${RED}❌ Test 2 failed: Failed to list feedbacks${NC}"
  echo "   Response: $RESPONSE"
  exit 1
fi

# Test 3: Get feedback stats
echo ""
echo "📊 Test 3: Get feedback statistics"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/feedback/stats/summary?days=7" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}")

if echo "$RESPONSE" | grep -q "total"; then
  echo -e "${GREEN}✅ Test 3 passed: Statistics retrieved${NC}"
  echo "   Stats: $RESPONSE"
else
  echo -e "${YELLOW}⚠️  Test 3 warning: Stats endpoint may require auth${NC}"
fi

# Test 4: Auto-feedback from local backend
echo ""
echo "🤖 Test 4: Auto-feedback (error simulation)"
RESPONSE=$(curl -s -X POST "${LOCAL_BACKEND_URL}/api/v1/feedback/send" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "category": "chat",
    "title": "Test Error",
    "message": "Simulated error for testing",
    "priority": 1
  }')

if echo "$RESPONSE" | grep -q "ok"; then
  echo -e "${GREEN}✅ Test 4 passed: Auto-feedback sent${NC}"
else
  echo -e "${YELLOW}⚠️  Test 4 warning: Auto-feedback may require REMOTE_API_URL configured${NC}"
fi

# Test 5: Update feedback status (admin)
if [ -n "$FEEDBACK_ID" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "✏️  Test 5: Update feedback status (admin)"
  RESPONSE=$(curl -s -X PUT "${REMOTE_API_URL}/api/v1/feedback/${FEEDBACK_ID}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -d '{
      "status": "reviewing",
      "admin_notes": "Test admin note"
    }')

  if echo "$RESPONSE" | grep -q "status"; then
    echo -e "${GREEN}✅ Test 5 passed: Feedback updated${NC}"
  else
    echo -e "${YELLOW}⚠️  Test 5 warning: Update may require admin auth${NC}"
  fi
fi

echo ""
echo -e "${GREEN}✅ Feedback Mechanism Tests Completed!${NC}"

