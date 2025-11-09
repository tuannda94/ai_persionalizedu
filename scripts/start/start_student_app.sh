#!/bin/bash
# Start Student App (Desktop + Local Backend)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Start local backend
echo "🚀 Starting Local Backend..."
cd "$PROJECT_ROOT/student-app/local-backend"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

# Start backend in background
uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 &
BACKEND_PID=$!

echo "✅ Local Backend started (PID: $BACKEND_PID)"
echo "   URL: http://localhost:8000"

# Wait a bit for backend to start
sleep 2

# Start desktop app
echo "🚀 Starting Desktop App..."
cd "$PROJECT_ROOT/student-app/desktop"

if [ ! -d "node_modules" ]; then
    npm install
fi

# Build renderer if needed
if [ ! -f "renderer/dist/renderer.bundle.js" ]; then
    cd renderer
    npm run build
    cd ..
fi

# Start Electron
npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

