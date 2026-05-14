from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.artifacts_router import router as artifacts_router
from routers.auth_router import router as auth_router
from routers.chat_router import router as chat_router
from routers.data_sources_router import router as data_sources_router
from routers.saved_queries_router import router as saved_queries_router
from routers.settings_router import router as settings_router
from routers.excel_editor_router import router as excel_editor_router
from services.duckdb_service import init_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.background_tasks import queue_worker, resume_pending_tasks
    
    # We no longer run init_schema here since it runs lazily per-user in get_connection
    
    # Resume any tasks that were pending/processing
    await resume_pending_tasks()
    
    # Start the queue worker task
    worker_task = asyncio.create_task(queue_worker())
    
    yield
    
    worker_task.cancel()


app = FastAPI(title="SheetMind API", version="1.0.0", lifespan=lifespan)

from fastapi import Request
from dependencies import current_username

@app.middleware("http")
async def extract_username_middleware(request: Request, call_next):
    username = request.headers.get("X-Username", "default")
    token = current_username.set(username)
    try:
        response = await call_next(request)
        return response
    finally:
        current_username.reset(token)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(data_sources_router, prefix="/api")
app.include_router(artifacts_router, prefix="/api")
app.include_router(saved_queries_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(excel_editor_router, prefix="/api")


import asyncio
from fastapi import WebSocket, WebSocketDisconnect

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

from services.duckdb_service import get_connection

@app.websocket("/api/ws/datasources")
async def websocket_datasources(websocket: WebSocket):
    await websocket.accept()
    
    username = websocket.query_params.get("username", "default")
    token = current_username.set(username)
    
    try:
        conn = get_connection()
        while True:
            # Poll for any pending/processing files
            rows = conn.execute("SELECT id, status, error_message, row_count, column_count FROM excel_files").fetchall()
            updates = [{"id": r[0], "status": r[1], "error_message": r[2], "row_count": r[3], "column_count": r[4]} for r in rows]
            await websocket.send_json({"type": "status_update", "data": updates})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    finally:
        current_username.reset(token)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
