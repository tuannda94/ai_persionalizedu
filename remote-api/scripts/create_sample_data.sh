#!/bin/bash
# Script để tạo dữ liệu mẫu cho admin-dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REMOTE_API_DIR="$PROJECT_ROOT/remote-api"

echo "🚀 Creating sample data for admin-dashboard..."
echo ""

cd "$REMOTE_API_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ -f ".env" ]; then
        echo "📋 Loading environment from .env..."
        export $(grep -v '^#' .env | xargs)
    else
        echo "⚠️  Warning: .env file not found and DATABASE_URL not set"
        echo "   Please set DATABASE_URL before running this script"
        exit 1
    fi
fi

# Run the Python script
echo "🐍 Running sample data creation script..."
python3 scripts/create_sample_data.py

echo ""
echo "✅ Done!"

