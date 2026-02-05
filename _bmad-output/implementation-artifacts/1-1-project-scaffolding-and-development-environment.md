# Story 1.1: Project Scaffolding and Development Environment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to initialize the monorepo with Rails API backend, Vue SPA frontend, and a development PostgreSQL instance,
So that I have a working development environment for building typerek features.

## Acceptance Criteria

1. A Rails 8.1 API-only application exists at `/backend` with PostgreSQL configured, initialized with `rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable`
2. A Vue 3 SPA exists at `/frontend` initialized with `npm create vue@latest frontend` selecting TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier
3. Post-scaffold frontend dependencies are installed and the frontend builds successfully: PrimeVue + Aura theme (`primevue`, `@primeuix/themes`), `vite-plugin-pwa`, `vue-i18n`
4. `docker-compose.dev.yml` exists at project root with a PostgreSQL service; `docker compose -f docker-compose.dev.yml up -d` starts PostgreSQL accessible from Rails
5. Both servers start successfully: Rails (`rails server`) and Vue (`npm run dev`), and the Vue app is accessible in the browser
6. Monorepo follows the structure: `/backend`, `/frontend`, `docker-compose.dev.yml` at root
7. PrimeVue Aura theme is configured with typerek design tokens (teal primary `#0D9488`) using `definePreset` from `@primeuix/styled`
8. The Vue app shell renders with bottom tab navigation placeholder (4 tabs: Standings, Matches, History, More)
9. The API client wrapper (`src/api/client.ts`) is created with typed fetch methods and structured error handling `{ error: { code, message, field } }`

## Tasks / Subtasks

