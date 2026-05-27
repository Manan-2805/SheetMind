# SheetMind Desktop Application

The desktop version of SheetMind, offering a zero-setup local experience. It bundles a React frontend, a FastAPI Python backend, and an Electron wrapper to provide a seamless standalone application. Local data is managed using DuckDB.

## Architecture

- **[Frontend](./frontend/README.md)**: Built with React, TypeScript, and Vite.
- **[Backend](./backend/README.md)**: Built with FastAPI, utilizing DuckDB for local Excel querying and data generation.
- **Electron**: Used to package the frontend and backend into a single executable.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- `uv` (Python package manager)

### Running the Application Locally

You can run the frontend and backend separately during development.

**1. Start the Backend**
```powershell
cd backend
# Create and activate virtual environment if not present
uv venv
.\.venv\Scripts\activate
# Install dependencies
uv pip install -e .
# Run the server
python -B main.py
```

**2. Start the Frontend**
```powershell
cd frontend
npm install
npm run dev
```

### Building the Application
To build the complete desktop executable, run the build script:
```powershell
.\build.ps1
```
