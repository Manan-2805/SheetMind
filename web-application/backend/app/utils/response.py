import uuid
from datetime import UTC, datetime
from typing import Any


def success_response(
    data: Any,
    message: str = "Success",
    request_id: str | None = None,
) -> dict:
    if request_id is None:
        request_id = str(uuid.uuid4())

    return {
        "success": True,
        "data": data,
        "message": message,
        "error": None,
        "meta": {
            "timestamp": datetime.now(UTC).isoformat(),
            "request_id": request_id,
            "version": "1.0.0",
        },
    }


def error_response(
    code: str,
    message: str,
    details: str | None = None,
    request_id: str | None = None,
) -> dict:
    if request_id is None:
        request_id = str(uuid.uuid4())

    return {
        "success": False,
        "data": None,
        "message": message,
        "error": {
            "code": code,
            "details": details,
        },
        "meta": {
            "timestamp": datetime.now(UTC).isoformat(),
            "request_id": request_id,
            "version": "1.0.0",
        },
    }
