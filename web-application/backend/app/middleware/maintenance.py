from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings
from app.utils.response import error_response


class MaintenanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if settings.maintenance_mode and request.url.path != "/api/health":
            return JSONResponse(
                status_code=503,
                content=error_response(
                    code="MAINTENANCE",
                    message="SheetMind is currently undergoing maintenance. Please try again shortly.",
                ),
            )

        response = await call_next(request)
        return response
