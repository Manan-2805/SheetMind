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

Run `make desktop-package VERSION=1.0.0` on the target OS. This installs the locked frontend and Electron dependencies, builds the Python backend with Nuitka, and writes the installer to `desktop-application/electron/dist`. Close SheetMind before packaging if the OS holds its build files open.

- **Linux** needs GCC, Make, and `patchelf`. If you use Debian's system Python, install its development headers (`python3-dev`). The x64 output is `SheetMind-1.0.0-linux-x86_64.AppImage`. On the target laptop, run `chmod +x SheetMind-1.0.0-linux-x86_64.AppImage` and then `./SheetMind-1.0.0-linux-x86_64.AppImage`. Build on a distribution with a glibc version at least as old as the one where you plan to run it. The repository's Linux build accepts `SHEETMIND_BUILD_JOBS` to limit the compiler's parallelism.
- **Windows** needs native Node.js, uv, GNU Make, and a Nuitka-supported C compiler. Run `make desktop-package VERSION=1.0.0` from PowerShell or Git Bash. For x64, run `SheetMind-1.0.0-windows-x64-setup.exe` from the output directory. The installer compresses the standalone backend once. Set `SHEETMIND_BUILD_JOBS` to override the default of four. Windows Developer Mode lets Electron Builder extract helper tools with symbolic links. [Nuitka platform requirements](https://nuitka.net/doc/user-manual.html)

## Test data and providers

Run `make desktop-test-data` to generate six related Excel workbooks, a test guide with expected results, and a ZIP in `desktop-application/test-data`. This directory is gitignored.

In **Settings → OpenAI-compatible**, enter the provider's API base URL, API key, and exact model ID. The base URL typically ends in `/v1`. Use **Test connection** to send a short chat completion probe without saving the draft, then save settings for use in chat, dashboards, and the Excel editor. Remote endpoints use HTTPS. Local providers can use HTTP on loopback. Enter a fresh key when changing endpoints.
