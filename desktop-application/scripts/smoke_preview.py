"""Smoke-test the Docker renderer, upload, chat, and error logging without a real LLM."""

import json
import os
import re
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from threading import Thread
from uuid import uuid4

from httpx import Client
from openpyxl import Workbook
from websockets.sync.client import connect


@contextmanager
def fake_provider():
    """Run a loopback provider that emits deterministic results and safe errors."""

    class Provider(BaseHTTPRequestHandler):
        table = ""

        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length))
            if payload["model"] == "rejected":
                status = 401
                response = {"error": "Fake private provider payload"}
            else:
                status = 200
                prompt = " ".join(message["content"] for message in payload["messages"])
                if "chart_config" in prompt:
                    text = '{"summary":"The total is 9.","followups":[],"chart_config":{}}'
                elif "DuckDB" in prompt:
                    text = json.dumps({"sql": f"SELECT SUM(amount) AS total FROM {self.table}"})
                else:
                    text = "Preview test"
                response = {"choices": [{"message": {"content": text}}]}
            data = json.dumps(response).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, _format, *_args):
            """Keep fake provider request bodies out of logs."""

    with ThreadingHTTPServer(("127.0.0.1", 0), Provider) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield Provider, f"http://127.0.0.1:{server.server_port}/v1"
        finally:
            server.shutdown()
            thread.join()


def smoke_test() -> None:
    """Run the preview against a fresh synthetic profile."""
    port = os.environ.get("SHEETMIND_PREVIEW_PORT", "4173")
    base = f"http://127.0.0.1:{port}"
    username = f"smoke-{uuid4().hex[:8]}"
    with (
        Client(base_url=base, timeout=15, trust_env=False) as client,
        fake_provider() as (
            provider,
            provider_url,
        ),
    ):
        page = client.get("/")
        page.raise_for_status()
        token = re.search(r'window\.__SHEETMIND_API_TOKEN__ = "([a-f0-9]{64})"', page.text)
        assert token
        asset = re.search(r'<script type="module" crossorigin src="\.?/([^"]+)"', page.text)
        assert asset and client.get(f"/{asset[1]}").status_code == 200
        assert client.get("/api/settings").status_code == 401
        client.headers.update({"X-SheetMind-Token": token[1], "X-Username": username})
        client.post("/api/auth/setup", json={"username": username}).raise_for_status()
        socket_url = f"ws://127.0.0.1:{port}/api/ws/datasources"
        with connect(f"{socket_url}?username={username}&api_token={token[1]}", origin=base) as ws:
            assert json.loads(ws.recv(timeout=5))["type"] == "status_update"

        workbook = Workbook()
        workbook.active.append(["amount"])
        workbook.active.append([2])
        workbook.active.append([7])
        buffer = BytesIO()
        workbook.save(buffer)
        upload = client.post(
            "/api/data-sources/upload", files={"file": ("preview.xlsx", buffer.getvalue())}
        )
        upload.raise_for_status()
        file_id = upload.json()["id"]
        for _ in range(100):
            source = next(
                item for item in client.get("/api/data-sources").json() if item["id"] == file_id
            )
            if source["status"] not in {"pending", "processing"}:
                break
            time.sleep(0.1)
        assert source["status"] == "completed"
        provider.table = f"file_{file_id.replace('-', '_')}_sheet"

        def set_model(model):
            client.put(
                "/api/settings",
                json={
                    "llm_provider": "openai",
                    "openai": {"base_url": provider_url, "model": model, "api_key": "fake-preview"},
                },
            ).raise_for_status()

        set_model("preview")
        session = client.post("/api/chat/sessions", json={"title": "Docker smoke test"})
        session.raise_for_status()
        route = f"/api/chat/sessions/{session.json()['id']}/messages"
        result = client.post(
            route, json={"content": "Sum the amount column", "referenced_files": ["preview.xlsx"]}
        )
        result.raise_for_status()
        assert result.json()["result_data"]["rows"] == [{"total": 9}]
        set_model("rejected")
        failure = client.post(
            route, json={"content": "Try again", "referenced_files": ["preview.xlsx"]}
        )
        assert failure.status_code == 502
        reference = failure.json()["detail"].split("Reference: ")[-1]
        assert re.fullmatch(r"[a-f0-9]{8}", reference)
        diagnostics = (Path(os.environ["SHEETMIND_DATA_DIR"]) / "logs" / "app.log").read_text()
        assert any(
            reference in line and "upstream HTTP 401" in line for line in diagnostics.splitlines()
        )
        assert "Fake private provider payload" not in diagnostics
    print("Desktop preview passed: renderer, token, WebSocket, workbook, chat, and safe error log.")


if __name__ == "__main__":
    smoke_test()
