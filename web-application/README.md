# SheetMind Web Application

The cloud-based web version of SheetMind. It features a React frontend and a robust FastAPI backend backed by a PostgreSQL database, designed to be deployed via Docker.

## Architecture

- **[Frontend](./frontend/README.md)**: Built with React, TypeScript, and Vite.
- **[Backend](./backend/README.md)**: Built with FastAPI, utilizing PostgreSQL for robust data management and Alembic for migrations.
- **Docker**: Containerized setup with `docker-compose`.

## Development and production

Use Docker with the Compose plugin. Create `web-application/.env` using the repository template and set the values for your local stack.

From the repository root, run:

```sh
make web-setup
make web
```

Open `http://localhost`. Use `make web-logs` to follow logs, `make web-ps` for status, and `make web-stop` to stop services while preserving the database volume.

Use `make web-build` to build production images and `make web-prod` to start them. Use separate Compose project names when isolating dev and production data. Both configurations use host port 80, so stop one before starting the other on the same host.

For local code checks or a standalone frontend build, run `make web-setup-local`, then `make web-check` or `make web-build-ui`. Use `make web-migrate` to apply Alembic migrations to the running development stack.
