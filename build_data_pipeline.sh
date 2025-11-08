#!/bin/bash
# Script để build data pipeline (vector store)

cd data_pipeline

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

# Chạy script để build model packages
echo "🚀 Building model packages..."
python embed_and_build_package.py

echo ""
echo "✅ Hoàn thành! Model packages đã được tạo trong model_packages/"
echo "   Bây giờ bạn có thể start backend: ./start_backend.sh"

