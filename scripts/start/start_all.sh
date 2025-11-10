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

    # Kill by port
    lsof -ti :8001 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true

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
    echo "   🚀 Starting Student App..."
    bash "$SCRIPT_DIR/start_student_app.sh" &
    STUDENT_APP_PID=$!
    echo "   ✅ Student App started (PID: $STUDENT_APP_PID)"
    echo "   📱 Electron app will open automatically"
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
echo "   Student App:     /tmp/local-backend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait

