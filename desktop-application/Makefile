.DEFAULT_GOAL := help

UV ?= uv
NPM ?= npm
NODE ?= node
POWERSHELL ?= powershell.exe
VERSION ?= 1.0.0
API_PORT ?= 8000
export SHEETMIND_BUILD_VERSION = $(VERSION)

ifeq ($(OS),Windows_NT)
PACKAGE_COMMAND = $(POWERSHELL) -NoProfile -ExecutionPolicy RemoteSigned -File build-windows.ps1 -Version "$(VERSION)"
else ifeq ($(shell uname -s),Darwin)
PACKAGE_COMMAND = bash build-macos.sh "$$SHEETMIND_BUILD_VERSION"
else ifeq ($(shell uname -s),Linux)
PACKAGE_COMMAND = bash build-linux.sh "$$SHEETMIND_BUILD_VERSION"
endif

.PHONY: help setup setup-backend setup-frontend setup-electron dev api ui electron test lint format-check typecheck pylint doctor check build package

help:
	@printf '%s\n' \
		'Desktop targets' \
		'  setup                     Sync Python, frontend and Electron dependencies' \
		'  dev                       Start the complete desktop app' \
		'  api [API_PORT=8000]       Start only the Python API' \
		'  ui / electron             Start Vite or Electron separately' \
		'  test                      Run the backend test suite' \
		'  lint / format-check / typecheck / check' \
		'  pylint / doctor           Run additional backend or React diagnostics' \
		'  build                     Build the frontend into frontend/dist' \
		'  package [VERSION=1.0.0]   Build the native installer into electron/dist'

setup: setup-backend setup-frontend setup-electron

setup-backend:
	cd backend && $(UV) sync --locked

setup-frontend:
	$(NPM) --prefix frontend ci

setup-electron:
	$(NPM) --prefix electron ci

dev:
	cd frontend && $(NODE) desktop-dev.mjs

api:
	cd backend && $(UV) run --locked --no-sync python -B main.py $(API_PORT)

ui:
	$(NPM) --prefix frontend run dev -- --host localhost --port 5173 --strictPort

electron:
	$(NPM) --prefix electron start

test:
	cd backend && $(UV) run --locked --no-sync python -B -m unittest discover -s tests -v

lint:
	cd backend && $(UV) run --locked --no-sync ruff check .
	cd frontend && $(NPM) run lint

format-check:
	cd backend && $(UV) run --locked --no-sync ruff format --check .
	cd frontend && $(NPM) run format

typecheck:
	cd frontend && $(NPM) exec --offline -- tsc -b --noEmit

pylint:
	cd backend && $(UV) run --locked --no-sync python -B -m pylint main.py models routers schemas services

doctor:
	cd frontend && $(NPM) exec --offline -- react-doctor

check: test lint format-check typecheck

build:
	$(NPM) --prefix frontend run build

package:
ifdef PACKAGE_COMMAND
	$(PACKAGE_COMMAND)
else
	$(error Native packaging is available on Linux, macOS, and Windows.)
endif
