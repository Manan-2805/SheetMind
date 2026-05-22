import logging
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.database import SessionLocal
from app.models.blocked_ip import BlockedIP
from app.utils.response import error_response

logger = logging.getLogger(__name__)


class IPBlockMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        real_ip = getattr(request.state, "real_ip", None)
        if not real_ip:
            real_ip = request.client.host if request.client else "unknown"

        session = SessionLocal()
        try:
            blocked = session.query(BlockedIP).filter(
                BlockedIP.ip_address == real_ip
            ).first()

            if blocked:
                now = datetime.now(timezone.utc)
                if blocked.blocked_until is None or blocked.blocked_until > now:
                    return JSONResponse(
                        status_code=403,
                        content=error_response(
                            code="IP_BLOCKED",
                            message="Your IP address has been blocked.",
                            details=blocked.reason,
                        ),
                    )

            expired_blocks = session.query(BlockedIP).filter(
                BlockedIP.blocked_until.isnot(None),
                BlockedIP.blocked_until <= datetime.now(timezone.utc),
            ).all()
            for expired in expired_blocks:
                session.delete(expired)
            if expired_blocks:
                session.commit()
        except Exception:
            logger.exception("Error checking IP block status")
            session.rollback()
        finally:
            session.close()

        response = await call_next(request)
        return response
