#!/bin/bash

# Test Update Button Functionality
# Tests: Update check, download, install flow

echo "🧪 Testing Update Button..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REMOTE_API_URL="${REMOTE_API_URL:-http://localhost:8000}"

# Detect platform
PLATFORM="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  PLATFORM="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  PLATFORM="windows"
fi

echo "📱 Platform: $PLATFORM"

# Test 1: Check for updates
echo ""
echo "🔍 Test 1: Check for updates"
RESPONSE=$(curl -s -X POST "${REMOTE_API_URL}/api/v1/updates/check" \
  -H "Content-Type: application/json" \
  -d "{
    \"platform\": \"$PLATFORM\",
    \"current_version\": \"1.0.0\",
    \"current_version_code\": 1
  }")

if echo "$RESPONSE" | grep -q "has_update"; then
  echo -e "${GREEN}✅ Test 1 passed: Update check successful${NC}"
  HAS_UPDATE=$(echo "$RESPONSE" | grep -o '"has_update":[^,]*' | cut -d':' -f2)
  echo "   Has update: $HAS_UPDATE"

  if echo "$RESPONSE" | grep -q '"has_update":true'; then
    LATEST_VERSION=$(echo "$RESPONSE" | grep -o '"latest_version":"[^"]*' | cut -d'"' -f4)
    DOWNLOAD_URL=$(echo "$RESPONSE" | grep -o '"download_url":"[^"]*' | cut -d'"' -f4)
    echo "   Latest version: $LATEST_VERSION"
    echo "   Download URL: $DOWNLOAD_URL"
  fi
else
  echo -e "${RED}❌ Test 1 failed: Update check failed${NC}"
  echo "   Response: $RESPONSE"
  exit 1
fi

# Test 2: List versions
echo ""
echo "📋 Test 2: List available versions"
RESPONSE=$(curl -s -X GET "${REMOTE_API_URL}/api/v1/updates/versions?platform=${PLATFORM}")

if echo "$RESPONSE" | grep -q "versions\|\[\]"; then
  echo -e "${GREEN}✅ Test 2 passed: Versions listed${NC}"
  VERSION_COUNT=$(echo "$RESPONSE" | grep -o '"version"' | wc -l)
  echo "   Found $VERSION_COUNT version(s)"
else
  echo -e "${YELLOW}⚠️  Test 2 warning: No versions found or API error${NC}"
fi

# Test 3: Download URL accessibility (if update available)
if echo "$RESPONSE" | grep -q '"has_update":true'; then
  echo ""
  echo "⬇️  Test 3: Check download URL"
  DOWNLOAD_URL=$(echo "$RESPONSE" | grep -o '"download_url":"[^"]*' | cut -d'"' -f4)

  if [ -n "$DOWNLOAD_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --head "$DOWNLOAD_URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
      echo -e "${GREEN}✅ Test 3 passed: Download URL accessible${NC}"
    else
      echo -e "${YELLOW}⚠️  Test 3 warning: Download URL returned HTTP $HTTP_CODE${NC}"
      echo "   URL: $DOWNLOAD_URL"
    fi
  else
    echo -e "${YELLOW}⚠️  Test 3 skipped: No download URL found${NC}"
  fi
fi

# Test 4: Update log endpoint
echo ""
echo "📝 Test 4: Update log endpoint"
RESPONSE=$(curl -s -X POST "${REMOTE_API_URL}/api/v1/updates/log" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_version\": \"1.0.0\",
    \"to_version\": \"1.1.0\",
    \"platform\": \"$PLATFORM\",
    \"status\": \"success\"
  }")

if echo "$RESPONSE" | grep -q "id\|ok"; then
  echo -e "${GREEN}✅ Test 4 passed: Update log created${NC}"
else
  echo -e "${YELLOW}⚠️  Test 4 warning: Update log may require auth${NC}"
fi

echo ""
echo -e "${GREEN}✅ Update Button Tests Completed!${NC}"
echo ""
echo "ℹ️  Note: Full update flow (download, install) requires Electron app running"

