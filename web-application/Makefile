.DEFAULT_GOAL := help

COMPOSE ?= docker compose
UV ?= uv
NPM ?= npm
VERSION ?= 1.0.0
ENV_FILES = $(if $(wildcard .env.local),--env-file .env.local) --env-file .env
DEV = $(COMPOSE) $(ENV_FILES) -f docker-compose.yml
PROD = $(DEV) -f docker-compose.prod.yml

.PHONY: help setup setup-local dev restart stop logs ps config stage-downloads migrate test lint format-check typecheck check build-ui build prod prod-restart prod-migrate prod-stop prod-logs prod-ps

help:
	@printf '%s\n' \
		'Web targets' \
		'  setup / dev              Build development images / start the development stack' \
		'  restart                  Apply .env changes and restart development services' \
		'  stop / logs / ps         Stop services, follow logs, or show status' \
		'  config                   Validate development and production Compose config' \
		'  stage-downloads           Copy locally built x64 installers into the public downloads directory' \
		'  migrate                  Apply migrations to the running development database' \
		'  setup-local              Install locked dependencies for local checks and UI builds' \
		'  test / lint / format-check / typecheck / check' \
		'  build-ui                 Build the frontend into frontend/dist' \
		'  build / prod             Build production images / start production from them' \
		'  prod-restart             Apply .env changes and restart production services' \
		'  prod-migrate             Apply migrations to the running production database' \
		'  prod-stop / prod-logs / prod-ps'

setup:
	$(DEV) build

setup-local:
	cd backend && $(UV) sync --locked
	$(NPM) --prefix frontend ci

dev:
	$(DEV) up -d --wait

restart:
	$(DEV) up -d --wait --force-recreate backend frontend nginx

stop:
	$(DEV) stop

logs:
	$(DEV) logs --follow --tail=100

ps:
	$(DEV) ps

config:
	$(DEV) config --quiet
	$(PROD) config --quiet

stage-downloads:
	@set -e; found=no; \
	for suffix in linux-x86_64.AppImage windows-x64-setup.exe; do \
		source="../desktop-application/electron/dist/SheetMind-$(VERSION)-$$suffix"; \
		if test -f "$$source"; then \
			install -m 0644 "$$source" "downloads/.SheetMind-$$suffix"; \
			mv -f "downloads/.SheetMind-$$suffix" "downloads/SheetMind-$$suffix"; \
			printf '%s\n' "Staged $$source"; found=yes; \
		fi; \
	done; \
	if test "$$found" = no; then \
		printf '%s\n' 'No desktop installers for this version. Run make desktop-package first.' >&2; exit 1; \
	fi

migrate:
	$(DEV) exec -T backend alembic upgrade head

test:
	@if test -d backend/tests; then \
		cd backend && $(UV) run --locked --no-sync python -B -m pytest; \
	else \
		printf '%s\n' 'No web backend tests directory in this checkout.'; \
	fi

lint:
	cd backend && $(UV) run --locked --no-sync ruff check .
	cd frontend && $(NPM) run lint

format-check:
	cd backend && $(UV) run --locked --no-sync ruff format --check .
	cd frontend && $(NPM) run format

typecheck:
	cd frontend && $(NPM) exec --offline -- tsc -b --noEmit

check: test lint format-check typecheck

build-ui:
	$(NPM) --prefix frontend run build

build:
	$(PROD) build $(SERVICES)

prod:
	$(PROD) up -d --wait

prod-restart:
	$(PROD) up -d --wait --force-recreate backend frontend nginx

prod-migrate:
	$(PROD) exec -T backend alembic upgrade head

prod-stop:
	$(PROD) stop

prod-logs:
	$(PROD) logs --follow --tail=100

prod-ps:
	$(PROD) ps
