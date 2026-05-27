# Desktop Frontend - Skill Guide for Sheetmind

## Project Overview
The desktop frontend of SheetMind is a cross-platform React application that interfaces directly with a local Python/FastAPI backend (spawning a DuckDB database). It provides a high-performance, completely offline natural language-to-SQL data exploration interface, featuring spreadsheet editing (via Univer/Handsontable), drag-and-drop dashboard building, and rich chat interactions. The frontend is built for fast iteration, native-like UX via Electron, and robust local data management.

## Folder Structure
```bash
desktop-application/frontend/
├── api/             # Axios API client functions grouped by feature (chatApi.ts, excelEditorApi.ts)
├── assets/          # Static assets like images and fonts
├── components/      # React components (includes shadcn/ui components in `ui/`)
├── drawers/         # Slide-in drawer components (e.g., HistoryDrawer.tsx)
├── hooks/           # Custom React hooks containing local state and logic (e.g., useChat.ts)
├── lib/             # Utility libraries (e.g., shadcn utils)
├── pages/           # High-level route components (ChatPage, SettingsPage, DashboardsPage)
├── services/        # External connection singletons (e.g., websocketService.ts)
├── styles/          # Additional CSS files
├── types/           # TypeScript interfaces and types for API and local state
└── utils/           # Helper functions (e.g., chatReferences.ts)
```

## Core Packages, Files & Responsibilities
- `package.json` / `vite.config.ts`: Defines the Vite + React setup. Note the `optimizeDeps` for `@univerjs`.
- `src/main.tsx`: Entry point, sets up `HashRouter` (crucial for Electron environments).
- `src/App.tsx`: Root component managing Onboarding and the `AppShell`.
- `src/components/layout/AppShell.tsx`: Central layout manager, synchronizes routing with chat sessions and handles sidebar/drawer states.
- `src/api/apiClient.ts`: Base Axios instance configured for local backend communication.
- `src/hooks/useChat.ts`: Manages chat state (messages, loading states, follow-ups, optimistic UI) using standard React hooks.
- `src/hooks/useExcelEditor.ts`: Manages the complex state and operations of the Univer/Handsontable spreadsheet grid.

## Architecture & Design Patterns
- **Overall architecture**: React SPA running inside an Electron browser window, communicating locally with a FastAPI backend via Axios (HTTP) and WebSockets (for live status updates).
- **State management (Correction from PRD)**: Although the PRD mentions Zustand, the actual codebase utilizes **custom React hooks** (`useChat`, `useExcelEditor`, `useToast`) mapping `useState` and `useRef` rather than a global Zustand store.
- **Component design**: 
  - Strictly follows the **shadcn/ui** pattern using Tailwind CSS. 
  - Components are heavily composed (e.g., `ChatInput`, `ChatMessage`).
  - Utilizes Lucide-react for all iconography.
- **Data fetching strategy**: 
  - Managed by feature-specific API files (`chatApi.ts`, `dataSourcesApi.ts`). 
  - Functions use async/await with a generic `handleError` wrapper that standardizes error throwing.
- **Routing**: `react-router-dom` using `HashRouter` mapping top-level `/:sessionId` for chats and named paths (`/data-sources`, `/settings`) for app panels.
- **Electron-specific patterns**: Relies on `HashRouter` to avoid file:// protocol path issues in production builds.
- **Grid Editing**: Extensive usage of `@univerjs` APIs via `useExcelEditor.ts` to sync local DOM mutations with React state before pushing back to the backend.

## Coding Standards & Conventions
- **File & folder naming**: CamelCase for hooks/utils (`useChat.ts`), PascalCase for React components and pages (`ChatPage.tsx`).
- **Component structure**: Functional components only. Default exports for pages and root files; named exports for hooks, API functions, and components.
- **Import order rules**: 
  1. System / external libraries (`react`, `react-router-dom`, `lucide-react`)
  2. Internal absolute imports (`@/components/...`, `@/hooks/...`, `@/api/...`)
  3. Internal relative imports
  (Leave a blank line between groups, alphabetically sorted).
- **TypeScript**: Strict typing enforced. Prefer interfaces in the `src/types/` folder for models shared across API and components (e.g., `ChatMessage`, `ResultTable`).
- **Tailwind + shadcn/ui**: Use `cn()` utility from `clsx` and `tailwind-merge` for conditional classes. Avoid inline styles unless computing dynamic sizing.

## Key Utilities & Helpers
- `useChat`: Core hook for session tracking, message appending, regenerating, and optimistic UI updates.
- `useExcelEditor`: Handles all Excel cell bindings, formatting map persistence, and AI mutation logic with Univer.
- `useToast` / `ToastProvider`: Global application notifications pattern.
- `api/apiClient.ts`: The unified Axios interceptor instance for backend requests.
- `websocketService.ts`: Singleton managing real-time SQL execution status and streaming events.

## Common Implementation Patterns
- **Adding a new page / feature**:
  1. Create the page component in `src/pages/NewFeaturePage.tsx`.
  2. Add the route inside `AppShell.tsx` under `<Routes>`.
  3. Add a sidebar icon in `Sidebar.tsx` and map its `ActiveView` state.
- **Adding a new API endpoint**:
  1. Add the HTTP request function in `src/api/{feature}Api.ts`.
  2. Use the generic `handleError` to parse Axios errors.
  3. Wire the API call to a specific `useFeature` hook to manage loading/error states.
- **Using shadcn/ui**: 
  - Add via `components.json` registry or implement natively if not available. 
  - Always combine classes with `cn(...)` to prevent CSS specificity conflicts.
- **Working with the Editor**: 
  - State inside the grid is mutable. Only sync back to React state when `isDirty` flags are triggered or saves occur.
  - Univer snapshot parsing (`extractRowsFromSnapshot`) is required before sending grid data back to the server.

## Agent Rules (Strict)
- **NEVER** introduce global stores like Redux or Zustand unless explicitly requested; strictly use React Contexts or custom Hooks to match existing codebase patterns.
- **NEVER** use `BrowserRouter`; strictly stick to `HashRouter` for Electron compatibility.
- **ALWAYS** encapsulate API calls inside the `src/api` folder, never directly inside a React component.
- **ALWAYS** implement loading skeletons or indeterminate states when fetching data or interacting with the database.
- **ALWAYS** handle optimistic UI updates when mutating chat messages (e.g., appending a message locally before awaiting the API response).
- **DO NOT** use default exports except for `App.tsx` and `main.tsx`. Use named exports for all standard components and hooks.

## Tech Stack & Tools
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM (HashRouter)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Icons**: Lucide React
- **Data Fetching**: Axios
- **Grid Engine**: Univer (@univerjs) + Handsontable
- **Charts**: ApexCharts (react-apexcharts)
- **Layouts**: react-grid-layout, react-resizable-panels
