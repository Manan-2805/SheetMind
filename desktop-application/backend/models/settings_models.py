"""Read, update, and clear persistent desktop application data."""

import json

from schemas.settings_schemas import SettingsResponse, UpdateSettingsRequest
from services.duckdb_service import get_connection
from services.storage_service import (
    get_app_root,
    get_backups_dir,
    get_debug_prompts_dir,
    get_uploads_dir,
    remove_chat_charts,
)


def get_settings() -> SettingsResponse:
    """Read the current user's settings with stored credentials."""
    with get_connection() as conn:
        row = conn.execute("SELECT settings_json FROM settings WHERE id = 1").fetchone()
    return SettingsResponse(**json.loads(row[0])) if row and row[0] else SettingsResponse()


def update_settings_db(settings: SettingsResponse) -> None:
    """Persist the current user's full settings."""
    with get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO settings (id, settings_json) VALUES (1, ?)",
            [settings.model_dump_json()],
        )


def merge_settings(body: UpdateSettingsRequest) -> SettingsResponse:
    """Apply only submitted fields and preserve a key on blank updates."""
    current = get_settings().model_dump()
    changes = body.model_dump(exclude_unset=True, exclude_none=True)
    openai = changes.pop("openai", {})
    if not openai.get("api_key"):
        openai.pop("api_key", None)
        if openai.get("base_url", current["openai"]["base_url"]) != current["openai"]["base_url"]:
            current["openai"]["api_key"] = ""
    current["openai"].update(openai)
    current["ollama"].update(changes.pop("ollama", {}))
    current.update(changes)
    settings = SettingsResponse.model_validate(current)
    update_settings_db(settings)
    return settings


def clear_chat_history_db() -> int:
    """Remove chat records, their PNGs, and the user's prompt files."""
    with get_connection() as conn:
        conn.begin()
        session_ids = [row[0] for row in conn.execute("SELECT id FROM chat_sessions").fetchall()]
        file_ids = [row[0] for row in conn.execute("SELECT id FROM excel_files").fetchall()]
        charts = conn.execute(
            "SELECT chart_url FROM chat_messages WHERE chart_url IS NOT NULL"
        ).fetchall()
        conn.execute("DELETE FROM chat_messages")
        conn.execute("DELETE FROM chat_sessions")
        conn.commit()

    remove_chat_charts([url for (url,) in charts])
    for path in get_debug_prompts_dir().glob("*.txt"):
        path.unlink(missing_ok=True)
    legacy_ids = set(session_ids + file_ids)
    for path in (get_app_root() / "debug_prompts").glob("*.txt"):
        if legacy_ids.intersection(path.stem.split("_")):
            path.unlink(missing_ok=True)
    return len(session_ids)


def delete_all_files_db() -> int:
    """Remove all imported tables, upload content, backups, and edit records."""
    with get_connection() as conn:
        conn.begin()
        count = conn.execute("SELECT count(*) FROM excel_files").fetchone()[0]
        tables = conn.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'main' AND table_type = 'BASE TABLE' "
            "AND starts_with(lower(table_name), 'file_')"
        ).fetchall()
        for (name,) in tables:
            identifier = name.replace('"', '""')
            conn.execute(f'DROP TABLE main."{identifier}"')
        conn.execute("DELETE FROM excel_sheets")
        conn.execute("DELETE FROM excel_files")
        conn.execute("DELETE FROM edit_history")
        conn.commit()

    for root in (get_uploads_dir(), get_backups_dir()):
        for path in root.iterdir():
            if path.is_symlink() or path.is_file():
                path.unlink(missing_ok=True)
    return count
