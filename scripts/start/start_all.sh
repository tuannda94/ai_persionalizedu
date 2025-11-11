#!/bin/bash
# Start All Services - Student App (Electron) + Admin Dashboard + Remote API

set -e

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Starting All Services..."
echo "   Project Root: $PROJECT_ROOT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."

    # Kill background processes
    if [ ! -z "$REMOTE_API_PID" ]; then
        echo "   Stopping Remote API (PID: $REMOTE_API_PID)..."
        kill $REMOTE_API_PID 2>/dev/null || true
    fi

    if [ ! -z "$ADMIN_DASHBOARD_PID" ]; then
        echo "   Stopping Admin Dashboard (PID: $ADMIN_DASHBOARD_PID)..."
        kill $ADMIN_DASHBOARD_PID 2>/dev/null || true
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        echo "   Stopping Local Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$STUDENT_APP_PID" ]; then
        echo "   Stopping Electron (PID: $STUDENT_APP_PID)..."
        kill $STUDENT_APP_PID 2>/dev/null || true
    fi

    # Kill by port
    lsof -ti :8001 | xargs kill -9 2>/dev/null || true
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true

    # Kill Electron processes (more aggressive)
    pkill -9 -f "electron" 2>/dev/null || true
    pkill -9 -f "Electron" 2>/dev/null || true
    # Kill any Electron processes from our app specifically
    pkill -9 -f "poly-ai-demo" 2>/dev/null || true

    echo "   ✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# 1. Start Remote API (required for Admin Dashboard)
echo "🌐 Step 1: Starting Remote API..."
echo "----------------------------"
if [ -d "$PROJECT_ROOT/remote-api" ]; then
    cd "$PROJECT_ROOT/remote-api"

    # Start in background
    bash "$SCRIPT_DIR/start_remote_api.sh" > /tmp/remote-api.log 2>&1 &
    REMOTE_API_PID=$!
    echo "   ✅ Remote API started (PID: $REMOTE_API_PID)"
    echo "   📄 Logs: /tmp/remote-api.log"

    # Wait for API to be ready
    echo "   ⏳ Waiting for Remote API to be ready..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:8001/health > /dev/null 2>&1; then
            echo "   ✅ Remote API is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "   ⚠️  Remote API may not be ready after 30 seconds"
        fi
        sleep 1
    done
else
    echo "   ⚠️  Remote API not found, skipping..."
fi
echo ""

# 2. Start Admin Dashboard
echo "📊 Step 2: Starting Admin Dashboard..."
echo "----------------------------"
if [ -d "$PROJECT_ROOT/admin-dashboard" ]; then
    cd "$PROJECT_ROOT/admin-dashboard"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi

    # Start in background
    echo "   🚀 Starting development server..."
    # Admin dashboard uses 'npm run dev' (Vite)
    npm run dev > /tmp/admin-dashboard.log 2>&1 &
    ADMIN_DASHBOARD_PID=$!
    echo "   ✅ Admin Dashboard started (PID: $ADMIN_DASHBOARD_PID)"
    echo "   📄 Logs: /tmp/admin-dashboard.log"
    # Check vite.config.js for port (default is 5173 for Vite, but config may override)
    # Use sed for macOS compatibility (grep -P not available on macOS)
    VITE_PORT=$(grep 'port:' vite.config.js 2>/dev/null | sed -E 's/.*port:[[:space:]]*([0-9]+).*/\1/' || echo "5173")
    echo "   🌐 URL: http://localhost:${VITE_PORT} (will open automatically)"

    # Wait for dashboard to be ready
    echo "   ⏳ Waiting for Admin Dashboard to be ready..."
    VITE_PORT=$(grep 'port:' vite.config.js 2>/dev/null | sed -E 's/.*port:[[:space:]]*([0-9]+).*/\1/' || echo "5173")
    for i in $(seq 1 60); do
        if curl -s http://localhost:${VITE_PORT} > /dev/null 2>&1; then
            echo "   ✅ Admin Dashboard is ready!"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "   ⚠️  Admin Dashboard may not be ready after 60 seconds"
        fi
        sleep 1
    done
else
    echo "   ⚠️  Admin Dashboard not found, skipping..."
