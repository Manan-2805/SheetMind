You are building SheetMind — a desktop application where users upload Excel files and query them using natural language. The app converts natural language to SQL, executes it against a DuckDB database via a FastAPI backend, and returns results as tables, charts, or Excel exports.

Read this entire prompt before writing a single line of code. If anything is ambiguous after reading, list your questions in the implementation plan before proceeding. Do not assume. Do not offer options. Execute exactly what is specified.

---

## WHAT ALREADY EXISTS

Frontend:
- Project created with: npm create vite@latest, project name: frontend, TypeScript selected
- npm install already run, basic Vite dev server tested and working
- Location: ./frontend/

Backend:
- uv init already run inside ./backend/ folder
- Python 3.11 selected
- Location: ./backend/

Do not reinitialize either project. Build on top of what exists.

---

## STRICT RULES — READ BEFORE ANYTHING ELSE

1. No Electron, no exe building, no packaging. Frontend and backend only. They communicate over HTTP localhost.
2. Every page that displays data must fetch it from a FastAPI endpoint. No hardcoded data in React components. If real data does not exist yet, the FastAPI endpoint returns realistic mock data. The React component calls the API. Always.
3. Skeleton loaders everywhere. No spinners. No static "Loading..." text. Every data-fetching component shows a skeleton that matches the exact shape of the real content while loading — same dimensions, same layout, same number of rows. Model this after how YouTube, Linear, and Vercel implement skeletons.
4. FastAPI must only accept requests from the frontend origin (http://localhost:5173). Configure CORS to allow only this origin. Reject all other origins.
5. shadcn/ui is the component primitive library. Install it properly. Use its components for all dialogs, tooltips, dropdowns, tabs, and overlays.
6. Tailwind CSS v4 is the styling system. Install it fresh into the existing Vite project. Do not use inline styles. Do not use plain CSS files except for a single global.css that sets CSS variables for the design tokens. All component styling uses Tailwind utility classes.
7. react-apexcharts is the chart library. Use the /core import to tree-shake unused chart types. Import only the chart types that are actually used in the component that uses them.
8. All reusable UI pieces are components. If you write the same JSX structure twice, it is a component.
9. Do not use any spinner or loading icon component from any library. Skeleton only.
10. The FastAPI backend uses uv for dependency management. All dependencies are added via: uv add <package>. Never use pip directly.
11. Generate a complete implementation plan first. The plan must list every file that will be created, what it contains, and the order of creation. After the plan, ask if there are any clarifications needed before proceeding. Only start writing code after the plan is confirmed.

---

## DESIGN TOKENS — IMPLEMENT THESE EXACTLY

These go in frontend/src/styles/global.css as CSS custom properties on :root and .dark.

Dark theme (default, applied to html element by default):
--color-bg-base: #0D0D0F
--color-bg-elevated: #131316
--color-bg-hover: #1C1C21
--color-bg-active: #222228
--color-border-default: #2A2A32
--color-border-subtle: #1E1E26
--color-text-primary: #F4F4F5
--color-text-secondary: #A1A1AA
--color-text-tertiary: #52525B
--color-accent: #7C3AED
--color-accent-hover: #6D28D9
--color-accent-subtle: rgba(124, 58, 237, 0.08)
--color-accent-border: rgba(124, 58, 237, 0.25)
--color-destructive: #EF4444
--color-success: #22C55E
--color-warning: #F59E0B

Light theme (.light class on html element):
--color-bg-base: #FAFAFA
--color-bg-elevated: #FFFFFF
--color-bg-hover: #F4F4F5
--color-bg-active: #E4E4E7
--color-border-default: #E4E4E7
--color-border-subtle: #F4F4F5
--color-text-primary: #09090B
--color-text-secondary: #52525B
--color-text-tertiary: #A1A1AA
--color-accent: #7C3AED
--color-accent-hover: #6D28D9
--color-accent-subtle: rgba(124, 58, 237, 0.08)
--color-accent-border: rgba(124, 58, 237, 0.25)
--color-destructive: #DC2626
--color-success: #16A34A
--color-warning: #D97706

Map these to Tailwind v4 theme config so they are usable as Tailwind classes (e.g. bg-bg-base, text-text-primary, border-border-default, bg-accent, text-accent).

---

## TYPOGRAPHY

Font: Inter from Google Fonts, loaded in index.html.
Code/SQL blocks: JetBrains Mono from Google Fonts, loaded in index.html.

Type scale (implement as Tailwind utilities):
- UI label: 11px / font-medium / tracking-wide (0.02em)
- Body: 13px / font-normal
- Body emphasis: 13px / font-medium
- Panel heading: 14px / font-semibold
- Page heading: 18px / font-semibold
- Code: 12px / JetBrains Mono

---

## NAMING CONVENTIONS — FOLLOW WITHOUT EXCEPTION

File names:
- React components: PascalCase.tsx (e.g. ChatMessage.tsx, SkeletonRow.tsx)
- Hooks: camelCase with use prefix (e.g. useTheme.ts, useChatHistory.ts)
- Utility functions: camelCase.ts (e.g. formatDate.ts, buildChartOptions.ts)
- API client functions: camelCase.ts inside src/api/ (e.g. chatApi.ts, dataSourcesApi.ts)
- Types/interfaces: PascalCase.ts inside src/types/ (e.g. ChatMessage.ts, DataSource.ts)
- Pages: PascalCase with Page suffix (e.g. ChatPage.tsx, SettingsPage.tsx)
- Drawers: PascalCase with Drawer suffix (e.g. HistoryDrawer.tsx, ArtifactsDrawer.tsx)

Component naming:
- All React component functions: PascalCase
- Props interfaces: ComponentNameProps (e.g. ChatMessageProps, SkeletonRowProps)

CSS class naming:
- Use Tailwind utility classes directly. No custom CSS class names except for animation keyframes in global.css.

Backend file names:
- Routers: snake_case with _router suffix (e.g. chat_router.py, data_sources_router.py)
- Models: snake_case with _models suffix (e.g. chat_models.py, data_source_models.py)
- Services: snake_case with _service suffix (e.g. chat_service.py, duckdb_service.py)
- Schemas: snake_case with _schemas suffix (e.g. chat_schemas.py)

Backend function and method naming:
- All functions and methods: snake_case
- FastAPI path operation functions: verb_noun pattern (e.g. get_chat_sessions, create_message, delete_data_source)
- Pydantic model classes: PascalCase (e.g. ChatSession, DataSourceResponse)

---

## PROJECT STRUCTURE — CREATE EXACTLY THIS

frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── chatApi.ts
│   │   ├── dataSourcesApi.ts
│   │   ├── artifactsApi.ts
│   │   ├── savedQueriesApi.ts
│   │   └── settingsApi.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TitleBar.tsx
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatMessageActions.tsx
│   │   │   ├── ChatMessageMeta.tsx
│   │   │   ├── ChatResultTable.tsx
│   │   │   ├── ChatEmptyState.tsx
│   │   │   ├── FileAutocomplete.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── charts/
│   │   │   ├── ChartRenderer.tsx
│   │   │   └── chartOptions.ts
│   │   ├── skeletons/
│   │   │   ├── SkeletonText.tsx
│   │   │   ├── SkeletonRow.tsx
│   │   │   ├── SkeletonCard.tsx
│   │   │   ├── SkeletonTable.tsx
│   │   │   └── SkeletonChatMessage.tsx
│   │   └── ui/
│   │       ├── Toast.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Badge.tsx
│   │       ├── Drawer.tsx
│   │       └── SegmentedControl.tsx
│   ├── drawers/
│   │   ├── HistoryDrawer.tsx
│   │   ├── ArtifactsDrawer.tsx
│   │   └── SavedQueriesDrawer.tsx
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useChat.ts
│   │   ├── useFileAutocomplete.ts
│   │   └── useToast.ts
│   ├── pages/
│   │   ├── OnboardingPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── DataSourcesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   ├── ChatMessage.ts
│   │   ├── DataSource.ts
│   │   ├── Artifact.ts
│   │   ├── SavedQuery.ts
│   │   └── Settings.ts
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── buildChartOptions.ts
│   │   └── cn.ts
│   ├── App.tsx
│   └── main.tsx

backend/
├── routers/
│   ├── chat_router.py
│   ├── data_sources_router.py
│   ├── artifacts_router.py
│   ├── saved_queries_router.py
│   └── settings_router.py
├── services/
│   ├── chat_service.py
│   ├── duckdb_service.py
│   └── llm_service.py
├── models/
│   ├── chat_models.py
│   ├── data_source_models.py
│   └── artifact_models.py
├── schemas/
│   ├── chat_schemas.py
│   ├── data_source_schemas.py
│   └── common_schemas.py
├── main.py
└── pyproject.toml (already exists from uv init — add dependencies to it)

---

## TECH STACK — INSTALL THESE EXACT PACKAGES

Frontend — run these in order inside ./frontend/:
1. npm install -D tailwindcss@next @tailwindcss/vite
2. npx shadcn@latest init (select: TypeScript yes, style Default, base color Neutral, CSS variables yes, tailwind config yes, components path src/components/ui, import alias @/components, no RSC)
3. npm install react-apexcharts apexcharts
4. npm install lucide-react
5. npm install axios
6. npm install clsx tailwind-merge (for the cn() utility)

Backend — run these inside ./backend/ using uv add:
1. uv add fastapi
2. uv add "uvicorn[standard]"
3. uv add duckdb
4. uv add pandas
5. uv add openpyxl
6. uv add python-multipart

---

## FRONTEND ARCHITECTURE DETAILS

### Routing
Use React state-based routing, not react-router. App.tsx manages a single activeView state:
type ActiveView = 'onboarding' | 'chat' | 'data-sources' | 'settings'

Drawers are managed by a single activeDrawer state:
type ActiveDrawer = 'history' | 'artifacts' | 'saved-queries' | null

### Theme
useTheme.ts manages theme state. It stores the user's preference in localStorage under the key 'sheetmind-theme'. Values: 'dark' | 'light' | 'system'. It applies 'dark' or 'light' class to the html element. On mount, it reads localStorage and applies immediately before first render to prevent flash.

### API Client
All API calls go through functions in src/api/. Every function uses axios with a base URL of http://localhost:8000. Every function is async and returns typed data. No raw fetch calls in components. Error handling is in the API functions — they throw a typed error that components can catch.

### Skeleton Implementation
Every skeleton component uses a shimmer animation defined in global.css:
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-elevated) 25%, var(--color-bg-hover) 50%, var(--color-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

SkeletonText.tsx renders a div with className="skeleton" and accepts width and height props.
SkeletonRow.tsx renders a table row of skeletons that matches the column structure of ChatResultTable.
SkeletonTable.tsx renders 5 SkeletonRows with a skeleton header.
SkeletonCard.tsx renders a card-shaped skeleton block.
SkeletonChatMessage.tsx renders a skeleton that matches the exact layout of a real ChatMessage (icon placeholder + 3 lines of text at varying widths + skeleton table below).

### # Autocomplete in ChatInput
When the user types # in the textarea, FileAutocomplete.tsx appears. It:
- Is positioned absolutely above the textarea cursor position using the textarea-caret library: install it with npm install textarea-caret
- Fetches the list of uploaded files and their sheets from GET /api/data-sources/list-for-autocomplete which returns mock data for now
- Shows a two-level list: filename row → indented sheet name rows
- Keyboard navigation: ArrowUp/ArrowDown moves selection, Enter inserts the selection at cursor replacing the # trigger, Escape dismisses
- Clicking outside dismisses it
- On selection, inserts #filename into the textarea at the cursor position

### Chart Renderer
ChartRenderer.tsx accepts: type (bar | horizontal-bar | line | area | pie | donut | scatter | histogram | heatmap), series, categories, title, and height props.
It uses react-apexcharts/core and imports only the chart type being rendered.
It reads the current theme from useTheme and passes theme: { mode: 'dark' | 'light' } to ApexCharts options.
The violet accent color (#7C3AED) is used as the primary chart color.
chartOptions.ts exports a buildChartOptions function that constructs the full ApexCharts options object from the chart type and theme, applying all design tokens (background transparent, grid lines using border-default color, text using text-secondary color, tooltip using bg-elevated background).

---

## BACKEND ARCHITECTURE DETAILS

### main.py
- Creates the FastAPI app instance
- Configures CORS: allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
- Includes all routers with prefix /api
- Includes a GET /api/health endpoint that returns {"status": "ok", "version": "1.0.0"}
- Starts uvicorn on host 0.0.0.0 port 8000 when run directly

### DuckDB Service
duckdb_service.py manages a single DuckDB connection to a file called sheetmind.duckdb in the backend directory. It initializes the schema on startup creating these tables if they do not exist:
- excel_files: id INTEGER PRIMARY KEY, original_filename VARCHAR, stored_path VARCHAR, uploaded_at TIMESTAMP, num_sheets INTEGER, file_size_bytes BIGINT
- excel_sheets: id INTEGER PRIMARY KEY, excel_file_id INTEGER, sheet_name VARCHAR, table_name VARCHAR, row_count INTEGER, col_count INTEGER, imported_at TIMESTAMP
- chat_sessions: id INTEGER PRIMARY KEY, title VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP, is_favorite BOOLEAN DEFAULT false
- chat_messages: id INTEGER PRIMARY KEY, session_id INTEGER, role VARCHAR, content VARCHAR, created_at TIMESTAMP, sql_generated VARCHAR, sql_execution_ms INTEGER, llm_generation_ms INTEGER, token_count_input INTEGER, token_count_output INTEGER, confidence_score INTEGER, result_row_count INTEGER
- saved_queries: id INTEGER PRIMARY KEY, label VARCHAR, nl_query VARCHAR, sql_query VARCHAR, created_at TIMESTAMP, last_used_at TIMESTAMP, use_count INTEGER DEFAULT 0
- artifacts: id INTEGER PRIMARY KEY, type VARCHAR, filename VARCHAR, file_path VARCHAR, created_at TIMESTAMP, source_message_id INTEGER, title VARCHAR

### Mock Data Strategy
Every router returns realistic mock data for now. The mock data must look like real application data — real-looking filenames, real-looking chat messages, real-looking query labels. Every endpoint is fully wired: the router calls the service, the service returns mock data shaped exactly like real data will be shaped. When real implementation replaces mock data, only the service layer changes — routers and schemas stay the same.

---

## PAGE AND ENDPOINT SPECIFICATIONS

### OnboardingPage
Route condition: no username in localStorage (key: 'sheetmind-username')
POST /api/auth/setup — body: { username: string } — returns: { username: string, created_at: string }
On success: saves username to localStorage, transitions to ChatPage
Animation: card fades in and slides up 12px on mount using Tailwind's transition classes + a mounted state boolean

### ChatPage
This is the primary view. It has two sub-states: empty (no messages) and active (messages exist).

Empty state: centered content with app name, tagline, and three suggestion chips. Each chip is a button that pre-fills the chat input.

Active state: scrollable message list + fixed input at bottom.

Endpoints needed:
- GET /api/chat/sessions — returns list of ChatSession objects with mock data
- GET /api/chat/sessions/:id/messages — returns list of ChatMessage objects with mock data. Include at least 3 mock messages: one user message, one assistant message with a result table (5 columns, 8 rows of mock data), one assistant message with the metadata footer in expanded state showing mock token counts and timing.
- POST /api/chat/sessions — creates a new session — returns new ChatSession
- POST /api/chat/sessions/:id/messages — body: { content: string, referenced_files: string[] } — returns mock ChatMessage with simulated SQL, result table, confidence score, token counts, timing

ChatMessage component renders:
- User messages: right-aligned, bg-bg-hover, rounded with bottom-right corner 2px, max-w-[60%]
- Assistant messages: left-aligned with 20px app icon (violet circle with S letter), no bubble background, full content width
- Below assistant message content: ChatResultTable if result_data exists
- Below table: NL summary in text-secondary italic text
- ChatMessageActions bar on hover (opacity-0 group-hover:opacity-100 transition)
- ChatMessageMeta collapsible footer

ChatResultTable renders a table with: sortable column headers (click to sort asc/desc with arrow icon), alternating row backgrounds, max 8 rows visible with internal scroll, "Showing X of Y rows" footer if more than 8 rows exist.

ChatInput renders: auto-growing textarea (min 44px, max 160px), # button on left inside textarea, send button on right inside textarea (violet, disabled when empty or loading), hint text below. While loading: send button shows nothing (it is disabled), TypingIndicator appears as a new message in the list immediately.

TypingIndicator renders three dots that pulse in sequence using CSS animation. Below the dots, show "Generating SQL..." text in text-tertiary 12px.

ChatMessageActions renders icon buttons using Lucide icons: RotateCcw, ThumbsUp, ThumbsDown, BarChart2, Download, Star, Code2. Each has a Tooltip on hover. Each is text-tertiary by default, text-primary on hover, 120ms transition.

ChatMessageMeta renders collapsed by default showing "▸ Query details" clickable text. Expanded shows: tokens in/out, SQL time in ms, LLM time in ms, confidence dots (5 small circles, filled to score, color based on score: red 1-2, amber 3, green 4-5).

### HistoryDrawer
Slides in from left, 220px wide, overlays content. Backdrop: none.
Animation: translateX(-220px) → translateX(0) on open, reverse on close. Use CSS transition, 200ms ease-out.

GET /api/chat/sessions — already defined above, reuse it. Group sessions by date on the frontend.

Session rows: 36px height, title truncated, timestamp right-aligned, hover shows star/edit/trash icons sliding in from right.

Search input filters sessions by title client-side (no new endpoint needed).

### ArtifactsDrawer
280px wide, same slide animation.

GET /api/artifacts — returns { excel_exports: ArtifactExport[], charts: ArtifactChart[] } with mock data. At least 3 of each type.

Two tabs using shadcn Tabs component.

Excel exports tab: list rows with file icon, filename, source session name, file size, date, hover actions.
Charts tab: 2-column grid, each card 120px height with a gradient placeholder (violet to purple), chart type badge, date below. Card hover: scale(1.02) border-accent transition 150ms.

### SavedQueriesDrawer
300px wide, same slide animation.

GET /api/saved-queries — returns SavedQuery[] with mock data. At least 4 mock queries with different labels and use counts.

Each query renders as a card (not a row). Cards have: label, NL query text (2 lines max), last used date, use count badge, Run button (violet, ▶ icon), Delete button (text-tertiary, turns text-destructive on hover), "{} View SQL" toggle that expands a code block using JetBrains Mono.

POST /api/saved-queries — body: { label: string, nl_query: string, sql_query: string } — returns new SavedQuery
DELETE /api/saved-queries/:id — returns { success: true }
POST /api/saved-queries/:id/run — returns { inserted_query: string } (the NL query to insert into chat)

### DataSourcesPage
Replaces main content area.

GET /api/data-sources — returns DataSource[] with mock data. At least 3 mock Excel files, each with 2-3 sheets. Include row_count, col_count, file_size_bytes, uploaded_at for each.

POST /api/data-sources/upload — accepts multipart form data, file field name: "file" — returns DataSource mock object with a simulated 1.5 second delay to show upload progress UI
DELETE /api/data-sources/:id — returns { success: true }
GET /api/data-sources/:id/preview — returns { columns: string[], rows: any[][] } with 10 rows of mock data
GET /api/data-sources/list-for-autocomplete — returns { files: { filename: string, sheets: string[] }[] }

Upload zone: drag-and-drop using HTML5 drag events (no library). On drag-over: border-accent, bg-accent-subtle transition. Multiple file selection allowed. Each file shows individual progress bar (violet fill, animated indeterminate while uploading since we cannot get real progress from a mock, 4px height, 8px radius).

File list table: Filename / Sheets / Rows / Size / Uploaded / Actions columns. Header 11px text-tertiary uppercase. Rows 48px height. On hover: show Preview, Re-import (disabled with tooltip "Coming soon"), Delete as text buttons. Expand chevron left of filename expands sheet sub-rows (indented, violet left border 2px, bg-bg-hover, sheet name + row count + col count). Preview opens a shadcn Dialog showing first 10 rows with SkeletonTable while loading.

### SettingsPage
Replaces main content area. Two-column layout: 180px left nav + content area.

Left nav items: Appearance, LLM Provider, Data. Active item: 2px left violet border + bg-bg-active + text-primary. Inactive: text-secondary, hover bg-bg-hover.

GET /api/settings — returns current settings object
PUT /api/settings — body: Partial<Settings> — returns updated settings object

Appearance section: Theme segmented control with three options (Light / Dark / System). On selection: immediately applies theme via useTheme hook. PUT /api/settings with { theme: value }.

LLM Provider section: Segmented control at top: OpenAI | Ollama.

OpenAI fields: API key masked input with Eye/EyeOff toggle. Test Connection button — on click: POST /api/settings/test-llm with { provider: 'openai', api_key: string } — show spinner on button during request (spinner replaces button text, not a separate element) — on response show "✓ Connected" green text or "✗ Failed" red text inline next to button for 3 seconds then revert. Model dropdown: static options gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini.

Ollama fields: URL input pre-filled with http://localhost:11434. Test Connection button same behavior. Model dropdown populated after successful test. Pull New Model: text input + Pull button + progress bar (indeterminate violet) shown during pull. POST /api/settings/pull-ollama-model body: { model_name: string } returns mock { success: true, model: string } after 2 second delay.

Data section: rows with label, description, action button. Clear Chat History and Delete All Files buttons turn red outline on hover and show a 3-second countdown confirmation inline (no modal): button text changes to "Confirm in 3..." counting down to "Confirm now" — clicking at any point during countdown confirms, clicking away cancels.

POST /api/settings/test-llm — mock returns { success: true, provider: string, latency_ms: number } after 800ms delay
POST /api/settings/pull-ollama-model — mock returns { success: true, model: string } after 2000ms delay
POST /api/settings/clear-chat-history — returns { success: true, deleted_sessions: number }
POST /api/settings/delete-all-files — returns { success: true, deleted_files: number }
GET /api/settings/export — returns settings JSON as a downloadable file
POST /api/settings/import — accepts JSON file — returns { success: true }

---

## ANIMATIONS AND TRANSITIONS

Define these in global.css as keyframes, use them via Tailwind's arbitrary value syntax or as named CSS classes:

Drawer slide: transform translateX, 200ms ease-out
Page transition (data-sources / settings replacing chat): opacity fade, 150ms ease
Button press: active:scale-[0.97], 80ms
Hover states: all interactive elements use transition-colors duration-[120ms]
Card hover in artifacts: hover:scale-[1.02] transition-transform duration-150
Shimmer skeleton: defined above

Mount animation for OnboardingPage card:
Start: opacity-0 translate-y-3
End: opacity-100 translate-y-0
Duration: 300ms ease-out
Implemented with a useEffect that sets a mounted boolean after a 10ms delay, toggling Tailwind classes conditionally.

---

## TOAST SYSTEM

useToast.ts manages a global toast queue in React context. Toast is pushed with: addToast({ type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string }).

Toast.tsx renders in a fixed bottom-right portal. Each toast: 320px wide, bg-bg-elevated, border-border-default, 8px radius, 12px padding, left colored bar (4px, color based on type: accent=info, success, destructive=error, warning). Auto-dismisses after 4 seconds with slide-out-right animation. Manual X button.

---

## IMPLEMENTATION PLAN REQUIREMENT

Before writing any code, output a structured implementation plan in this format:

PHASE 1 — Foundation
List every file, what it sets up, in what order.

PHASE 2 — Backend routers and mock data
List every router file and every endpoint in it.

PHASE 3 — Frontend pages and drawers
List every page and drawer in order of implementation.

PHASE 4 — Integration and wiring
List every API connection being made real.

After the plan, write exactly this line:
"Any clarifications needed before I begin? If not, I'll start with Phase 1."

Then wait for confirmation before writing any code.

---

## FINAL CHECKLIST BEFORE SUBMITTING ANY CODE

Before writing each file, verify:
- [ ] Does it follow the naming convention?
- [ ] Does every data fetch use an API function from src/api/?
- [ ] Does every loading state use a skeleton, not a spinner?
- [ ] Does every interactive element have hover, active, focus states?
- [ ] Does it use Tailwind classes only (no inline styles, no plain CSS outside global.css)?
- [ ] Does it use the design tokens via CSS variables?
- [ ] Is CORS configured to allow only http://localhost:5173?
- [ ] Does the backend mock data look realistic, not placeholder-y?