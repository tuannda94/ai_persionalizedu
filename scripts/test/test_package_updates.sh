#!/bin/bash
# Test Model Package Updates System

echo "🧪 Testing Model Package Updates System"
echo ""

# Test 1: Check package model
echo "Test 1: Check package model"
cd "$(dirname "$0")/../../remote-api"

if [ -f "app/models/package.py" ]; then
    echo "✅ package.py model exists"
else
    echo "❌ package.py model NOT found"
    exit 1
fi

# Test 2: Check package API
echo ""
echo "Test 2: Check package API"
if [ -f "app/api/v1/packages.py" ]; then
    echo "✅ packages.py API exists"
else
    echo "❌ packages.py API NOT found"
    exit 1
fi

# Test 3: Check package service in local backend
echo ""
echo "Test 3: Check package service (local backend)"
cd "../student-app/local-backend"

if [ -f "app/services/package_service.py" ]; then
    echo "✅ package_service.py exists"
else
    echo "❌ package_service.py NOT found"
    exit 1
fi

# Test 4: Check package API in local backend
echo ""
echo "Test 4: Check package API (local backend)"
if [ -f "app/api/v1/packages.py" ]; then
    echo "✅ packages.py API exists in local backend"
else
    echo "❌ packages.py API NOT found in local backend"
    exit 1
fi

# Test 5: Check Admin Dashboard Packages page
echo ""
echo "Test 5: Check Admin Dashboard Packages page"
cd "../../admin-dashboard"

if [ -f "src/pages/Packages.jsx" ]; then
    echo "✅ Packages.jsx exists"
else
    echo "❌ Packages.jsx NOT found"
    exit 1
fi

echo ""
echo "✅ All package update tests passed!"

