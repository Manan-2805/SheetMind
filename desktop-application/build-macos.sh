#!/usr/bin/env bash
# SheetMind Desktop Application Builder for macOS
# Usage: ./build-macos.sh [version] [--clean]

set -e

VERSION=${1:-"1.0.0"}
CLEAN=false

for arg in "$@"; do
    if [ "$arg" == "--clean" ]; then
        CLEAN=true
    fi
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_PATH="$ROOT/build.log"

# Clear old log
> "$LOG_PATH"

exec > >(tee -i "$LOG_PATH") 2>&1

echo "============================================="
echo "   SheetMind Desktop macOS Builder v$VERSION"
echo "============================================="
echo "Logging build process to: $LOG_PATH"

# Close any running instances if any
echo "Closing any active processes..."
pkill -f sheetmind-backend || true
pkill -f electron || true

# Set Nuitka Cache Dir environment variable to use local directory
export NUITKA_CACHE_DIR="$ROOT/backend/.nuitka-cache"
mkdir -p "$NUITKA_CACHE_DIR"
echo "Nuitka cache directory configured at: $NUITKA_CACHE_DIR"

# Step 1: Clean and Prepare Build Directory
echo -e "\n[1/5] Cleaning and preparing build directories..."
BUILD_DIR="$ROOT/build"
BACKEND_BUILD_DIR="$BUILD_DIR/backend"
FRONTEND_BUILD_DIR="$BUILD_DIR/frontend"

if [ "$CLEAN" = true ]; then
    echo "Clean build requested. Purging build directories and Nuitka cache..."
    rm -rf "$BUILD_DIR"
    rm -rf "$ROOT/backend/main.build"
    rm -rf "$ROOT/backend/main.onefile-build"
    rm -rf "$NUITKA_CACHE_DIR"
else
    echo "Incremental build. Keeping Nuitka build cache and existing build directories..."
    rm -rf "$FRONTEND_BUILD_DIR"
fi

mkdir -p "$BUILD_DIR"
mkdir -p "$BACKEND_BUILD_DIR"
mkdir -p "$FRONTEND_BUILD_DIR"
echo "Build directories prepared successfully."

# Step 2: Build Frontend (React + Vite)
echo -e "\n[2/5] Building Frontend (React + Vite)..."
cd "$ROOT/frontend"
echo "Running npm ci..."
npm ci
echo "Running npm run build..."
npm run build
echo "Copying built frontend assets..."
cp -r dist/* "$FRONTEND_BUILD_DIR/"
echo "Frontend build completed."

# Step 3: Compile Backend with Nuitka
echo -e "\n[3/5] Compiling Backend with Nuitka..."
cd "$ROOT/backend"

# Activate Virtual Environment or Create if missing
if [ ! -f "$ROOT/backend/.venv/bin/activate" ]; then
    echo "Virtual environment not found. Creating a new one using uv..."
    uv venv "$ROOT/backend/.venv"
    source "$ROOT/backend/.venv/bin/activate"
    echo "Installing dependencies using uv..."
    uv pip install -r pyproject.toml
else
    echo "Activating python virtual environment..."
    source "$ROOT/backend/.venv/bin/activate"
fi

# Install Nuitka using uv if not already installed
echo "Checking build dependencies with uv..."
uv pip install nuitka ordered-set zstandard

# Execute Nuitka Compile with heavy optimizations
echo "Compiling backend to native executable..."

NUITKA_PACKAGES=(
    "fastapi"
    "uvicorn"
    "duckdb"
    "pandas"
    "openpyxl"
    "openai"
    "websockets"
    "starlette"
    "anyio"
    "aiofiles"
    "seaborn"
    "matplotlib"
    "numpy"
    "httpx"
    "routers"
    "services"
    "models"
    "schemas"
    "dependencies"
)

NUITKA_ARGS=(
    "--standalone"
    "--onefile"
    "--jobs=8"
    "--lto=no"
    "--no-progressbar"
    "--output-dir=$BACKEND_BUILD_DIR"
    "--output-filename=sheetmind-backend"
)

for pkg in "${NUITKA_PACKAGES[@]}"; do
    NUITKA_ARGS+=("--include-package=$pkg")
done

NUITKA_ARGS+=("--include-package-data=uvicorn")

if [ "$CLEAN" = true ]; then
    echo "Clean build: Nuitka will remove intermediate output directory upon completion."
    NUITKA_ARGS+=("--remove-output")
else
    echo "Incremental build: Nuitka will preserve intermediate output directory (main.build/) for caching."
fi

python -B -m nuitka "${NUITKA_ARGS[@]}" main.py

# Deactivate Venv
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi

echo "Backend compilation completed successfully."

# Step 4: Package Desktop Application with Electron Builder
echo -e "\n[4/5] Packaging Desktop Application with Electron Builder..."
cd "$ROOT/electron"

# Update package.json version
echo "Updating package.json version to $VERSION..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "Running npm ci for Electron..."
npm ci

echo "Building final desktop installer..."
# Bypass code signing on macOS CI runner
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist -- --mac

echo "Electron packaging completed."

# Step 5: Wrap up and output location
echo -e "\n[5/5] Build Complete!"
echo "============================================="
DIST_DIR="$ROOT/electron/dist"
if [ -d "$DIST_DIR" ]; then
    echo "Your installer is ready in: $DIST_DIR"
    find "$DIST_DIR" -maxdepth 1 -type f \( -name "*.dmg" -o -name "*.zip" \) | while read -r file; do
        echo " - $(basename "$file")"
    done
else
    echo "WARNING: Dist directory not found. Please check build.log for errors."
fi
echo "============================================="
cd "$ROOT"
