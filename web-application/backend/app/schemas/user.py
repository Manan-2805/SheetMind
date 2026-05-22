from typing import Optional

from pydantic import BaseModel


class UserSchema(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str
    last_login_at: Optional[str] = None

    model_config = {"from_attributes": True}
