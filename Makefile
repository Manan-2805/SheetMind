.DEFAULT_GOAL := help

DESKTOP_TARGETS := setup setup-backend setup-frontend setup-electron dev api ui electron \
	test lint format-check typecheck pylint doctor check build package
WEB_TARGETS := setup setup-local dev stop logs ps config migrate test lint format-check \
	typecheck check build-ui build prod prod-stop prod-logs prod-ps

.PHONY: help setup desktop web build test check $(addprefix desktop-,$(DESKTOP_TARGETS)) $(addprefix web-,$(WEB_TARGETS))

help:
	@printf '%s\n' \
		'SheetMind commands' \
		'  make desktop-setup       Install locked desktop dependencies' \
		'  make desktop             Start Vite, Electron and the desktop backend' \
		'  make desktop-package VERSION=1.2.3   Build an installer for this OS' \
		'  make web                 Start the web development stack in Docker' \
		'  make web-logs / web-stop Follow logs or stop the development stack' \
		'  make web-build / web-prod Build production images or start production' \
		'  make setup / build / test / check     Run a workflow for both apps' \
		'  make -C desktop-application help     List all desktop targets' \
		'  make -C web-application help         List all web targets'

setup: desktop-setup web-setup
desktop: desktop-dev
web: web-dev
build: desktop-build web-build
test: desktop-test web-test
check: desktop-check web-check

$(addprefix desktop-,$(DESKTOP_TARGETS)): desktop-%:
	+$(MAKE) -C desktop-application $*

$(addprefix web-,$(WEB_TARGETS)): web-%:
	+$(MAKE) -C web-application $*
