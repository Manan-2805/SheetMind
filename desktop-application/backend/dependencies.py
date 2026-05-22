import contextvars

current_username: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_username", default="default"
)
