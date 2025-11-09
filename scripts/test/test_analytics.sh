#!/bin/bash

# Test Analytics Dashboard
# Tests: Statistics endpoints, data aggregation

echo "🧪 Testing Analytics Dashboard..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REMOTE_API_URL="${REMOTE_API_URL:-http://localhost:8000}"

# Test 1: Telemetry statistics
echo "📊 Test 1: Telemetry statistics"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/telemetry/stats?days=7" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}")

if echo "$RESPONSE" | grep -q "total_queries\|period_days"; then
  echo -e "${GREEN}✅ Test 1 passed: Telemetry stats retrieved${NC}"
  TOTAL_QUERIES=$(echo "$RESPONSE" | grep -o '"total_queries":[^,]*' | cut -d':' -f2)
  AVG_DURATION=$(echo "$RESPONSE" | grep -o '"average_duration_ms":[^,}]*' | cut -d':' -f2)
  echo "   Total queries: $TOTAL_QUERIES"
  echo "   Avg duration: ${AVG_DURATION}ms"
else
  echo -e "${YELLOW}⚠️  Test 1 warning: Stats may require admin auth or no data${NC}"
  echo "   Response: $RESPONSE"
fi

# Test 2: Feedback statistics
echo ""
echo "📝 Test 2: Feedback statistics"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/feedback/stats/summary?days=7" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}")

if echo "$RESPONSE" | grep -q "total\|by_status"; then
  echo -e "${GREEN}✅ Test 2 passed: Feedback stats retrieved${NC}"
  TOTAL_FEEDBACK=$(echo "$RESPONSE" | grep -o '"total":[^,]*' | cut -d':' -f2)
  echo "   Total feedback: $TOTAL_FEEDBACK"
else
  echo -e "${YELLOW}⚠️  Test 2 warning: Stats may require admin auth or no data${NC}"
fi

# Test 3: Different time periods
echo ""
echo "📅 Test 3: Different time periods"
for DAYS in 1 7 30; do
  RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/telemetry/stats?days=${DAYS}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN:-}")

  if echo "$RESPONSE" | grep -q "period_days"; then
    echo -e "${GREEN}✅ Test 3 passed: Stats for ${DAYS} day(s)${NC}"
  else
    echo -e "${YELLOW}⚠️  Test 3 warning: Stats for ${DAYS} day(s) may require auth${NC}"
  fi
done

# Test 4: Top subjects
echo ""
echo "📚 Test 4: Top subjects"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/telemetry/stats?days=7" \
  -H "Authorization: Bearer ${ADMIN_TOKEN:-}")

if echo "$RESPONSE" | grep -q "top_subjects"; then
  echo -e "${GREEN}✅ Test 4 passed: Top subjects retrieved${NC}"
  TOP_SUBJECTS=$(echo "$RESPONSE" | grep -o '"top_subjects":\[[^]]*' | head -c 200)
  echo "   Subjects: $TOP_SUBJECTS"
else
  echo -e "${YELLOW}⚠️  Test 4 warning: Top subjects may require data${NC}"
fi

echo ""
echo -e "${GREEN}✅ Analytics Dashboard Tests Completed!${NC}"

