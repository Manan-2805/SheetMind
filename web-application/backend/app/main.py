import logging
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from app.config import settings
from app.database import create_database_if_not_exists
from app.middleware.ip_block import IPBlockMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.maintenance import MaintenanceMiddleware
from app.middleware.real_ip import RealIPMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import health
from app.utils.response import error_response

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_real_ip(request: Request) -> str:
    return getattr(request.state, "real_ip", None) or get_remote_address(request)


limiter = Limiter(key_func=get_real_ip, default_limits=["100/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Complete database setup before the API accepts requests."""
    logger.info("Starting SheetMind API...")
    create_database_if_not_exists()

    backend_dir = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_cfg.attributes["configure_logging"] = False
    command.upgrade(alembic_cfg, "head")
    logger.info("Alembic migrations applied successfully.")

    yield
    logger.info("Shutting down SheetMind API...")


docs_url = "/api/docs" if settings.environment == "development" else None

app = FastAPI(
    title="SheetMind API",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(IPBlockMiddleware)
app.add_middleware(MaintenanceMiddleware)
app.add_middleware(RealIPMiddleware)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)

app.include_router(health.router, prefix="/api")


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content=error_response(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many requests. Please try again later.",
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=error_response(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=str(exc.errors()),
        ),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", str(exc))
    return JSONResponse(
        status_code=500,
        content=error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
        ),
    )
