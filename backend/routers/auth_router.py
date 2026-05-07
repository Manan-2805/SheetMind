import glob
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from dependencies import current_username
from services.duckdb_service import get_connection

router = APIRouter(prefix="/auth", tags=["auth"])


class SetupRequest(BaseModel):
    username: str


class SetupResponse(BaseModel):
    username: str
    created_at: str
    is_new: bool


class UsersListResponse(BaseModel):
    users: list[str]


@router.get("/users", response_model=UsersListResponse)
async def list_users() -> UsersListResponse:
    files = glob.glob("sheetmind_*.duckdb")
    users = []
    for f in files:
        name = f.replace("sheetmind_", "").replace(".duckdb", "")
        if name and name != "default":
            users.append(name)
    users.sort()
    return UsersListResponse(users=users)


@router.post("/setup", response_model=SetupResponse)
async def setup_user(body: SetupRequest) -> SetupResponse:
    safe = body.username.strip()
    token = current_username.set(safe)
    try:
        conn = get_connection()
        existing = conn.execute("SELECT COUNT(*) FROM chat_sessions").fetchone()[0]
        is_new = existing == 0
    finally:
        current_username.reset(token)

    return SetupResponse(
        username=safe,
        created_at=datetime.now(timezone.utc).isoformat(),
        is_new=is_new,
    )
