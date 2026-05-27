# SheetMind Web Application

The cloud-based web version of SheetMind. It features a React frontend and a robust FastAPI backend backed by a PostgreSQL database, designed to be deployed via Docker.

## Architecture

- **[Frontend](./frontend/README.md)**: Built with React, TypeScript, and Vite.
- **[Backend](./backend/README.md)**: Built with FastAPI, utilizing PostgreSQL for robust data management and Alembic for migrations.
- **Docker**: Containerized setup with `docker-compose`.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- `uv` (Python package manager)
- Docker Desktop (for running PostgreSQL and containerized services)

### Running Locally with Docker (Recommended)

To spin up the entire web application (frontend, backend, database) using Docker:
```powershell
docker-compose up --build
```

### Running Locally for Development (Manual)

**1. Database**
Ensure you have a PostgreSQL instance running or start one via Docker. Set the environment variables in `.env` based on `.env.example`.

**2. Start the Backend**
```powershell
cd backend
uv venv
.\.venv\Scripts\activate
uv pip install -e .
alembic upgrade head
# Start server using the standard uvicorn command
uvicorn app.main:app --reload
```

**3. Start the Frontend**
```powershell
cd frontend
npm install
npm run dev
```
