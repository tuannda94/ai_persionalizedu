#!/bin/bash
# Test Migration Script

echo "🧪 Testing Migration Script"
echo ""

cd "$(dirname "$0")/../../remote-api"

# Test 1: Check migration SQL file
echo "Test 1: Check migration SQL file"
if [ -f "migrations/create_model_packages_table.sql" ]; then
    echo "✅ create_model_packages_table.sql exists"
else
    echo "❌ create_model_packages_table.sql NOT found"
    exit 1
fi

# Test 2: Check migration Python script
echo ""
echo "Test 2: Check migration Python script"
if [ -f "migrations/run_migration.py" ]; then
    echo "✅ run_migration.py exists"
else
    echo "❌ run_migration.py NOT found"
    exit 1
fi

# Test 3: Check if package model is imported in database.py
echo ""
echo "Test 3: Check database.py imports package model"
if grep -q "package" app/database.py; then
    echo "✅ package model import found in database.py"
else
    echo "❌ package model import NOT found in database.py"
    exit 1
fi

# Test 4: Check SQL syntax (basic check)
echo ""
echo "Test 4: Check SQL syntax"
if grep -q "CREATE TABLE.*model_packages" migrations/create_model_packages_table.sql; then
    echo "✅ CREATE TABLE statement found"
else
    echo "❌ CREATE TABLE statement NOT found"
    exit 1
fi

echo ""
echo "✅ All migration tests passed!"
echo ""
echo "📝 To run migration:"
echo "   cd remote-api"
echo "   # Make sure .env has DATABASE_URL and JWT_SECRET_KEY"
echo "   python migrations/run_migration.py"

