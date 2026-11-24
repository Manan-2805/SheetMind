# SheetMind

A cross-platform application that lets users query, visualize, and export Excel data using natural language — powered by OpenAI or a local Ollama model, with zero setup required.

## Project Structure

This repository is divided into two main applications:

- [Desktop Application](./desktop-application/README.md): A standalone desktop version built with Electron, React, and Python (FastAPI + DuckDB).
- [Web Application](./web-application/README.md): A cloud-based web version built with React and Python (FastAPI + PostgreSQL).

### Component Documentation

- **Desktop App**
  - [Frontend](./desktop-application/frontend/README.md)
  - [Backend](./desktop-application/backend/README.md)
- **Web App**
  - [Frontend](./web-application/frontend/README.md)
  - [Backend](./web-application/backend/README.md)

## Global Requirements

- **uv**: Used for fast Python package management.
- **Node.js**: Required for frontend development.

## Common commands

Run these from the repository root. Use GNU Make with a POSIX shell such as Git Bash on Windows. Desktop development also needs uv and a Vite-compatible Node.js version. Web development uses Docker Compose and the local configuration described in the [web guide](./web-application/README.md).

| Command | What it runs |
| --- | --- |
| `make help` | Show the workflow shortcuts |
| `make desktop-setup` | Install locked desktop dependencies |
| `make desktop` | Start Vite, Electron and the local API |
| `make desktop-test` | Run the desktop backend tests |
| `make desktop-build` | Build the desktop UI |
| `make desktop-package VERSION=1.2.3` | Build a native installer in `desktop-application/electron/dist` |
| `make web-setup` / `make web` | Build development images / start the web stack at `http://localhost` |
| `make web-logs` / `make web-stop` | Follow development logs / stop its services |
| `make web-build` / `make web-prod` | Build production images / start the production stack |
| `make check` | Run both apps' available tests, lint, formatting and type checks |

Use `make -C desktop-application help` and `make -C web-application help` for app-specific targets.
