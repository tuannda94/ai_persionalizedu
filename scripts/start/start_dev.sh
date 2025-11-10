#!/bin/bash
# Development script - Start everything in separate terminals/tabs
# This script helps you start all services easily

set -e

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Development Startup Helper"
echo "=========================================="
echo ""
echo "This script will help you start all services."
echo ""
echo "Options:"
echo "  1. Start Remote API + Admin Dashboard (background)"
echo "  2. Start Student App (Electron) in current terminal"
echo "  3. Start everything (requires multiple terminals)"
echo ""
read -p "Choose option (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Starting Remote API + Admin Dashboard..."
        bash "$SCRIPT_DIR/start_all.sh"
        ;;
    2)
        echo ""
        echo "🎓 Starting Student App..."
        bash "$SCRIPT_DIR/start_student_app.sh"
        ;;
    3)
        echo ""
        echo "🚀 Starting everything..."
        echo ""
        echo "Step 1: Starting Remote API + Admin Dashboard in background..."
        bash "$SCRIPT_DIR/start_all.sh" &
        ALL_PID=$!

        sleep 3

        echo ""
        echo "Step 2: Starting Student App..."
        echo "   (This will run in foreground - use Ctrl+C to stop)"
        bash "$SCRIPT_DIR/start_student_app.sh"
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac

