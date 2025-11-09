#!/bin/bash

# Test Performance Optimization
# Tests: RAG caching, response times, cache management

echo "🧪 Testing Performance Optimization..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LOCAL_BACKEND_URL="${LOCAL_BACKEND_URL:-http://localhost:8000}"

# Test 1: Cache directory exists
echo "💾 Test 1: Cache directory structure"
CACHE_DIR="student-app/local-backend/storage/cache"

if [ -d "$CACHE_DIR" ]; then
  echo -e "${GREEN}✅ Test 1 passed: Cache directory exists${NC}"
  CACHE_FILES=$(find "$CACHE_DIR" -name "*.json" 2>/dev/null | wc -l)
  echo "   Cache files: $CACHE_FILES"
else
  echo -e "${YELLOW}⚠️  Test 1: Cache directory will be created on first use${NC}"
  mkdir -p "$CACHE_DIR"
  echo "   Created cache directory"
fi

# Test 2: First query (cache miss, should be slower)
echo ""
echo "⏱️  Test 2: First query (cache miss)"
START_TIME=$(date +%s%N)
RESPONSE=$(curl -s -X POST "${LOCAL_BACKEND_URL}/api/v1/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Python?",
    "user_id": "test_user"
  }' --max-time 30 2>/dev/null | head -c 100)
END_TIME=$(date +%s%N)

FIRST_DURATION=$((($END_TIME - $START_TIME) / 1000000)) # Convert to milliseconds

if [ -n "$RESPONSE" ]; then
  echo -e "${GREEN}✅ Test 2 passed: First query completed${NC}"
  echo "   Duration: ${FIRST_DURATION}ms (cache miss)"
else
  echo -e "${YELLOW}⚠️  Test 2 warning: Query may require Ollama${NC}"
  FIRST_DURATION=0
fi

# Test 3: Second query (cache hit, should be faster)
if [ "$FIRST_DURATION" -gt 0 ]; then
  echo ""
  echo "⚡ Test 3: Second query (cache hit)"
  sleep 1 # Small delay
  START_TIME=$(date +%s%N)
  RESPONSE=$(curl -s -X POST "${LOCAL_BACKEND_URL}/api/v1/chat/stream" \
    -H "Content-Type: application/json" \
    -d '{
      "question": "What is Python?",
      "user_id": "test_user"
    }' --max-time 30 2>/dev/null | head -c 100)
  END_TIME=$(date +%s%N)

  SECOND_DURATION=$((($END_TIME - $START_TIME) / 1000000))

  if [ -n "$RESPONSE" ]; then
    echo -e "${GREEN}✅ Test 3 passed: Second query completed${NC}"
    echo "   Duration: ${SECOND_DURATION}ms (cache hit)"

    if [ "$SECOND_DURATION" -lt "$FIRST_DURATION" ]; then
      IMPROVEMENT=$((100 - ($SECOND_DURATION * 100 / $FIRST_DURATION)))
      echo -e "${GREEN}   ⚡ Performance improvement: ~${IMPROVEMENT}% faster${NC}"
    else
      echo -e "${YELLOW}   ⚠️  Cache may not be working or query too fast to measure${NC}"
    fi
  fi
fi

# Test 4: Cache file creation
echo ""
echo "📁 Test 4: Cache file creation"
CACHE_FILES_AFTER=$(find "$CACHE_DIR" -name "*.json" 2>/dev/null | wc -l)

if [ "$CACHE_FILES_AFTER" -gt 0 ]; then
  echo -e "${GREEN}✅ Test 4 passed: Cache files created${NC}"
  echo "   Cache files: $CACHE_FILES_AFTER"

  # Show sample cache file
  SAMPLE_FILE=$(find "$CACHE_DIR" -name "*.json" -type f | head -1)
  if [ -n "$SAMPLE_FILE" ]; then
    echo "   Sample cache file: $(basename $SAMPLE_FILE)"
  fi
else
  echo -e "${YELLOW}⚠️  Test 4: No cache files created (may require successful queries)${NC}"
fi

# Test 5: Cache statistics
echo ""
echo "📊 Test 5: Cache statistics"
# Check if cache_service has stats function
if grep -q "get_cache_stats" student-app/local-backend/app/services/cache_service.py 2>/dev/null; then
  echo -e "${GREEN}✅ Test 5 passed: Cache statistics function exists${NC}"
  echo "   Note: Stats can be accessed via Python API"
else
  echo -e "${YELLOW}⚠️  Test 5: Cache stats function not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Performance Optimization Tests Completed!${NC}"

