# SheetMind

**Product Requirements Document**

_Version 1.3 · Desktop Application_

Windows · macOS · Linux

_Intelligence built into every sheet._

_v1.3 — Converted Artifacts and Saved Queries from slide-in drawers to premium full-page layouts, optimized build system with Nuitka compiler caching and cross-platform scripts, resolved Excel editor and WebSocket bugs._

---

# 1. Product Overview

## 1.1 Vision

SheetMind is a cross-platform portable desktop application that lets users upload Excel files and query them using natural language. It converts queries into SQL, executes them against a local DuckDB database, and returns results as tables, charts, or downloadable Excel files — with no cloud dependency or complex setup. Users can also mutate Excel data and inject formulas using natural language, edit spreadsheets directly in a full grid editor, and build visual dashboards powered entirely by their saved queries — all with a required confirmation step before any destructive action.

## 1.2 Target Platforms

- Windows (x64)
- macOS (x64 + Apple Silicon universal binary)
- Linux (x64)

## 1.3 Distribution

Portable: single installer or executable per platform. No external database server, no cloud backend required. Internet is only needed for OpenAI API calls when the user selects OpenAI as the LLM provider.

## 1.4 Core Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Shell | Electron | Cross-platform desktop, spawns Python backend |
| Frontend | React + TypeScript + Vite | Type safety, fast dev iteration, small bundles |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first with accessible Radix primitives |
| Charts | react-apexcharts (core import) | 10 chart types, built-in dark theme, tree-shakeable |
| Grid Editor | Handsontable + @handsontable/react | Full spreadsheet editing with freeze, sort, context menu |
| Dashboard Layout | react-grid-layout | Drag-and-drop responsive grid, well-maintained |
| Dashboard Export | html2canvas | DOM-to-PNG snapshot for dashboard export |
| Backend | FastAPI + Uvicorn | Async, streaming-friendly, easy to bundle |
| Database | DuckDB | Vectorised analytical queries, file-native |
| LLM | OpenAI API or Ollama (local) | User's choice, full offline support via Ollama |
| Packaging | PyInstaller + electron-builder | Battle-tested cross-platform bundling |

---

# 2. Architecture Overview

## 2.1 Process Model

Electron spawns a PyInstaller-bundled FastAPI process on startup. The frontend communicates with this backend over localhost. On quit, Electron terminates the child process cleanly.

## 2.2 Multi-User Model

SheetMind supports multiple local user accounts. On first launch, the user enters a username. All subsequent launches show a list of existing accounts to select from. Each user account has a completely isolated DuckDB database file, upload folder, and settings — no data bleeds between accounts.

Future: Replace username-only login with Google OAuth. The multi-user infrastructure is already in place — auth upgrade is a swap of the login screen only.

## 2.3 Local Data Storage

Data is stored per user under a shared app directory:

| Path | Contents |
|---|---|
| `~/.sheetmind/users/{username}/main.duckdb` | All Excel data + app metadata for this user |
| `~/.sheetmind/users/{username}/uploaded_excels/` | Copies of original Excel files |
| `~/.sheetmind/users/{username}/exports/` | Generated Excel exports from query results |
| `~/.sheetmind/users/{username}/charts/` | Saved chart images |
| `~/.sheetmind/users/{username}/.backups/` | Auto-versioned backups before Excel mutations and saves |
| `~/.sheetmind/users/{username}/dashboard_exports/` | PNG snapshots exported from dashboards |
| `~/.sheetmind/users/{username}/settings.json` | User preferences (theme, LLM config, limits) |
| `~/.sheetmind/accounts.json` | List of registered usernames for login screen |

## 2.4 Database Schema (DuckDB — per user)

| Table | Purpose | Key Columns |
|---|---|---|
| `excel_files` | Excel file registry | id, original_filename, stored_path, uploaded_at, file_size_bytes |
| `excel_sheets` | Sheet to DuckDB table map | id, excel_file_id, sheet_name, table_name, row_count, col_count |
| `chat_sessions` | Chat history sessions | id, title, created_at, updated_at, is_favorite |
| `chat_messages` | Individual messages | id, session_id, role, content, sql_generated, sql_execution_ms, llm_generation_ms, token_count_input, token_count_output, confidence_score |
| `saved_queries` | Labeled reusable queries | id, label, nl_query, sql_query, use_count, last_used_at, is_favorite |
| `artifacts` | Exports and chart files | id, type, filename, file_path, source_message_id, title, created_at |
| `edit_history` | Excel mutation audit log | id, excel_file_id, sheet_name, operation_type, rows_affected, applied_at, backup_path, was_confirmed |
| `dashboards` | Dashboard registry | id, title, layout_json, created_at, updated_at, is_favorite, thumbnail_path |
| `dashboard_widgets` | Individual widgets on a dashboard | id, dashboard_id, widget_type, label, saved_query_id, column_config_json, position_json, size |

## 2.5 NL to SQL Pipeline

The core pipeline runs on every user query. Self-correction is limited to 2 retries.

- User types query with `#filename` reference in chat input
- Frontend parser extracts `#refs` and resolves them to DuckDB table names
- `POST /query` sends NL text + resolved table list to FastAPI
- Schema fetcher pulls column names, types, and 3 sample rows for referenced tables only
- Prompt builder injects schema + NL into a structured system prompt template
- LLM provider router sends to OpenAI or Ollama based on user settings
- LLM returns candidate SQL + a self-assessed confidence score (1–5)
- SQL executor runs the query on DuckDB. On error: send error back to LLM for correction (max 2 retries)
- Result returned to frontend as: table, auto-detected chart suggestion, Excel export option, NL summary

## 2.6 NL to Excel Mutation Pipeline

A separate pipeline handles user requests that modify Excel data rather than query it. Triggered when the LLM classifies a message as a mutation intent.

- User describes a change in natural language
- Backend detects mutation intent and routes to `excel_edit_service`
- Schema fetcher pulls column names and types for the target sheet
- LLM generates a structured operation JSON (type, condition, target_column, expression)
- AST safety validator checks the expression against an allowlist of permitted node types
- Dry-run executed: rows that would be affected are identified, old and new values computed
- Diff payload sent to frontend: rows affected count, before/after table
- User reviews diff and confirms or cancels
- On confirm: pandas operation applied, file written back via openpyxl, DuckDB table refreshed, backup created
- On cancel: no changes applied, diff discarded

Security: All LLM-generated expressions are validated against an AST allowlist before `eval`. No imports, no file system access, no function calls beyond pandas column operations are permitted.

---

# 3. Application Layout

## 3.1 Shell Structure

A 52px fixed left sidebar (icon-only, always visible) sits alongside the main content area. The sidebar never collapses. Tooltips appear on hover after a 300ms delay. All navigation is icon-based with no text labels.

## 3.2 Left Sidebar Navigation

| Position | Icon | Label | Action | Opens As |
|---|---|---|---|---|
| Top | SquarePen | New chat | Opens a fresh chat session | Replaces main area |
| Top | Clock | History | Browse and search past sessions | Slide-in drawer (220px) |
| Top | Layers | Artifacts | View all exports and charts | Replaces main area |
| Top | Bookmark | Saved queries | Browse and reuse labeled queries | Replaces main area |
| Top | Database | Data Sources | Upload and manage Excel files | Replaces main area |
| Top | TableProperties | Excel Editor | Full spreadsheet grid editor | Replaces main area |
| Top | LayoutDashboard | Dashboards | Create and view dashboards | Replaces main area |
| Bottom | Settings | Settings | Theme, LLM config, data management | Replaces main area |

Active sidebar item: 36×36px violet background pill behind icon, 8px radius, white icon. Hover: bg-hover background, icon brightens, 120ms transition.

---

# 4. Feature Specifications

## 4.1 Onboarding / User Login

Shown on first launch and when no active session exists in localStorage.

- Full-screen centered card with violet radial glow behind it.
- App logo, name **SheetMind**, and tagline displayed above the input.
- Input: "What should we call you?" — username only, no password.
- On submit: checks `accounts.json` for existing accounts and shows a list of previous users to select from. New users are added to the list.
- Account selection shows username + last login date. Clicking a name logs in immediately.
- Card fade-in + slide-up 12px animation on mount (300ms ease-out).

Planned upgrade: Replace username-only login with Google OAuth in v2. The multi-user infrastructure (per-user DuckDB, per-user folder) is already built to support this without structural changes.

---

## 4.2 Chat Page

### Empty state

- Centered: SheetMind logo, tagline, and three suggestion chip buttons.
- Each chip pre-fills the chat input with a sample query on click.

### Chat input

- Multi-line textarea. Shift+Enter for newline, Enter to send.
- `#` triggers a file autocomplete dropdown positioned at cursor using `textarea-caret` library.
- Dropdown shows filename rows with indented sheet name sub-rows. Two-level, keyboard-navigable (arrow keys, Enter, Escape).
- Send button: violet, disabled when empty or while streaming.
- Character counter appears above 2,000 characters only.

### Message display

- User messages: right-aligned, bg-hover background, rounded corners (bottom-right 2px), max 60% width.
- Assistant messages: left-aligned, violet circle S icon, no bubble background, full content width.
- Optimistic UI: user message appears in the list immediately before the API call returns.
- TypingIndicator: three pulsing dots + "Generating SQL..." text appears while the pipeline runs.

### Result table

- Inline sortable table below assistant message. Click column header to sort asc/desc.
- Configurable row display: user can set how many rows are shown (default 8, options 10, 25, 50, 100).
- Results above the row limit show: "Showing N of M rows" with export prompt.
- Alternating row backgrounds. 36px row height.
- NL summary: 1–2 sentence plain English interpretation below the table, in text-secondary italic.

### Per-message action bar (hover to reveal)

| Action | Icon | Behaviour |
|---|---|---|
| Regenerate | RotateCcw | Re-sends the same NL query. Opens an optional input to add correction instructions before regenerating. |
| Like | ThumbsUp | Marks message positively, stored locally in DuckDB. |
| Dislike | ThumbsDown | Marks negatively. Opens a one-line feedback input. |
| Export as chart | BarChart2 | Opens chart builder panel pre-loaded with this result set. |
| Export to Excel | Download | Generates .xlsx from result, saves to artifacts, shows toast. |
| View SQL | Code2 | Opens a read-only modal showing the generated SQL in JetBrains Mono. |
| Save query | Star | Opens save-query dialog. Label is pre-filled by LLM, user can edit. |

### Debug info footer (collapsed by default)

- Collapsed: small chevron row showing "Query details."
- Expanded: input tokens / output tokens, LLM generation time (ms), SQL execution time (ms), confidence score (1–5 coloured dots: red 1–2, amber 3, green 4–5).
- Confidence 1 or 2: inline yellow warning banner above the result table.

---

## 4.3 Chart Builder

Opens as a panel from the "Export as chart" action bar button or from the Artifacts page.

- Chart type dropdown: Bar, Horizontal Bar, Line, Area, Pie, Donut, Scatter, Histogram, Heatmap, Pivot.
- X-axis dropdown, Y-axis dropdown, Group by dropdown — populated from result column names.
- Color palette selector: 5 preset palettes. Primary colour is violet to match app theme.
- Title input pre-filled from the NL query text.
- Live preview updates as user changes settings.
- Auto-detection: backend sends a second lightweight LLM call after SQL execution to suggest chart type + axis mapping. User can accept or dismiss.
- Export as PNG button. Export as SVG button. Save to Artifacts button.

| Chart type | Best for |
|---|---|
| Bar | Categorical comparisons |
| Horizontal bar | Long category labels |
| Line | Time series and trends |
| Area | Cumulative trends |
| Pie | Part-of-whole (7 or fewer categories) |
| Donut | Part-of-whole with center statistic |
| Scatter | Correlation between two numeric columns |
| Histogram | Distribution of a single numeric column |
| Heatmap | Two categorical axes with numeric intensity |
| Pivot table | Grouped aggregations |

---

## 4.4 Chat History Drawer

Slides in from left over the main content, 220px wide, 200ms ease-out. No backdrop.

- Search bar at top — filters sessions by title client-side.
- Favorites section pinned at top, collapsible with chevron.
- Sessions grouped by: Today, Yesterday, Last 7 days, Older.
- Per row: title (truncated), relative timestamp right-aligned.
- Row hover: slide-in star, edit (pencil), and trash icons from the right (120ms).
- Double-click title to rename inline.
- Delete shows a confirmation prompt.
- Active session: violet 2px left border + background-active.

---

## 4.5 Artifacts Page

Replaces the main content area. A premium dashboard page featuring a two-tab view: **Excel Exports** and **Saved Charts**, equipped with advanced search filters, visual grid galleries, and rich details/preview overlays.

### Excel Exports Tab

- **Grid / Table Toggle Layout**: Display exported `.xlsx` files with clean metadata cards or a tabular list.
- **Advanced Header**: Features quick search by filename, source session name, and a dual-calendar date range filter.
- **Card Metadata**: File icon (distinguishing standard from mutated files), export title, source session link, precise file size (e.g. `124 KB`), and upload/creation date formatted as `DD-MM-YYYY`.
- **Card Actions (Hover & Direct)**:
  - *Download/Export*: Open system save dialog to export local file.
  - *Inline Rename*: Click title or pencil icon to update filename inline.
  - *Delete*: With double-confirmation prompt to prevent accidental data loss.
  - *Preview*: Open high-performance premium modal displaying the first 100 rows in an interactive `Handsontable` grid.
  - *Create Chart*: Action shortcut to open the Chart Builder pre-loaded with this export's schema.

### Saved Charts Tab

- **Rich Gallery Grid**: 3-column responsive layout of generated charts using live interactive thumbnails (with light/dark adaptive themes), chart type badge (Bar, Scatter, Donut, etc.), and original natural language query used to generate it.
- **Premium Lightbox Modal**: Clicking any chart card opens a high-fidelity full-screen lightbox preview showing the interactive ApexCharts widget.
- **Actions Panel**: Download as PNG, download as SVG, view underlying query SQL, or delete.

Artifacts are independent from chat sessions. Deleting a session does not delete its artifacts.

---

## 4.6 Saved Queries Page

Replaces the main content area. A dual-panel analytical dashboard for managing, running, and analyzing reusable saved queries.

### Left Panel: Browse & Search

- **Search Header**: Fuzzy matching across query labels, SQL statements, and natural language descriptions.
- **Time/Usage Filters**: Filter by All Time, Today, Last 7 Days, or Last 30 Days.
- **Favorite Filter Pinning**: Quick toggling between "All Queries" and "Favorites Only."
- **Query List Cards**:
  - Interactive cards showing query label, natural language query prompt (2 lines max, truncated), execution use count badge (e.g., `×24`), and last-used date formatted as `DD-MM-YYYY`.
  - Active query highlighted with a custom sidebar accent.
  - Favorite star toggle is easily clickable directly on the list item.

### Right Panel: Query Details & Interactive Preview

- **Details Mode (Default when query is selected)**:
  - *Title & Meta*: In-place renaming of the query label, description text area.
  - *Visual SQL Editor*: Syntax-highlighted read-only editor showing the exact SQL statement in JetBrains Mono.
  - *Quick Run Button*: Instantly execute the query on the current DuckDB database.
- **Interactive Results Panel (Shown on Run)**:
  - Displays the result inside an interactive `ExcelPreviewGrid` with pagination controls.
  - *Quick Actions*: "Export to Excel" (writes to artifacts), "Create Chart" (loads result into Chart Builder), or "Insert to Active Chat" (closes page and copies SQL/NL directly into the active chat session context).

---

## 4.7 Data Sources Page

Replaces the main content area. Full panel layout.

### Upload zone

- Drag-and-drop zone + Browse files button. Accepts `.xlsx` and `.xls`.
- Multiple file upload supported. Per-file indeterminate progress bar (violet, 4px height, 8px radius) during import.
- On completion: success checkmark animation per file, or error reason (Corrupted file, Password protected, etc.).

### File list table

| Column | Notes |
|---|---|
| Filename | Expand chevron on left to show sheet sub-rows |
| Sheets | Count of sheets, shown as a pill badge |
| Rows | Total rows across all sheets |
| Size | File size in KB or MB |
| Uploaded | Relative timestamp (e.g. 2 hours ago) |
| Actions | Preview, Delete (with confirmation) |

### Sheet sub-rows (expanded)

- Indented 16px, violet 2px left border, bg-hover background.
- Shows: sheet name, row count, column count.
- Click to preview that specific sheet (opens modal with first 50 rows + SkeletonTable while loading).

### Search and filter

- Search by filename, filter by sheet count, row count, size, and upload date.

### Per-file additional actions (planned)

- **Re-import:** re-reads the stored file and refreshes the DuckDB table.
- **Restore previous version:** dropdown of timestamped backups per file (created by mutations and saves).

---

## 4.8 Excel Mutation via Natural Language

Users can describe data changes in plain English and SheetMind applies them to the source Excel file with a required confirmation step.

### Supported mutation types

- **Value update:** change column values based on conditions.
- **Formula injection:** write Excel formulas into cells based on conditions.
- **Row deletion:** remove rows matching a condition.
- **Value fill:** fill empty cells in a column based on adjacent column logic.

### Mutation flow

1. User types a mutation request in the chat (LLM classifies it as mutation intent).
2. Backend generates a structured operation and performs a dry-run.
3. Diff is returned: rows affected count, before/after value table.
4. User reviews the diff preview in the chat and clicks **Apply** or **Cancel**.
5. On Apply: change is written to the Excel file, DuckDB table is refreshed, a timestamped backup is created.
6. On Cancel: nothing is changed.

### Backup and restore

- Before every write, a timestamped backup is created in `.backups/` (e.g. `Sales_Orders_20240315_143022.xlsx`).
- Last 5 backups per file are retained. Older ones are auto-deleted.
- Restore previous version option available in Data Sources page per file (opens a dropdown of available backup timestamps).

Security: LLM-generated expressions are validated via Python AST before execution. Only arithmetic, comparison, and pandas column operations are permitted. No imports or file system access.

---

## 4.9 Settings Page

Replaces the main content area. Two-column layout: 180px left nav + content area.

### Appearance

- Theme segmented control: Light / Dark / System. Applied immediately and persisted.

### LLM Provider

- Segmented control at top: OpenAI / Ollama.
- **OpenAI:** masked API key input with show/hide toggle, Test Connection button (spinner → green tick or red X inline for 3 seconds), model dropdown (gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini).
- **Ollama:** base URL input (default `http://localhost:11434`), Test Connection button, model dropdown (populated after successful test), Pull New Model (text input + Pull button + indeterminate violet progress bar).
- Active provider indicator: green dot = connected, red dot = not configured or unreachable.

### Data configuration

| Setting | Description | Default |
|---|---|---|
| Max Concurrent Uploads | How many Excel files can be importing at the same time | 3 |
| Result Row Limit | Maximum rows shown inline in the chat result table | 500 |
| Clear Chat History | Permanently delete all sessions and messages (3-second countdown confirmation) | — |
| Delete All Files | Remove all uploaded Excel files and their DuckDB tables (3-second countdown confirmation) | — |

API keys are stored in the OS keychain via Keytar (Electron). Never in plaintext files or environment variables.

---

## 4.10 Excel Editor Page

Replaces the main content area. A full spreadsheet editing environment backed by Handsontable, with an AI mutation panel and change stack at the bottom.

### Mode A — File Selector

Shown when no file is open. Centered card (520px wide) with violet glow.

- File list fetched from uploaded Excel files.
- Each row: filename, sheet count badge, file size, upload date.
- Clicking a row opens it in Mode B.
- Empty state links to Data Sources page.
- SkeletonRow × 4 while loading.

### Mode B — Editor Layout

```
┌──────────────────────────────────────────────────────┐
│  Editor Header (48px) — filename · Save · Close       │
├──────────────────────────────────────────────────────┤
│  Editor Toolbar (40px) — formatting controls          │
├──────────────────────────────────────────────────────┤
│  Sheet Tabs (36px) — one tab per sheet                │
├──────────────────────────────────────────────────────┤
│  Handsontable Grid (flex-grow, top panel)             │
├──────────── drag handle (8px) ───────────────────────┤
│  AI Panel (bottom panel)                              │
│  Change Stack │ Diff View │ Prompt input bar          │
└──────────────────────────────────────────────────────┘
```

### Editor Header (48px)

- Left: back arrow (returns to Mode A), filename, sheet count badge.
- Right: amber "Unsaved" dot (visible only when `isDirty` is true), violet Save button, X close button.

### Editor Toolbar (40px)

Groups left to right: Bold, Italic, font size input (8–72pt) · Text color, background color (native color picker, shows current color swatch) · Border All, Border None · Align Left, Center, Right · Freeze rows input, Freeze cols input, Apply button · Add Row Below, Delete Row, Add Column Right, Delete Column.

All toolbar actions call Handsontable API on ref directly. Row/col add and delete update local state and set `isDirty = true`. No backend call until Save.

