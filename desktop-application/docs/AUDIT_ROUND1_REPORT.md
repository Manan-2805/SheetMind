# SheetMind desktop audit round 1

Branch `bugfix/audit-round-1` from `origin/main` (`f7a03b7`). Tests used disposable data and synthetic LLM responses. The web tree and database schema were untouched.

| Item | Status | Commit | Verification |
|---|---|---|---|
| F1 API URL | Done | `24e1a63` | Node dynamic-port REST, WebSocket and chart URL assertions |
| F2 Local API | Partial | `5a3dca0` | `LocalApiTests` plus authenticated loopback HTTP, WebSocket and PNG. Native packaged origin unverified |
| F3 SQL guard | Done | `7bb6039` | `SqlGuardTests` covers SELECT, CTEs, paging, blocked SQL, locked pandas import and interrupt |
| F4 Safe edits | Done | `301b8bc` | `ExcelOperationsTests` exercises all seven types, validation and absence of dynamic Python execution |
| F5 Workbook saves | Done | `f2bce90` | `ExcelDiskTests` covers disk input, styled saves, atomic failure, history restore and retention |
| F6 Uploads | Done | `43f8d56` | `UploadTests` covers caps, partial cleanup, supported types, schemes and chart paths |
| F7 Import correctness | Done | `84006ce` | `ImportNamingTests` covers Excel and CSV headers, sheet collisions and rollback |
| F8 Cleanup | Done | `ba4164f` | `DesktopCleanupTests` covers settings import and generated-file cleanup |
| F9 WebSocket isolation | Done | `ec2cee5` | `test_two_users_receive_only_their_own_events` and loopback sockets |
| F10 Privacy | Done | `fbaf96c` | `LoggingPrivacyTests` covers opt-in, retention and provider errors. Replaced 11 prints and seven remaining silent generic catches |
| P1 Event loop | Done | `06cb0b0` | `test_concurrent_requests_keep_user_context`, `test_health_responds_while_database_work_is_running` |
| P2 Client reuse | Done | `55410b7` | `test_clients_are_reused_by_provider_and_closed` |
| P3 Bundle | Done | `430d97e`, `a30a04c` | TypeScript, Vite, zero Handsontable imports, entry HTML preload assertion |
| P4 Native CSV | Skipped | — | 500,000 rows each. Pandas 0.183 s, native 0.072 s. Account codes changed BIGINT to VARCHAR and dates changed VARCHAR to DATE |
| Part C | Partial | `b0a729a`, `fadf4d5` | Ruff, Biome comparison, Node syntax and lifecycle simulation passed. Native quit unverified |

## Gates and measurements

| Check | Before | After |
|---|---:|---:|
| Ruff lint / files needing formatting | 29 / 4 | 0 / 0 |
| Pylint diagnostics / score | 33 / 9.86 | 13 / 9.96, nonzero exit |
| TypeScript errors | 0 | 0 |
| Biome errors / warnings / infos | 286 / 64 / 16 | 275 / 59 / 16, no added errors by rule and file |
| Initial JS, minified / gzip | 12,564.01 / 3,266.00 kB | 1,726.79 / 500.23 kB |
| Same 500k-row query, wall / peak process RSS | 0.639 s / 431.1 MiB | 0.064 s / 246.3 MiB after F3 |
| Health during slow DB work | 418 ms | Under 200 ms while work was pending |

Vite output in kB, minified / gzip. Entry `2405.52 / 662.47 → 1669.87 / 478.52`. Shared API `55.84 / 21.09`. Lazy Dashboards `831.01 / 213.17`. Lazy Excel `5363.89 / 1494.93` plus `81.74 / 12.63` CSS and on-demand dictionaries. The old Univer chunk was `10157.41 / 2602.91`. AG Grid contributes 1,846,719 rendered bytes before minification across Chat, Data Sources, Saved Queries and Artifacts. Univer contributes 7,930,135 such bytes in the Excel route's main chunk.

```text
ruff check .                        All checks passed!
ruff format --check .               56 files already formatted
python -B -m unittest discover -s tests -v
Ran 45 tests in 1.969s
OK
npx tsc -b --noEmit                  exit 0, no diagnostics
npm run format                      Checked 102 files in 27ms. No fixes applied.
npm run lint                        Found 275 errors. Found 59 warnings. Found 16 infos.
pylint                              Your code has been rated at 9.96/10
vite build                          built in 2.13s, large-chunk warning
```

Biome reported `useButtonType` 138, `noLabelWithoutControl` 48, `useExhaustiveDependencies` 23, `useKeyWithClickEvents` 18, `noStaticElementInteractions` 16, `noArrayIndexKey` 12, `noSvgWithoutTitle` 7, `noAutofocus` 4, `noDangerouslySetInnerHtml` and `useAriaPropsSupportedByRole` two each. One each for `useHookAtTopLevel`, `noAriaHiddenOnFocusable`, `useSemanticElements`, `noRedeclare`, and `useIterableCallbackReturn`. React Doctor's score API was unreachable. The pinned scan's error flagged the existing React Router `useLocation` value as a mutable global.

The real loopback fake-Ollama run passed XLSX upload, authenticated chart loading, chat paging, preview, apply, restore and two-user isolation. Its 500,000-row query used 0.120 s and 307.9 MiB peak RSS in a process that also rendered a chart. The repeatable regression is `test_fake_ollama_upload_query_preview_apply_restore`.

## Part D findings

Paths are relative to `desktop-application/` unless prefixed otherwise.

| ID | Severity | Evidence and proposed fix | Effort |
|---|---|---|---|
| D01 | High | `frontend/src/components/chat/ChatMessage.tsx:162,398` passes unescaped model output into HTML. Render formatted content as React nodes. | M |
| D02 | High | `web-application/backend/app/middleware/real_ip.py:8` and `web-application/nginx/nginx.prod.conf:38` trust a forwarded value used for blocks and limits. Configure trusted proxies and normalize client IP at the edge. | M |
| D03 | Medium | `backend/routers/dashboard_router.py:107` queries `natural_query` while the schema defines `nl_query`. Fix the binding and test naming with a saved query. | S |
| D04 | Medium | `backend/models/chat_models.py:1205,1682,1699` permits orphan messages and looks up branch anchors without session scope. Regeneration version allocation also spans separate reads and writes. Validate membership and make writes transactional. | M |
| D05 | Medium | `backend/services/duckdb_service.py:22,36` and `backend/services/background_tasks.py:145,159` expose close races, unawaited imports and resume limited to registered accounts. Coordinate cursor lifetimes and drain or persist the queue. | L |
| D06 | Medium | `backend/routers/artifacts_router.py:47` serves a persisted path without root validation. Resolve exports within the owner directory and handle missing files. | S |
| D07 | Medium | `backend/services/query_service.py:31` and `backend/models/data_source_models.py:149` assume scalar `pd.isna` results. Normalize nested values, Decimal and timestamps consistently. | M |
| D08 | Medium | `backend/services/chart_service.py:8,12,46` uses pyplot globals and selects Agg after importing pyplot. Isolate figures and initialize Agg before pyplot. | M |
| D09 | Medium | `frontend/src/api/apiClient.ts:10` sends raw usernames. Unicode account setup returned 200 while its UTF-8 username header returned 400. Define one Unicode-safe header encoding. | S |
| D10 | Medium | `electron/main.js:211` waits a fixed 1.5 s. `build-linux.sh:31` and `build-macos.sh:31` kill by process name. `.github/workflows/build-desktop.yml:69` interpolates the dispatch version in shell. Poll health, target owned processes and validate the version. | M |
| D11 | Low | `backend/routers/saved_queries_router.py:151` names exports to second precision and has no saved-query import route. Use collision-safe names and specify an import format. | M |
| D12 | Low | `backend/services/dashboard_service.py:138` strips UTC. `frontend/src/hooks/useExcelEditor.ts:196` relies on grid disposal for event cleanup. Preserve a UTC wire format and explicitly dispose subscriptions. | M |

A 10,000-character chat returned 400. Unicode setup returned 200 and the Unicode header returned 400. A Windows-style uppercase CSV filename imported. Empty CSV, corrupt XLSX and an XLSX with ZIP encryption flags entered error state. A formula-error workbook, 100-sheet workbook and generated 1M-row CSV completed. Two identical uploads completed under different IDs.

## Decisions and limits

The seven guarded SQL paths are chat create, regenerate, page and export, saved-query run and export, and widget refresh. Other nonconstant executions are internal query clauses or identifiers in `chat_models.py:374,428,644,1175`, `data_source_models.py:100,102,138,143`, `saved_query_models.py:66`, `settings_models.py:82`, `dashboard_service.py:55,215`, `excel_import_service.py:69`, and guarded wrappers in `sql_guard.py:80,83`. Exports use the configured cap. Explicit DataFrame registration works with external access locked. URL downloads permit private IPs as requested. XLS and ODS lack their optional engines and return 415.

The native Electron probe could not start because NSS, NSPR and ALSA libraries are missing. The loopback test verified token-gated `Origin: null`, and the Node simulation verified normal quit dispatch. Abrupt termination and native process-tree shutdown remain unverified.

Removed `handsontable@17.0.1` and `@handsontable/react@16.2.0`. Transitive removals were `@handsontable/pikaday`, `@types/trusted-types`, `bignumber.js`, `chevrotain`, `dompurify`, `hyperformula`, `moment`, `numbro`, `regexp-to-ast` and `tiny-emitter`. Versions are in [DEPENDENCY_CHANGES.md](DEPENDENCY_CHANGES.md). No packages were added or upgraded.

## Ten manual checks

1. In the backend directory run `export SHEETMIND_DATA_DIR="$(mktemp -d)"` and run `.venv/bin/python -B main.py`.
2. Start `.venv/bin/python -B -m uvicorn --app-dir tests audit_fake_ollama:app --host 127.0.0.1 --port 11435` and run `npm run dev` in the frontend.
3. Sign in as `alice`. Set Ollama to `http://127.0.0.1:11435` and model `audit-fake`. Enable automatic charts and set the row limit to two.
4. Create `audit.xlsx` with headers `label,amount` and six rows with amounts 1–6. Upload it and wait for completion.
5. Ask “Show the amounts” referencing `audit.xlsx`. Verify six total rows, a chart, and amounts 3 and 4 on page two.
6. Open the workbook in Excel Editor and ask “Add 10 to the amounts.” Verify the preview says six affected rows.
7. Apply the change. Verify the first amount is 11 and an existing cell style is preserved.
8. Open History, select the AI revision and restore it. Verify the first amount is 1.
9. Switch to `bob`. Verify Alice's files and chat are absent. Try an XLS or ODS upload and verify it is rejected.
10. On a host with Electron runtime libraries, launch the packaged app from the shell in step 1. Repeat steps 3–5 and verify charts load, HTTP links open externally, and quitting stops the backend.
