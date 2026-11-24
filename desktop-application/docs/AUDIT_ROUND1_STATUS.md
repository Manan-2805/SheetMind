# Desktop audit round 1 status

- Base: `f7a03b7`. Worktree was clean before creating `bugfix/audit-round-1` from `origin/main`.
- Baseline: Ruff 0.15.14 reported 29 findings, 12 safe fixes, and 4 files needing formatting. Pylint reported 33 diagnostics and scored 9.86/10. TypeScript emitted no diagnostics. Biome reported 286 errors, 64 warnings, and 16 infos.
- Baseline Vite: 1.08 kB runtime, 2,405.52 kB entry JS (662.47 kB gzip), 10,157.41 kB Univer JS (2,602.91 kB gzip), 87.76 kB entry CSS, and 81.74 kB Univer CSS. Vite reported the duplicate chat API import and chunk sizes above 500 kB.
- Baseline runtime: generated XLSX upload and fake-LLM question passed through a loopback Uvicorn server. The 500,000-row CSV query took 0.639 s wall time and peaked at 431.1 MiB process RSS.
- F1 (`24e1a63`): URL wiring passed a Node smoke test with a non-default port. Only the standalone dev fallback contains backend port 8000.
- F2 (`5a3dca0`): six regression tests failed before the changes and passed afterward. The staged packaged Electron runtime could not start because its native NSS, NSPR, and ALSA libraries are unavailable.
- F3 (`7bb6039`): guarded all seven untrusted SQL execution paths. The focused suite passed and the same loopback benchmark measured 0.064 s and 246.3 MiB peak RSS.
- F4 (`301b8bc`): structured editing plans replace executable strings. Nine operation and safety tests pass, and TypeScript reports no errors.
- F5 (`f2bce90`): seven workbook regressions failed on the previous implementation and pass after the changes. Tests use disposable workbooks and data. TypeScript reports no errors.
- F6 (`43f8d56`): four upload and chart path tests pass. The locked backend has neither xlrd nor odfpy, so new XLS and ODS uploads return 415.
- F7 (`84006ce`): four tests failed on the old importer and pass with collision-safe sheet names, original headers, and transaction rollback on sheet errors.
- F8 (`ba4164f`): three tests failed before implementation and pass afterward. Settings import persists allowed fields, and cleanup removes the associated files and rows.
- F9 (`ec2cee5`): the two-user regression reproduced cross-user sends and passes with username-scoped subscriptions.
- F10 (`fbaf96c`): two privacy tests pass. Replaced 11 backend print calls and seven remaining silent generic catches. Prompt files contain metadata and expire after seven days.
- P1 (`06cb0b0`): 43 tests pass. The health regression measured 418 ms before the fix and passed the 200 ms budget while the slow request was still pending. Concurrent users kept separate databases.
- P2 (`55410b7`): the fake-client test verifies per-key OpenAI reuse, one Ollama pool, and closure at shutdown.
- P3 (`430d97e`): lazy Excel and Dashboards routes build successfully. Vite's duplicate chat API import warning is gone. Dependency removals are recorded in `DEPENDENCY_CHANGES.md`.
- P4: skipped after a 500,000-row comparison showed different account-code and date types. Pandas took 0.183 s and DuckDB auto-detect took 0.072 s. Both produced 500,000 rows.
- Part C lint: Ruff is clean, unused chat fixtures are gone, and Biome parses both Tailwind stylesheets. Biome reported 275 errors, 59 warnings, and 16 infos after formatting, with no added errors by rule and file.
- Next item: commit and verify Electron navigation and quit handling.

Reports are kept under `desktop-application/docs/` to follow the desktop-only scope.
