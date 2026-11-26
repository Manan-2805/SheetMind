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

Open [http://localhost:8000](http://localhost:8000/). Use `make web-restart` after changing `.env`, `make web-logs` to follow logs, `make web-ps` for status, and `make web-stop` to stop services while preserving the database volume.

Use `make web-build` to build production images, `make web-prod` to start them on port 80, and `make web-prod-restart` to apply changes to `.env`. Use separate Compose project names when isolating dev and production data. Set `WEB_HOST_PORT` to change the published port. An optional gitignored `web-application/.env.local` can supply defaults that `web-application/.env` overrides.

The web API applies Alembic migrations before accepting requests in both Docker stacks. Use `make web-migrate` or `make web-prod-migrate` to apply migrations manually to a running stack. To deploy new backend code or migrations to the production stack, run `make web-build SERVICES=backend` followed by `make web-prod-restart`.

The `/download` page is public. After a native desktop build, run `make web-stage-downloads VERSION=1.0.0` from the repository root. It copies the available x64 installers into the gitignored `web-application/downloads` directory served by Docker. In production, place the installers in that directory on the web host or mount a release directory through `WEB_DOWNLOADS_DIR`. Visitors can download whichever installers are present.

The website and desktop app can be used without a Google account. Desktop profiles live on the device.

For local code checks or a standalone frontend build, run `make web-setup-local`, then `make web-check` or `make web-build-ui`.
