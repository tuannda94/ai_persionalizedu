#!/bin/bash
# Start Remote API Server

cd "$(dirname "$0")/../../remote-api"

# Activate virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Install dependencies if needed
if [ ! -f ".venv/bin/uvicorn" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Create .env with DATABASE_URL and JWT_SECRET_KEY"
fi

# Start server
echo "🚀 Starting Remote API Server..."
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

