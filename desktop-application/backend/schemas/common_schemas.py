"""Module containing common_schemas functionality."""

from pydantic import BaseModel


class SuccessResponse(BaseModel):
    """Schema or class representation for SuccessResponse."""
    success: bool


class ErrorResponse(BaseModel):
    """Schema or class representation for ErrorResponse."""
    detail: str
