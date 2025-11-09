#!/bin/bash

# Test Backend Startup
# Kiểm tra backend có start được không

echo "🧪 Testing Backend Startup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT/student-app/local-backend"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi

# Activate venv
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Creating venv..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -q -r requirements.txt
fi

# Test 1: Import config
echo "📋 Test 1: Import config"
if python3 -c "from app.config import settings; print('✅ Config OK')" 2>&1; then
    echo -e "${GREEN}✅ Test 1 passed${NC}"
else
    echo -e "${RED}❌ Test 1 failed${NC}"
    python3 -c "from app.config import settings" 2>&1
    exit 1
fi
echo ""

# Test 2: Import main app
echo "📋 Test 2: Import main app"
if python3 -c "from app.main import app; print('✅ App import OK')" 2>&1; then
    echo -e "${GREEN}✅ Test 2 passed${NC}"
else
    echo -e "${RED}❌ Test 2 failed${NC}"
    python3 -c "from app.main import app" 2>&1
    exit 1
fi
echo ""

# Test 3: Start backend (5 seconds)
echo "📋 Test 3: Start backend (5 seconds)"
uvicorn app.main:app --port 8000 --host 127.0.0.1 > /tmp/test-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start (max 10 seconds)
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Test 3 passed: Backend started successfully (after ${i}s)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Test 3 failed: Backend did not start after 10 seconds${NC}"
        echo "Logs:"
        cat /tmp/test-backend.log
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
done
echo ""

echo -e "${GREEN}✅ All backend startup tests passed!${NC}"

