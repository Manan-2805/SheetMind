# SheetMind Desktop Application

The desktop version of SheetMind, offering a zero-setup local experience. It bundles a React frontend, a FastAPI Python backend, and an Electron wrapper to provide a seamless standalone application. Local data is managed using DuckDB.

## Architecture

- **[Frontend](./frontend/README.md)**: Built with React, TypeScript, and Vite.
- **[Backend](./backend/README.md)**: Built with FastAPI, utilizing DuckDB for local Excel querying and data generation.
- **Electron**: Used to package the frontend and backend into a single executable.

## Development and packaging

Install GNU Make, uv, and Node.js 20.19+ or 22.12+. On Windows, use a POSIX shell such as Git Bash for Make. [Vite Node.js requirements](https://vite.dev/guide/#scaffolding-your-first-vite-project)

Run from the repository root:

```sh
make desktop-setup
make desktop
```

The development launcher waits for Vite before opening Electron. Closing Electron stops Vite. Use `make desktop-api` and `make desktop-ui` for browser-only development in separate terminals.

Run `make desktop-package VERSION=1.2.3` on the target OS to build an installer into `desktop-application/electron/dist`. Native builds use the existing Nuitka and Electron Builder toolchains. Close SheetMind before packaging if the OS holds its build files open.
