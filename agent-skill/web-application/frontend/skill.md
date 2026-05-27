# Web Frontend - Skill Guide for Sheetmind

## Project Overview
The web application frontend serves as the landing page, authentication portal, and documentation hub for SheetMind. Built with React, Vite, and Tailwind CSS, it connects to a Python FastAPI backend and features MDX-powered documentation to explain the desktop app's features (such as DuckDB integration and AI-powered Excel mutations).

## Folder Structure
```bash
web-application/frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and local static files
│   ├── components/         # Reusable React components
│   │   ├── common/         # Generic components (ProtectedRoute, FeatureCard)
│   │   ├── layout/         # Layout components (Navbar, Footer, DocsLayout)
│   │   ├── docs/           # MDX-related or docs-specific components
│   │   └── landing/        # Landing page sections
│   ├── hooks/              # Custom React hooks (useAuth, useScrollReveal)
│   ├── lib/                # Core utilities (api.ts for Axios)
│   ├── pages/              # Route components, heavily lazy-loaded
│   │   └── docs/           # Documentation sub-pages grouped by feature
│   └── types/              # TypeScript interfaces (auth.ts)
├── package.json            # NPM dependencies and scripts
├── vite.config.ts          # Vite build and dev server config
└── tailwind.config.ts      # Tailwind CSS configuration
```

## Core Packages, Files & Responsibilities
- `src/App.tsx`: Central router configuration using `createBrowserRouter`. Implements React `lazy` and `Suspense` for code splitting across all routes.
- `src/lib/api.ts`: Central Axios instance. Handles base URL (`/api`), credentials, and global interceptors (e.g., 401 redirects to `/login`, 503 to `/maintenance`).
- `src/hooks/useAuth.tsx`: React Context provider managing global authentication state, user data fetching, and logout flows.
- `src/components/common/ProtectedRoute.tsx`: Route wrapper that checks `isAuthenticated` and redirects unauthenticated users to `/login`.
- `vite.config.ts`: Configures the dev server to proxy `/api` requests to `http://backend:8000` and sets up MDX plugins (`remark-gfm`, `rehype-highlight`).

## Architecture & Design Patterns
- **Overall architecture**: Single Page Application (SPA) built with React and bundled by Vite. Heavy use of route-level code splitting (`React.lazy`).
- **State management**: Currently relies on React Context (e.g., `AuthContext`) for global state like authentication. The project standard mandates **Zustand** for complex frontend state going forward.
- **Component design**: Functional components utilizing Tailwind CSS utility classes. Tools like `clsx` and `tailwind-merge` are configured to support shadcn/ui patterns.
- **Data fetching strategy**: Client-side data fetching via Axios. The `api.ts` file acts as the single source of truth for API calls, standardizing error handling and redirects.
- **Routing**: Client-side routing with `react-router-dom` (v7). Routes are defined centrally in `App.tsx`.
- **Authentication & Authorization flow**: Session-based auth using cookies (`withCredentials: true`). The frontend checks `/auth/me` on load via `useAuth` to populate the user context. Unauthenticated API responses (401) trigger a global redirect to the login page.
- **Error handling and logging strategy**: Axios interceptors catch global errors (like 401 and 503) and handle routing automatically.

## Coding Standards & Conventions
- **File & folder naming conventions**: PascalCase for components and pages (e.g., `DocsHomePage.tsx`), camelCase for hooks and utilities (e.g., `useAuth.tsx`, `api.ts`).
- **Component structure and naming**: Use explicit `export default function ComponentName()` or named exports. Separate components into logical folders (`common`, `layout`, `docs`).
- **Import order rules**: 
  1. System/built-in React imports
  2. Third-party library imports
  3. Local imports (using `@/` path aliases)
  Groups should be separated by an empty line and sorted alphabetically.
- **TypeScript usage and strictness**: Strict typing is enforced. Interfaces are defined in `src/types/` (e.g., `AuthUser`). Use specific types instead of `any`.
- **Tailwind + shadcn/ui usage rules**: Use Tailwind utility classes for styling. Combine classes using `clsx` and `tailwind-merge` when building reusable/shadcn-style components.
- **Zustand store patterns**: When creating new state, use Zustand (project standard) rather than expanding React Context, keeping stores modular and focused.

## Key Utilities & Helpers
- `api.ts` (`src/lib/api.ts`): Pre-configured Axios instance. Always use this instead of native `fetch` or a raw Axios import.
- `useAuth` (`src/hooks/useAuth.tsx`): Hook to access the current `user`, `isAuthenticated` status, and the `logout` function.
- `ProtectedRoute` (`src/components/common/ProtectedRoute.tsx`): Wrapper component to secure private routes.

## Common Implementation Patterns
- **How to add a new page**: 
  1. Create a new `.tsx` file in `src/pages/`.
  2. Define the functional component and export it.
  3. In `App.tsx`, import it using `const NewPage = lazy(() => import('@/pages/NewPage'))`.
  4. Add it to the router configuration wrapped in `<Suspense fallback={<LoadingFallback />}>`.
- **How to make an API call**: Import `api` from `@/lib/api`. Call `await api.get('/path')`. No need to handle 401s manually as the interceptor catches them.
- **How to protect a route**: Wrap the route element with `<ProtectedRoute>` in `App.tsx`.
- **How to use shadcn/ui components correctly**: When implementing new shadcn/ui components, ensure they use `tailwind-merge` and `clsx` for class deduplication, and adhere to the project's existing theme variables.

## Agent Rules (Strict)
- **Always** use the `api` instance from `src/lib/api.ts` for network requests; do not use raw `axios` or `fetch`.
- **Always** follow the strict import sorting rules (System -> Third-party -> Local aliases), separated by newlines and sorted alphabetically.
- **Never** add "Task X: Done" comments in the code. Only write logical, explanatory comments.
- **Never** use emojis in code or comments.
- **Always** use PowerShell commands when proposing terminal executions.
- **Always** utilize `@/` aliases for local imports instead of relative paths like `../../`.
- **Never** create redundant `.md` implementation files; update existing ones or only create what is requested.

## Tech Stack & Tools
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript (~6.0.2)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v3.4 + clsx + tailwind-merge
- **Documentation**: MDX (@mdx-js/react, remark-gfm, rehype-highlight)
- **HTTP Client**: Axios (v1.16)
- **Animation**: Framer Motion, React Three Fiber (for landing page 3D)
