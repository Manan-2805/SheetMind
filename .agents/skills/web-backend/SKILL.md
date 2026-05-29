---
name: web-backend
description: Skill guide and architecture rules for the SheetMind Web FastAPI backend.
---
# Web Backend Skill

## Overview
The web application backend of SheetMind provides the REST API that powers the cloud-hosted web version of the product. Built with FastAPI, it handles user authentication (Google OAuth), session management (JWT), PostgreSQL database interactions via SQLAlchemy, and Alembic for schema migrations.

## When to Use
Use this skill when developing, refactoring, or reviewing code in the `web-application/backend/` directory.

## Instructions
- Standard 3-layer architecture: Routers (Controllers) → Services (Business Logic) → Database/Models.
- **Routing:** API endpoints are modularized using `APIRouter` inside `app/routers/` and included in `main.py` under the `/api` prefix.
- **Data Validation:** Pydantic models (`schemas/`) are strictly used for validating request payloads and formatting responses.
- **Database Interaction:** PostgreSQL using SQLAlchemy ORM. Migrations managed strictly by Alembic. `get_db` dependency injects the session into routers.
- **Authentication:** Google OAuth2 flow returning JWT access tokens. Tokens are set in HTTP-only cookies. Protected routes use the `get_current_user` dependency.

### How to add a new API endpoint + schema + service:
1. Create Pydantic schemas for request and response in `app/schemas/`.
2. Add business logic functions in `app/services/`.
3. Create or update a router in `app/routers/` using `@router.get/post` and inject `Depends(get_db)`.
4. Include the router in `app/main.py` if it's a new file.

### How to work with the database:
1. Add a new model class inheriting from `Base` in `app/models/`.
2. Run `alembic revision --autogenerate -m "description"` to generate a migration.
3. The migration is applied automatically on app startup via the lifespan context manager.
4. Query the DB inside services using the `Session` object.

## Output Format
- `snake_case` for files and folders (e.g., `auth_service.py`, `user_service.py`).
- **Import order rules:** (1) System imports, (2) Third-party imports, (3) Local imports (`app.config`). Groups separated by a blank line, sorted alphabetically.
- Comprehensive type hints are required for all function arguments and return types.

## Examples & Notes

> [!WARNING] Strict Rules
> - **DO NOT** create direct DB connections in routers; always inject `Session = Depends(get_db)` and pass it to services.
> - **DO NOT** put complex business logic in the `routers/` folder. It belongs in `services/`.
> - **ALWAYS** write Alembic migrations for any model changes. Do not use `Base.metadata.create_all()` in production code.
> - **ALWAYS** follow the strict import sorting rule.
> - **NEVER** add emojis in code or comments.
> - **NEVER** add task completion comments (e.g., "Task X: Done").
> - **ALWAYS** use `uv` for package management and run Python code with `-B` flag.
