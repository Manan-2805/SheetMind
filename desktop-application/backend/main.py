"""Module containing main functionality."""

import asyncio
import hmac
import os
import sys
import traceback
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.datastructures import Headers
from starlette.types import Receive, Scope, Send

from dependencies import current_username
from models.chat_models import _ws_clients
from routers.artifacts_router import router as artifacts_router
from routers.auth_router import router as auth_router
from routers.chat_router import router as chat_router
from routers.dashboard_router import router as dashboard_router
from routers.data_sources_router import router as data_sources_router
from routers.excel_editor_router import router as excel_editor_router
from routers.saved_queries_router import router as saved_queries_router
from routers.settings_router import router as settings_router
from services.background_tasks import queue_worker, resume_pending_tasks
from services.duckdb_service import get_connection
from services.logging_service import get_logger
from services.storage_service import get_charts_dir, is_valid_username

TOKEN_HEADER = "X-SheetMind-Token"
DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def _has_local_host(scope: Scope) -> bool:
    server = scope.get("server")
    hosts = Headers(scope=scope).getlist("host")
    if len(hosts) != 1 or server is None:
        return False
    port = server[1]
    return hosts[0].lower() in {f"127.0.0.1:{port}", f"localhost:{port}"}


def _has_launch_token(provided: str) -> bool:
    expected = os.environ.get("SHEETMIND_API_TOKEN")
    return not expected or hmac.compare_digest(expected.encode(), provided.encode())


class LocalCORSMiddleware(CORSMiddleware):
    """Enforce the listener's loopback host and desktop renderer origins."""

    def is_allowed_origin(self, origin: str) -> bool:
        """Allow an opaque file origin when the backend requires a launch token."""
        if origin == "null":
            return bool(os.environ.get("SHEETMIND_API_TOKEN"))
        return super().is_allowed_origin(origin)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and not _has_local_host(scope):
            response = JSONResponse({"detail": "Invalid Host header"}, status_code=400)
            await response(scope, receive, send)
            return
        await super().__call__(scope, receive, send)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Execute the lifespan operation."""
    logger = get_logger()
    logger.info("Application starting up...")
    if not os.environ.get("SHEETMIND_API_TOKEN"):
        logger.warning("Local API token is unset. Running in standalone development mode.")

    await resume_pending_tasks()
    worker_task = asyncio.create_task(queue_worker())

    yield

    logger.info("Application shutting down...")
    worker_task.cancel()


app = FastAPI(title="SheetMind API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Handle request validation errors gracefully and return user-friendly messages."""
    logger = get_logger()
    logger.warning("Request validation failed for %s fields", len(exc.errors()))
    errors_summary = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Value is invalid")
        errors_summary.append(f"{loc}: {msg}")

    return JSONResponse(
        status_code=422,
        content={"detail": f"Request validation failed: {'; '.join(errors_summary)}"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions globally, logging traceback and returning a 500 error."""
    logger = get_logger()
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    logger.error(
        "Unhandled global exception occurred on %s: %s\n%s",
        request.url.path,
        str(exc),
        traceback.format_exc(),
    )

    return JSONResponse(
        status_code=500, content={"detail": "An internal error occurred. Please try again."}
    )


@app.middleware("http")
async def extract_username_middleware(request: Request, call_next):
    """Execute the extract_username_middleware operation."""
    path = request.url.path
    if request.method != "OPTIONS" and path != "/api/health":
        supplied = request.headers.get(TOKEN_HEADER, "")
        if not supplied and request.method == "GET" and path.startswith("/api/chat/charts/static/"):
            supplied = request.query_params.get("api_token", "")
        if not _has_launch_token(supplied):
            return JSONResponse({"detail": "Invalid API token"}, status_code=401)
    username = request.headers.get("X-Username", "default")
    if not is_valid_username(username):
        return JSONResponse({"detail": "Invalid username"}, status_code=400)
    token = current_username.set(username)
    try:
        response = await call_next(request)
        return response
    finally:
        current_username.reset(token)


app.add_middleware(
    LocalCORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(data_sources_router, prefix="/api")
app.include_router(artifacts_router, prefix="/api")
app.include_router(saved_queries_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(excel_editor_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    """Execute the health_check operation."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/chat/charts/static/{filename}")
async def serve_chart_static(filename: str):
    """Serve auto-generated chart images from the user's charts dir."""
    chart_path = get_charts_dir() / filename
    if not chart_path.exists():
        raise HTTPException(status_code=404, detail="Chart not found")
    return FileResponse(str(chart_path), media_type="image/png")


@app.websocket("/api/ws/datasources")
async def websocket_datasources(websocket: WebSocket):
    """Execute the websocket_datasources operation."""
    username = websocket.query_params.get("username", "default")
    supplied = websocket.query_params.get("api_token", "")
    # Uvicorn's handshake logs include the query string from the ASGI scope.
    websocket.scope["query_string"] = b""
    origin = websocket.headers.get("origin")
    allowed_origin = origin in DEV_ORIGINS or (
        origin == "null" and bool(os.environ.get("SHEETMIND_API_TOKEN"))
    )
    if not _has_local_host(websocket.scope) or (origin is not None and not allowed_origin):
        await websocket.send_denial_response(JSONResponse({"detail": "Invalid origin"}, 400))
        return
    if not _has_launch_token(supplied):
        await websocket.send_denial_response(JSONResponse({"detail": "Invalid API token"}, 401))
        return
    if not is_valid_username(username):
        await websocket.send_denial_response(JSONResponse({"detail": "Invalid username"}, 400))
        return
    await websocket.accept()
    _ws_clients.add(websocket)

    token = current_username.set(username)
    logger = get_logger()
    logger.info("WebSocket Connected: username=%s", username)

    try:
        # Broadcast initial status update on connection
        conn = get_connection()
        rows = conn.execute(
            "SELECT id, status, error_message, row_count, column_count FROM excel_files"
        ).fetchall()
        updates = [
            {
                "id": r[0],
                "status": r[1],
                "error_message": r[2],
                "row_count": r[3],
                "column_count": r[4],
            }
            for r in rows
        ]
        await websocket.send_json({"type": "status_update", "data": updates})

        # Keep connection alive without polling, wait for close/disconnection
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket connection error: %s", e)
    finally:
        _ws_clients.discard(websocket)
        logger.info("WebSocket Disconnected: username=%s", username)
        current_username.reset(token)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    uvicorn.run(app, host="127.0.0.1", port=port, access_log=False)
