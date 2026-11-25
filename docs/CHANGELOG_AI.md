# AI changes

## Desktop packages and public downloads

- Fixed native Windows Make argument passing, included only the backend executable in installer resources, and gave Linux and Windows artifacts platform-specific names.
- Added a public download page and a Make target for staging the built Linux and Windows installers on the web host.
- Matched the staging path to Electron Builder's `x86_64` AppImage filename.
- Reused the locked Electron runtime already installed by npm during Linux and Windows packaging.
- Removed Google sign-in from the web frontend and API. Old frontend sign-in URLs redirect to downloads. Desktop startup uses local profiles.

## Web database startup

- Added the initial Alembic revision for users, blocked IPs, and request logs.
- The API waits for migrations before serving requests. A PostgreSQL advisory lock serializes concurrent workers and manual migration runs.
- Added `make web-prod-migrate` and documented how to rebuild only the web backend.

## Web Docker restart and Google OAuth

- Added Make targets that apply the current environment to development and production containers while preserving the database volume.
- Aligned the development proxy and frontend URL with the OAuth callback on port 8000. Google’s callback continues to come from the environment.
- Routed requests for the production frontend through the outer Nginx proxy and made the frontend health check use its dedicated endpoint.
