"""Write bounded desktop diagnostics with a stable active log path."""

import logging
import os
import re
import sys
import time
from functools import lru_cache
from logging.handlers import RotatingFileHandler
from pathlib import Path
from traceback import extract_tb

from services.storage_service import get_app_root

DEFAULT_MAX_BYTES = 5 * 1024 * 1024
BACKUPS = 3
RETENTION_SECONDS = 7 * 24 * 3600
ARCHIVE_SUFFIX = re.compile(r"(?:[1-9][0-9]*|\d{4}-\d{2}-\d{2})")


class DesktopFileHandler(RotatingFileHandler):
    """Rotate by size and reopen the active file after deletion or replacement."""

    def __init__(self, path: Path, *, max_bytes: int):
        self.path = path
        super().__init__(
            path, maxBytes=max_bytes, backupCount=BACKUPS, encoding="utf-8", delay=True
        )
        self._next_prune = 0.0
        self._prune_archives()

    def _prune_archives(self) -> None:
        cutoff = time.time() - RETENTION_SECONDS
        prefix = self.path.name + "."
        for path in self.path.parent.glob(prefix + "*"):
            if not ARCHIVE_SUFFIX.fullmatch(path.name.removeprefix(prefix)):
                continue
            try:
                if not path.is_symlink() and path.is_file() and path.stat().st_mtime < cutoff:
                    path.unlink(missing_ok=True)
            except OSError:
                continue
        self._next_prune = time.monotonic() + 3600

    def emit(self, record: logging.LogRecord) -> None:
        """Keep logging to the active path even if its directory was removed."""
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            if time.monotonic() >= self._next_prune:
                self._prune_archives()
            encoded = self.format(record).encode("utf-8", errors="replace")
            line = encoded[: self.maxBytes - 1].decode("utf-8", errors="ignore") + "\n"
            try:
                size = self.path.stat().st_size
            except FileNotFoundError:
                size = 0
            if size and size + len(line.encode("utf-8")) > self.maxBytes:
                self.doRollover()
            with self.path.open("a", encoding="utf-8", newline="") as stream:
                stream.write(line)
        except OSError:
            self.handleError(record)

    def handleError(self, _record: logging.LogRecord) -> None:
        """Report disk failures without printing the original log arguments."""
        if sys.stderr is not None:
            sys.stderr.write("SheetMind could not write its diagnostic log.\n")


def log_path() -> Path:
    """Return the active log location for this desktop backend."""
    return get_app_root() / "logs" / "app.log"


def exception_location(error: Exception) -> str:
    """Record source locations while excluding exception text and local values."""
    return " > ".join(
        f"{Path(frame.filename).name}:{frame.lineno}:{frame.name}"
        for frame in extract_tb(error.__traceback__, limit=-8)
    )


@lru_cache(maxsize=1)
def get_logger() -> logging.Logger:
    """Return the process-wide desktop logger."""
    logger = logging.getLogger("sheetmind")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s] [%(filename)s:%(lineno)d]: %(message)s"
    )
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)
    try:
        max_bytes = int(os.environ.get("SHEETMIND_LOG_MAX_BYTES", DEFAULT_MAX_BYTES))
        if max_bytes <= 0:
            raise ValueError
    except ValueError:
        max_bytes = DEFAULT_MAX_BYTES
        logger.warning("Invalid SHEETMIND_LOG_MAX_BYTES. Using %s bytes.", max_bytes)

    try:
        path = log_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        handler = DesktopFileHandler(path, max_bytes=max_bytes)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    except OSError as error:
        logger.warning("Could not initialize the log file: %s", type(error).__name__)
    return logger
