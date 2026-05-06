SheetMind — Product Requirements Document  v1.0

**SheetMind**

Product Requirements Document

*Version 1.0  ·  Desktop Application*

Windows · macOS · Linux

*Intelligence built into every sheet.*

# **Table of Contents**

# **1. Product Overview**
## **1.1 Vision**
SheetMind is a cross-platform portable desktop application that lets users upload Excel files and query them using natural language. It converts natural language queries into SQL, executes them against a local DuckDB database, and returns results as tables, charts, or downloadable Excel files — with no cloud dependency or complex setup.

## **1.2 Target Platforms**
- Windows (x64)
- macOS (x64 + Apple Silicon universal binary)
- Linux (x64)

## **1.3 Distribution**
Portable: single installer or executable per platform. No external database server, no cloud backend required. Internet is only needed for OpenAI API calls if the user chooses OpenAI as the LLM provider.

## **1.4 Core Tech Stack**

|**Layer**|**Technology**|**Rationale**|
| :- | :- | :- |
|Shell|Electron|Cross-platform desktop, spawns Python backend|
|Frontend|React + TypeScript + Vite|Type safety, fast dev iteration, small bundles|
|Charts|Recharts|React-native, TypeScript-first, composable|
|Backend|FastAPI + Uvicorn|Async, streaming-friendly, easy to bundle|
|Database|DuckDB|Analytical speed, vectorized, file-native|
|LLM|OpenAI API or Ollama (local)|User's choice, no forced cloud dependency|
|Packaging|PyInstaller + electron-builder|Battle-tested cross-platform bundling|


# **2. Architecture Overview**
## **2.1 Process Model**
Electron spawns a PyInstaller-bundled FastAPI process on startup. The frontend communicates with this backend over localhost. On quit, Electron terminates the child process cleanly. This pattern is used by Postman and Insomnia — well understood and reliable.

## **2.2 Local Data Storage**
~/.SheetMind/

- main.duckdb             ← all Excel data + app metadata

- uploaded\_excels/        ← copies of original Excel files

- exports/                ← generated Excel exports

- charts/                 ← saved chart images

## **2.3 Database Schema (DuckDB)**
Six core tables manage all application state:

|**Table**|**Purpose**|**Key Columns**|
| :- | :- | :- |
|excel\_files|Excel file registry|id, original\_filename, stored\_path, uploaded\_at, file\_size\_bytes|
|excel\_sheets|Sheet → DuckDB table map|id, excel\_file\_id, sheet\_name, table\_name, row\_count, col\_count|
|chat\_sessions|Chat history sessions|id, title, created\_at, updated\_at, is\_favorite|
|chat\_messages|Individual messages|id, session\_id, role, content, sql\_generated, sql\_execution\_ms, llm\_generation\_ms, token\_count\_input, token\_count\_output, confidence\_score|
|saved\_queries|Labeled reusable queries|id, label, nl\_query, sql\_query, use\_count, last\_used\_at|
|artifacts|Exports + chart files|id, type, filename, file\_path, source\_message\_id, title|

## **2.4 NL → SQL Pipeline**
The core pipeline runs on every user query. Self-correction is limited to 2 retries to prevent infinite loops.

1. User types query with #filename reference in chat input
1. Frontend parser extracts #refs and resolves them to DuckDB table names
1. POST /query sends NL text + resolved table list to FastAPI
1. Schema fetcher pulls column names, types, and 3 sample rows for referenced tables only — surgical injection, not full DB schema
1. Prompt builder injects schema + NL into a structured system prompt template
1. LLM provider router sends to OpenAI or Ollama based on user settings
1. LLM returns candidate SQL + a self-assessed confidence score (1–5)
1. SQL executor runs the query on DuckDB. On error: send error back to LLM for correction (max 2 retries)
1. Result streamed to frontend as: table / chart / Excel export / NL summary

DuckDB vs SQLite: DuckDB is chosen because it is purpose-built for analytical queries (GROUP BY, window functions, PIVOT) over large datasets. A vectorized query over 100k rows runs in ~40ms in DuckDB vs ~800ms in SQLite. For a desktop app where the user is watching a spinner, this difference is the line between fast and broken.


