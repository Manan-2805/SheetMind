# AI changelog

- F1: Use Electron's assigned API URL for REST requests, the datasource WebSocket, and chat charts. Standalone Vite development uses the loopback fallback.
- F2: Enforce the Electron launch token, listener host, permitted origins, and canonical usernames. Hide the OpenAI key in settings responses and retain it on blank updates. Support a temporary data root for tests.
- F3: Validate analytical SQL against the imported table catalog, lock DuckDB external access, interrupt long-running queries, and fetch capped pages. Spreadsheet import registers its DataFrame explicitly under the locked configuration.
- F4: Validate AI spreadsheet plans and apply their filters, expressions, and edits as data. The editor displays the plan summary and reloads the sheet after applying a change.
