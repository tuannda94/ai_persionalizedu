#!/bin/bash
# Run all code structure tests

echo "🧪 Running All Structure Tests"
echo "==================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Test 1: Auto-Update
echo "📦 Test 1: Auto-Update System"
echo "----------------------------"
bash "$SCRIPT_DIR/test_auto_update.sh"
AUTO_UPDATE_RESULT=$?
echo ""

# Test 2: File Hosting
echo "📁 Test 2: File Hosting System"
echo "----------------------------"
bash "$SCRIPT_DIR/test_file_hosting.sh"
FILE_HOSTING_RESULT=$?
echo ""

# Test 3: Package Updates
echo "📦 Test 3: Model Package Updates"
echo "----------------------------"
bash "$SCRIPT_DIR/test_package_updates.sh"
PACKAGE_UPDATES_RESULT=$?
echo ""

# Test 4: Migration
echo "🗄️  Test 4: Migration Scripts"
echo "----------------------------"
bash "$SCRIPT_DIR/test_migration.sh"
MIGRATION_RESULT=$?
echo ""

# Summary
echo "==================="
echo "📊 Test Summary"
echo "==================="
echo ""

if [ $AUTO_UPDATE_RESULT -eq 0 ]; then
    echo "✅ Auto-Update System: PASSED"
else
    echo "❌ Auto-Update System: FAILED"
fi

if [ $FILE_HOSTING_RESULT -eq 0 ]; then
    echo "✅ File Hosting System: PASSED"
else
    echo "❌ File Hosting System: FAILED"
fi

if [ $PACKAGE_UPDATES_RESULT -eq 0 ]; then
    echo "✅ Package Updates System: PASSED"
else
    echo "❌ Package Updates System: FAILED"
fi

if [ $MIGRATION_RESULT -eq 0 ]; then
    echo "✅ Migration Scripts: PASSED"
else
    echo "❌ Migration Scripts: FAILED"
fi

echo ""

# Overall result
if [ $AUTO_UPDATE_RESULT -eq 0 ] && [ $FILE_HOSTING_RESULT -eq 0 ] && [ $PACKAGE_UPDATES_RESULT -eq 0 ] && [ $MIGRATION_RESULT -eq 0 ]; then
    echo "🎉 All structure tests passed!"
    echo ""
    echo "💡 To test API endpoints, run:"
    echo "   ./scripts/test/test_api_endpoints.sh"
    echo "   ./scripts/test/test_local_backend.sh"
    echo ""
    echo "💡 To verify entire system:"
    echo "   ./scripts/test/verify_system.sh"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi

