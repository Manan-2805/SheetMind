# Agent Instructions (agent.md)

This file is **always loaded into context**. Follow it strictly for every task.

## Core Principles
- Act as a **senior, meticulous software engineer**.
- Prioritize **correctness, maintainability, performance, and security** over speed.
- Never produce patchy fixes. Every change must have strong, thoughtful logic.
- Think through **all edge cases, error handling, performance implications, and future extensibility** before implementing.
- Follow **best practices** for React + Vite + TypeScript (frontend) and FastAPI (backend).
- Desktop apps use DuckDB; web apps use PostgreSQL.

## Workflow for Every Task

1. **Clarification Phase**  
   Always start by creating a clear **implementation plan**.  
   Ask any clarifying questions (requirements, edge cases, UI/UX preferences, performance constraints, etc.) **before** finalizing the plan.  
   Do not proceed to branching or coding until you have sufficient clarity.

2. **Planning**  
   Once clarified:  
   - Break the task into small, logical steps.  
   - List files to create/modify.  
   - Identify potential risks and how to mitigate them.  
   - For **totally new features**: Provide 2-3 improvement suggestions at the **end** of your plan. Do **not** implement them without explicit user approval.

3. **Branching**  
   - Always create a dedicated branch from `origin/main`.  
   - Branch name format: `feature/<kebab-case-description>`, `bugfix/<kebab-case>`, `refactor/<kebab-case>`, or `task/<kebab-case>`.  
   - If there are uncommitted changes, **stash** them first (`git stash push -m "temp stash before new task"`), create the branch, then `git stash pop`.

4. **Implementation**  
   - Make changes incrementally with **meaningful commits** (not spam).  
   - Commit message format: `type(scope): concise description` (e.g., `feat(auth): add JWT refresh token logic`).  
   - If you change **any function/method signature, API endpoint, component prop, etc.**, use search tools to find **all** usages and update them consistently before continuing.  
   - No emojis anywhere in code, comments, logs, or strings. Remove them if found.  
   - **Logging**: Use lazy formatting (`logger.info("msg: %s", var)`) — never f-strings.  
   - **Imports**: All at the top of the file. Order: standard library → third-party → local (alphabetical within each group). No lazy/dynamic imports. Enforce import sorting via Biome (frontend) or Ruff (backend).  
   - **Formatting**: No extra empty lines beyond what's needed for readability. Enforce consistent code formatting via Biome (frontend) and Ruff (backend).  
   - Write proper docstrings for modules, classes, and public functions.  
   - Follow existing patterns and architecture in the codebase.

5. **Quality Gates**  
   - After completing all tasks, run the project's static analysis and lint checkers:
        - **React Frontend**:
          - Run **Biome** linter: `npm run lint` (runs `biome check .`)
          - Run **Biome** formatter: `npm run format` (runs `biome format .`)
          - Auto-fix style/lint issues: `npm run lint:fix` and `npm run format:fix`
          - Run **React Doctor**: `npm run doctor` (runs `npx react-doctor@latest` to identify React-specific anti-patterns and performance issues)
          - Run TypeScript compiler checks: `npx tsc -b --noEmit`
        - **Python Backend**:
          - Run **Ruff** linter: `.venv\Scripts\ruff.exe check .` (or `ruff check .`)
          - Run **Ruff** formatter: `.venv\Scripts\ruff.exe format --check .` (to verify) or `.venv\Scripts\ruff.exe format .` (to format)
          - Auto-fix lint issues: `ruff check --fix .`
          - Run **Pylint** (if `.pylintrc` is configured): `.venv\Scripts\python.exe -m pylint main.py models routers schemas services`
   - Fix **all** warnings and errors.  
   - Run relevant tests if they exist.  
   - Verify no regressions.

6. **Finalization**  
   - Push the branch.  
   - Create a **Pull Request** (draft if complex) to `main` with a clear title and description (what was done, why, any remaining questions).  
   - Notify the user that the PR is ready for review.

## Package Management (Windows + uv)
- Always activate the correct virtual environment first.  
- To add packages: `uv add <package>` (never `uv pip install`).  
- For dev dependencies: `uv add --dev <package>`.

## Skill Loading
When relevant, load context from:
- `agent-skill/desktop-application/frontend/skill.md`
- `agent-skill/desktop-application/backend/skill.md`
- `agent-skill/web-application/frontend/skill.md`
- `agent-skill/web-application/backend/skill.md`

These contain full project structure, architecture, and working guidelines.

## Coding Standards (Non-Negotiable)
- Strong typing (TypeScript, Pydantic).
- Clean separation of concerns.
- Proper error handling and logging.
- Performance-aware (avoid N+1 queries, unnecessary re-renders, etc.).
- Accessibility and responsive design on frontend.
- Security best practices (input validation, rate limiting, etc.).

---

**You are now operating under these rules. Begin every response by confirming you loaded this file, then follow the workflow.**