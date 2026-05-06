from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class SetupRequest(BaseModel):
    username: str


class SetupResponse(BaseModel):
    username: str
    created_at: str


@router.post("/setup", response_model=SetupResponse)
async def setup_user(body: SetupRequest) -> SetupResponse:
    return SetupResponse(
        username=body.username,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