### Sheet Tabs (36px)

- Horizontal scrollable tab row. Active tab: bg-elevated, 2px violet top border.
- Switching tab syncs current Handsontable data back to session state before loading the new sheet.
- Add sheet tab (+): visible but disabled with tooltip "Add sheet coming in a future version."

### Editor Grid

Handsontable with `licenseKey: 'non-commercial-and-evaluation'`. Features enabled: row headers, column headers, manual row/col resize, context menu, column sorting, dropdown menu, filters, frozen rows/cols. `afterChange` callback updates session state and sets `isDirty = true` on every cell edit. Formatting is stored in a `CellFormattingMap` (frontend only) and applied via the `cells()` callback. For sheets over 5,000 rows, virtualization is enabled and a toast warning is shown.

### AI Panel

Three-column layout: Change Stack (200px fixed) | Diff View (flex-grow) | Prompt input bar (full-width, 56px fixed at bottom).

**Change Stack:** Lists all changes (newest first). Each card shows: operation type badge, status (pending=amber, accepted=green, rejected=muted red), prompt text (2 lines), affected row count, sheet name. Clicking a card shows its diff in the center.

**Diff View:** Shows before/after table for the selected change. Columns: Row # | Column | Current Value | New Value. Current value: red-tinted background. New value: green-tinted background. Formula values shown in JetBrains Mono. For pending changes: Accept (violet) and Reject (outline destructive) buttons shown. For accepted changes: read-only with timestamp. For rejected changes: Restore button creates a new pending change.

**Prompt input bar:** Active sheet chip ("Editing: SheetName"), textarea (Shift+Enter for newline, Enter to send), Send button. Up to 3 suggestion chips above the bar, replaced after each AI response.

### Change Stack Rules

1. Changes are never auto-applied. Every AI change requires explicit Accept.
2. Multiple pending changes can coexist. Each is independent.
3. Accepting a later change that overlaps columns applies on top of the already-live data (frontend always sends current rows to `/apply`).
4. Rejected changes show a Restore button that creates a new pending entry.
5. "Continue editing" link dismisses diff view without accepting or rejecting.

### Save Behavior

- Save button calls `/save` with all sheet data and `formattingMap`.
- Backup is created before every write.
- On success: `isDirty = false`, success toast shown.
- On failure: error toast, `isDirty` remains true.

---

## 4.11 Live Dashboard Page

Replaces the main content area. Lets users build visual dashboards powered entirely by their saved queries. Dashboards auto-refresh their data when opened by re-running all bound saved queries against the current DuckDB state.

### Widget Types (v1)

Four widget types are supported in v1. All are fully functional.

| Widget | Data requirement | Configuration |
|---|---|---|
| KPI Card | 1 saved query returning at least 1 numeric column | Value column + aggregation (SUM / COUNT / AVG / MAX / MIN). Optional: second saved query + column for % change comparison. |
| Chart | 1 saved query returning at least 2 columns | X-axis column, Y-axis column, chart type (Bar, Line, or Pie only in v1). |
| Data Table | 1 saved query | Optional column subset selection. Row limit (default 50). |
| Text Label | None | Static text input. Used for headings or notes on the canvas. |

### Dashboard List Page

This is the default view when the user navigates to Dashboards.

- **Header:** "Dashboards" title (left), "Create Dashboard" violet button (right).
- **Search bar:** filters the list by dashboard title in real time.
- **Filter dropdown:** All / Favorites / Recent (last 7 days).
- **Sort:** by Name (A–Z), Date Created, Last Viewed.
- **Favorites:** star icon per row. Favorited dashboards always appear above non-favorites regardless of sort order. Clicking the star toggles the state immediately.
- **Dashboard list table:**

| Column | Notes |
|---|---|
| Name | Dashboard title |
| Widgets | Count of widgets as a pill badge |
| Last viewed | Relative timestamp |
| Created | Relative timestamp |
| Actions | View, Rename (inline), Redesign, Delete (with confirmation) |

- **Empty state:** illustration + "No dashboards yet. Create your first one." with a Create Dashboard button centered below.

### Dashboard Creation Flow

Clicking "Create Dashboard" opens a full-screen creation wizard with three steps.

#### Step 1 — Layout Picker

Full-screen step. Heading: "Choose a starting layout." Subtext: "Pick a grid arrangement. You can always add, remove, and resize widgets later."

Grid of layout preview cards (visual wireframe thumbnails showing empty widget slots). Each card shows a label below it:

| Layout name | Grid arrangement |
|---|---|
| 2 KPI Cards | 2 equal columns, 1 row |
| 4 KPI Cards | 4 equal columns, 1 row |
| KPIs + Chart | 3 KPI cards (top row) + 1 wide chart (full width below) |
| KPIs + Table | 2 KPI cards (top row) + 1 full-width table below |
| Chart Focus | 1 full-width chart (top) + 2 equal charts below |
| KPIs + Charts + Table | 4 KPIs (top) + 2 charts (middle) + 1 table (bottom) |
| Custom — Manual | Empty canvas. User adds and arranges widgets freely. |
| Custom — AI | User describes the layout to the AI agent. |

Selecting any pre-made layout or Custom Manual advances to Step 2 immediately. Selecting Custom AI opens the AI layout conversation panel within the same step (see below).

**Custom AI layout sub-flow:**

- Panel slides in from the right (or replaces the card grid).
- Heading: "Describe your dashboard to the AI."
- Textarea: "What should this dashboard show? How many widgets, and what should each one do?" (Shift+Enter for newline, Enter sends.)
- AI responds with a proposed layout description (e.g. "I'll create: 2 KPI cards for Total Revenue and Order Count, 1 bar chart for monthly revenue, and 1 data table for top products. Does this look right?").
- User can confirm or ask for changes. Once confirmed, the canvas renders with the proposed widget slots (empty, unbound) and the user proceeds to the canvas editor in Step 2.
- The AI does not bind queries — it only determines widget types, labels, and positions.

#### Step 2 — Canvas Editor (Bind & Arrange)

The canvas editor opens with the chosen layout rendered as empty widget slots. The user binds saved queries to each widget and may freely rearrange the layout.

**Canvas grid system:** Uses `react-grid-layout`. 3-column responsive grid. Each widget occupies a grid position defined by `x, y, w, h` (column and row units). Widget sizes:

| Size label | Grid units (w × h) |
|---|---|
| Small | 1 × 1 |
| Medium | 2 × 1 |
| Large | 3 × 1 (full width) |
| Tall | 1 × 2 |
| Large Tall | 2 × 2 |

Dragging a widget by its header reorders it on the grid. Resize handle at the bottom-right corner. Minimum sizes enforced per widget type (KPI Card: 1×1, Chart: 2×1, Table: 2×2, Text Label: 1×1).

**Unbound widget state:** Each empty slot shows a dashed violet border, the widget type icon, and a "Bind query →" button centered inside it.

**Query binding panel (opens when "Bind query →" is clicked):**

1. **Saved query dropdown** (searchable by label). Shows query label + last-used date.
2. **Test button** → runs the saved query against DuckDB and shows a preview: column names, data types, row count, and first 5 rows in a small table. This validates that the query is working and shows what columns are available.
3. **Column configuration** (shown after a successful test):
   - KPI Card: Value Column dropdown (numeric columns only), Aggregation dropdown (SUM / COUNT / AVG / MAX / MIN), optional Comparison Query dropdown + Comparison Column for % change.
   - Chart: X-axis column, Y-axis column (numeric columns only), Chart Type (Bar / Line / Pie).
   - Data Table: Column subset multi-select (default: all), Row limit numeric input (default 50, max 500).
   - Text Label: Static text textarea (no query needed).
4. **Confirm binding** button (violet). Closes the panel and marks the widget as bound (dashed border replaced with solid, preview rendered with live data).

**Widget header (on bound widgets):**
- Label text (editable inline double-click).
- Three-dot menu: Edit binding, Resize, Duplicate, Delete.

**Canvas toolbar (top of Step 2):**
- "+ Add Widget" dropdown: KPI Card, Chart, Data Table, Text Label. Adds a new unbound widget at the bottom of the grid.
- "Clear all" (ghost, destructive) — removes all widgets with confirmation.
- Widget count indicator: "N widgets" (11px, text-tertiary, right side).

#### Step 3 — Name & Save

Triggered when the user clicks "Save Dashboard" (violet button, top right of canvas editor). If no widget has been bound, the button is disabled with tooltip "Bind at least one widget to save."

A dialog (420px wide modal) appears:

- Heading: "Name your dashboard"
- Text input: placeholder "e.g. Sales Overview Q1 2024." Pre-filled with "Untitled Dashboard."
- Below the input: "Generate name with AI" button (magic wand icon, 13px, violet text). Clicking this sends the widget labels and types to the LLM and populates the input with the suggested name. The user can accept it or type their own.
- "Save" button (violet) + "Cancel" (ghost).

On save:
- Dashboard record written to `dashboards` table with `layout_json` and `is_favorite = false`.
- All widget records written to `dashboard_widgets` table.
- User is redirected to the Dashboard List page. A success toast appears: "Dashboard saved. Click View to open it."

### Dashboard View Page

Opens when the user clicks "View" on any dashboard from the list.

**Header (48px):**
- Left: ChevronLeft back arrow → returns to Dashboard List. Dashboard title (14px, font-semibold).
- Right: "Export PNG" button (outline), "Redesign" button (outline), last-updated timestamp (11px, text-tertiary).

