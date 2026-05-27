import logging
from datetime import UTC, datetime

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


async def exchange_code_for_tokens(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code != 200:
            logger.error("Token exchange failed: %s", response.text)
            raise ValueError("token_exchange_failed")
        return response.json()


async def fetch_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            logger.error("User info fetch failed: %s", response.text)
            raise ValueError("user_info_failed")
        return response.json()


def upsert_user(db: Session, google_user_info: dict) -> User:
    google_id = google_user_info["sub"]
    email = google_user_info["email"]
    name = google_user_info.get("name", email.split("@")[0])
    picture = google_user_info.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()

    if user:
        user.last_login_at = datetime.now(UTC)
        user.name = name
        user.picture = picture
    else:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            last_login_at=datetime.now(UTC),
        )
        db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        logger.exception("Failed to upsert user")
        raise ValueError("user_creation_failed")

    return user
