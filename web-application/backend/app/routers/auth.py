import logging
import os
import secrets

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserSchema
from app.services.auth_service import (
    exchange_code_for_tokens,
    fetch_user_info,
    upsert_user,
)
from app.utils.jwt import create_access_token
from app.utils.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_real_ip(request: Request) -> str:
    return getattr(request.state, "real_ip", None) or get_remote_address(request)


limiter = Limiter(key_func=get_real_ip)


@router.get("/google")
@limiter.limit("20/minute")
async def google_auth(request: Request):
    state = secrets.token_hex(16)

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope=openid+email+profile"
        f"&access_type=offline"
        f"&state={state}"
    )

    response = JSONResponse(
        content=success_response(
            data={"auth_url": auth_url},
            message="Authorization URL generated",
        )
    )

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=600,
        secure=settings.environment == "production",
    )

    return response


@router.get("/google/callback")
@limiter.limit("20/minute")
async def google_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    vite_app_url = os.environ.get("VITE_APP_URL", "http://localhost:5173")

    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        return RedirectResponse(
            url=f"{vite_app_url}/auth/callback?status=error&reason=invalid_state"
        )

    try:
        tokens = await exchange_code_for_tokens(code)
    except ValueError:
        return RedirectResponse(
            url=f"{vite_app_url}/auth/callback?status=error&reason=token_exchange_failed"
        )

    try:
        user_info = await fetch_user_info(tokens["access_token"])
    except (ValueError, KeyError):
        return RedirectResponse(
            url=f"{vite_app_url}/auth/callback?status=error&reason=token_exchange_failed"
        )

    try:
        user = upsert_user(db, user_info)
    except ValueError:
        return RedirectResponse(
            url=f"{vite_app_url}/auth/callback?status=error&reason=user_creation_failed"
        )

    jwt_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
    }
    access_token = create_access_token(jwt_data)

    response = RedirectResponse(
        url=f"{vite_app_url}/auth/callback?status=success",
        status_code=302,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )

    response.delete_cookie(key="oauth_state")

    return response


@router.get("/me")
@limiter.limit("60/minute")
async def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    user_data = UserSchema(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        picture=current_user.picture,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        last_login_at=current_user.last_login_at.isoformat()
        if current_user.last_login_at
        else None,
    )
    return success_response(data=user_data.model_dump(), message="User retrieved")


@router.post("/logout")
async def logout(request: Request):
    response = JSONResponse(content=success_response(data=None, message="Logged out successfully"))
    response.delete_cookie(key="access_token", path="/")
    return response
