#!/usr/bin/env bash
# SheetMind Desktop Application Builder for Linux
# Usage: ./build-linux.sh [version] [--clean]

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
echo "   SheetMind Desktop Linux Builder v$VERSION"
echo "============================================="
echo "Logging build process to: $LOG_PATH"

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
    "--jobs=${SHEETMIND_BUILD_JOBS:-4}"
    "--lto=no"
    "--no-progressbar"
    "--output-dir=$BACKEND_BUILD_DIR"
    "--output-filename=sheetmind-backend"
)

for pkg in "${NUITKA_PACKAGES[@]}"; do
    NUITKA_ARGS+=("--include-package=$pkg")
done

# Bundle large Python dependencies as bytecode to avoid generating C for them.
for pkg in anyio fastapi httpx matplotlib numpy openai openpyxl pandas seaborn starlette; do
    NUITKA_ARGS+=("--noinclude-custom-mode=$pkg:bytecode")
done

NUITKA_ARGS+=("--include-package-data=uvicorn")

if [ "$CLEAN" = true ]; then
    echo "Clean build: Nuitka will remove intermediate output directory upon completion."
    NUITKA_ARGS+=("--remove-output")
else
    echo "Incremental build: Nuitka will preserve intermediate output directory (main.build/) for caching."
fi

uv run --locked --with nuitka --with ordered-set --with zstandard python -B -m nuitka "${NUITKA_ARGS[@]}" main.py

echo "Backend compilation completed successfully."

# Step 4: Package Desktop Application with Electron Builder
echo -e "\n[4/5] Packaging Desktop Application with Electron Builder..."
cd "$ROOT/electron"

echo "Running npm ci for Electron..."
npm ci

echo "Building final desktop installer..."
npm run dist -- --linux --publish never -c.extraMetadata.version="$VERSION" \
    -c.electronDist="$ROOT/electron/node_modules/electron/dist"

echo "Electron packaging completed."

# Step 5: Wrap up and output location
echo -e "\n[5/5] Build Complete!"
echo "============================================="
DIST_DIR="$ROOT/electron/dist"
if [ -d "$DIST_DIR" ]; then
    echo "Your installer is ready in: $DIST_DIR"
    find "$DIST_DIR" -maxdepth 1 -type f \( -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) | while read -r file; do
        echo " - $(basename "$file")"
    done
else
    echo "WARNING: Dist directory not found. Please check build.log for errors."
fi
echo "============================================="
cd "$ROOT"
