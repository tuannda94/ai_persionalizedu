#!/bin/bash
# Migration: Add learning package fields to app_versions table
# Run this script to apply the migration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/add_learning_package_to_versions.sql"

echo "🔄 Running migration: Add learning package fields to app_versions"
echo "   Migration file: $MIGRATION_FILE"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Loading from .env..."
    if [ -f "$PROJECT_ROOT/remote-api/.env" ]; then
        export $(cat "$PROJECT_ROOT/remote-api/.env" | grep -v '^#' | xargs)
    else
        echo "❌ Error: DATABASE_URL not found in environment or .env file"
        exit 1
    fi
fi

# Run migration using psql
if command -v psql &> /dev/null; then
    echo "📊 Connecting to database..."
    psql "$DATABASE_URL" -f "$MIGRATION_FILE"
    echo ""
    echo "✅ Migration completed successfully!"
else
    echo "⚠️  psql not found. Please run the migration manually:"
    echo "   psql \$DATABASE_URL -f $MIGRATION_FILE"
    exit 1
fi