- [x] Task 1: Initialize Rails API backend (AC: #1)
  - [x] Run `rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable`
  - [x] Verify Rails 8.1 API-only mode is active (`config.api_only = true` in `config/application.rb`)
  - [x] Configure `database.yml` to connect to Docker PostgreSQL (host: `localhost`, port: `5432`, credentials via environment variables)
  - [x] Add session middleware to `config/application.rb` for cookie-based auth (required by Story 1.2):
    ```ruby
    config.session_store :cookie_store, key: "_typerek_session"
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
    ```
  - [x] Add `bcrypt` gem to Gemfile (uncomment it — Rails includes it commented by default) for `has_secure_password` in Story 1.2
  - [x] Add `rack-cors` gem to Gemfile and configure `config/initializers/cors.rb` to allow requests from the Vue dev server (`http://localhost:5173`)

- [x] Task 2: Initialize Vue 3 SPA frontend (AC: #2, #3)
  - [x] Run `npm create vue@latest frontend` with TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier
  - [x] Install production dependencies: `npm install primevue @primeuix/themes vue-i18n`
  - [x] Install dev dependencies: `npm install -D vite-plugin-pwa`
  - [x] Verify `npm run build` succeeds with all dependencies

- [x] Task 3: Configure PrimeVue with typerek design tokens (AC: #7)
  - [x] Create `src/theme-preset.ts` with `definePreset(Aura, {...})` overriding:
    - Primary color: teal `#0D9488` (use teal palette: 50-950)
    - Surface background: `#FAFAFA`
    - Card border-radius: `12px`
    - Button border-radius: `8px`
    - Light mode only (set `darkModeSelector: 'none'` or `.light-mode-only` to disable dark mode)
  - [x] Configure PrimeVue plugin in `main.ts` with the custom preset
  - [x] Import pattern: `import Aura from '@primeuix/themes/aura'` and `import { definePreset } from '@primeuix/styled'`

- [x] Task 4: Create app shell with bottom tab navigation (AC: #8)
  - [x] Create `src/components/ui/AppNavigation.vue` with 4 bottom tabs:
    - Standings (`pi pi-trophy`)
    - Matches (`pi pi-calendar`)
    - History (`pi pi-chart-bar`)
    - More (`pi pi-cog`)
  - [x] Create placeholder view components: `LeaderboardView.vue`, `MatchesView.vue`, `HistoryView.vue`, `MoreView.vue` in `src/views/`
  - [x] Configure Vue Router with routes for each tab view; default route `/` maps to LeaderboardView (home screen)
  - [x] Style navigation: fixed bottom positioning, teal active tab, gray inactive, 56px tab bar height, 48x48dp touch targets
  - [x] App.vue should include `<AppNavigation />` and `<router-view />`

- [x] Task 5: Create typed API client (AC: #9)
  - [x] Create `src/api/types.ts` with TypeScript interfaces:
    - `ApiResponse<T>` — `{ data: T }`
    - `ApiCollectionResponse<T>` — `{ data: T[], meta: { count: number } }`
    - `ApiError` — `{ error: { code: string, message: string, field: string | null } }`
  - [x] Create `src/api/client.ts` with typed fetch wrapper:
    - Base URL configurable (default `/api/v1`)
    - Methods: `get<T>`, `post<T>`, `put<T>`, `delete<T>`
    - Automatic JSON parsing and camelCase field handling
    - Structured error handling: parse error responses into `ApiError`, throw on non-2xx
    - Include credentials (`credentials: 'include'`) for session cookies

- [x] Task 6: Create development Docker setup (AC: #4)
  - [x] Create `docker-compose.dev.yml` at project root with PostgreSQL 16 service:
    - Port mapping: `5432:5432`
    - Named volume for data persistence
    - Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` with sensible defaults
  - [x] Create `.env.example` at project root documenting all environment variables
  - [x] Verify `docker compose -f docker-compose.dev.yml up -d` starts PostgreSQL
  - [x] Verify `rails db:create` succeeds against the Docker PostgreSQL

- [x] Task 7: Configure Vite proxy for development (AC: #5)
  - [x] Add proxy configuration to `vite.config.ts`:
    ```typescript
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
    ```
  - [x] Verify both servers start: Rails on port 3000, Vue on port 5173
  - [x] Verify the Vue app renders in browser at `http://localhost:5173` with the tab navigation shell

- [x] Task 8: Configure vue-i18n scaffolding (AC: #3)
  - [x] Create `src/locales/en.json` and `src/locales/pl.json` with initial structure (navigation labels only for now):
    ```json
    { "nav": { "standings": "Standings", "matches": "Matches", "history": "History", "more": "More" } }
    ```
  - [x] Configure vue-i18n plugin in `main.ts` with browser language detection and English fallback
  - [x] Update `<html lang="">` attribute reactively based on selected language
  - [x] Use `$t()` for tab labels in AppNavigation

## Dev Notes

### Architecture Patterns & Constraints

- **Monorepo structure:** `/backend` (Rails API) and `/frontend` (Vue SPA) at project root. All Docker files at root level.
- **Rails API-only mode:** `config.api_only = true` strips browser middleware. Session middleware MUST be re-added explicitly in `config/application.rb` for cookie-based auth (not in an initializer — must be before middleware stack is built).
- **Session store:** Encrypted cookie store (`cookie_store`), no Redis needed. Key: `_typerek_session`.
- **API namespace:** All endpoints under `/api/v1/`. Controller structure: `app/controllers/api/v1/`.
- **JSON response format:** Success: `{ data: ... }`, Error: `{ error: { code, message, field } }`. All JSON fields in camelCase.
- **Frontend state management:** Pinia with domain-based stores (`useAuthStore`, `useMatchesStore`, `useBetsStore`, `useLeaderboardStore`).
- **PrimeVue 4.x import paths:** Use `@primeuix/themes/aura` (NOT `@primevue/themes/aura`). Use `definePreset` from `@primeuix/styled`.
- **Design tokens:** Teal primary `#0D9488`, amber secondary `#F59E0B`, surface background `#FAFAFA`, card radius 12px, button radius 8px.
- **No dark mode in MVP:** Disable dark mode selector in PrimeVue theme config.
- **i18n:** All user-facing strings via `$t()`. Key structure: `{view}.{component}.{element}`.
- **Development workflow:** PostgreSQL runs in Docker via `docker-compose.dev.yml`. Rails and Vue run locally (not containerized) for fast iteration.

### Critical Developer Guardrails

- **DO NOT** install Tailwind CSS or any other CSS framework. PrimeVue's styling system is the single source of truth.
- **DO NOT** add Chart.js or Playwright yet — those are needed in later stories.
- **DO NOT** create model files, migrations, or database tables — those belong to Story 1.2+.
- **DO NOT** create login/auth views — those belong to Story 1.2.
- **DO NOT** use `@primevue/themes/aura` — the correct import path is `@primeuix/themes/aura`.
- **DO** configure CORS for development (allow `localhost:5173` origin).
- **DO** set up session middleware in `config/application.rb`, NOT in an initializer.
- **DO** include `credentials: 'include'` in the fetch wrapper for cookie-based auth to work cross-origin in development.
- **DO** use PrimeIcons (`pi pi-*`) for all icons.
- **DO** use `rem` for font sizes, `px` for borders/shadows, `%`/`flex` for layout widths.
- **DO** use mobile-first CSS (mobile styles default, desktop overrides via `@media (min-width: 768px)`).

### Project Structure Notes

Target directory structure after this story is complete:

```
typerek-2.0/
├── .env.example
├── .gitignore (update with backend/frontend ignores)
├── docker-compose.dev.yml
├── backend/
│   ├── Gemfile (with bcrypt, rack-cors uncommented/added)
│   ├── config/
│   │   ├── application.rb (session middleware configured)
│   │   ├── database.yml (Docker PostgreSQL connection)
│   │   └── initializers/
│   │       └── cors.rb (CORS for Vue dev server)
│   └── ...
├── frontend/
│   ├── package.json
│   ├── vite.config.ts (proxy + PWA plugin configured)
│   ├── src/
│   │   ├── main.ts (PrimeVue + vue-i18n configured)
│   │   ├── App.vue (navigation shell)
│   │   ├── theme-preset.ts (typerek design tokens)
│   │   ├── api/
│   │   │   ├── client.ts (typed fetch wrapper)
│   │   │   └── types.ts (API response/error types)
│   │   ├── components/
│   │   │   └── ui/
│   │   │       └── AppNavigation.vue
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── pl.json
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── stores/ (empty, created in later stories)
│   │   └── views/
│   │       ├── LeaderboardView.vue (placeholder)
│   │       ├── MatchesView.vue (placeholder)
│   │       ├── HistoryView.vue (placeholder)
│   │       └── MoreView.vue (placeholder)
│   └── ...
└── _bmad-output/ (existing planning artifacts)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Rails and Vue initialization commands, post-scaffold additions
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Session management, API namespace, error format, security guards
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, structure patterns, enforcement guidelines
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Complete directory structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — PrimeVue Aura theme, design tokens, color system
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — Bottom tab navigation, 4 tabs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — Mobile-first, 2 breakpoints
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Success] — Self-hosting, Docker Compose

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Node v17.8.0 too old for create-vue@latest (requires Node >=20.19.0) — installed Node 22.22.0 via mise
- strscan 3.1.0 had stale native extensions from old asdf Ruby 3.3.5 — reinstalled strscan 3.1.7
- PrimeVue TypeScript: `inverseColor` renamed to `contrastColor`, component tokens nest under `root`

### Completion Notes List

- All 9 ACs verified: Rails 8.1.2 API boots, Vue 3 builds, PrimeVue themed, Docker PostgreSQL runs, db:create succeeds
- mise.toml manages Ruby 3.3.6 and Node 22.22.0
- Removed Vue scaffold files (HelloWorld, TheWelcome, WelcomeItem, HomeView, AboutView, counter store, base.css, logo.svg)
- Removed nested backend/.git (monorepo uses root .git)

### File List

**Root:**
- docker-compose.dev.yml
- .env.example
- mise.toml

**Backend (modified from rails new scaffold):**
- backend/Gemfile (bcrypt, rack-cors uncommented)
- backend/config/application.rb (session middleware added)
- backend/config/database.yml (Docker PostgreSQL config)
- backend/config/initializers/cors.rb (localhost:5173 CORS)

**Frontend:**
- frontend/src/main.ts (PrimeVue, vue-i18n, Pinia, router configured)
- frontend/src/theme-preset.ts (teal primary, custom card/button radius)
- frontend/src/App.vue (AppNavigation + RouterView shell)
- frontend/src/router/index.ts (4 routes: standings, matches, history, more)
- frontend/src/components/ui/AppNavigation.vue (fixed bottom tab bar, 4 tabs)
- frontend/src/views/LeaderboardView.vue (placeholder)
- frontend/src/views/MatchesView.vue (placeholder)
- frontend/src/views/HistoryView.vue (placeholder)
- frontend/src/views/MoreView.vue (placeholder)
- frontend/src/api/types.ts (ApiResponse, ApiCollectionResponse, ApiError)
- frontend/src/api/client.ts (typed fetch wrapper with credentials: include)
- frontend/src/locales/en.json (nav labels)
- frontend/src/locales/pl.json (nav labels)
- frontend/src/assets/main.css (minimal reset)
- frontend/vite.config.ts (proxy /api to localhost:3000)
