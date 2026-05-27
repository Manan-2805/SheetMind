from pydantic import BaseModel


class UserSchema(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None
    created_at: str
    last_login_at: str | None = None

    model_config = {"from_attributes": True}
