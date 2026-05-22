from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RealIPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            real_ip = forwarded_for.split(",")[0].strip()
        else:
            real_ip = request.headers.get("X-Real-IP")
            if not real_ip:
                real_ip = request.client.host if request.client else "unknown"

        request.state.real_ip = real_ip
        response = await call_next(request)
        return response
