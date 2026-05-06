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
from services.duckdb_service import init_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema()
    yield


app = FastAPI(title="SheetMind API", version="1.0.0", lifespan=lifespan)

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


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
