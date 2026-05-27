# SheetMind Desktop Backend

This is the backend component for the SheetMind desktop application. It is built with FastAPI and utilizes DuckDB to query Excel files locally without requiring a full database server.

## Prerequisites
- Python (v3.10+)
- `uv` (Fast Python package manager)

## Setup and Installation

1. Navigate to the backend directory:
   ```powershell
   cd desktop-application/backend
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

## Development Server

To run the FastAPI server without generating `.pyc` files:
```powershell
python -B main.py
```
*(Ensure the virtual environment is activated before running).*

## Technologies Used
- Python
- FastAPI
- DuckDB
- Ruff (Linting/Formatting)
