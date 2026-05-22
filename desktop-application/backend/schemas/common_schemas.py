from pydantic import BaseModel


class SuccessResponse(BaseModel):
    success: bool


class ErrorResponse(BaseModel):
    detail: str
