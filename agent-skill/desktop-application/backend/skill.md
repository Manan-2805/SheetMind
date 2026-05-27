# Desktop Backend - Skill Guide for Sheetmind

## Project Overview
The backend for the desktop version of SheetMind is a local Python web server powered by FastAPI. Spawned by the Electron shell, it provides a REST and WebSocket API for the frontend. It is responsible for handling natural language to SQL conversion (via OpenAI or Ollama), managing local analytical data in DuckDB, handling file system operations (Excel imports, mutations, charting, backups), and orchestrating multi-user data isolation. 

## Folder Structure
```bash
desktop-application/backend/
├── models/         # Data access layer (DuckDB queries) and core entity logic
├── routers/        # API route definitions and endpoint handlers
├── schemas/        # Pydantic models for request/response validation
├── services/       # Core business logic (LLM, DuckDB, Excel processing, Storage)
├── dependencies.py # Dependency injection (e.g., ContextVars for username)
├── main.py         # App entry point, middleware, lifespans, WebSockets
├── pyproject.toml  # Dependency management (uv)
└── uv.lock         # Exact dependency lockfile
```

## Core Packages, Files & Responsibilities
- `main.py`: Bootstraps FastAPI, registers all `routers`, sets up CORS, handles the `extract_username_middleware`, and manages WebSocket connections for live data source updates.
- `dependencies.py`: Holds the `current_username` ContextVar for multi-user isolation across requests.
- `services/duckdb_service.py`: Thread-safe DuckDB connection manager that ensures each user accesses their own isolated `.duckdb` database.
- `services/llm_service.py`: Abstraction layer for interacting with LLM providers (OpenAI API or local Ollama), configured by user settings.
- `services/background_tasks.py`: Async queue worker for handling long-running tasks without blocking the main event loop.
- `services/storage_service.py`: Helpers for locating the user-specific storage paths (`~/.sheetmind/users/{username}/...`).
- `pyproject.toml`: Defines dependencies (FastAPI, Uvicorn, DuckDB, Pandas, OpenAI, etc.). Managed using `uv`.

## Architecture & Design Patterns
- **Overall Architecture:** Standard layered architecture (Routers → Models/Services → Database). The backend runs locally on localhost and serves requests directly from the Electron app.
- **Multi-User Isolation:** Driven by the `X-Username` HTTP header. A middleware in `main.py` sets the `current_username` ContextVar. The `duckdb_service` and `storage_service` read this ContextVar to route data access to the correct user's directory and database.
- **Database Interaction:** DuckDB is used as the analytical database. Queries are written as raw SQL strings executed via the `duckdb.DuckDBPyConnection.cursor()`. Database operations are abstracted into the `models/` directory (e.g., `chat_models.py`, `settings_models.py`).
- **State Management & Concurrency:** Async functions are heavily utilized for I/O bounds. A global dictionary with a threading Lock (`_conns`) is used in `duckdb_service.py` to maintain active DuckDB connections per user.
- **API Design:** RESTful principles using FastAPI's `APIRouter`. Endpoint inputs and outputs are strictly validated using Pydantic models in the `schemas/` directory.
- **Real-Time Communication:** WebSockets (in `main.py`) are used to broadcast status updates (e.g., Excel import progress) back to the React frontend.

## Coding Standards & Conventions
- **Naming Conventions:** 
  - `snake_case` for all files, folders, variables, and function names.
  - `PascalCase` for Pydantic schema classes.
- **Import Order Rules:** (1) Standard library imports, (2) Third-party library imports, (3) Local application imports. Each group is separated by a blank line and sorted alphabetically.
- **Pydantic Validation:** All incoming request bodies and outgoing responses must be strongly typed using Pydantic schemas (defined in `schemas/`).
- **Error Handling:** Use FastAPI's `HTTPException` inside routers. Catch specific exceptions (e.g., `ValueError`) from the models/services layer and translate them into appropriate HTTP status codes (e.g., 400 or 404).
- **Logging:** Always use `get_logger()` from `services.logging_service`. Do not use `print()` or standard `logging.getLogger()`.

## Key Utilities & Helpers
- `current_username` (`dependencies.py`): A `contextvars.ContextVar` storing the active user's username for the lifecycle of a request.
- `get_connection()` (`services/duckdb_service.py`): Returns the active DuckDB cursor for the current user.
- `get_user_db_path()` (`services/storage_service.py`): Safely constructs the file path to the user's data directory.

## Common Implementation Patterns
- **Adding a New API Endpoint:**
  1. Define the request and response Pydantic schemas in `schemas/`.
  2. Implement the database query in `models/` or complex business logic in `services/`.
  3. Create the route in the corresponding `routers/` file using `@router.get` or `@router.post`.
  4. Ensure the router is included in `main.py`.
- **Working with the Database:**
  1. Import `get_connection` from `services.duckdb_service`.
  2. Call `conn = get_connection()`.
  3. Execute queries using `conn.execute("SQL QUERY", params)`.
  4. Fetch results using `.fetchall()` or `.fetchone()`.
- **Handling LLM Calls:**
  1. Construct the system and user prompts.
  2. Use helpers in `services.llm_service` to execute the call. The service automatically routes to Ollama or OpenAI based on the user's settings.

## Agent Rules (Strict)
- **NEVER** bypass the `current_username` context for database or file access. All data must be partitioned per user.
- **NEVER** place business logic or database queries directly inside `routers/`. Always delegate to `models/` or `services/`.
- **NEVER** use synchronous I/O operations where async equivalents are necessary, to prevent blocking the FastAPI event loop.
- **ALWAYS** validate API inputs and outputs using Pydantic models.
- **ALWAYS** use `uv` for package management and run Python code with the `-B` flag to avoid creating `.pyc` files.
- **ALWAYS** maintain strict separation of concerns between `models` (DB access), `schemas` (validation), `routers` (HTTP handling), and `services` (core logic).

## Tech Stack & Tools
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Database:** DuckDB
- **Data Processing:** Pandas, openpyxl
- **LLM Integration:** OpenAI SDK, httpx (for Ollama)
- **Package Manager:** uv
- **Linting:** Pylint (configured via `.pylintrc`)
