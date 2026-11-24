"""Opt-in prompt diagnostics that retain metadata and expire after seven days."""

import os
import re
from datetime import UTC, datetime
from pathlib import Path
from time import time
from typing import Any

from services.logging_service import get_logger
from services.storage_service import get_app_root, get_debug_prompts_dir

_RETENTION_SECONDS = 7 * 24 * 60 * 60


def write_debug_prompt(messages: str | list, label: str) -> Path | None:
    """Record prompt size without persisting user input, rows, or provider secrets."""
    if os.environ.get("SHEETMIND_DEBUG_PROMPTS") != "1":
        return None
    label = re.sub(r"[^a-zA-Z0-9_-]+", "_", label)[:60]
    try:
        folder = get_debug_prompts_dir()
        filename = folder / f"{datetime.now(UTC):%Y%m%d_%H%M%S_%f}_{label}.txt"
        count = len(messages) if isinstance(messages, list) else 1
        length = (
            sum(len(message.get("content") or "") for message in messages)
            if isinstance(messages, list)
            else len(messages)
        )
        filename.write_text(
            f"{label}\nMessages: {count}\nPrompt characters: {length}\n",
            encoding="utf-8",
        )
        return filename
    except (OSError, TypeError) as exc:
        get_logger().warning("Could not write prompt diagnostics: %s", type(exc).__name__)
        return None


def append_debug_response(path: Path | None, response: Any, label: str) -> None:
    """Record response metadata without storing the response content."""
    if path is None or os.environ.get("SHEETMIND_DEBUG_PROMPTS") != "1":
        return
    try:
        with path.open("a", encoding="utf-8") as stream:
            stream.write(f"{label}\nResponse received: {response is not None}\n")
            if isinstance(response, dict):
                for field in ("input_tokens", "output_tokens"):
                    count = response.get(field)
                    if type(count) is int:
                        stream.write(f"{field}: {count}\n")
    except OSError as exc:
        get_logger().warning("Could not append prompt diagnostics: %s", type(exc).__name__)


def prune_debug_prompts() -> None:
    """Delete expired diagnostic files from owned current and legacy directories."""
    root = get_app_root().resolve()
    cutoff = time() - _RETENTION_SECONDS
    folders = [root / "debug_prompts", *root.glob("users/*/debug_prompts")]
    for folder in folders:
        try:
            if not folder.resolve().is_relative_to(root):
                continue
            for path in folder.glob("*.txt"):
                if not path.is_symlink() and path.is_file() and path.stat().st_mtime < cutoff:
                    path.unlink(missing_ok=True)
        except (OSError, RuntimeError) as exc:
            get_logger().warning("Could not prune prompt diagnostics: %s", type(exc).__name__)
