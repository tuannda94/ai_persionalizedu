#!/bin/bash
# Test File Hosting System

echo "🧪 Testing File Hosting System"
echo ""

# Test 1: Check file_service.py
echo "Test 1: Check file_service.py"
cd "$(dirname "$0")/../../remote-api"

if [ -f "app/services/file_service.py" ]; then
    echo "✅ file_service.py exists"
else
    echo "❌ file_service.py NOT found"
    exit 1
fi

# Test 2: Check files.py endpoint
echo ""
echo "Test 2: Check files.py endpoint"
if [ -f "app/api/v1/files.py" ]; then
    echo "✅ files.py endpoint exists"
else
    echo "❌ files.py endpoint NOT found"
    exit 1
fi

# Test 3: Check upload endpoint in updates.py
echo ""
echo "Test 3: Check upload endpoint"
if grep -q "upload_version" app/api/v1/updates.py; then
    echo "✅ upload_version endpoint found"
else
    echo "❌ upload_version endpoint NOT found"
    exit 1
fi

# Test 4: Check config has STORAGE_ROOT
echo ""
echo "Test 4: Check config"
if grep -q "STORAGE_ROOT" app/config.py; then
    echo "✅ STORAGE_ROOT config found"
else
    echo "❌ STORAGE_ROOT config NOT found"
    exit 1
fi

echo ""
echo "✅ All file hosting tests passed!"

