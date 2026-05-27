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