# **3. Application Layout**
## **3.1 Shell Structure**
The application uses a fixed left sidebar (56px collapsed / 220px expanded) alongside a main content area. The sidebar never overlaps the content.

## **3.2 Left Sidebar Navigation**

|**Position**|**Label**|**Action**|**Opens As**|
| :- | :- | :- | :- |
|Top|New chat|Opens a fresh chat session|Inline (replaces main area)|
|Top|History|Browse and search past sessions|Slide-in drawer|
|Top|Artifacts|View all exports and charts|Slide-in drawer|
|Top|Saved queries|Browse and reuse labeled queries|Slide-in drawer|
|Top|Data sources|Upload and manage Excel files|Full panel (replaces main area)|
|Bottom|Settings|Theme, LLM config, data management|Full panel (replaces main area)|


# **4. Feature Specifications**
## **4.1 New Chat**
### **Chat input behaviour**
- Multi-line textarea. Shift+Enter for newline, Enter to send.
- # triggers a file/sheet autocomplete dropdown positioned at cursor, showing filename → sheet as a two-level list, keyboard-navigable.
- Send button disabled while empty or while a response is streaming.
- Character counter appears only above 2,000 characters.

### **Per-message action bar (hover/tap to reveal)**

|**Action**|**Icon**|**Behaviour**|
| :- | :- | :- |
|Regenerate|↺|Re-sends the same NL query, generates fresh SQL|
|Like|👍|Marks message positively (stored locally)|
|Dislike|👎|Marks negatively; optionally opens one-line feedback input|
|Export as chart|📈|Opens chart builder pre-loaded with this result|
|Export to Excel|⬇️|Generates and downloads an .xlsx from the result|
|Save query|⭐|Opens save-query dialog with label input|
|Copy SQL|{}|Copies generated SQL to clipboard|

### **Per-message metadata footer (collapsed by default)**
- Input token count / output token count
- LLM generation time (e.g. SQL generated in 340 ms)
- SQL execution time (e.g. Data retrieved in 12 ms)
- Confidence score: 1–5 shown as coloured dots (red = 1–2, amber = 3, green = 4–5)
- Confidence 2264 2 shows an inline yellow warning banner: Low confidence - verify this result

### **Result display rules**
- Results 2264 500 rows: full inline sortable table.
- Results > 500 rows: first 500 shown with note: Showing 500 of N rows. Export to Excel for full dataset.
- Auto chart suggestion: LLM detects if a chart is more appropriate and proposes one; user can accept or dismiss.
- NL summary: 1–2 sentence plain English interpretation of the result shown below the table.

## **4.2 Chat History**
Opens as a slide-in drawer from the left sidebar.

- Search bar at top (searches session titles and message content).
- Favorites section pinned at top (collapsible).
- Sessions in reverse-chronological order, grouped by: Today / Yesterday / Last 7 days / Older.
- Per session: title (double-click to rename), last message timestamp, hover actions: ⭐ Favorite · ✏️ Rename · 🗑️ Delete.
- Delete shows a confirmation prompt.

## **4.3 Artifacts**
Opens as a slide-in drawer. Two tabs:

- Excel exports — filename, source session, date generated, file size. Actions: Download, Delete.
- Charts & visuals — thumbnail preview, chart type label, source session, date. Actions: Download PNG, Delete.

Deleting a chat session does not auto-delete its artifacts. Users manage artifacts independently from this panel.

## **4.4 Saved Queries**
Opens as a slide-in drawer.
### **Per-query row shows**
- User-defined label
- Original NL query text
- Generated SQL (collapsed, expandable)
- Created date, last-used date, use count badge

### **Actions**
- Run — inserts the NL query into current chat input and sends immediately.
- Edit label — inline rename.
- Delete — with confirmation.

### **Saving a query**
- Triggered from per-message action bar (⭐ Save query).
- Dialog: pre-filled NL query text (read-only) + label input (required) + optional notes field.

## **4.5 Data Sources (Excel File Management)**
Opens as a full-panel page replacing the main content area.
### **Upload**
- Drag-and-drop zone + Browse files button.
- Accepts .xlsx and .xls.
- Multiple file upload supported with per-file progress bars.
- On completion: success/error state per file. Errors show reason (e.g. Corrupted file, Password protected).

