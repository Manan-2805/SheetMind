from fastapi import APIRouter, Depends, Request

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserSchema
from app.utils.response import success_response

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile")
async def get_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    user_data = UserSchema(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        picture=current_user.picture,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        last_login_at=current_user.last_login_at.isoformat() if current_user.last_login_at else None,
    )
    return success_response(data=user_data.model_dump(), message="Profile retrieved")