**Auto-refresh on open:**
- All widgets re-run their bound saved queries against DuckDB immediately on page load.
- Each widget shows a skeleton loader while its query runs.
- If a query fails (e.g. the saved query's source table was deleted): the widget shows an inline error state — "Query failed. Source may have been removed." with a "Check Data Sources" link. Other widgets continue loading normally.
- No manual refresh button. Data is always fresh on open.

**Widget rendering:**

- **KPI Card:** Large number (24px, font-semibold) with aggregation applied. Below it: comparison trend line showing % change with colored arrow (green up, red down) if a comparison query was bound. Widget label above the number (12px, text-secondary).
- **Chart:** Full react-apexcharts render using the bound chart type and columns. Chart title = widget label. Legend shown below. No interactions beyond hover tooltip (no drill-down in v1).
- **Data Table:** Sortable table. Click column header to sort asc/desc. Row count shown in footer ("Showing N rows"). Alternating row backgrounds, 36px row height.
- **Text Label:** Rendered text, no background. Font size inherits from app theme.

**Export PNG:**
- Clicking "Export PNG" uses `html2canvas` to capture the entire dashboard canvas (including all rendered widgets) as a PNG.
- File is saved to `~/.sheetmind/users/{username}/dashboard_exports/` with filename `{dashboard_title}_{timestamp}.png`.
- A download dialog opens via Electron's `dialog.showSaveDialog` so the user can choose where to save it.
- Toast: "Dashboard exported as PNG."

**Redesign shortcut:**
- "Redesign" button opens the canvas editor (Step 2) pre-loaded with the current dashboard layout and all existing bindings intact. Saving from redesign updates the existing dashboard record.

---

# 5. Non-Functional Requirements

## 5.1 Performance Targets

| Metric | Target |
|---|---|
| App cold start (including Python backend startup) | 4 seconds or less |
| Excel import (10,000 rows) | 2 seconds or less |
| SQL execution (simple query, 100k rows) | 500ms or less |
| LLM SQL generation (OpenAI GPT-4o) | 5 seconds or less |
| Chart render | 300ms or less |
| Excel mutation dry-run (10k rows) | 1 second or less |
| File write-back after confirmed mutation | 2 seconds or less |
| Dashboard load (all widgets, 4–6 queries) | 3 seconds or less |
| Dashboard PNG export | 2 seconds or less |

## 5.2 Security

- API keys stored in OS keychain via Keytar, never in plaintext.
- No telemetry, no analytics, no data sent anywhere except user-initiated LLM API calls.
- LLM-generated mutation expressions validated via Python AST allowlist before execution.
- CORS restricted to `http://localhost:5173` only in development; Electron origin in production.
- All data (Excel files, query history, exports, dashboards) remains local per user.
- Dashboard widget data is served only from the local DuckDB instance — no external queries.

## 5.3 Reliability

- NL to SQL self-correction: max 2 retries on SQL error before returning a user-facing error.
- Failed Excel imports are rolled back completely — no partial data in DuckDB.
- Excel mutations: timestamped backup created before every write, last 5 retained per file.
- Excel Editor saves: timestamped backup created before every save, last 5 retained per file.
- App crash recovery: last active session and active user restored on next launch.
- Dashboard widget query failure: fails gracefully per widget — other widgets still render.

## 5.4 Accessibility

- Full keyboard navigation through sidebar and all drawers.
- Focus traps in modals and drawers.
- WCAG AA colour contrast in both light and dark themes.

---

# 6. Error States

| Scenario | User-facing message |
|---|---|
| LLM provider not configured | Set up your LLM provider in Settings before querying. [Settings] |
| SQL generation failed after 2 retries | Couldn't generate a valid query. Try rephrasing or specify which columns to use. |
| No #filename reference in query | Mention a data source using #filename to query your data. |
| Referenced file not found in DB | #filename.xlsx was not found. It may have been deleted. Go to Data Sources to re-upload. |
| Excel file is password protected | This file is password protected and cannot be imported. |
| DuckDB query timeout (over 30 seconds) | This query is taking too long. Try narrowing your question or filtering the data first. |
| Ollama unreachable | Cannot reach Ollama at [url]. Make sure Ollama is running. |
| Mutation AST validation failed | This edit contains an unsafe operation and cannot be applied. Try rephrasing the change. |
| Mutation dry-run produced zero changes | No rows matched your condition. The data was not changed. |
| Backup creation failed before write | Could not create a backup. The edit was not applied to protect your data. |
| Excel Editor: sheet over 50,000 rows | "This sheet has N rows. Opening large sheets may affect performance. Continue?" (Continue / Cancel dialog) |
| Excel Editor: save failure | Could not save the file. Your unsaved changes are still in the editor. |
| Excel Editor: /apply network error | Could not apply the change. The edit is still pending — you can retry. |
| Dashboard: widget query failed on load | Query failed. The source query or its data may have been removed. [Check Data Sources] |
| Dashboard: saved query has no numeric column (KPI) | This query has no numeric columns. KPI cards require at least one numeric column. |
| Dashboard: saved query returns 0 rows | This query returned no data. The dashboard widget will appear empty. |
| Dashboard: PNG export failed | Could not export the dashboard. Try again or resize your window. |
| Dashboard creation: AI layout call failed | Couldn't generate a layout. You can pick a preset or start with a blank canvas instead. |

---

# 7. Out of Scope — v1

Explicitly deferred to keep v1 shippable:

- Google OAuth (infrastructure ready, auth screen is the only remaining piece)
- Multi-user collaboration or shared sessions
- Cloud sync or backup
- Plugin or extension system
- SQL editor / manual query mode
- Scheduled or recurring queries
- Slack, email, or other integrations
- Formula-aware Excel parsing (cells with formulas read as computed values only)
- Electron packaging and portable installer (phase 2 of the build)
- Dashboard: drill-down on chart click
- Dashboard: widget-level refresh (only full-dashboard refresh on open)
- Dashboard: export formats other than PNG (PDF, HTML embed)
- Dashboard: chart types beyond Bar, Line, Pie in v1
- Dashboard: sharing or embedding dashboards
- Excel Editor: add sheet tab
- Excel Editor: collaborative editing

---

# 8. Unique Suggestions & Improvements

The suggestions below are additions that would meaningfully raise SheetMind's quality, usefulness, and impressiveness as a portfolio project — beyond what v1 ships with. They are grouped by effort and area.

---

## 8.1 High Value, Low Effort

**Keyboard shortcut system**
Cmd/Ctrl+K for new chat, Cmd/Ctrl+H for history drawer, Cmd/Ctrl+D for dashboards, Cmd/Ctrl+, for settings. Standard pattern that immediately makes the app feel polished. One configuration file, no architectural change.

**Copy cell / copy row in result tables**
Right-click on any cell in a chat result table, Excel Editor, or dashboard table widget to copy the value. Right-click a row to copy the whole row as CSV. Works via the browser clipboard API. Trivial to add, frequently expected by anyone who works with data.

**Dashboard widget notes**
Each widget on a dashboard can have an optional footnote — a small line of text below the widget (e.g. "Excludes refunded orders" or "Source: Q1 Sales sheet"). Stored in `dashboard_widgets.column_config_json`. No backend change needed.

**Confidence score history chart in debug footer**
The debug footer already shows the current message's confidence score. Add a tiny sparkline showing the last 10 scores for this session. Visually communicates query stability at a glance.

**Saved query "last result" cache**
When a saved query is run from the drawer, cache the result with a timestamp. Next time the drawer opens, show the last result instantly with a "from N minutes ago" label and a Refresh button. Makes the saved queries drawer feel live without hitting DuckDB on every open.

---

## 8.2 High Value, Medium Effort

**Auto-relationship detection across files**
On upload, scan all loaded tables for columns with matching names and compatible types. Surface these as suggested JOIN paths inside the `#` autocomplete dropdown (e.g. "orders.customer_id → customers.id"). Inject these join hints into the LLM schema context. This dramatically improves multi-file query accuracy and is a genuine differentiator — most tools miss this.

**Query templates library**
Ship 10–15 built-in query templates (Top 10 by revenue, Month-over-month growth, Find duplicates, Null value audit, Distribution summary). Each template has a title, description, and a parameterised NL query. Templates appear in the empty chat state and in a "Templates" section in the saved queries drawer. Good for non-technical users and demonstrates product thinking.

**Excel Editor: mutation history panel**
The `edit_history` table already records every mutation. Add a History tab inside the AI panel that shows all past edits for the currently open file — timestamp, operation type, rows affected, the original prompt. Each row has a Restore button that re-opens the diff and lets the user undo the change via a reverse mutation. This turns the audit log into an actual feature.

**Dashboard: NL query slot (AI helper)**
Inside the query binding panel (Step 2), add an alternative to picking a saved query: a small textarea where the user types a NL question on the spot. SheetMind generates the SQL, runs a test, and if it looks correct, auto-saves it as a new saved query and binds it to the widget in one step. Lowers the barrier for users who haven't built their saved query library yet.

**Diff view for re-imports**
When a user re-imports an updated Excel file in Data Sources, show a diff before committing: rows added (green), rows changed (amber), rows removed (red). Row count summary at the top. The user can review and confirm or cancel the import. Protects against accidental overwrites and is a feature no basic tool provides.

---

## 8.3 Architecture-Level Improvements

**Streaming SQL results**
Stream rows to the frontend as DuckDB produces them rather than waiting for the full result set. Makes large queries feel significantly faster. Requires switching the `/query` response to `StreamingResponse` on the FastAPI side and using a `ReadableStream` reader on the frontend.

**Background import queue**
Move all Excel imports to a background thread. Show a small progress badge on the Data Sources sidebar icon while files are importing. The user can keep chatting and using the app without waiting. Large files (100k+ rows) currently block the UI — this fix raises the practical file size ceiling considerably.

**LLM context window management**
For very long chat sessions, auto-summarise messages older than a configurable threshold (default: 20 messages) into a compact context summary before sending the next prompt. Prevents silent truncation that causes the LLM to lose schema context and produce wrong SQL. Surface this in the debug footer as "Context: summarised N messages."

**Schema versioning**
Track column schema changes across re-imports. When a re-import adds, renames, or removes a column, write the diff to a `schema_versions` table. Surface a warning badge in the saved queries drawer on any saved query that references a column that no longer exists in the current schema. Prevents silent failures in dashboards and saved queries after a file update.

---

## 8.4 Dashboard-Specific Improvements (post-v1)

**Dashboard templates by use case**
Pre-built dashboard templates (Sales Overview, Financial Summary, Inventory Status, HR Headcount) that are fully wired — they include layout, widget types, labels, and even suggested query prompts for each slot. The user opens a template, runs the suggested queries in the chat, saves them, and snaps them into the pre-labelled slots. Dramatically reduces time-to-first-dashboard for non-technical users.

**Widget-level drill-down (click to query)**
Clicking a bar in a dashboard chart or a row in a dashboard table opens a side panel that runs a drill-down query — e.g. clicking the "March" bar in a revenue chart runs "Show me the individual orders in March." The drill-down query is generated by the LLM from the widget's bound query context. Makes dashboards interactive rather than static.

**Scheduled dashboard snapshot**
A setting per dashboard: "Auto-export PNG every day at 9am." Uses Electron's background timer to open the dashboard in a headless renderer, export the PNG, and save it to the exports folder. No server required. Useful for users who want a daily snapshot of their data without manual action.

**Dashboard grid templates as user assets**
Let users save their own custom grid layouts as reusable templates (alongside the built-in ones). After designing a dashboard they like, a "Save layout as template" option strips the data bindings and saves the grid arrangement for reuse on future dashboards.