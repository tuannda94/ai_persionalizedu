#!/bin/bash
# Script để start backend server

cd backend

# Kiểm tra virtual environment
if [ ! -d ".venv" ]; then
    echo "Tạo virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Cài đặt dependencies nếu chưa có
if [ ! -f ".venv/.deps_installed" ]; then
    echo "Cài đặt dependencies..."
    pip install -r requirements.txt
    touch .venv/.deps_installed
fi

# Load environment variables nếu có
if [ -f "example_env.sh" ]; then
    source example_env.sh
fi

# Start server
echo "🚀 Starting backend server tại http://localhost:8000"
python app.py