### **File list table**

|**Column**|**Notes**|
| :- | :- |
|Filename|Clickable to expand sheet list|
|Sheets|Count of sheets in the file|
|Rows|Total rows across all sheets|
|Uploaded|Relative timestamp (e.g. 2 hours ago)|
|Size|File size in KB/MB|
|Actions|View sheets · Preview · Re-import · Delete|

### **Excel editing (v1 scope)**
Manual and chat-driven Excel editing is deferred to v2. The UI reserves a disabled Edit button with tooltip: Coming in a future version.

## **4.6 Settings**
Opens as a full-panel replacement. Three sub-sections:
### **Appearance**
- Theme toggle: Light / Dark / System default. Applied immediately, persisted.

### **LLM Provider**
- OpenAI: API key (masked + show/hide), Test connection button, model selection dropdown (fetched from OpenAI, cached).
- Ollama: Base URL input (default http://localhost:11434), Test connection, model list fetched from Ollama API, Add model (pull by name with progress).
- Active provider radio: OpenAI / Ollama. Status indicator: green dot = connected, red = not configured.

### **Data management**
- Open data folder — opens the app data directory in OS file browser.
- Clear all chat history — double-confirmation.
- Delete all uploaded files — double-confirmation.
- Export settings / Import settings — JSON backup and restore of settings (not chat data).

API keys are stored in the OS keychain (Keytar via Electron), never in plaintext files.


# **5. Chart Builder**
Accessible from the per-message action bar (📈 Export as chart).
## **5.1 Supported Chart Types**

|**Type**|**Best for**|
| :- | :- |
|Bar|Categorical comparisons|
|Horizontal bar|Long category labels|
|Line|Time series and trends|
|Area|Cumulative trends|
|Pie|Part-of-whole (≤ 7 categories)|
|Donut|Part-of-whole with a center statistic|
|Scatter|Correlation between two numeric columns|
|Histogram|Distribution of a single numeric column|
|Heatmap|Two categorical axes + numeric intensity|
|Pivot table|Grouped aggregations|

## **5.2 Auto-detection**
After SQL execution, the backend sends a second lightweight LLM call with column names and types. The LLM returns a chart type + axis mapping. If confidence is low, the UI shows the chart type selector with no pre-selection.

## **5.3 Chart UI**
- Chart type selector tabs at top.
- Axis assignment dropdowns: x-axis, y-axis, group by.
- Title input (pre-filled from the NL query).
- Color palette selector (5 preset palettes).
- Download PNG / Download SVG buttons.
- Save to Artifacts button.


# **6. Non-Functional Requirements**
## **6.1 Performance Targets**

|**Metric**|**Target**|
| :- | :- |
|App cold start (including Python backend startup)|≤ 4 seconds|
|Excel import (10,000 rows)|≤ 2 seconds|
|SQL execution (simple query, 100k rows)|≤ 500 ms|
|LLM SQL generation (OpenAI GPT-4o)|≤ 5 seconds|
|Chart render|≤ 300 ms|

## **6.2 Security**
- API keys stored in OS keychain via Keytar — never in plaintext files or environment variables.
- No telemetry, no analytics, no data sent anywhere except user-initiated LLM API calls.
- All Excel data, query history, and exports remain local.

## **6.3 Reliability**
- Self-correction retry loop: max 2 retries on SQL error before returning a user-facing error.
- Failed Excel imports are rolled back completely — no partial data in DuckDB.
- App crash recovery: last active session restored on next launch.

## **6.4 Accessibility**
- Full keyboard navigation through sidebar and all drawers.
- Focus traps in modals and drawers.
- WCAG AA colour contrast in both light and dark themes.


# **7. Error States**

|**Scenario**|**User-facing message**|
| :- | :- |
|LLM provider not configured|Set up your LLM provider in Settings before querying. [Settings →]|
|SQL generation failed after 2 retries|Couldn't generate a valid query. Try rephrasing or be more specific about which columns to use.|
|No #filename reference in query|Mention a data source with #filename to query your data.|
|Referenced file not found in DB|#filename.xlsx was not found. It may have been deleted. Go to Data Sources to re-upload.|
|Excel file is password protected|This file is password protected and cannot be imported.|
|DuckDB query timeout (> 30 s)|This query is taking too long. Try narrowing your question or filtering the data.|
|Ollama unreachable|Cannot reach Ollama at [url]. Make sure Ollama is running.|


# **8. Out of Scope — v1**
Explicitly deferred to keep v1 shippable:

- Excel file editing (manual or chat-driven)
- Multi-user or shared sessions
- Cloud sync or backup
- Plugin or extension system
- SQL editor / manual query mode (power user feature, v2 candidate)
- Scheduled or recurring queries
- Slack, email, or other integrations
- Formula-aware Excel parsing (cells with formulas read as computed values only)


# **9. Suggested Improvements Beyond v1**
## **9.1 High Value, Low Complexity**
- SQL editor pane — show generated SQL in an editable code block. Let the user tweak and re-run. One toggle away once the infrastructure exists.
- Keyboard shortcuts — Cmd/Ctrl+K for new chat, Cmd/Ctrl+H for history, Cmd/Ctrl+, for settings. Standard pattern, high perceived quality.
- Pin columns in result tables — freeze the first column for wide result sets.
- Copy cell / copy row — right-click on table cells to copy individual values.

## **9.2 High Value, Medium Complexity**
- Auto-relationship detection — on upload, scan all loaded tables for columns with the same name and type. Surface these as suggested JOINs in the schema context sent to the LLM. Dramatically improves multi-file query accuracy.
- Query templates — ship 10–15 built-in query templates (Top 10 by revenue, Month-over-month growth, Find duplicates) that apply to any uploaded file. Good for non-technical users.
- Diff view for re-imports — when a user re-imports an updated Excel, show which rows were added, changed, or removed before committing.
- Named report auto-refresh — saved queries re-run automatically when their source file is re-imported. Shown in a Reports section.

## **9.3 Architecture-Level Improvements**
- Schema versioning — track column changes across re-imports. Surface a warning in saved queries that reference renamed or removed columns.
- Streaming results — stream rows to the frontend as DuckDB produces them, not after the full result is ready.
- Background import queue — imports run in a background thread so the user can keep chatting while large files are being processed.
- LLM context window management — for very long chat sessions, auto-summarise older messages to stay within token limits rather than silently truncating them.

## **9.4 UX Improvements**
- Onboarding flow — first-launch wizard: set LLM provider → upload a sample file → run a guided first query. Eliminates the blank-slate problem.
- Result pinning — pin a result to the top of a chat for reference while continuing to ask follow-up questions below it.
- Voice input — use the Web Speech API (available in Electron's Chromium) for hands-free querying. Zero additional dependency cost.
- Density toggle — compact / comfortable / spacious. Power users want more data on screen; casual users want breathing room.


# **10. Corrections to Original Spec**
These are places where the original feature description had gaps or inconsistencies.

|**Original statement**|**What changed**|**Why**|
| :- | :- | :- |
|Chat history pops up a window|Changed to a slide-in drawer|A separate OS window creates focus management bugs on Linux and breaks keyboard nav. Drawers are the standard pattern.|
|Artifacts shows images with graphs or charts|Split into two tabs: Excel exports and Charts|A list/grid hybrid for two content types produces a confusing layout. Separate tabs with appropriate layouts per type is cleaner.|
|Saved queries: user can label and reuse|Added use count and last-used date|Without sorting signals, the list becomes noise after a few weeks of use.|
|Edit Excel manually or with chat|Deferred entirely to v2|A correct diff/apply/confirm flow for Excel editing is a full product surface on its own. A broken v1 of this hurts trust more than not having it.|
|Ollama: add new models|Clarified as: pull new model by name with progress tracking|Listing installed models is not enough. Users need to pull new ones from inside the app or they will context-switch to the terminal.|
|Token usage, time taken shown on result|Moved to a collapsed metadata footer per message|Always-visible metadata clutters the chat. It should be discoverable, not forced on every message.|
