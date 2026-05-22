import logging
import threading
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.database import SessionLocal
from app.models.api_log import ApiLog

logger = logging.getLogger(__name__)


def _write_log_to_db(
    endpoint: str,
    method: str,
    status_code: int,
    processing_time_ms: float,
    ip_address: str | None,
    user_agent: str | None,
    request_size_bytes: int | None,
    response_size_bytes: int | None,
) -> None:
    session = SessionLocal()
    try:
        log_entry = ApiLog(
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            processing_time_ms=processing_time_ms,
            ip_address=ip_address,
            user_agent=user_agent,
            request_size_bytes=request_size_bytes,
            response_size_bytes=response_size_bytes,
        )
        session.add(log_entry)
        session.commit()
    except Exception:
        logger.exception("Failed to write API log entry")
        session.rollback()
    finally:
        session.close()


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path == "/api/health":
            return await call_next(request)

        start_time = time.perf_counter()
        response = await call_next(request)
        processing_time_ms = (time.perf_counter() - start_time) * 1000

        ip_address = getattr(request.state, "real_ip", None)
        user_agent = request.headers.get("user-agent")
        request_size = request.headers.get("content-length")
        request_size_bytes = int(request_size) if request_size else None
        response_size = response.headers.get("content-length")
        response_size_bytes = int(response_size) if response_size else None

        thread = threading.Thread(
            target=_write_log_to_db,
            args=(
                request.url.path,
                request.method,
                response.status_code,
                processing_time_ms,
                ip_address,
                user_agent,
                request_size_bytes,
                response_size_bytes,
            ),
            daemon=True,
        )
        thread.start()

        return response
