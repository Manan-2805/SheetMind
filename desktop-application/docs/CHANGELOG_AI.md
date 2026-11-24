# AI changelog

- F1: Use Electron's assigned API URL for REST requests, the datasource WebSocket, and chat charts. Standalone Vite development uses the loopback fallback.
- F2: Enforce the Electron launch token, listener host, permitted origins, and canonical usernames. Hide the OpenAI key in settings responses and retain it on blank updates. Support a temporary data root for tests.
- F3: Validate analytical SQL against the imported table catalog, lock DuckDB external access, interrupt long-running queries, and fetch capped pages. Spreadsheet import registers its DataFrame explicitly under the locked configuration.
- F4: Validate AI spreadsheet plans and apply their filters, expressions, and edits as data. The editor displays the plan summary and reloads the sheet after applying a change.
- F5: Read AI edit input from disk, preserve existing worksheet formatting, publish workbook changes atomically, and retain 20 backups per file. The editor restores by history ID and identifies read-only formats.
- F6: Cap and stream local and HTTP uploads, accept CSV and XLSX, and constrain chart downloads to PNG files in the chart directory.
- F7: Keep colliding sheet names distinct, normalize raw column headers, and import all workbook sheets in one transaction with sheet-specific errors.
- F8: Apply validated settings imports without credentials, clear imported files and backup history, and remove chart images and prompt logs when clearing chats.
