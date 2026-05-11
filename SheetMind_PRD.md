**SheetMind**

Product Requirements Document

_Version 1.1 · Desktop Application_

Windows · macOS · Linux

_Intelligence built into every sheet._

_v1.1 - Updated with implemented features, Excel mutation engine, and feature checklist_

# **1\. Product Overview**

## **1.1 Vision**

SheetMind is a cross-platform portable desktop application that lets users upload Excel files and query them using natural language. It converts queries into SQL, executes them against a local DuckDB database, and returns results as tables, charts, or downloadable Excel files - with no cloud dependency or complex setup. Users can also mutate Excel data and inject formulas using natural language, with a diff-preview and confirmation step before any changes are applied.

## **1.2 Target Platforms**

- Windows (x64)
- macOS (x64 + Apple Silicon universal binary)
- Linux (x64)

## **1.3 Distribution**

Portable: single installer or executable per platform. No external database server, no cloud backend required. Internet is only needed for OpenAI API calls when the user selects OpenAI as the LLM provider.

## **1.4 Core Tech Stack**

| **Layer** | **Technology**                 | **Rationale**                                       |
| --------- | ------------------------------ | --------------------------------------------------- |
| Shell     | Electron                       | Cross-platform desktop, spawns Python backend       |
| Frontend  | React + TypeScript + Vite      | Type safety, fast dev iteration, small bundles      |
| Styling   | Tailwind CSS v4 + shadcn/ui    | Utility-first with accessible Radix primitives      |
| Charts    | react-apexcharts (core import) | 10 chart types, built-in dark theme, tree-shakeable |
| Backend   | FastAPI + Uvicorn              | Async, streaming-friendly, easy to bundle           |
| Database  | DuckDB                         | Vectorized analytical queries, file-native          |
| LLM       | OpenAI API or Ollama (local)   | User's choice, full offline support via Ollama      |
| Packaging | PyInstaller + electron-builder | Battle-tested cross-platform bundling               |

# **2\. Architecture Overview**

## **2.1 Process Model**

Electron spawns a PyInstaller-bundled FastAPI process on startup. The frontend communicates with this backend over localhost. On quit, Electron terminates the child process cleanly.

## **2.2 Multi-User Model**

SheetMind supports multiple local user accounts. On first launch, the user enters a username. All subsequent launches show a list of existing accounts to select from. Each user account has a completely isolated DuckDB database file, upload folder, and settings - no data bleeds between accounts.

Future: Replace username-only login with Google OAuth. The multi-user infrastructure is already in place - auth upgrade is a swap of the login screen only.

## **2.3 Local Data Storage**

Data is stored per user under a shared app directory:

| **Path**                                       | **Contents**                                  |
| ---------------------------------------------- | --------------------------------------------- |
| ~/.sheetmind/users/{username}/main.duckdb      | All Excel data + app metadata for this user   |
| ~/.sheetmind/users/{username}/uploaded_excels/ | Copies of original Excel files                |
| ~/.sheetmind/users/{username}/exports/         | Generated Excel exports from query results    |
| ~/.sheetmind/users/{username}/charts/          | Saved chart images                            |
| ~/.sheetmind/users/{username}/.backups/        | Auto-versioned backups before Excel mutations |
| ~/.sheetmind/users/{username}/settings.json    | User preferences (theme, LLM config, limits)  |
| ~/.sheetmind/accounts.json                     | List of registered usernames for login screen |

## **2.4 Database Schema (DuckDB - per user)**

| **Table**     | **Purpose**               | **Key Columns**                                                                                                                            |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| excel_files   | Excel file registry       | id, original_filename, stored_path, uploaded_at, file_size_bytes                                                                           |
| excel_sheets  | Sheet to DuckDB table map | id, excel_file_id, sheet_name, table_name, row_count, col_count                                                                            |
| chat_sessions | Chat history sessions     | id, title, created_at, updated_at, is_favorite                                                                                             |
| chat_messages | Individual messages       | id, session_id, role, content, sql_generated, sql_execution_ms, llm_generation_ms, token_count_input, token_count_output, confidence_score |
| saved_queries | Labeled reusable queries  | id, label, nl_query, sql_query, use_count, last_used_at, is_favorite                                                                       |
| artifacts     | Exports and chart files   | id, type, filename, file_path, source_message_id, title, created_at                                                                        |
| edit_history  | Excel mutation audit log  | id, excel_file_id, sheet_name, operation_type, rows_affected, applied_at, backup_path, was_confirmed                                       |

## **2.5 NL to SQL Pipeline**

The core pipeline runs on every user query. Self-correction is limited to 2 retries.

- User types query with #filename reference in chat input
- Frontend parser extracts #refs and resolves them to DuckDB table names
- POST /query sends NL text + resolved table list to FastAPI
- Schema fetcher pulls column names, types, and 3 sample rows for referenced tables only
- Prompt builder injects schema + NL into a structured system prompt template
- LLM provider router sends to OpenAI or Ollama based on user settings
- LLM returns candidate SQL + a self-assessed confidence score (1-5)
- SQL executor runs the query on DuckDB. On error: send error back to LLM for correction (max 2 retries)
- Result returned to frontend as: table, auto-detected chart suggestion, Excel export option, NL summary

## **2.6 NL to Excel Mutation Pipeline**

A separate pipeline handles user requests that modify Excel data rather than query it. Triggered when the LLM classifies a message as a mutation intent.

- User describes a change in natural language (e.g. increase column D by 0.25 where column E is less than 50)
- Backend detects mutation intent and routes to excel_edit_service
- Schema fetcher pulls column names and types for the target sheet
- LLM generates a structured operation JSON (type, condition, target_column, expression)
- AST safety validator checks the expression against an allowlist of permitted node types
- Dry-run executed: rows that would be affected are identified, old and new values computed
- Diff payload sent to frontend: rows affected count, before/after table
- User reviews diff and confirms or cancels
- On confirm: pandas operation applied, file written back via openpyxl, DuckDB table refreshed, backup created
- On cancel: no changes applied, diff discarded

Security: All LLM-generated expressions are validated against an AST allowlist before eval. No imports, no file system access, no function calls beyond pandas column operations are permitted.

# **3\. Application Layout**

## **3.1 Shell Structure**

A 52px fixed left sidebar (icon-only, always visible) sits alongside the main content area. The sidebar never collapses. Tooltips appear on hover after a 300ms delay. All navigation is icon-based with no text labels.

## **3.2 Left Sidebar Navigation**

| **Position** | **Icon**  | **Label**     | **Action**                         | **Opens As**            |
| ------------ | --------- | ------------- | ---------------------------------- | ----------------------- |
| Top          | SquarePen | New chat      | Opens a fresh chat session         | Replaces main area      |
| Top          | Clock     | History       | Browse and search past sessions    | Slide-in drawer (220px) |
| Top          | Layers    | Artifacts     | View all exports and charts        | Slide-in drawer (280px) |
| Top          | Bookmark  | Saved queries | Browse and reuse labeled queries   | Slide-in drawer (300px) |
| Top          | Database  | Data sources  | Upload and manage Excel files      | Replaces main area      |
| Bottom       | Settings  | Settings      | Theme, LLM config, data management | Replaces main area      |

Active sidebar item: 36x36px violet background pill behind icon, 8px radius, white icon. Hover: bg-hover background, icon brightens, 120ms transition.

# **4\. Feature Specifications**

## **4.1 Onboarding / User Login**

Shown on first launch and when no active session exists in localStorage.

- Full-screen centered card with violet radial glow behind it.
- App logo, name SheetMind, and tagline displayed above the input.
- Input: What should we call you? - username only, no password.
- On submit: checks accounts.json for existing accounts and shows a list of previous users to select from. New users are added to the list.
- Account selection shows username + last login date. Clicking a name logs in immediately.
- Card fade-in + slide-up 12px animation on mount (300ms ease-out).

Planned upgrade: Replace username-only login with Google OAuth in v2. The multi-user infrastructure (per-user DuckDB, per-user folder) is already built to support this without structural changes.

## **4.2 Chat Page**

### **Empty state**

- Centered: SheetMind logo, tagline, and three suggestion chip buttons.
- Each chip pre-fills the chat input with a sample query on click.

### **Chat input**

- Multi-line textarea. Shift+Enter for newline, Enter to send.
- \# triggers a file autocomplete dropdown positioned at cursor using textarea-caret library.
- Dropdown shows filename rows with indented sheet name sub-rows. Two-level, keyboard-navigable (arrow keys, Enter, Escape).
- Send button: violet, disabled when empty or while streaming.
- Character counter appears above 2,000 characters only.

### **Message display**

- User messages: right-aligned, bg-hover background, rounded corners (bottom-right 2px), max 60% width.
- Assistant messages: left-aligned, violet circle S icon, no bubble background, full content width.
- Optimistic UI: user message appears in the list immediately before the API call returns.
- TypingIndicator: three pulsing dots + Generating SQL... text appears while the pipeline runs.

### **Result table**

- Inline sortable table below assistant message. Click column header to sort asc/desc.
- Configurable row display: user can set how many rows are shown (default 8, options 10, 25, 50, 100).
- Results above the row limit show: Showing N of M rows with export prompt.
- Alternating row backgrounds. 36px row height.
- NL summary: 1-2 sentence plain English interpretation below the table, in text-secondary italic.

### **Per-message action bar (hover to reveal)**

| **Action**      | **Icon**   | **Behaviour**                                                                                           |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Regenerate      | RotateCcw  | Re-sends the same NL query. Opens an optional input to add correction instructions before regenerating. |
| Like            | ThumbsUp   | Marks message positively, stored locally in DuckDB.                                                     |
| Dislike         | ThumbsDown | Marks negatively. Opens a one-line feedback input.                                                      |
| Export as chart | BarChart2  | Opens chart builder panel pre-loaded with this result set.                                              |
| Export to Excel | Download   | Generates .xlsx from result, saves to artifacts, shows toast.                                           |
| View SQL        | Code2      | Opens a read-only modal showing the generated SQL in JetBrains Mono.                                    |
| Save query      | Star       | Opens save-query dialog. Label is pre-filled by LLM, user can edit.                                     |

### **Debug info footer (collapsed by default)**

- Collapsed: small chevron row showing Query details.
- Expanded: input tokens / output tokens, LLM generation time (ms), SQL execution time (ms), confidence score (1-5 coloured dots: red 1-2, amber 3, green 4-5).
- Confidence 1 or 2: inline yellow warning banner above the result table.

## **4.3 Chart Builder**

Opens as a panel from the Export as chart action bar button or from the Artifacts page.

- Chart type dropdown: Bar, Horizontal Bar, Line, Area, Pie, Donut, Scatter, Histogram, Heatmap, Pivot.
- X-axis dropdown, Y-axis dropdown, Group by dropdown - populated from result column names.
- Color palette selector: 5 preset palettes. Primary colour is violet to match app theme.
- Title input pre-filled from the NL query text.
- Live preview updates as user changes settings.
- Auto-detection: backend sends a second lightweight LLM call after SQL execution to suggest chart type + axis mapping. User can accept or dismiss.
- Export as PNG button. Export as SVG button. Save to Artifacts button.

| **Chart type** | **Best for**                                |
| -------------- | ------------------------------------------- |
| Bar            | Categorical comparisons                     |
| Horizontal bar | Long category labels                        |
| Line           | Time series and trends                      |
| Area           | Cumulative trends                           |
| Pie            | Part-of-whole (7 or fewer categories)       |
| Donut          | Part-of-whole with center statistic         |
| Scatter        | Correlation between two numeric columns     |
| Histogram      | Distribution of a single numeric column     |
| Heatmap        | Two categorical axes with numeric intensity |
| Pivot table    | Grouped aggregations                        |

## **4.4 Chat History Drawer**

Slides in from left over the main content, 220px wide, 200ms ease-out. No backdrop.

- Search bar at top - filters sessions by title client-side.
- Favorites section pinned at top, collapsible with chevron.
- Sessions grouped by: Today, Yesterday, Last 7 days, Older.
- Per row: title (truncated), relative timestamp right-aligned.
- Row hover: slide-in star, edit (pencil), and trash icons from the right (120ms).
- Double-click title to rename inline.
- Delete shows a confirmation prompt.
- Active session: violet 2px left border + background-active.

## **4.5 Artifacts Page**

Slide-in drawer, 280px wide. Two tabs: Excel Exports and Charts.

### **Excel Exports tab**

