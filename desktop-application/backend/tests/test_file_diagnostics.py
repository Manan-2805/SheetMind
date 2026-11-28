"""Verify desktop diagnostics against isolated log files and a fake provider."""

import logging
import os
import time
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from services.logging_service import DesktopFileHandler


class FileDiagnosticsTests(TestCase):
    """Exercise rotation, recovery, and precise cleanup."""

    def test_rotates_and_recreates_the_active_file(self):
        """Keep a fixed active path and recover if it disappears while running."""
        root = Path(self.enterContext(TemporaryDirectory()))
        path = root / "logs" / "app.log"
        handler = self.enterContext(closing(DesktopFileHandler(path, max_bytes=80)))
        for _ in range(7):
            handler.handle(logging.LogRecord("test", logging.INFO, __file__, 1, "x" * 48, (), None))
        self.assertEqual(len(list(path.parent.glob("app.log.[0-9]"))), 3)
        path.unlink()
        handler.handle(logging.LogRecord("test", logging.INFO, __file__, 1, "recreated", (), None))
        self.assertEqual(path.read_text(encoding="utf-8"), "recreated\n")
        self.assertLessEqual(path.stat().st_size, 80)
        handler.handle(logging.LogRecord("test", logging.INFO, __file__, 1, "é" * 100, (), None))
        self.assertLessEqual(path.stat().st_size, 80)
        self.assertTrue(path.read_text(encoding="utf-8").endswith("\n"))

    def test_prunes_only_old_owned_archives(self):
        """Keep unrelated files and recent log archives."""
        root = Path(self.enterContext(TemporaryDirectory()))
        files = [
            root / name for name in ("app.log.1", "app.log.2025-01-01", "app.log.2", "notes.log")
        ]
        for file in files:
            file.touch()
        old = time.time() - 8 * 24 * 3600
        for file in (files[0], files[1], files[3]):
            os.utime(file, (old, old))
        self.addCleanup(DesktopFileHandler(root / "app.log", max_bytes=80).close)
        self.assertFalse(files[0].exists())
        self.assertFalse(files[1].exists())
        self.assertTrue(files[2].exists())
        self.assertTrue(files[3].exists())
