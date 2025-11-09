#!/bin/bash

# Test Backend Connection
# Debug script để kiểm tra backend có chạy được không

echo "🔍 Testing Backend Connection..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check port 8000
echo "1️⃣  Checking port 8000..."
PORT_PIDS=$(lsof -ti :8000 2>/dev/null || echo "")
if [ -n "$PORT_PIDS" ]; then
    echo -e "${YELLOW}   ⚠️  Port 8000 is in use (PIDs: $PORT_PIDS)${NC}"
    echo "   Processes:"
    ps -p $PORT_PIDS -o pid,command 2>/dev/null || true
else
    echo -e "${GREEN}   ✅ Port 8000 is free${NC}"
fi
echo ""

# Check uvicorn processes
echo "2️⃣  Checking uvicorn processes..."
UVICORN_PIDS=$(pgrep -f "uvicorn.*app.main" 2>/dev/null || echo "")
if [ -n "$UVICORN_PIDS" ]; then
    echo -e "${YELLOW}   ⚠️  Found uvicorn processes (PIDs: $UVICORN_PIDS)${NC}"
    ps -p $UVICORN_PIDS -o pid,command 2>/dev/null || true
else
    echo -e "${GREEN}   ✅ No uvicorn processes found${NC}"
fi
echo ""

# Test backend health
echo "3️⃣  Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>&1)
if [ $? -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q "status"; then
    echo -e "${GREEN}   ✅ Backend is responding!${NC}"
    echo "   Response: $HEALTH_RESPONSE" | head -c 200
    echo ""
else
    echo -e "${RED}   ❌ Backend is not responding${NC}"
    echo "   Error: $HEALTH_RESPONSE"
fi
echo ""

# Check backend log
echo "4️⃣  Checking backend log..."
if [ -f /tmp/local-backend.log ]; then
    echo "   Last 10 lines of log:"
    tail -10 /tmp/local-backend.log | sed 's/^/      /'
else
    echo -e "${YELLOW}   ⚠️  No log file found${NC}"
fi
echo ""

# Summary
echo "📊 Summary:"
if [ -n "$PORT_PIDS" ] || [ -n "$UVICORN_PIDS" ]; then
    echo -e "${YELLOW}   ⚠️  There are processes that need to be killed${NC}"
    echo "   Run: pkill -9 -f 'uvicorn.*app.main'"
    echo "   Or: lsof -ti :8000 | xargs kill -9"
else
    if echo "$HEALTH_RESPONSE" | grep -q "status"; then
        echo -e "${GREEN}   ✅ Backend is running and healthy!${NC}"
    else
        echo -e "${RED}   ❌ Backend is not running or not responding${NC}"
    fi
fi

