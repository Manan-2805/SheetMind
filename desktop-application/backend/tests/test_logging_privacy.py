"""Verify diagnostic privacy and clear errors from malformed LLM JSON."""

import os
from pathlib import Path
from tempfile import TemporaryDirectory
from time import time
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from services.llm_service import _call_llm_json
from services.prompt_debug_service import (
    append_debug_response,
    prune_debug_prompts,
    write_debug_prompt,
)
from services.storage_service import get_app_root, get_debug_prompts_dir


class LoggingPrivacyTests(IsolatedAsyncioTestCase):
    """Use disposable diagnostics and fake provider responses."""

    def setUp(self):
        root = self.enterContext(TemporaryDirectory())
        self.enterContext(
            patch.dict(os.environ, SHEETMIND_DATA_DIR=root, SHEETMIND_DEBUG_PROMPTS="0")
        )

    async def test_debug_prompt_opt_in_redaction_and_retention(self):
        """Record metadata only when enabled and prune diagnostics older than a week."""
        sensitive = "unique-synthetic-result-row"
        prompt = [{"role": "user", "content": sensitive}]
        self.assertIsNone(write_debug_prompt(prompt, "test"))
        self.assertFalse((get_app_root() / "users" / "default" / "debug_prompts").exists())
        with patch.dict(os.environ, SHEETMIND_DEBUG_PROMPTS="1"):
            result = write_debug_prompt(prompt, "test")
            append_debug_response(result, {"rows": [sensitive], "input_tokens": 1}, "response")
        self.assertIsInstance(result, Path)
        self.assertNotIn(sensitive, result.read_text(encoding="utf-8"))
        old = get_debug_prompts_dir() / "old.txt"
        old.touch()
        eight_days_ago = time() - (8 * 24 * 60 * 60)
        os.utime(old, (eight_days_ago, eight_days_ago))
        prune_debug_prompts()
        self.assertFalse(old.exists())
        self.assertTrue(result.exists())

    async def test_invalid_llm_json_returns_clear_error_and_logs_no_content(self):
        """Surface provider parse errors and keep the provider payload out of logs."""
        invalid_content = "synthetic private output"
        create = AsyncMock(
            return_value=SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content=invalid_content))]
            )
        )
        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
        settings = SimpleNamespace(
            llm_provider="openai", openai=SimpleNamespace(api_key="", model="fake")
        )
        with (
            patch("services.llm_service.AsyncOpenAI", return_value=client),
            self.assertLogs("sheetmind", level="WARNING") as logs,
            self.assertRaisesRegex(ValueError, "invalid JSON"),
        ):
            await _call_llm_json(settings, [])
        self.assertFalse(any(invalid_content in message for message in logs.output))
