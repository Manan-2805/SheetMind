---
name: desktop-backend
description: Skill guide and architecture rules for the SheetMind Desktop FastAPI backend.
---
# Desktop Backend Skill

## Overview
The backend for the desktop version of SheetMind is a local Python web server powered by FastAPI. Spawned by the Electron shell, it provides a REST and WebSocket API for the frontend. It is responsible for handling natural language to SQL conversion (via OpenAI or Ollama), managing local analytical data in DuckDB, handling file system operations (Excel imports, mutations, charting, backups), and orchestrating multi-user data isolation.

## When to Use
Use this skill when developing, refactoring, or reviewing code in the `desktop-application/backend/` directory.

## Instructions
- Standard layered architecture (Routers → Models/Services → Database). The backend runs locally on localhost.
- **Multi-User Isolation:** Driven by the `X-Username` HTTP header. A middleware in `main.py` sets the `current_username` ContextVar. Data access must respect this.
- **Database Interaction:** DuckDB is used as the analytical database. Queries are written as raw SQL strings executed via the `duckdb.DuckDBPyConnection.cursor()`. Abstract DB operations into `models/`.
- **API Design:** RESTful principles using FastAPI's `APIRouter`. Endpoint inputs and outputs are strictly validated using Pydantic models in `schemas/`.
- **Real-Time Communication:** WebSockets (in `main.py`) broadcast status updates (e.g., Excel import progress).

### Adding a New API Endpoint:
1. Define the request and response Pydantic schemas in `schemas/`.
2. Implement the database query in `models/` or complex business logic in `services/`.
3. Create the route in the corresponding `routers/` file using `@router.get` or `@router.post`.
4. Ensure the router is included in `main.py`.

### Working with the Database:
1. Import `get_connection` from `services.duckdb_service`.
2. Call `conn = get_connection()`.
3. Execute queries using `conn.execute("SQL QUERY", params)`.
4. Fetch results using `.fetchall()` or `.fetchone()`.

### Handling LLM Calls:
1. Construct the system and user prompts.
2. Use helpers in `services.llm_service` to execute the call.

## Output Format
- `snake_case` for all files, folders, variables, and function names.
- `PascalCase` for Pydantic schema classes.
- **Import Order Rules:** (1) System imports, (2) Third-party library imports, (3) Local application imports. Each group is separated by a blank line and sorted alphabetically.
- Always use `get_logger()` from `services.logging_service`. Do not use `print()` or standard `logging.getLogger()`.
- Code must be robust with `try-except` blocks. FastApi `HTTPException` should be raised inside routers.

## Examples & Notes

> [!WARNING] Strict Rules
> - **NEVER** bypass the `current_username` context for database or file access. All data must be partitioned per user.
> - **NEVER** place business logic or database queries directly inside `routers/`. Always delegate to `models/` or `services/`.
> - **NEVER** use synchronous I/O operations where async equivalents are necessary, to prevent blocking the FastAPI event loop.
> - **ALWAYS** validate API inputs and outputs using Pydantic models.
> - **ALWAYS** use `uv` for package management and run Python code with the `-B` flag to avoid creating `.pyc` files.
> - **NEVER** add emojis in the code or comments.
> - **NEVER** add task completion comments (e.g., "Task X: Done").
