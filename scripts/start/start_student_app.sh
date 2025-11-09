#!/bin/bash
# Start Student App (Desktop + Local Backend)

set -e

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Starting Student App..."
echo "   Project Root: $PROJECT_ROOT"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found. Please install Python 3.8+"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: node not found. Please install Node.js 16+"
    exit 1
fi

# Start local backend
echo "📡 Step 1: Starting Local Backend..."
cd "$PROJECT_ROOT/student-app/local-backend"

# Create virtual environment if not exists
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/upgrade dependencies
echo "   Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if uvicorn is installed
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "   Installing uvicorn..."
    pip install -q uvicorn[standard]
fi

# Check and kill any existing backend processes
echo "   Checking for existing backend processes..."
# Method 1: Kill by port
PORT_IN_USE=$(lsof -ti :8000 2>/dev/null || echo "")
if [ -n "$PORT_IN_USE" ]; then
    echo "   ⚠️  Port 8000 is in use (PIDs: $PORT_IN_USE)"
    for pid in $PORT_IN_USE; do
        echo "      Killing PID: $pid"
        kill -9 $pid 2>/dev/null || true
    done
    sleep 1
fi

# Method 2: Kill all uvicorn processes (more aggressive)
UVICORN_PIDS=$(pgrep -f "uvicorn.*app.main" 2>/dev/null || echo "")
if [ -n "$UVICORN_PIDS" ]; then
    echo "   ⚠️  Found uvicorn processes (PIDs: $UVICORN_PIDS)"
    for pid in $UVICORN_PIDS; do
        echo "      Killing uvicorn PID: $pid"
        kill -9 $pid 2>/dev/null || true
    done
    sleep 1
fi

# Method 3: Kill by process name pattern (last resort)
pkill -9 -f "uvicorn.*app.main" 2>/dev/null || true
pkill -9 -f "python.*uvicorn.*app.main" 2>/dev/null || true

# Wait for processes to die
sleep 2

# Final verification
PORT_STILL_IN_USE=$(lsof -ti :8000 2>/dev/null || echo "")
if [ -n "$PORT_STILL_IN_USE" ]; then
    echo "   ⚠️  Port still in use after cleanup, force killing..."
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Final check
if lsof -i :8000 > /dev/null 2>&1; then
    echo "   ❌ ERROR: Port 8000 is still in use after cleanup!"
    echo "   Please manually kill processes: lsof -ti :8000 | xargs kill -9"
    exit 1
else
    echo "   ✅ Port 8000 is free and ready"
fi

# Start backend in background
echo "   Starting backend server..."
# Clear old log
> /tmp/local-backend.log

# Start uvicorn (ensure we're in the right directory with venv activated)
cd "$PROJECT_ROOT/student-app/local-backend"
source .venv/bin/activate
nohup uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 > /tmp/local-backend.log 2>&1 &
BACKEND_PID=$!

# Save PID for cleanup
echo $BACKEND_PID > /tmp/local-backend.pid

echo "   ✅ Local Backend started (PID: $BACKEND_PID)"
echo "   📍 URL: http://localhost:8000"
echo "   📄 Logs: /tmp/local-backend.log"
echo ""

# Wait a moment for process to start
sleep 3

# Verify process is actually running
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "   ❌ ERROR: Backend process died immediately!"
    echo "   📄 Check logs: /tmp/local-backend.log"
    if [ -f /tmp/local-backend.log ]; then
        echo "   Last 30 lines of log:"
        tail -30 /tmp/local-backend.log | sed 's/^/      /'
    fi
    echo ""
    echo "   💡 Debugging steps:"
    echo "      1. Check Python: python3 --version"
    echo "      2. Check venv: ls -la .venv/bin/python"
    echo "      3. Test import: cd student-app/local-backend && source .venv/bin/activate && python3 -c 'from app.main import app'"
    echo "      4. Manual start: uvicorn app.main:app --port 8000"
    exit 1
fi

echo "   ✅ Backend process is running (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "   Waiting for backend to be ready..."
MAX_WAIT=30
BACKEND_READY=false
for i in $(seq 1 $MAX_WAIT); do
    # Check if process is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   ❌ ERROR: Backend process died!"
        echo "   📄 Check logs: /tmp/local-backend.log"
        if [ -f /tmp/local-backend.log ]; then
            echo "   Last 20 lines of log:"
            tail -20 /tmp/local-backend.log | sed 's/^/      /'
        fi
        exit 1
    fi

    # Check health endpoint
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   ✅ Backend is ready!"
        BACKEND_READY=true
        break
    fi

    # Show progress every 5 seconds
    if [ $((i % 5)) -eq 0 ]; then
        echo "   ⏳ Still waiting... ($i/$MAX_WAIT seconds)"
        # Show last few lines of log
        if [ -f /tmp/local-backend.log ]; then
            echo "   Last log entries:"
            tail -3 /tmp/local-backend.log | sed 's/^/      /'
        fi
    fi

    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    echo "   ⚠️  Backend may not be ready after $MAX_WAIT seconds"
    echo "   📄 Check logs: /tmp/local-backend.log"
    if [ -f /tmp/local-backend.log ]; then
        echo "   Last 20 lines of log:"
        tail -20 /tmp/local-backend.log | sed 's/^/      /'
    fi
    echo "   ⚠️  Continuing anyway, but backend may not be fully ready..."
fi
echo ""

# Start desktop app
echo "🖥️  Step 2: Starting Desktop App..."
cd "$PROJECT_ROOT/student-app/desktop"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

# Build renderer if needed (using webpack from desktop directory)
if [ ! -f "renderer/dist/renderer.bundle.js" ]; then
    echo "   Building renderer..."
    cd "$PROJECT_ROOT/student-app/desktop"
    npm run build:renderer || {
        echo "   ⚠️  Renderer build failed, trying webpack directly..."
        cd renderer
        npx webpack --mode development
        cd ..
    }
fi

# Start Electron
echo "   Starting Electron app..."
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."

    # Kill by PID if available
    if [ ! -z "$BACKEND_PID" ]; then
        echo "   Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi

    # Also kill by saved PID file
    if [ -f /tmp/local-backend.pid ]; then
        SAVED_PID=$(cat /tmp/local-backend.pid 2>/dev/null)
        if [ -n "$SAVED_PID" ] && ps -p $SAVED_PID > /dev/null 2>&1; then
            echo "   Stopping backend from saved PID: $SAVED_PID..."
            kill -9 $SAVED_PID 2>/dev/null || true
        fi
        rm -f /tmp/local-backend.pid
    fi

    # Kill all uvicorn processes as last resort
    pkill -9 -f "uvicorn.*app.main" 2>/dev/null || true

    # Kill by port
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true

    echo "   ✅ Backend stopped"
    exit 0
}

trap cleanup EXIT INT TERM

# Start Electron (this will block until Electron exits)
echo "   Starting Electron..."
npm start

# If we get here, Electron has exited
echo ""
echo "ℹ️  Electron app has exited"
cleanup
