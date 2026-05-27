# Web Backend - Skill Guide for Sheetmind

## Project Overview
The web application backend of Sheetmind provides the REST API that powers the cloud-hosted web version of the product. Built with FastAPI, it handles user authentication (Google OAuth), session management (JWT), PostgreSQL database interactions via SQLAlchemy, and Alembic for schema migrations. It serves as the primary conduit for the web frontend to interact with the core natural language-to-SQL logic, ensuring multi-user isolation, security, and scalability.

## Folder Structure
```bash
web-application/backend/
├── alembic/              # Database migration scripts and environment
├── app/
│   ├── dependencies/     # FastAPI Depends injectables (e.g., get_current_user)
│   ├── middleware/       # Custom middlewares (CORS, IP Block, Rate limit, Security)
│   ├── models/           # SQLAlchemy ORM definitions (e.g., User)
│   ├── routers/          # API endpoints organized by domain (auth, user, health)
│   ├── schemas/          # Pydantic models for request/response validation
│   ├── services/         # Business logic layer (auth_service, user_service)
│   ├── utils/            # Shared utilities (jwt, response wrappers)
│   ├── config.py         # Application configuration (pydantic-settings)
│   ├── database.py       # Database connection setup and session factory
│   └── main.py           # FastAPI application entry point and lifespan events
├── alembic.ini           # Configuration for Alembic migrations
├── pyproject.toml        # Dependencies and project metadata (uv)
└── uv.lock               # Lockfile for precise dependency management
```

## Core Packages, Files & Responsibilities
- `app/main.py`: Bootstraps FastAPI, configures middlewares, registers routers, applies Alembic migrations on startup, and defines global exception handlers.
- `app/config.py`: Centralized settings management using `pydantic-settings`. Loads environment variables.
- `app/database.py`: SQLAlchemy setup, `SessionLocal` factory, and database initialization logic.
- `pyproject.toml`: Manages dependencies including FastAPI, SQLAlchemy, Alembic, psycopg2-binary, authlib, slowapi, and pydantic.

## Architecture & Design Patterns
- **Overall architecture:** Standard 3-layer architecture: Routers (Controllers) → Services (Business Logic) → Database/Models.
- **Routing:** API endpoints are modularized using `APIRouter` inside `app/routers/` and included in `main.py` under the `/api` prefix.
- **Data Validation:** Pydantic models (`schemas/`) are strictly used for validating request payloads and formatting responses.
- **Business Logic:** Placed in the `app/services/` layer (e.g., `auth_service.py`), keeping routers thin and focused on HTTP concerns.
- **Database Interaction:** Relational database (PostgreSQL) using SQLAlchemy ORM. Migrations managed strictly by Alembic. `get_db` dependency injects the session into routers.
- **Authentication:** Google OAuth2 flow returning JWT access tokens. Tokens are set in HTTP-only cookies. Protected routes use the `get_current_user` dependency.
- **Security & Rate Limiting:** Utilizes `slowapi` for endpoint rate limiting based on client IP. Custom middlewares handle security headers, real IP resolution, maintenance mode, and IP blocking.
- **Error Handling:** Global exception handlers in `main.py` for standardizing error responses (422, 429, 500) using a unified `error_response` utility.

## Coding Standards & Conventions
- **File & folder naming conventions:** `snake_case` for files and folders (e.g., `auth_service.py`, `user_service.py`).
- **Component structure:** Keep files focused. Models represent DB tables, schemas represent API contracts.
- **Import order rules:** 
  1. System imports (e.g., `logging`, `os`).
  2. Third-party imports (e.g., `fastapi`, `sqlalchemy`).
  3. Local imports (e.g., `app.config`, `app.models`).
  (Groups should be separated by a blank line. Sort alphabetically within groups).
- **Type Hinting:** Comprehensive type hints are required for all function arguments and return types.
- **Dependency Management:** Use `uv` for package management. Always pin dependencies in `pyproject.toml`.
- **Environment Execution:** Run python code with the `-B` flag to avoid creating `.pyc` files.
- **Comments & Logging:** No unnecessary comments like "Task 1: Done". Use logical comments only. Use Python's standard `logging` module. No emojis in code or comments.

## Key Utilities & Helpers
- `app.utils.response.success_response` / `error_response`: Standardized JSON wrappers for API responses.
- `app.utils.jwt.create_access_token`: Generates JWTs for authenticated sessions.
- `app.dependencies.auth.get_current_user`: Secures endpoints by verifying the JWT cookie and returning the DB user object.
- `slowapi.Limiter`: Protects against brute-force and abuse by rate-limiting requests.

## Common Implementation Patterns
- **How to add a new API endpoint + schema + service:**
  1. Create Pydantic schemas for request and response in `app/schemas/`.
  2. Add business logic functions in `app/services/`.
  3. Create or update a router in `app/routers/` using `@router.get/post` and inject `Depends(get_db)`.
  4. Include the router in `app/main.py` if it's a new file.
- **How to work with the database:**
  1. Add a new model class inheriting from `Base` in `app/models/`.
  2. Run `alembic revision --autogenerate -m "description"` to generate a migration.
  3. The migration is applied automatically on app startup via the lifespan context manager.
  4. Query the DB inside services using the `Session` object.
- **How to handle background tasks:** Keep them outside the synchronous request cycle or use FastAPI's `BackgroundTasks`.

## Agent Rules (Strict)
- **DO NOT** create direct DB connections in routers; always inject `Session = Depends(get_db)` and pass it to services.
- **DO NOT** put complex business logic in the `routers/` folder. It belongs in `services/`.
- **ALWAYS** write Alembic migrations for any model changes. Do not use `Base.metadata.create_all()` in production code.
- **ALWAYS** follow the strict import sorting rule (System -> Third-party -> Local, alphabetically sorted, line spaced).
- **NEVER** add emojis in code or comments.
- **NEVER** add task completion comments (e.g., "Task X: Done").
- **ALWAYS** use `uv` for package installation and manage virtual environments appropriately.
- **ALWAYS** run python code with `-B` flag to avoid `.pyc` generation.

## Tech Stack & Tools
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy (v2.0+)
- **Migrations:** Alembic
- **Validation:** Pydantic (v2)
- **Package Manager:** uv
- **Auth:** authlib, python-jose (JWT)
- **Rate Limiting:** slowapi
- **Server:** uvicorn
