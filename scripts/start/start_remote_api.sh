#!/bin/bash
# Start Remote API Server

set -e

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Starting Remote API Server..."
echo "   Project Root: $PROJECT_ROOT"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found. Please install Python 3.8+"
    exit 1
fi

# Navigate to remote-api directory
cd "$PROJECT_ROOT/remote-api"

# Check if directory exists
if [ ! -d "app" ]; then
    echo "❌ Error: remote-api directory not found or invalid"
    exit 1
fi

# Create virtual environment if not exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/upgrade dependencies
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if uvicorn is installed
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "   Installing uvicorn..."
    pip install -q uvicorn[standard]
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating sample .env file..."
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/poly_ai_db

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production

# Admin
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
    echo "   ✅ Sample .env created. Please update with your values!"
    echo "   ⚠️  You MUST set DATABASE_URL and JWT_SECRET_KEY before starting"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=postgresql://user:password" .env; then
    echo "⚠️  Warning: DATABASE_URL not configured in .env"
    echo "   Please set DATABASE_URL before starting"
    exit 1
fi

# Check if JWT_SECRET_KEY is set
if ! grep -q "JWT_SECRET_KEY=" .env || grep -q "JWT_SECRET_KEY=your-secret-key" .env; then
    echo "⚠️  Warning: JWT_SECRET_KEY not configured in .env"
    echo "   Please set JWT_SECRET_KEY before starting"
    exit 1
fi

# Start server
echo "🌐 Starting Remote API Server..."
echo "   📍 URL: http://0.0.0.0:8001"
echo "   📄 Docs: http://localhost:8001/docs"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

# Use port 8001 to avoid conflict with local backend (8000)
uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