fi
echo ""

# 3. Start Student App (Electron)
echo "🎓 Step 3: Starting Student App (Electron)..."
echo "----------------------------"
if [ -d "$PROJECT_ROOT/student-app" ]; then
    cd "$PROJECT_ROOT"

    # Start Student App (this will start backend + Electron)
    # Note: Electron needs GUI access, so we'll start it in a way that allows window display
    echo "   🚀 Starting Student App..."
    echo "   📱 Electron app window will open automatically"

    # Start backend first (in background)
    echo "   📡 Starting local backend..."
    cd "$PROJECT_ROOT/student-app/local-backend"

    # Create virtual environment if not exists
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi

    # Activate and start backend
    source .venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt 2>/dev/null || true

    # Kill existing backend on port 8000
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true

    # Start backend in background
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/local-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   ✅ Backend started (PID: $BACKEND_PID)"

    # Wait for backend to be ready
    echo "   ⏳ Waiting for backend to be ready..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "   ✅ Backend is ready!"
            break
        fi
        sleep 1
    done

    # Now start Electron (in a way that allows GUI)
    cd "$PROJECT_ROOT/student-app/desktop"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing npm dependencies..."
        npm install
    fi

    # Build renderer if needed
    if [ ! -f "renderer/dist/renderer.bundle.js" ]; then
        echo "   🔨 Building renderer..."
        npm run build:dev 2>/dev/null || npm run build:renderer 2>/dev/null || true
    fi

    # Start Electron - needs GUI access
    echo "   🚀 Starting Electron..."
    cd "$PROJECT_ROOT/student-app/desktop"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: Electron needs GUI access
        # The best way is to run it in a new Terminal window or use osascript
        echo "   📱 Launching Electron app in new Terminal window..."

        # Create a launch script
        LAUNCH_SCRIPT="/tmp/launch_electron_$$.sh"
        cat > "$LAUNCH_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_ROOT/student-app/desktop"
echo "🚀 Starting Electron..."
npm start
EOF
        chmod +x "$LAUNCH_SCRIPT"

        # Use osascript to open in a new Terminal window
        # This ensures Electron has GUI access
        osascript << APPLESCRIPT
tell application "Terminal"
    activate
    do script "bash '$LAUNCH_SCRIPT'"
end tell
APPLESCRIPT

        echo "   ✅ Electron launching in new Terminal window"
        echo "   📱 Electron window will open automatically"
        echo "   💡 You can close the Terminal window after Electron starts"

        # Give it a moment
        sleep 3

        # Try to find the Electron process
        STUDENT_APP_PID=$(pgrep -f "electron.*main.js" | head -1)
        if [ -n "$STUDENT_APP_PID" ]; then
            echo "   ✅ Electron process found (PID: $STUDENT_APP_PID)"
        else
            echo "   ⚠️  Electron process not found yet, it may still be starting..."
        fi
    else
        # Linux: Use DISPLAY variable and run in background
        export DISPLAY=${DISPLAY:-:0}
        npm start > /tmp/electron.log 2>&1 &
        STUDENT_APP_PID=$!
        echo "   ✅ Electron started (PID: $STUDENT_APP_PID)"
    fi

    echo "   📄 Logs: /tmp/electron.log (if available)"
    echo "   📄 Backend logs: /tmp/local-backend.log"
else
    echo "   ⚠️  Student App not found, skipping..."
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📋 Running Services:"
echo "   🌐 Remote API:      http://localhost:8001"
# Get Vite port from config or use default
VITE_PORT=$(cd "$PROJECT_ROOT/admin-dashboard" && grep 'port:' vite.config.js 2>/dev/null | sed -E 's/.*port:[[:space:]]*([0-9]+).*/\1/' || echo "5173")
echo "   📊 Admin Dashboard: http://localhost:${VITE_PORT}"
echo "   🎓 Student App:     Running (Electron window)"
echo ""
echo "📄 Logs:"
echo "   Remote API:      /tmp/remote-api.log"
echo "   Admin Dashboard: /tmp/admin-dashboard.log"
echo "   Local Backend:   /tmp/local-backend.log"
echo "   Electron:        /tmp/electron.log"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait

