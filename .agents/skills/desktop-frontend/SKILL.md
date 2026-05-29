---
name: desktop-frontend
description: Skill guide and architecture rules for the SheetMind Desktop React/Electron frontend.
---
# Desktop Frontend Skill

## Overview
The desktop frontend of SheetMind is a cross-platform React application that interfaces directly with a local Python/FastAPI backend (spawning a DuckDB database). It provides a high-performance, completely offline natural language-to-SQL data exploration interface, featuring spreadsheet editing (via Univer/Handsontable), drag-and-drop dashboard building, and rich chat interactions.

## When to Use
Use this skill when developing, refactoring, or reviewing code in the `desktop-application/frontend/` directory.

## Instructions
- **Overall architecture**: React SPA running inside an Electron browser window, communicating locally with a FastAPI backend via Axios (HTTP) and WebSockets (for live status updates).
- **State management**: Utilize custom React hooks (`useChat`, `useExcelEditor`, `useToast`) mapping `useState` and `useRef` rather than a global Zustand store.
- **Component design**: Strictly follows the shadcn/ui pattern using Tailwind CSS. Utilize Lucide-react for all iconography.
- **Data fetching**: Managed by feature-specific API files (e.g., `chatApi.ts`). Use async/await with a generic `handleError` wrapper.
- **Routing**: Use `react-router-dom` with `HashRouter` to avoid file:// protocol path issues in production builds.

### Adding a new page / feature:
1. Create the page component in `src/pages/NewFeaturePage.tsx`.
2. Add the route inside `AppShell.tsx` under `<Routes>`.
3. Add a sidebar icon in `Sidebar.tsx` and map its `ActiveView` state.

### Adding a new API endpoint:
1. Add the HTTP request function in `src/api/{feature}Api.ts`.
2. Use the generic `handleError` to parse Axios errors.
3. Wire the API call to a specific `useFeature` hook to manage loading/error states.

### Working with the Editor (Univer):
- State inside the grid is mutable. Only sync back to React state when `isDirty` flags are triggered or saves occur.
- Univer snapshot parsing (`extractRowsFromSnapshot`) is required before sending grid data back to the server.

## Output Format
- CamelCase for hooks/utils (`useChat.ts`), PascalCase for React components and pages (`ChatPage.tsx`).
- Functional components only. Default exports for pages and root files; named exports for hooks, API functions, and components.
- **Import order rules:** (1) System / external libraries, (2) Internal absolute imports (`@/...`), (3) Internal relative imports. Separate groups by a blank line and sort alphabetically.
- Strict typing enforced. Prefer interfaces in the `src/types/` folder.
- Use `cn()` utility from `clsx` and `tailwind-merge` for conditional Tailwind classes.

## Examples & Notes

> [!WARNING] Strict Rules
> - **NEVER** introduce global stores like Redux or Zustand unless explicitly requested; strictly use React Contexts or custom Hooks.
> - **NEVER** use `BrowserRouter`; strictly stick to `HashRouter` for Electron compatibility.
> - **ALWAYS** encapsulate API calls inside the `src/api` folder, never directly inside a React component.
> - **ALWAYS** implement loading skeletons or indeterminate states when fetching data.
> - **ALWAYS** handle optimistic UI updates when mutating chat messages.
> - **DO NOT** use default exports except for `App.tsx` and `main.tsx`. Use named exports for standard components and hooks.
> - **NEVER** add emojis in the code or comments.
> - **NEVER** add task completion comments (e.g., "Task X: Done").
