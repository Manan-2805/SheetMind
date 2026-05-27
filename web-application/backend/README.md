# SheetMind Web Backend

This is the backend component for the SheetMind web application. It is built with FastAPI and utilizes PostgreSQL for robust, scalable data management. Database migrations are handled by Alembic.

## Prerequisites
- Python (v3.10+)
- `uv` (Fast Python package manager)
- PostgreSQL database (can be run via Docker)

## Setup and Installation

1. Navigate to the backend directory:
   ```powershell
   cd web-application/backend
   ```
2. Create and activate a virtual environment using `uv`:
   ```powershell
   uv venv
   .\.venv\Scripts\activate
   ```
3. Install dependencies from `pyproject.toml`:
   ```powershell
   uv pip install -e .
   ```

## Database Migrations

Before running the server, ensure your database schema is up-to-date:
```powershell
alembic upgrade head
```

## Development Server

To run the FastAPI development server without generating `.pyc` files:
```powershell
# You can use uvicorn directly or via a module entry point
uvicorn app.main:app --reload
```
*(Ensure the virtual environment is activated and `.env` is properly configured).*

## Technologies Used
- Python
- FastAPI
- PostgreSQL (via SQLAlchemy)
- Alembic (Migrations)
- Ruff (Linting/Formatting)
