.DEFAULT_GOAL := help

COMPOSE ?= docker compose
UV ?= uv
NPM ?= npm
DEV = $(COMPOSE) -f docker-compose.yml
PROD = $(DEV) -f docker-compose.prod.yml

.PHONY: help setup setup-local dev stop logs ps config migrate test lint format-check typecheck check build-ui build prod prod-stop prod-logs prod-ps

help:
	@printf '%s\n' \
		'Web targets' \
		'  setup / dev              Build development images / start the development stack' \
		'  stop / logs / ps         Stop services, follow logs, or show status' \
		'  config                   Validate development and production Compose config' \
		'  migrate                  Apply migrations to the running development database' \
		'  setup-local              Install locked dependencies for local checks and UI builds' \
		'  test / lint / format-check / typecheck / check' \
		'  build-ui                 Build the frontend into frontend/dist' \
		'  build / prod             Build production images / start production from them' \
		'  prod-stop / prod-logs / prod-ps'

setup:
	$(DEV) build

setup-local:
	cd backend && $(UV) sync --locked
	$(NPM) --prefix frontend ci

dev:
	$(DEV) up -d

stop:
	$(DEV) stop

logs:
	$(DEV) logs --follow --tail=100

ps:
	$(DEV) ps

config:
	$(DEV) config --quiet
	$(PROD) config --quiet

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
	$(PROD) build

prod:
	$(PROD) up -d

prod-stop:
	$(PROD) stop

prod-logs:
	$(PROD) logs --follow --tail=100

prod-ps:
	$(PROD) ps
