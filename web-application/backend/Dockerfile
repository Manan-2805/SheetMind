# ─────────────────────────────────────────────────────────────────
# Stage 1: Dependency resolver
#   Uses uv to resolve and install only production dependencies
#   into an isolated virtual environment, then discards uv itself.
# ─────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS deps

# Install uv from its official distroless image — no pip needed
COPY --from=ghcr.io/astral-sh/uv:0.7.6 /uv /usr/local/bin/uv

WORKDIR /app

# Copy only the dependency manifests first to leverage Docker layer cache.
# A rebuild only happens when pyproject.toml or uv.lock changes.
COPY pyproject.toml uv.lock ./

# Sync production deps only into /app/.venv
# --frozen        : respect uv.lock exactly (reproducible builds)
# --no-dev        : skip dev/test dependencies
# --no-cache      : do not write uv's download cache (keeps layer lean)
# --no-install-project : do not install the project package itself yet
RUN uv sync --frozen --no-dev --no-cache --no-install-project

# ─────────────────────────────────────────────────────────────────
# Stage 2: Final runtime image
#   Copy only the venv and application source — nothing else.
# ─────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Non-root user for security
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --no-create-home appuser

WORKDIR /app

# Copy the pre-built venv from the deps stage
COPY --from=deps --chown=appuser:appgroup /app/.venv /app/.venv

# Copy application source — only the app package and required config files
COPY --chown=appuser:appgroup app/ ./app/
COPY --chown=appuser:appgroup alembic/ ./alembic/
COPY --chown=appuser:appgroup alembic.ini ./alembic.ini
COPY --chown=appuser:appgroup pyproject.toml ./pyproject.toml

# Activate venv by prepending it to PATH
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
