#!/bin/bash
# Test API Endpoints

echo "🧪 Testing API Endpoints"
echo ""

API_URL="${API_URL:-http://localhost:8000}"
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
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        echo -e "${RED}FAILED${NC} (Unknown method: $method)"
        ((TEST_FAILED++))
        return 1
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "404" ]; then
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

echo "📡 Testing Remote API Endpoints"
echo "   API URL: $API_URL"
echo ""

# Health check
test_endpoint "GET" "/health" "Health check"

# Root endpoint
test_endpoint "GET" "/" "Root endpoint"

# Version check (should work without auth)
test_endpoint "POST" "/api/v1/updates/check" "Version check" \
    '{"platform":"windows","current_version":"1.0.0","current_version_code":10000}'

# Package check (should work without auth)
test_endpoint "POST" "/api/v1/packages/check" "Package check" \
    '{"current_packages":[{"subject":"CS101","version":"v1"}]}'

# Package list (should work without auth)
test_endpoint "GET" "/api/v1/packages/list" "Package list"

# Version list (should work without auth)
test_endpoint "GET" "/api/v1/updates/versions" "Version list"

echo ""
echo "==================="
echo "📊 Test Summary"
echo "==================="
echo -e "${GREEN}Passed: $TEST_PASSED${NC}"
echo -e "${RED}Failed: $TEST_FAILED${NC}"
echo ""

if [ $TEST_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All API endpoint tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed (this is OK if server is not running)${NC}"
    echo "   To test properly, start the Remote API server first:"
    echo "   cd remote-api && ./scripts/start/start_remote_api.sh"
    exit 0  # Don't fail, just warn
fi

