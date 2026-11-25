# SheetMind Desktop Application Builder for Windows
# Usage: .\build-windows.ps1 [-Version "1.0.0"]

param(
    [string]$Version = "1.0.0",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$LogPath = "$ROOT\build.log"

# Start recording all output to build.log (captures stdout/stderr)
Start-Transcript -Path $LogPath -Force | Out-Null

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   SheetMind Desktop Windows Builder v$Version" -ForegroundColor Cyan
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

# Set Nuitka Cache Dir environment variable to use local directory
$NuitkaCacheDir = "$ROOT\backend\.nuitka-cache"
if (-not (Test-Path $NuitkaCacheDir)) {
    New-Item -ItemType Directory -Force $NuitkaCacheDir | Out-Null
}
$env:NUITKA_CACHE_DIR = $NuitkaCacheDir
Write-Host "Nuitka cache directory configured at: $NuitkaCacheDir" -ForegroundColor DarkGray

# Step 1: Clean and Prepare Build Directory
Write-Host "`n[1/5] Cleaning and preparing build directories..." -ForegroundColor Yellow
$BuildDir = "$ROOT\build"
$BackendBuildDir = "$BuildDir\backend"
$FrontendBuildDir = "$BuildDir\frontend"

if ($Clean) {
    Write-Host "Clean build requested. Purging build directories and Nuitka cache..." -ForegroundColor DarkGray
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
    }
    $NuitkaCache = "$ROOT\backend\main.build"
    if (Test-Path $NuitkaCache) {
        Remove-Item -Recurse -Force $NuitkaCache
    }
    $NuitkaOnefileDir = "$ROOT\backend\main.onefile-build"
    if (Test-Path $NuitkaOnefileDir) {
        Remove-Item -Recurse -Force $NuitkaOnefileDir
    }
    if (Test-Path $NuitkaCacheDir) {
        Remove-Item -Recurse -Force $NuitkaCacheDir
    }
} else {
    Write-Host "Incremental build. Keeping Nuitka build cache and existing build directories..." -ForegroundColor DarkGray
    if (Test-Path $FrontendBuildDir) {
        Remove-Item -Recurse -Force $FrontendBuildDir
    }
}

if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Force $BuildDir | Out-Null
}
if (-not (Test-Path $BackendBuildDir)) {
    New-Item -ItemType Directory -Force $BackendBuildDir | Out-Null
}
if (-not (Test-Path $FrontendBuildDir)) {
    New-Item -ItemType Directory -Force $FrontendBuildDir | Out-Null
}
Write-Host "Build directories prepared successfully." -ForegroundColor Green


# Step 2: Build Frontend (React + Vite)
Write-Host "`n[2/5] Building Frontend (React + Vite)..." -ForegroundColor Yellow
Set-Location "$ROOT\frontend"
Write-Host "Running npm ci..." -ForegroundColor DarkGray
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Running npm run build..." -ForegroundColor DarkGray
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Copying built frontend assets..." -ForegroundColor DarkGray
Copy-Item -Recurse -Force "dist\*" $FrontendBuildDir
Write-Host "Frontend build completed." -ForegroundColor Green

# Step 3: Compile Backend with Nuitka
Write-Host "`n[3/5] Compiling Backend with Nuitka..." -ForegroundColor Yellow
Set-Location "$ROOT\backend"

# Execute Nuitka Compile with heavy optimizations:
# - '--jobs=8': Speeds up compilation heavily using 8 threads on R7 CPU
# - '--lto=no': Disables Link Time Optimization, cutting build time by 50%+
# - Bundles missing dynamic packages: aiofiles, seaborn, matplotlib, numpy, httpx, jinja2
Write-Host "Compiling backend to native executable (using 8 parallel jobs)..." -ForegroundColor DarkGray

$nuitkaPackages = @(
    "fastapi",
    "uvicorn",
    "duckdb",
    "pandas",
    "openpyxl",
    "openai",
    "websockets",
    "starlette",
    "anyio",
    "aiofiles",
    "seaborn",
    "matplotlib",
    "numpy",
    "httpx",
    "routers",
    "services",
    "models",
    "schemas",
    "dependencies"
)

$nuitkaArgs = @(
    "--standalone",
    "--onefile",
    "--jobs=8",
    "--lto=no",
    "--no-progressbar",
    "--output-dir=$BackendBuildDir",
    "--output-filename=sheetmind-backend.exe"
)

foreach ($pkg in $nuitkaPackages) {
    $nuitkaArgs += "--include-package=$pkg"
}

$nuitkaArgs += "--include-package-data=uvicorn"
$nuitkaArgs += "--windows-console-mode=disable"

if ($Clean) {
    Write-Host "Clean build: Nuitka will remove intermediate output directory upon completion." -ForegroundColor DarkGray
    $nuitkaArgs += "--remove-output"
} else {
    Write-Host "Incremental build: Nuitka will preserve intermediate output directory (main.build/) for caching." -ForegroundColor DarkGray
}

$nuitkaArgs += "main.py"

uv run --locked --with nuitka --with ordered-set --with zstandard python -B -m nuitka @nuitkaArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Nuitka backend compilation failed with exit code $LASTEXITCODE"
    if (Get-Command deactivate -ErrorAction SilentlyContinue) {
        deactivate
    }
    Stop-Transcript | Out-Null
    exit $LASTEXITCODE
}

Write-Host "Backend compilation completed successfully." -ForegroundColor Green

# Step 4: Package Desktop Application with Electron Builder
Write-Host "`n[4/5] Packaging Desktop Application with Electron Builder..." -ForegroundColor Yellow
Set-Location "$ROOT\electron"

Write-Host "Running npm ci for Electron..." -ForegroundColor DarkGray
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building final desktop installer..." -ForegroundColor DarkGray
# Use standard electron-builder to build for host OS (Windows installer)
npm run dist -- --win --publish never "-c.extraMetadata.version=$Version"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

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
