from pydantic import BaseModel


class GoogleAuthResponse(BaseModel):
    auth_url: str
