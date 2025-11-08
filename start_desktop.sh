#!/bin/bash
# Script để start desktop app

cd desktop

# Cài đặt dependencies nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "Cài đặt Electron dependencies..."
    npm install
fi

if [ ! -d "renderer/node_modules" ]; then
    echo "Cài đặt React dependencies..."
    cd renderer
    npm install
    cd ..
fi

# Build renderer nếu chưa có
if [ ! -f "renderer/dist/renderer.bundle.js" ]; then
    echo "Building renderer..."
    cd renderer
    npm install 2>/dev/null || true
    npx webpack --mode production || webpack --mode production
    cd ..
fi

# Start app
echo "🚀 Starting desktop app..."
npm start

