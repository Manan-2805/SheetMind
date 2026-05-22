import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.config import settings
from app.database import get_db
from app.utils.response import error_response, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
        status_code = 200
    except Exception:
        logger.exception("Database health check failed")
        db_status = "disconnected"
        status_code = 503

    data = {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "environment": settings.environment,
        "version": "1.0.0",
    }

    if status_code == 200:
        return success_response(data=data, message="Service is healthy")

    return JSONResponse(
        status_code=503,
        content=error_response(
            code="SERVICE_UNHEALTHY",
            message="Service is unhealthy",
            details=f"Database: {db_status}",
        ),
    )
