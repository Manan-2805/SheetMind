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
- F10: two privacy tests pass. Replaced 11 backend print calls and seven remaining silent generic catches. Prompt files contain metadata and expire after seven days.
- Next item: P1 move synchronous DB work off the event loop.

Reports are kept under `desktop-application/docs/` to follow the desktop-only scope.
