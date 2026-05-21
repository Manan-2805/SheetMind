import json
from pathlib import Path

from dependencies import current_username


def get_app_root() -> Path:
    """Root app dir: ~/.sheetmind in production, or backend/.sheetmind in development"""
    import os
    import sys
    
    is_dev = (
        os.environ.get("SHEETMIND_ENV") == "development"
        or os.environ.get("NODE_ENV") == "development"
        or (not getattr(sys, "frozen", False) and (Path(__file__).parent.parent.parent / ".git").exists())
    )
    
    if is_dev:
        base = Path(__file__).parent.parent / ".sheetmind"
    else:
        base = Path.home() / ".sheetmind"
        
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_user_dir(username: str | None = None) -> Path:
    """Per-user dir: ~/.sheetmind/users/{username}"""
    if username is None:
        username = current_username.get("default")
    safe = "".join(c for c in username if c.isalnum() or c in ("_", "-")) or "default"
    path = get_app_root() / "users" / safe
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_user_db_path(username: str | None = None) -> Path:
    """Per-user DuckDB file: ~/.sheetmind/users/{username}/data.duckdb"""
    return get_user_dir(username) / "data.duckdb"


def get_uploads_dir(username: str | None = None) -> Path:
    """Per-user uploads: ~/.sheetmind/users/{username}/uploads"""
    path = get_user_dir(username) / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_exports_dir(username: str | None = None) -> Path:
    """Per-user exports: ~/.sheetmind/users/{username}/exports"""
    path = get_user_dir(username) / "exports"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_charts_dir() -> Path:
    """Global charts: ~/.sheetmind/charts to prevent unauthenticated 404s when loading images"""
    path = get_app_root() / "charts"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_backups_dir(username: str | None = None) -> Path:
    """Per-user backups: ~/.sheetmind/users/{username}/backups"""
    path = get_user_dir(username) / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_debug_prompts_dir() -> Path:
    """Debug prompts dir inside .sheetmind (not per-user)."""
    path = get_app_root() / "debug_prompts"
    path.mkdir(parents=True, exist_ok=True)
    return path


# ---------------------------------------------------------------------------
# Global accounts registry
# ---------------------------------------------------------------------------

def _accounts_path() -> Path:
    return get_app_root() / "accounts.json"


def _load_accounts() -> dict:
    p = _accounts_path()
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_accounts(data: dict) -> None:
    _accounts_path().write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def list_account_users() -> list[dict]:
    """Return list of {username, last_login} sorted by last_login desc."""
    accounts = _load_accounts()
    users = []
    for username, info in accounts.items():
        users.append({
            "username": username,
            "last_login": info.get("last_login"),
            "created_at": info.get("created_at"),
        })
    users.sort(key=lambda u: u.get("last_login") or "", reverse=True)
    return users


def register_login(username: str) -> None:
    """Update or create a user entry in accounts.json."""
    from datetime import datetime, timezone
    accounts = _load_accounts()
    now = datetime.now(timezone.utc).isoformat()
    if username not in accounts:
        accounts[username] = {"created_at": now, "last_login": now}
    else:
        accounts[username]["last_login"] = now
    _save_accounts(accounts)


def remove_account(username: str) -> None:
    """Remove user from accounts.json."""
    accounts = _load_accounts()
    accounts.pop(username, None)
    _save_accounts(accounts)
