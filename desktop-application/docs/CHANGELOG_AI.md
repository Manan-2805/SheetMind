# AI changelog

- Use completed workbook schema for untagged chat, preserve selected file references, and separate SQL generation and retry time from database execution. Stop chat at the provider or SQL worker, cap request time, and summarize small results without another model call.
- Match the landing page's clear glass surfaces and overlay the content with a readable, rounded chat history drawer beside navigation.
- Commit active grid edits before saving, download the saved workbook copy, and show a loading state during AI edit preview.

- Add a loopback Docker preview of the desktop renderer and API with its own data volume and a mock-provider CI smoke test.
- Keep bounded logs at a stable path and report chat failures with diagnostic references. Use larger desktop typography and translucent glass surfaces.

- Provider settings: store an OpenAI-compatible base URL and exact model ID, test with a chat completion, and use the endpoint across chat, dashboards, and spreadsheet edits. Clear the previous key when changing endpoints without supplying a new key.
- Manual testing: generate six related synthetic workbooks, a ZIP, and a guide with expected results through Make.
- Windows packaging: bundle large dependencies as bytecode and ship the standalone backend inside NSIS so the installer performs compression once.

- Native packaging: pass the requested version to PowerShell, package only the backend executable, and give Linux and Windows installers explicit platform and architecture names. Freeze large Python dependencies as bytecode in Linux builds to limit native compilation overhead.
- Native startup: wait for the local API to report healthy before opening the window, resolve the logo through Vite, and use bundled fonts on first launch.
- Native live updates: normalize Electron's packaged WebSocket origin on the local datasource connection while keeping the launch token requirement.

- F1: Use Electron's assigned API URL for REST requests, the datasource WebSocket, and chat charts. Standalone Vite development uses the loopback fallback.
- F2: Enforce the Electron launch token, listener host, permitted origins, and canonical usernames. Hide the OpenAI key in settings responses and retain it on blank updates. Support a temporary data root for tests.
- F3: Validate analytical SQL against the imported table catalog, lock DuckDB external access, interrupt long-running queries, and fetch capped pages. Spreadsheet import registers its DataFrame explicitly under the locked configuration.
- F4: Validate AI spreadsheet plans and apply their filters, expressions, and edits as data. The editor displays the plan summary and reloads the sheet after applying a change.
- F5: Read AI edit input from disk, preserve existing worksheet formatting, publish workbook changes atomically, and retain 20 backups per file. The editor restores by history ID and identifies read-only formats.
- F6: Cap and stream local and HTTP uploads, accept CSV and XLSX, and constrain chart downloads to PNG files in the chart directory.
- F7: Keep colliding sheet names distinct, normalize raw column headers, and import all workbook sheets in one transaction with sheet-specific errors.
- F8: Apply validated settings imports without credentials, clear imported files and backup history, and remove chart images and prompt logs when clearing chats.
- F9: Scope datasource and chat WebSocket notifications to their user, including notifications from background imports and when the desktop client switches users.
- F10: Make prompt diagnostics opt-in and content-free with seven-day retention, replace silent failures and print calls with logger messages, and expose actionable dashboard parse errors.
- P1: Move synchronous database work to threaded endpoints and workers while preserving each request's username context.
- P2: Reuse OpenAI clients by key and a common Ollama HTTP pool, with provider connection cleanup at shutdown.
- P3: Load the Excel editor and Dashboards on demand and use one static chat API import in the history drawer. Remove unused Handsontable dependencies.
- P3 follow-up: Let Vite split the workbook dependencies with the lazy editor route so the entry HTML does not preload Univer.
- Part C: Remove unused chat fixtures, resolve Ruff findings, and enable Biome parsing for Tailwind directives.
- Part C: Block off-app Electron navigation and windows, open HTTP links in the default browser, and stop the backend on normal quit and shutdown signals.
- Added root and app-specific Make targets for setup, development, tests, checks, and builds. The desktop launcher closes Vite with Electron, and native packaging passes the version to Electron Builder without rewriting dependency manifests.
- Enabled installation of the locked native Vite binding in the web image builder so development and production images can build.
