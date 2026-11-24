"""Verify upload size, file type, URL scheme, and chart path validation."""

import os
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from main import app, serve_chart_static
from services.duckdb_service import close_connection
from services.storage_service import get_charts_dir, get_uploads_dir


class UploadTests(IsolatedAsyncioTestCase):
    """Exercise the desktop routes with synthetic files."""

    async def asyncSetUp(self):
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=root, MAX_UPLOAD_BYTES="32"))
        self.addCleanup(close_connection, "default")
        self.root = Path(root)
        self.client = await self.enterAsyncContext(
            AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:49152")
        )

    async def test_oversized_upload_removes_partial_file(self):
        """Reject a file beyond the configured byte limit."""
        response = await self.client.post(
            "/api/data-sources/upload", files={"file": ("big.csv", b"x" * 33)}
        )
        self.assertEqual(response.status_code, 413)
        self.assertEqual(list(get_uploads_dir().iterdir()), [])

    async def test_unsupported_upload_types_are_rejected(self):
        """Restrict new uploads to CSV and XLSX."""
        for suffix in (".xls", ".ods", ".txt"):
            response = await self.client.post(
                "/api/data-sources/upload", files={"file": (f"data{suffix}", b"1")}
            )
            self.assertEqual(response.status_code, 415)

    async def test_remote_upload_requires_http_and_supported_file_type(self):
        """Reject unsupported schemes and file paths before opening a connection."""
        for url, code in (
            ("file:///sample.csv", 400),
            ("https://example.invalid/data.ods", 415),
        ):
            response = await self.client.post(
                "/api/data-sources/upload-from-url", json={"url": url}
            )
            self.assertEqual(response.status_code, code)

    async def test_chart_paths_stay_inside_chart_directory(self):
        """Require a PNG file contained by the resolved chart directory."""
        chart_dir = get_charts_dir()
        (chart_dir / "safe.png").write_bytes(b"synthetic")
        (chart_dir / "read.txt").write_bytes(b"synthetic")
        (chart_dir / "directory.png").mkdir()
        outside = self.root / "outside.png"
        outside.write_bytes(b"synthetic")
        (chart_dir / "symlink.png").symlink_to(outside)
        for path in ("../outside.png", "read.txt", "directory.png", "symlink.png"):
            with self.subTest(path=path), self.assertRaises(HTTPException) as error:
                await serve_chart_static(path)
            self.assertEqual(error.exception.status_code, 404)
        self.assertEqual((await serve_chart_static("safe.png")).media_type, "image/png")
