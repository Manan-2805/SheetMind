# SheetMind Desktop Application Builder
# Usage: .\build.ps1 [-Version "1.0.0"]

param(
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$LogPath = "$ROOT\build.log"

# Start recording all output to build.log (captures stdout/stderr)
Start-Transcript -Path $LogPath -Force | Out-Null

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   SheetMind Desktop Builder v$Version" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Logging build process to: $LogPath" -ForegroundColor DarkGray

# Check if running with Administrator privileges on Windows
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "****************************************************************" -ForegroundColor Yellow
    Write-Host "                       IMPORTANT WARNING                       " -ForegroundColor Yellow
    Write-Host "****************************************************************" -ForegroundColor Yellow
    Write-Host "On Windows, electron-builder extracts code-signing utilities    " -ForegroundColor Yellow
    Write-Host "containing macOS symbolic links. To allow this extraction without" -ForegroundColor Yellow
    Write-Host "errors, please ensure:" -ForegroundColor Yellow
    Write-Host "1. You run this build script in an ADMINISTRATOR PowerShell window" -ForegroundColor Yellow
    Write-Host "   (highly recommended for the first build run) OR" -ForegroundColor Yellow
    Write-Host "2. Enable 'Developer Mode' in Windows Settings." -ForegroundColor Yellow
    Write-Host "   (Settings -> Update & Security -> For developers -> Developer Mode)" -ForegroundColor Yellow
    Write-Host "****************************************************************" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Clean and Prepare Build Directory
Write-Host "`n[1/5] Cleaning and preparing build directories..." -ForegroundColor Yellow
$BuildDir = "$ROOT\build"
$BackendBuildDir = "$BuildDir\backend"
$FrontendBuildDir = "$BuildDir\frontend"

if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
New-Item -ItemType Directory -Force $BackendBuildDir | Out-Null
New-Item -ItemType Directory -Force $FrontendBuildDir | Out-Null
Write-Host "Build directories prepared successfully." -ForegroundColor Green

# Step 2: Build Frontend (React + Vite)
Write-Host "`n[2/5] Building Frontend (React + Vite)..." -ForegroundColor Yellow
Set-Location "$ROOT\frontend"
Write-Host "Running npm install..." -ForegroundColor DarkGray
npm install
Write-Host "Running npm run build..." -ForegroundColor DarkGray
npm run build
Write-Host "Copying built frontend assets..." -ForegroundColor DarkGray
Copy-Item -Recurse -Force "dist\*" $FrontendBuildDir
Write-Host "Frontend build completed." -ForegroundColor Green

# Step 3: Compile Backend with Nuitka
Write-Host "`n[3/5] Compiling Backend with Nuitka..." -ForegroundColor Yellow
Set-Location "$ROOT\backend"

# Activate Virtual Environment
$VenvActivate = "$ROOT\backend\.venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) {
    Write-Host "Activating python virtual environment..." -ForegroundColor DarkGray
    . $VenvActivate
} else {
    Write-Error "Virtual environment not found at $ROOT\backend\.venv. Please create one first."
}

# Install Nuitka using uv if not already installed
Write-Host "Checking build dependencies with uv..." -ForegroundColor DarkGray
uv pip install nuitka ordered-set zstandard

# Execute Nuitka Compile with heavy optimizations:
# - '--jobs=8': Speeds up compilation heavily using 8 threads on R7 CPU
# - '--lto=no': Disables Link Time Optimization, cutting build time by 50%+
# - Bundles missing dynamic packages: aiofiles, seaborn, matplotlib, numpy, httpx, jinja2
Write-Host "Compiling backend to native executable (using 8 parallel jobs)..." -ForegroundColor DarkGray
python -B -m nuitka `
    --standalone `
    --onefile `
    --jobs=8 `
    --lto=no `
    --output-dir=$BackendBuildDir `
    --output-filename=sheetmind-backend `
    --include-package=fastapi `
    --include-package=uvicorn `
    --include-package=duckdb `
    --include-package=pandas `
    --include-package=openpyxl `
    --include-package=openai `
    --include-package=websockets `
    --include-package=starlette `
    --include-package=anyio `
    --include-package=aiofiles `
    --include-package=seaborn `
    --include-package=matplotlib `
    --include-package=numpy `
    --include-package=httpx `
    --include-package=jinja2 `
    --include-package=routers `
    --include-package=services `
    --include-package=models `
    --include-package=schemas `
    --include-package=dependencies `
    --include-package-data=uvicorn `
    --windows-console-mode=disable `
    --remove-output `
    main.py

# Deactivate Venv
if (Get-Command deactivate -ErrorAction SilentlyContinue) {
    deactivate
}

Write-Host "Backend compilation completed successfully." -ForegroundColor Green

# Step 4: Package Desktop Application with Electron Builder
Write-Host "`n[4/5] Packaging Desktop Application with Electron Builder..." -ForegroundColor Yellow
Set-Location "$ROOT\electron"

# Update package.json version
Write-Host "Updating package.json version to $Version..." -ForegroundColor DarkGray
$PkgPath = "$ROOT\electron\package.json"
$Pkg = Get-Content $PkgPath | ConvertFrom-Json
$Pkg.version = $Version
$Pkg | ConvertTo-Json -Depth 100 | Set-Content $PkgPath

Write-Host "Running npm install for Electron..." -ForegroundColor DarkGray
npm install

Write-Host "Building final desktop installer..." -ForegroundColor DarkGray
# Use standard electron-builder to build for host OS (Windows installer)
npm run dist

Write-Host "Electron packaging completed." -ForegroundColor Green

# Step 5: Wrap up and output location
Write-Host "`n[5/5] Build Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
$DistDir = "$ROOT\electron\dist"
if (Test-Path $DistDir) {
    Write-Host "Your installer is ready in: $DistDir" -ForegroundColor Cyan
    Get-ChildItem $DistDir -Filter "*.exe" | ForEach-Object {
        Write-Host " - $_" -ForegroundColor Green
    }
} else {
    Write-Warning "Dist directory not found. Please check build.log for errors."
}
Write-Host "=============================================" -ForegroundColor Green

# Stop recording output
Stop-Transcript | Out-Null
Set-Location $ROOT