- Filter by filename (search input) and date range picker.
- Each row: file icon, filename, source session name, file size, created date.
- Row hover actions: Download, Rename (inline), Delete (with confirmation), Preview (opens modal with first 50 rows), Generate Chart (opens chart builder pre-loaded with this file).

### **Charts tab**

- 2-column grid of thumbnail cards.
- Each card: chart preview thumbnail (violet-to-purple gradient placeholder), chart type badge, source session, date.
- Card hover: scale(1.02) + violet border, 150ms transition.
- Card click: opens full chart preview modal.
- Actions: Download PNG, Delete.

Artifacts are independent from chat sessions. Deleting a session does not delete its artifacts.

## **4.6 Saved Queries Drawer**

Slide-in drawer, 300px wide.

- Search input filters by label or NL query text.
- Time filter dropdown: All time, Today, Last 7 days, Last 30 days.
- Favorite toggle: star icon, pinned favorites section at top.

### **Per-query card shows**

- User label (editable inline on click).
- NL query text (2 lines max, truncated with ellipsis).
- Use count badge (e.g. x12) and last-used relative date.
- {} View SQL toggle: expands a JetBrains Mono code block below the card.

### **Per-query actions**

- Run: inserts the NL query into the current active chat input and sends immediately.
- Result appears at the right side of the drawer as a mini result panel with the table, save to artifacts button, and generate chart button.
- Rename label: inline edit.
- Delete: with confirmation.
- Favorite: toggles pinned state.

## **4.7 Data Sources Page**

Replaces the main content area. Full panel layout.

### **Upload zone**

- Drag-and-drop zone + Browse files button. Accepts .xlsx and .xls.
- Multiple file upload supported. Per-file indeterminate progress bar (violet, 4px height, 8px radius) during import.
- On completion: success checkmark animation per file, or error reason (Corrupted file, Password protected, etc.).

### **File list table**

| **Column** | **Notes**                                     |
| ---------- | --------------------------------------------- |
| Filename   | Expand chevron on left to show sheet sub-rows |
| Sheets     | Count of sheets, shown as a pill badge        |
| Rows       | Total rows across all sheets                  |
| Size       | File size in KB or MB                         |
| Uploaded   | Relative timestamp (e.g. 2 hours ago)         |
| Actions    | Preview, Delete (with confirmation)           |

### **Sheet sub-rows (expanded)**

- Indented 16px, violet 2px left border, bg-hover background.
- Shows: sheet name, row count, column count.
- Click to preview that specific sheet (opens modal with first 50 rows + SkeletonTable while loading).

### **Search and filter**

- Search by filename, filter by sheet count, row count, size, and upload date.

## **4.8 Excel Mutation via Natural Language**

Users can describe data changes in plain English and SheetMind will apply them to the source Excel file with a required confirmation step.

### **Supported mutation types**

- Value update: change column values based on conditions (e.g. increase column D by 0.25 where column E is less than 50).
- Formula injection: write Excel formulas into cells based on conditions (e.g. in column C where column D equals A, set formula: if E is greater than 50% of F then E plus F else F times 0.5).
- Row deletion: remove rows matching a condition (e.g. delete all rows where Status is Cancelled and RefundAmount is zero).
- Value fill: fill empty cells in a column based on adjacent column logic.

### **Mutation flow**

- User types a mutation request in the chat (the LLM classifies it as mutation intent).
- Backend generates a structured operation and performs a dry-run.
- Diff is returned: rows affected count, before/after value table.
- User reviews the diff preview in the chat and clicks Apply or Cancel.
- On Apply: change is written to the Excel file, DuckDB table is refreshed, a timestamped backup is created.
- On Cancel: nothing is changed.

### **Backup and restore**

- Before every write, a timestamped backup is created in .backups/ (e.g. Sales_Orders_20240315_143022.xlsx).
- Last 5 backups per file are retained. Older ones are auto-deleted.
- Restore previous version option available in the Data Sources page per file (opens a dropdown of available backup timestamps).

Security: LLM-generated expressions are validated via Python AST before execution. Only arithmetic, comparison, and pandas column operations are permitted. No imports or file system access.

## **4.9 Settings Page**

Replaces the main content area. Two-column layout: 180px left nav + content area.

