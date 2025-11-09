#!/bin/bash
# Test Auto-Update System

echo "🧪 Testing Auto-Update System"
echo ""

# Test 1: Check if electron-updater is installed
echo "Test 1: Check electron-updater dependency"
cd "$(dirname "$0")/../../student-app/desktop"

if grep -q "electron-updater" package.json; then
    echo "✅ electron-updater found in package.json"
else
    echo "❌ electron-updater NOT found in package.json"
    exit 1
fi

# Test 2: Check if updater.js exists
echo ""
echo "Test 2: Check updater.js file"
if [ -f "src/main/updater.js" ]; then
    echo "✅ updater.js exists"
else
    echo "❌ updater.js NOT found"
    exit 1
fi

# Test 3: Check if main.js imports updater
echo ""
echo "Test 3: Check main.js integration"
if grep -q "initUpdater" src/main/main.js; then
    echo "✅ updater integrated in main.js"
else
    echo "❌ updater NOT integrated in main.js"
    exit 1
fi

# Test 4: Check electron-builder.yml config
echo ""
echo "Test 4: Check electron-builder.yml"
if grep -q "publish:" electron-builder.yml; then
    echo "✅ publish config found in electron-builder.yml"
else
    echo "❌ publish config NOT found"
    exit 1
fi

echo ""
echo "✅ All auto-update tests passed!"

