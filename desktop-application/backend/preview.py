"""Serve the desktop renderer and API together for the local Docker preview."""

import os
from pathlib import Path
from secrets import token_hex

import uvicorn
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from main import DEV_ORIGINS, app

DIST = Path(__file__).resolve().parent / "frontend-dist"
PORT = int(os.environ.get("SHEETMIND_PREVIEW_PORT", "4173"))
TOKEN = token_hex(32)
os.environ["SHEETMIND_API_TOKEN"] = TOKEN
app.state.browser_preview = True
DEV_ORIGINS.extend(f"http://{host}:{PORT}" for host in ("127.0.0.1", "localhost"))

app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="preview-assets")


@app.get("/", include_in_schema=False)
def index() -> HTMLResponse:
    """Provide the renderer with the same API configuration as Electron preload."""
    script = (
        '<script>window.__SHEETMIND_API_URL__ = location.origin + "/api";'
        f'window.__SHEETMIND_API_TOKEN__ = "{TOKEN}";</script>'
    )
    markup = (
        (DIST / "index.html").read_text(encoding="utf-8").replace("</head>", f"{script}</head>")
    )
    return HTMLResponse(markup, headers={"Cache-Control": "no-store"})


@app.get("/favicon.png", include_in_schema=False)
def favicon() -> FileResponse:
    """Serve the desktop icon from the built renderer."""
    return FileResponse(DIST / "favicon.png")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT, access_log=False)