### **Appearance**

- Theme segmented control: Light / Dark / System. Applied immediately and persisted.

### **LLM Provider**

- Segmented control at top: OpenAI / Ollama.
- OpenAI: masked API key input with show/hide toggle, Test Connection button (shows spinner during test, then green tick or red X inline for 3 seconds), model dropdown (gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini).
- Ollama: base URL input (default <http://localhost:11434>), Test Connection button, model dropdown (populated after successful test), Pull New Model (text input + Pull button + indeterminate violet progress bar).
- Active provider indicator: green dot = connected, red dot = not configured or unreachable.

### **Data configuration**

| **Setting**            | **Description**                                                                           | **Default** |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| Max Concurrent Uploads | How many Excel files can be importing at the same time                                    | 3           |
| Result Row Limit       | Maximum rows shown inline in the chat result table                                        | 500         |
| Clear Chat History     | Permanently delete all sessions and messages (3-second countdown confirmation)            | -           |
| Delete All Files       | Remove all uploaded Excel files and their DuckDB tables (3-second countdown confirmation) | -           |

API keys are stored in the OS keychain via Keytar (Electron). Never in plaintext files or environment variables.

# **5\. Feature Implementation Checklist**

Status key: Done = fully implemented and working | Partial = built but incomplete | Planned = not yet started | v2 = intentionally deferred

## **5.1 Authentication and User Management**

| **Feature**                            | **Status** | **Notes**                                         |
| -------------------------------------- | ---------- | ------------------------------------------------- |
| Username-only login screen             | **Done**   | Card animation, account list on return visit      |
| Multiple user account support          | **Done**   | Separate DuckDB per user, separate upload folder  |
| Account list on login (returning user) | **Done**   | Shows all registered usernames with last login    |
| Google OAuth login                     | **v2**     | Infrastructure ready, just needs auth screen swap |

## **5.2 Chat Page**

| **Feature**                               | **Status**  | **Notes**                                          |
| ----------------------------------------- | ----------- | -------------------------------------------------- |
| Empty state with suggestion chips         | **Done**    | Three pre-fill chips, centered layout              |
| \# file autocomplete dropdown             | **Done**    | Two-level file/sheet list, keyboard nav            |
| Optimistic user message display           | **Done**    | Message appears before API returns                 |
| Typing indicator (animated dots)          | **Done**    | Three pulsing dots + Generating SQL... text        |
| Result table with sortable columns        | **Done**    | Click header to sort asc/desc                      |
| Configurable result row count             | **Done**    | User can set rows shown: 8/10/25/50/100            |
| NL summary below result                   | **Done**    | 1-2 sentence plain English interpretation          |
| Regenerate with correction input          | **Done**    | Opens optional correction text before regenerating |
| Like / Dislike with feedback input        | **Done**    | Dislike opens one-line feedback field              |
| Export as chart (full chart builder)      | **Done**    | Chart type, axes, palette, PNG/SVG export          |
| Export to Excel (saves to Artifacts)      | **Done**    | Generates xlsx, saves to artifacts, toast shown    |
| View SQL query modal                      | **Done**    | Read-only JetBrains Mono code block                |
| Save query with AI-generated label        | **Done**    | LLM pre-fills label, user can edit before saving   |
| Debug info footer (tokens, timing, score) | **Done**    | Collapsed by default, confidence dots coloured     |
| Confidence warning banner                 | **Done**    | Yellow inline banner for score 1-2                 |
| Skeleton loaders for messages             | **Done**    | YouTube-style shimmer, matches message shape       |
| Auto chart type suggestion                | **Planned** | Second LLM call to suggest chart type post-query   |

## **5.3 Chat History Drawer**

| **Feature**                                       | **Status**  | **Notes**                                |
| ------------------------------------------------- | ----------- | ---------------------------------------- |
| Session list with grouping (Today/Yesterday/etc.) | **Done**    | Four time groups, reverse-chronological  |
| Search sessions by title                          | **Done**    | Client-side filter                       |
| Favorite sessions (pinned at top)                 | **Done**    | Star icon, collapsible favorites section |
| Rename session (inline double-click)              | **Done**    | Inline edit on double-click              |
| Delete session with confirmation                  | **Done**    | Confirm prompt before deletion           |
| Search session message content                    | **Planned** | Full-text search across message content  |

## **5.4 Artifacts**

| **Feature**                  | **Status** | **Notes**                                           |
| ---------------------------- | ---------- | --------------------------------------------------- |
| Excel exports tab            | **Done**   | Filter by name and date, list with actions          |
| Charts tab (thumbnail grid)  | **Done**   | 2-col grid, violet gradient placeholder, type badge |
| Filter by filename           | **Done**   | Search input filters in real-time                   |
| Filter by date               | **Done**   | Date range picker                                   |
| Rename artifact              | **Done**   | Inline rename                                       |
| Delete artifact              | **Done**   | With confirmation                                   |
| Preview Excel export         | **Done**   | Opens modal with first 50 rows                      |
| Generate chart from artifact | **Done**   | Opens chart builder pre-loaded with artifact data   |
| Full chart preview modal     | **Done**   | Click chart thumbnail to view full size             |

## **5.5 Saved Queries Drawer**

| **Feature**                      | **Status** | **Notes**                                          |
| -------------------------------- | ---------- | -------------------------------------------------- |
| Query card list                  | **Done**   | Label, NL text (2 lines), use count, last used     |
| Search by label or query text    | **Done**   | Real-time filter                                   |
| Time filter dropdown             | **Done**   | All time, Today, Last 7 days, Last 30 days         |
| Favorite queries (pinned)        | **Done**   | Star toggle, pinned section at top                 |
| Run query from drawer            | **Done**   | Inserts into active chat and sends                 |
| Result panel in drawer sidebar   | **Done**   | Mini result table, save to artifacts, chart button |
| View SQL (expandable code block) | **Done**   | JetBrains Mono, collapsible                        |
| Rename label (inline)            | **Done**   | Click label to edit                                |
| Delete with confirmation         | **Done**   | Confirm before delete                              |

## **5.6 Data Sources Page**

| **Feature**                             | **Status**  | **Notes**                                          |
| --------------------------------------- | ----------- | -------------------------------------------------- |
| Drag-and-drop upload zone               | **Done**    | HTML5 drag events, violet border on drag-over      |
| Multiple file upload with progress bars | **Done**    | Per-file indeterminate violet progress bar         |
| File list table                         | **Done**    | Name, sheets, rows, size, uploaded date            |
| Search and filter file list             | **Done**    | Filter by name, sheet count, row count, size, date |
| Expand file to show sheets              | **Done**    | Chevron expands sheet sub-rows with violet border  |
| Preview sheet (first 50 rows)           | **Done**    | Modal with SkeletonTable loading state             |
| Delete file with confirmation           | **Done**    | Removes from DuckDB and uploaded_excels folder     |
| Excel mutation via chat                 | **Planned** | NL-driven data changes with diff preview           |
| Re-import file                          | **Planned** | Re-read stored file and refresh DuckDB table       |
| Backup and restore versions             | **Planned** | Per-file backup history, restore dropdown          |

## **5.7 Settings Page**

| **Feature**                            | **Status**  | **Notes**                                    |
| -------------------------------------- | ----------- | -------------------------------------------- |
| Theme toggle (Light/Dark/System)       | **Done**    | Immediate apply, persisted to settings.json  |
| OpenAI API key input (masked)          | **Done**    | Show/hide toggle                             |
| OpenAI model selection dropdown        | **Done**    | gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini   |
| OpenAI Test Connection                 | **Done**    | 800ms mock delay, green tick or red X inline |
| Ollama base URL input                  | **Done**    | Pre-filled <http://localhost:11434>          |
| Ollama Test Connection                 | **Done**    | Same behavior as OpenAI test                 |
| Ollama model dropdown (after test)     | **Done**    | Populated from Ollama API on successful test |
| Pull new Ollama model                  | **Done**    | Text input + Pull button + progress bar      |
| Max Concurrent Uploads setting         | **Done**    | Numeric input, default 3                     |
| Result Row Limit setting               | **Done**    | Numeric input, default 500                   |
| Clear Chat History (countdown confirm) | **Done**    | 3-second countdown, inline no modal          |
| Delete All Files (countdown confirm)   | **Done**    | 3-second countdown, inline no modal          |
| Open data folder in OS file browser    | **Planned** | Electron shell.openPath()                    |
| Export settings to JSON                | **Planned** | Backup settings.json via save dialog         |
| Import settings from JSON              | **Planned** | Restore from backup file                     |

## **5.8 Excel Mutation Engine**

| **Feature**               | **Status**  | **Notes**                                 |
| ------------------------- | ----------- | ----------------------------------------- |
| Value update mutations    | **Planned** | Change numeric/text values by condition   |
| Formula injection         | **Planned** | Write Excel formulas via openpyxl         |
| Row deletion by condition | **Planned** | Delete matching rows with confirmation    |
| Value fill (empty cells)  | **Planned** | Fill nulls based on adjacent column logic |
| Diff preview before apply | **Planned** | Before/after table, rows affected count   |
| AST safety validator      | **Planned** | Allowlist-based expression validation     |
| Auto-backup before write  | **Planned** | Timestamped backup, last 5 retained       |
| Restore from backup       | **Planned** | Dropdown of backup timestamps per file    |
| Edit audit log            | **Planned** | edit_history table, full mutation record  |

# **6\. Non-Functional Requirements**

## **6.1 Performance Targets**

| **Metric**                                        | **Target**        |
| ------------------------------------------------- | ----------------- |
| App cold start (including Python backend startup) | 4 seconds or less |
| Excel import (10,000 rows)                        | 2 seconds or less |
| SQL execution (simple query, 100k rows)           | 500ms or less     |
| LLM SQL generation (OpenAI GPT-4o)                | 5 seconds or less |
| Chart render                                      | 300ms or less     |
| Excel mutation dry-run (10k rows)                 | 1 second or less  |
| File write-back after confirmed mutation          | 2 seconds or less |

## **6.2 Security**

- API keys stored in OS keychain via Keytar, never in plaintext.
- No telemetry, no analytics, no data sent anywhere except user-initiated LLM API calls.
- LLM-generated mutation expressions validated via Python AST allowlist before execution.
- CORS restricted to <http://localhost:5173> only in development; Electron origin in production.
- All data (Excel files, query history, exports) remains local per user.

## **6.3 Reliability**

- NL to SQL self-correction: max 2 retries on SQL error before returning a user-facing error.
- Failed Excel imports are rolled back completely - no partial data in DuckDB.
- Excel mutations: timestamped backup created before every write, last 5 retained per file.
- App crash recovery: last active session and active user restored on next launch.

## **6.4 Accessibility**

- Full keyboard navigation through sidebar and all drawers.
- Focus traps in modals and drawers.
- WCAG AA colour contrast in both light and dark themes.

# **7\. Error States**

| **Scenario**                           | **User-facing message**                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| LLM provider not configured            | Set up your LLM provider in Settings before querying. \[Settings\]                       |
| SQL generation failed after 2 retries  | Couldn't generate a valid query. Try rephrasing or specify which columns to use.         |
| No #filename reference in query        | Mention a data source using #filename to query your data.                                |
| Referenced file not found in DB        | #filename.xlsx was not found. It may have been deleted. Go to Data Sources to re-upload. |
| Excel file is password protected       | This file is password protected and cannot be imported.                                  |
| DuckDB query timeout (over 30 seconds) | This query is taking too long. Try narrowing your question or filtering the data first.  |
| Ollama unreachable                     | Cannot reach Ollama at \[url\]. Make sure Ollama is running.                             |
| Mutation AST validation failed         | This edit contains an unsafe operation and cannot be applied. Try rephrasing the change. |
| Mutation dry-run produced zero changes | No rows matched your condition. The data was not changed.                                |
| Backup creation failed before write    | Could not create a backup. The edit was not applied to protect your data.                |

# **8\. Out of Scope - v1**

Explicitly deferred to keep v1 shippable:

- Google OAuth (infrastructure ready, auth screen is the only remaining piece)
- Multi-user collaboration or shared sessions
- Cloud sync or backup
- Plugin or extension system
- SQL editor / manual query mode (v2 candidate)
- Scheduled or recurring queries
- Slack, email, or other integrations
- Formula-aware Excel parsing (cells with formulas read as computed values only)
- Electron packaging and portable installer (phase 2 of the build)

# **9\. Suggested Improvements**

## **9.1 High Value, Low Complexity**

- SQL editor pane - show generated SQL in an editable code block below the result. Let the user tweak it and re-run. One toggle away once the infrastructure exists.
- Keyboard shortcuts - Cmd/Ctrl+K for new chat, Cmd/Ctrl+H for history, Cmd/Ctrl+comma for settings. Standard pattern, immediate perceived quality boost.
- Pin columns in result table - freeze the first column when scrolling wide results horizontally.
- Copy cell or copy row - right-click on any table cell to copy the value. Right-click row to copy the whole row as CSV.
- Voice input - Web Speech API is available in Electron's Chromium. Zero dependency cost. Hands-free querying for power users.

## **9.2 High Value, Medium Complexity**

- Auto-relationship detection - on upload, scan all loaded tables for columns with the same name and type. Surface these as suggested JOIN paths in the schema context sent to the LLM. Dramatically improves multi-file query accuracy.
- Query templates - ship 10-15 built-in query templates (Top 10 by revenue, Month-over-month growth, Find duplicates) that apply to any uploaded file. Good for non-technical users who don't know how to start.
- Diff view for re-imports - when a user re-imports an updated Excel file, show which rows were added, changed, or removed before committing to the DuckDB table.
- Named report auto-refresh - saved queries re-run automatically when their source file is re-imported. Results shown in a Reports section with change indicators.
- Result pinning - pin a result table to the top of the chat for reference while continuing to ask follow-up questions below it.

## **9.3 Architecture-Level Improvements**

- Schema versioning - track column changes across re-imports. Surface a warning badge in saved queries that reference renamed or removed columns.
- Streaming results - stream rows to the frontend as DuckDB produces them rather than waiting for the full result set. Makes large queries feel faster.
- Background import queue - imports run in a background thread with a progress indicator in the sidebar so the user can keep chatting while large files are processing.
- LLM context window management - for very long chat sessions, auto-summarise older messages to stay within token limits rather than silently truncating them.

## **9.4 Excel Mutation Improvements (once the engine is shipped)**

- Batch mutations - apply multiple changes in a single transaction. Show a combined diff for all changes before confirming.
- Mutation templates - pre-built common transforms (normalise percentages, fill nulls with column mean, round all numeric columns to 2 decimals).
- Undo stack - keep the last 10 mutations in memory per session so the user can step backward without touching the backup files.
- Mutation history panel - show all edits applied to a file with who triggered them, when, and how many rows were affected.

# **10\. Changelog from v1.0**

| **Change**                              | **Type** | **Detail**                                                                                                                             |
| --------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-user account system               | New      | Per-user isolated DuckDB, folder, settings. Username login with account list on return.                                                |
| Excel mutation engine                   | New      | NL-driven data changes: value update, formula injection, row deletion, fill empty. Full diff-preview + AST safety guard + auto-backup. |
| edit_history DuckDB table               | New      | Audit log for all mutations: file, sheet, operation, rows affected, backup path, confirmation status.                                  |
| Artifacts: filter and chart button      | Updated  | Added date filter, rename, and Generate Chart button directly from artifacts page.                                                     |
| Saved queries: favorites + result panel | Updated  | Favorite toggle, pinned section, mini result panel when running a query from the drawer.                                               |
| Data sources: search and filter         | Updated  | Filter by name, sheet count, row count, size, upload date.                                                                             |
| Settings: Max Concurrent Uploads        | Updated  | New configurable setting with default of 3.                                                                                            |
| Settings: Result Row Limit              | Updated  | Configurable cap on inline result rows, default 500.                                                                                   |
| Backup and restore per file             | New      | Timestamped backups before every mutation, restore dropdown in Data Sources.                                                           |
| Feature checklist added                 | New      | Section 5 tracks every feature with Done/Partial/Planned/v2 status.                                                                    |
| Charts: Recharts replaced               | Updated  | react-apexcharts (core import) used instead. Better dark theme, more chart types.                                                      |
| Styling: Tailwind v4 + shadcn/ui        | Updated  | Replaced generic CSS approach. All design tokens via CSS variables in global.css.                                                      |
| Auto chart type suggestion              | Planned  | Post-query second LLM call to suggest best chart type and axis mapping.                                                                |