#!/bin/bash

# Verify Scripts - Kiểm tra scripts có chạy được không

echo "🔍 Verifying Scripts..."
echo "======================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📁 Project Root: $PROJECT_ROOT"
echo ""

# Check 1: Python
echo "🐍 Check 1: Python"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi
echo ""

# Check 2: Node.js
echo "📦 Check 2: Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo ""

# Check 3: Directories
echo "📂 Check 3: Project Directories"
DIRS=(
    "student-app/local-backend"
    "student-app/desktop"
    "remote-api"
    "data-pipeline"
    "storage"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        echo -e "${GREEN}✅ $dir exists${NC}"
    else
        echo -e "${RED}❌ $dir not found${NC}"
    fi
done
echo ""

# Check 4: Required files
echo "📄 Check 4: Required Files"
FILES=(
    "student-app/local-backend/app/main.py"
    "student-app/local-backend/requirements.txt"
    "student-app/desktop/package.json"
    "remote-api/app/main.py"
    "remote-api/requirements.txt"
    "data-pipeline/embed_and_build_package.py"
)

for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file not found${NC}"
    fi
done
echo ""

# Check 5: Scripts permissions
echo "🔐 Check 5: Scripts Permissions"
SCRIPTS=(
    "scripts/start/start_student_app.sh"
    "scripts/start/start_remote_api.sh"
    "scripts/build/build_data_pipeline.sh"
    "scripts/build/build_student_app.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$PROJECT_ROOT/$script" ]; then
        if [ -x "$PROJECT_ROOT/$script" ]; then
            echo -e "${GREEN}✅ $script is executable${NC}"
        else
            echo -e "${YELLOW}⚠️  $script is not executable, fixing...${NC}"
            chmod +x "$PROJECT_ROOT/$script"
        fi
    else
        echo -e "${RED}❌ $script not found${NC}"
    fi
done
echo ""

# Check 6: Paths in scripts
echo "🛤️  Check 6: Paths in Scripts"
echo "   Checking for relative path issues..."

# Check start_student_app.sh
if grep -q "PROJECT_ROOT" "$PROJECT_ROOT/scripts/start/start_student_app.sh"; then
    echo -e "${GREEN}✅ start_student_app.sh uses PROJECT_ROOT${NC}"
else
    echo -e "${YELLOW}⚠️  start_student_app.sh may have path issues${NC}"
fi

# Check start_remote_api.sh
if grep -q "PROJECT_ROOT" "$PROJECT_ROOT/scripts/start/start_remote_api.sh"; then
    echo -e "${GREEN}✅ start_remote_api.sh uses PROJECT_ROOT${NC}"
else
    echo -e "${YELLOW}⚠️  start_remote_api.sh may have path issues${NC}"
fi
echo ""

# Check 7: Dependencies
echo "📦 Check 7: Dependencies Files"
if [ -f "$PROJECT_ROOT/student-app/local-backend/requirements.txt" ]; then
    echo -e "${GREEN}✅ Local backend requirements.txt exists${NC}"
    echo "   Dependencies: $(grep -v '^#' "$PROJECT_ROOT/student-app/local-backend/requirements.txt" | wc -l | tr -d ' ') packages"
fi

if [ -f "$PROJECT_ROOT/remote-api/requirements.txt" ]; then
    echo -e "${GREEN}✅ Remote API requirements.txt exists${NC}"
    if grep -q "minio" "$PROJECT_ROOT/remote-api/requirements.txt"; then
        echo -e "${GREEN}   ✅ MinIO dependency found${NC}"
    else
        echo -e "${YELLOW}⚠️  MinIO dependency missing${NC}"
    fi
fi
echo ""

# Summary
echo "======================"
echo -e "${GREEN}✅ Script verification completed!${NC}"
echo ""
echo "🚀 Next steps:"
echo "   1. Start local backend: ./scripts/start/start_student_app.sh"
echo "   2. Start remote API: ./scripts/start/start_remote_api.sh"
echo "   3. Build data pipeline: ./scripts/build/build_data_pipeline.sh"

