---
name: web-frontend
description: Skill guide and architecture rules for the SheetMind Web React frontend.
---
# Web Frontend Skill

## Overview
The web application frontend serves as the landing page, authentication portal, and documentation hub for SheetMind. Built with React, Vite, and Tailwind CSS, it connects to a Python FastAPI backend and features MDX-powered documentation.

## When to Use
Use this skill when developing, refactoring, or reviewing code in the `web-application/frontend/` directory.

## Instructions
- **Overall architecture**: Single Page Application (SPA) built with React and bundled by Vite. Heavy use of route-level code splitting (`React.lazy`).
- **State management**: When creating new state, use **Zustand** (project standard) rather than expanding React Context, keeping stores modular and focused.
- **Component design**: Functional components utilizing Tailwind CSS utility classes. Tools like `clsx` and `tailwind-merge` are configured to support shadcn/ui patterns.
- **Data fetching**: Client-side data fetching via Axios. The `src/lib/api.ts` file acts as the single source of truth for API calls.
- **Routing**: Client-side routing with `react-router-dom` (v7).

### How to add a new page:
1. Create a new `.tsx` file in `src/pages/`.
2. Define the functional component and export it.
3. In `App.tsx`, import it using `const NewPage = lazy(() => import('@/pages/NewPage'))`.
4. Add it to the router configuration wrapped in `<Suspense fallback={<LoadingFallback />}>`.

### How to make an API call:
- Import `api` from `@/lib/api`. Call `await api.get('/path')`. No need to handle 401s manually as the interceptor catches them.

### How to protect a route:
- Wrap the route element with `<ProtectedRoute>` in `App.tsx`.

## Output Format
- PascalCase for components and pages (e.g., `DocsHomePage.tsx`), camelCase for hooks and utilities (e.g., `useAuth.tsx`, `api.ts`).
- **Import order rules:** (1) System/built-in React imports, (2) Third-party library imports, (3) Local imports (using `@/` path aliases). Separated by newlines, sorted alphabetically.
- Strict typing is enforced. Interfaces are defined in `src/types/`.

## Examples & Notes

> [!WARNING] Strict Rules
> - **Always** use the `api` instance from `src/lib/api.ts` for network requests; do not use raw `axios` or `fetch`.
> - **Always** follow the strict import sorting rules.
> - **Always** utilize `@/` aliases for local imports instead of relative paths like `../../`.
> - **Never** add "Task X: Done" comments in the code.
> - **Never** use emojis in code or comments.
> - **Never** create redundant `.md` implementation files.
