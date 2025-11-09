#!/bin/bash

# Comprehensive Test Suite - All New Features
# Runs all tests for newly implemented features

echo "🧪 Running Comprehensive Test Suite - All Features..."
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to run test and track results
run_test() {
  local test_name=$1
  local test_script=$2

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Running: $test_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if bash "$test_script" 2>&1; then
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo -e "${GREEN}✅ $test_name: PASSED${NC}"
      ((PASSED++))
    elif [ $EXIT_CODE -eq 1 ]; then
      echo -e "${RED}❌ $test_name: FAILED${NC}"
      ((FAILED++))
    else
      echo -e "${YELLOW}⚠️  $test_name: WARNINGS${NC}"
      ((WARNINGS++))
    fi
  else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 1 ]; then
      echo -e "${RED}❌ $test_name: FAILED${NC}"
      ((FAILED++))
    else
      echo -e "${YELLOW}⚠️  $test_name: WARNINGS${NC}"
      ((WARNINGS++))
    fi
  fi
  echo ""
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if services are running
echo "🔍 Checking services..."
echo ""

# Check local backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Local backend is running${NC}"
else
  echo -e "${RED}❌ Local backend is not running${NC}"
  echo "   Start it with: ./scripts/start/start_student_app.sh"
  echo ""
fi

# Check remote API (optional)
REMOTE_API_URL="${REMOTE_API_URL:-http://localhost:8000}"
if curl -s "${REMOTE_API_URL}/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Remote API is accessible${NC}"
else
  echo -e "${YELLOW}⚠️  Remote API may not be running (some tests may fail)${NC}"
  echo "   Start it with: cd remote-api && ./scripts/start/start_remote_api.sh"
fi

echo ""
echo "=========================================="
echo ""

# Run all new feature tests
run_test "Feedback Mechanism" "$SCRIPT_DIR/test_feedback.sh"
run_test "Update Button" "$SCRIPT_DIR/test_update_button.sh"
run_test "Offline Mode" "$SCRIPT_DIR/test_offline_mode.sh"
run_test "Analytics Dashboard" "$SCRIPT_DIR/test_analytics.sh"
run_test "Error Handling" "$SCRIPT_DIR/test_error_handling.sh"
run_test "Performance Optimization" "$SCRIPT_DIR/test_performance.sh"

# Summary
echo "=========================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All critical tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi

