import logging
from logging.handlers import TimedRotatingFileHandler
import os
import sys

from services.storage_service import get_app_root


_logger = None

def get_logger() -> logging.Logger:
    global _logger
    if _logger is not None:
        return _logger

    # Create logger
    logger = logging.getLogger("sheetmind")
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers if initialized multiple times
    if logger.handlers:
        _logger = logger
        return _logger

    # Format
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s] [%(filename)s:%(lineno)d]: %(message)s"
    )

    # 1. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 2. File Handler (rotating daily, keep 5 days)
    logs_dir = get_app_root() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / "app.log"

    try:
        file_handler = TimedRotatingFileHandler(
            str(log_file),
            when="D",
            interval=1,
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Failed to initialize rotating file log handler: {e}")

    _logger = logger
    return _logger
