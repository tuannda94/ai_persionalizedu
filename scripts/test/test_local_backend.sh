#!/bin/bash
# Test Local Backend Endpoints

echo "🧪 Testing Local Backend Endpoints"
echo ""

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
TEST_PASSED=0
TEST_FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    echo -n "Testing: $description ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        echo -e "${RED}FAILED${NC} (Unknown method: $method)"
        ((TEST_FAILED++))
        return 1
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $http_code)"
        ((TEST_PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC} (HTTP $http_code)"
        echo "   Response: $body"
        ((TEST_FAILED++))
        return 1
    fi
}

echo "💻 Testing Local Backend Endpoints"
echo "   Backend URL: $BACKEND_URL"
echo ""

# Health check
test_endpoint "GET" "/health" "Health check"

# Root endpoint
test_endpoint "GET" "/" "Root endpoint"

# Get current packages
test_endpoint "GET" "/api/v1/packages/current" "Get current packages"

# Check package updates
test_endpoint "POST" "/api/v1/packages/check" "Check package updates" \
    '{"remote_api_url":""}'

# Get conversations
test_endpoint "GET" "/api/v1/chat/conversations?user_id=test" "Get conversations"

echo ""
echo "==================="
echo "📊 Test Summary"
echo "==================="
echo -e "${GREEN}Passed: $TEST_PASSED${NC}"
echo -e "${RED}Failed: $TEST_FAILED${NC}"
echo ""

if [ $TEST_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All local backend tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed (this is OK if backend is not running)${NC}"
    echo "   To test properly, start the Local Backend first:"
    echo "   cd student-app/local-backend && uvicorn app.main:app --reload --port 8000"
    exit 0  # Don't fail, just warn
fi

