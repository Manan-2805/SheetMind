"""Module containing auth_router functionality."""

import shutil
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from dependencies import current_username
from services.duckdb_service import close_connection, get_connection
from services.storage_service import (
    get_user_dir,
    list_account_users,
    register_login,
    remove_account,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class SetupRequest(BaseModel):
    """Schema or class representation for SetupRequest."""
    username: str


class SetupResponse(BaseModel):
    """Schema or class representation for SetupResponse."""
    username: str
    created_at: str
    last_login: str
    is_new: bool


class UsersListResponse(BaseModel):
    """Schema or class representation for UsersListResponse."""
    users: list[dict]


class DeleteUserResponse(BaseModel):
    """Schema or class representation for DeleteUserResponse."""
    success: bool
    username: str


@router.get("/users", response_model=UsersListResponse)
async def list_users() -> UsersListResponse:
    """Execute the list_users operation."""
    users = list_account_users()
    return UsersListResponse(users=users)


@router.post("/setup", response_model=SetupResponse)
async def setup_user(body: SetupRequest) -> SetupResponse:
    """Execute the setup_user operation."""
    safe = body.username.strip()
    if not safe:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    token = current_username.set(safe)
    try:
        conn = get_connection()
        existing = conn.execute("SELECT COUNT(*) FROM chat_sessions").fetchone()[0]
        is_new = existing == 0
    finally:
        current_username.reset(token)

    register_login(safe)
    users = list_account_users()
    user_info = next((u for u in users if u["username"] == safe), {})

    return SetupResponse(
        username=safe,
        created_at=user_info.get("created_at") or datetime.now(timezone.utc).isoformat(),
        last_login=user_info.get("last_login") or datetime.now(timezone.utc).isoformat(),
        is_new=is_new,
    )


@router.delete("/users/{username}", response_model=DeleteUserResponse)
async def delete_user(username: str) -> DeleteUserResponse:
    """Execute the delete_user operation."""
    safe = "".join(c for c in username if c.isalnum() or c in ("_", "-"))
    if not safe:
        raise HTTPException(status_code=400, detail="Invalid username")

    close_connection(safe)

    user_dir = get_user_dir(safe)
    if user_dir.exists():
        try:
            shutil.rmtree(str(user_dir))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user directory: {e}") from e

    remove_account(safe)

    return DeleteUserResponse(success=True, username=safe)
