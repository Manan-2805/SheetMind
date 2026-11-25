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

- **Linux** needs GCC, Make, and `patchelf`. If you use Debian's system Python, install its development headers (`python3-dev`). The x64 output is `SheetMind-1.0.0-linux-x64.AppImage`. On the target laptop, run `chmod +x SheetMind-1.0.0-linux-x64.AppImage` and then `./SheetMind-1.0.0-linux-x64.AppImage`. Build on a distribution with a glibc version at least as old as the one where you plan to run it. The repository's Linux build accepts `SHEETMIND_BUILD_JOBS` to limit the compiler's parallelism.
- **Windows** needs native Node.js, uv, GNU Make, and Visual Studio Build Tools with Desktop development with C++. Open Git Bash on Windows and run `make desktop-package VERSION=1.0.0`. For x64, run `SheetMind-1.0.0-windows-x64-setup.exe` from the output directory. Windows Developer Mode lets Electron Builder extract its helper tools with symbolic links. [Nuitka platform requirements](https://nuitka.net/doc/user-manual.html)
