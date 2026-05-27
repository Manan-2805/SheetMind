"""Module containing logging_service functionality."""

import logging
import sys
from logging.handlers import TimedRotatingFileHandler

from services.storage_service import get_app_root

_LOGGER = None


def get_logger() -> logging.Logger:
    """Execute the get_logger operation."""
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    # Create logger
    logger = logging.getLogger("sheetmind")
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers if initialized multiple times
    if logger.handlers:
        _LOGGER = logger
        return _LOGGER

    # Format
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s] [%(filename)s:%(lineno)d]: %(message)s"
    )

    # 1. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 2. File Handler (rotating daily, keep 3 days)
    logs_dir = get_app_root() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / "app.log"

    try:
        file_handler = TimedRotatingFileHandler(
            str(log_file), when="D", interval=1, backupCount=3, encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Failed to initialize rotating file log handler: {e}")

    _LOGGER = logger
    return _LOGGER
