# Desktop audit round 1 status

- Base: `f7a03b7`. Worktree was clean before creating `bugfix/audit-round-1` from `origin/main`.
- Baseline: Ruff 0.15.14 reported 29 findings, 12 safe fixes, and 4 files needing formatting. Pylint reported 33 diagnostics and scored 9.86/10. TypeScript emitted no diagnostics. Biome reported 286 errors, 64 warnings, and 16 infos.
- Baseline Vite: 1.08 kB runtime, 2,405.52 kB entry JS (662.47 kB gzip), 10,157.41 kB Univer JS (2,602.91 kB gzip), 87.76 kB entry CSS, and 81.74 kB Univer CSS. Vite reported the duplicate chat API import and chunk sizes above 500 kB.
- Baseline runtime: generated XLSX upload and fake-LLM question passed through a loopback Uvicorn server. The 500,000-row CSV query took 0.639 s wall time and peaked at 431.1 MiB process RSS.
- F1 (`24e1a63`): URL wiring passed a Node smoke test with a non-default port. Only the standalone dev fallback contains backend port 8000.
- F2: six regression tests failed before the changes and passed afterward. Packaged Electron origin verification is in progress.
- Next item: F3 SQL validation, paging, and interruption.

Reports are kept under `desktop-application/docs/` to follow the desktop-only scope.
