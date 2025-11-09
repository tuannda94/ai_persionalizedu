#!/bin/bash
# Verify Entire System

echo "🔍 Verifying Entire System"
echo "=========================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

run_test() {
    local test_name=$1
    local test_script=$2

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $test_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if bash "$test_script" 2>&1; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        ((FAILED_TESTS++))
    fi

    ((TOTAL_TESTS++))
    echo ""
}

# 1. Structure Tests
echo -e "${YELLOW}📁 Phase 1: Structure Verification${NC}"
echo ""

# Check main directories
echo "Checking project structure..."
if [ -d "$PROJECT_ROOT/student-app" ] && \
   [ -d "$PROJECT_ROOT/remote-api" ] && \
   [ -d "$PROJECT_ROOT/admin-dashboard" ] && \
   [ -d "$PROJECT_ROOT/data-pipeline" ] && \
   [ -d "$PROJECT_ROOT/storage" ] && \
   [ -d "$PROJECT_ROOT/scripts" ] && \
   [ -d "$PROJECT_ROOT/docs" ]; then
    echo -e "${GREEN}✅ Project structure: OK${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Project structure: MISSING DIRECTORIES${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

# 2. Code Tests
echo -e "${YELLOW}💻 Phase 2: Code Verification${NC}"
echo ""

run_test "Auto-Update System" "$SCRIPT_DIR/test_auto_update.sh"
run_test "File Hosting System" "$SCRIPT_DIR/test_file_hosting.sh"
run_test "Package Updates System" "$SCRIPT_DIR/test_package_updates.sh"
run_test "Migration Scripts" "$SCRIPT_DIR/test_migration.sh"

# 3. API Tests (if servers are running)
echo -e "${YELLOW}🌐 Phase 3: API Verification${NC}"
echo ""

# Check if Remote API is running
if curl -s "http://localhost:8000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Remote API is running${NC}"
    run_test "Remote API Endpoints" "$SCRIPT_DIR/test_api_endpoints.sh"
else
    echo -e "${YELLOW}⚠️  Remote API is not running (skipping API tests)${NC}"
    echo "   Start with: cd remote-api && ./scripts/start/start_remote_api.sh"
fi
echo ""

# Check if Local Backend is running
if curl -s "http://localhost:8000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Local Backend is running${NC}"
    run_test "Local Backend Endpoints" "$SCRIPT_DIR/test_local_backend.sh"
else
    echo -e "${YELLOW}⚠️  Local Backend is not running (skipping backend tests)${NC}"
    echo "   Start with: cd student-app/local-backend && uvicorn app.main:app --reload --port 8000"
fi
echo ""

# 4. Documentation Tests
echo -e "${YELLOW}📚 Phase 4: Documentation Verification${NC}"
echo ""

docs_ok=true
required_docs=(
    "docs/README.md"
    "docs/QUICK_START.md"
    "docs/FINAL_STRUCTURE.md"
    "docs/PROJECT_STATUS.md"
    "docs/architecture.md"
    "docs/IMPLEMENTATION_REQUIRED.md"
)

for doc in "${required_docs[@]}"; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $doc MISSING${NC}"
        docs_ok=false
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
done
echo ""

# Final Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 FINAL VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All verifications passed!${NC}"
    echo ""
    echo "✅ System is ready for:"
    echo "   - Development"
    echo "   - Testing"
    echo "   - Deployment"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some verifications failed${NC}"
    echo ""
    echo "Please review the failed tests above."
    exit 1
fi

