---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-03.md'
workflowType: 'architecture'
project_name: 'typerek-2.0'
user_name: 'Karol'
date: '2026-02-04'
lastStep: 8
status: 'complete'
completedAt: '2026-02-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
34 FRs across 8 categories:
- **Betting & Predictions (FR1-FR7):** Match viewing, 6-option bet placement, time-based lock, pre/post-kickoff visibility rules. Architecturally, these define the core API endpoints and the central time-based access control pattern.
- **Scoring & Points (FR8-FR12):** Admin-triggered point calculation, odds-as-points model, compound bet resolution (1X, X2, 12). Requires an abstracted scoring engine that's deterministic and configurable per deployment.
- **Leaderboard & Rankings (FR13-FR15):** Aggregated point rankings, live totals after scoring. Read-heavy queries that may benefit from pre-computed totals.
- **Player History (FR16-FR17):** Per-user betting record with full transparency. Straightforward read queries joining bets, matches, and scores.
- **Authentication & User Management (FR18-FR25):** Invite-only token auth, nickname + password, admin role management. Minimal auth surface area -- no email, no OAuth, no password reset flow.
- **Tournament & Match Administration (FR26-FR30):** Seed-based match loading, admin odds/score entry, immutable results after scoring. Admin panel is data entry only -- no match CRUD through UI.
- **Internationalization (FR31-FR32):** Polish and English. Frontend-only concern via Vue i18n.
- **PWA & Mobile (FR33-FR34):** Home screen install, responsive design. Vite PWA plugin + manifest configuration.

**Non-Functional Requirements:**
21 NFRs across 4 categories:
- **Performance (NFR1-5):** 500ms SPA transitions, 200ms API responses (50 concurrent users), 3s PWA cold start, 1s warm start. Comfortable targets for a Rails API serving small payloads.
- **Security (NFR6-13):** The 4 server-side guards (bet lock, visibility toggle, ownership, admin role), HttpOnly/Secure cookies, cryptographic invite tokens, bcrypt passwords, minimal data collection. Security is the highest-stakes NFR category.
- **Data Integrity (NFR14-17):** PostgreSQL persistent volumes, deterministic calculations, transactional score entry + point calculation, referential integrity. Standard Rails/PostgreSQL territory.
- **Deployment (NFR18-21):** Single `docker compose up`, environment variable config, 3 containers, zero external dependencies. Simplest possible ops story.

**Scale & Complexity:**

- Primary domain: Full-stack web application (SPA + REST API)
- Complexity level: Low
- Estimated architectural components: ~12 (Rails models, controllers, scoring engine, Vue views, custom components, auth layer, i18n, PWA config, Docker setup, nginx config, seed system, admin panel)

### Technical Constraints & Dependencies

- **Tech stack locked in:** Rails API (Ruby) + Vue 3 (Composition API) + PrimeVue + PostgreSQL -- decided in brainstorming session, driven by developer skill profile and security confidence
- **Monorepo structure:** `/backend`, `/frontend`, `docker-compose.yml` at root
- **Single domain deployment:** nginx serves Vue static build and proxies `/api` to Rails. Session cookies require single-domain setup.
- **No external services:** No email provider, no OAuth provider, no external API for match data, no CDN. Fully self-contained.
- **Solo developer (frontend-new):** Backend (Rails) is comfort zone. Frontend (Vue 3 + PrimeVue) is a learning investment. Architecture should minimize frontend complexity where possible.
- **Tournament deadline:** Ready for deployment by May/June 2026 for real World Cup use.

### Cross-Cutting Concerns Identified

- **Time-based access control:** The kickoff timestamp is the single most architecturally significant data point. It gates bet mutations, controls visibility of other players' bets, and determines match state (open/locked/scored). Every relevant API endpoint must check this consistently.
- **Authentication & authorization:** Session-based auth permeates all API endpoints. Two roles (player, admin) with admin being a superset. The 4 security guards must be implemented as reusable middleware/concerns, not per-endpoint logic.
- **Internationalization:** All user-facing text in PL and EN. Frontend-only via Vue i18n. Must be designed into component structure from the start to avoid retrofit.
- **Optimistic UI:** Bet placement uses optimistic updates (highlight immediately, save in background, revert on failure). Requires consistent error handling pattern across the frontend.
- **PWA lifecycle:** Service worker for static asset caching, manifest for home screen install, offline-aware error states. Cuts across the entire frontend build pipeline.
- **Scoring engine isolation:** Must be a pure, testable module separate from controllers/views. Configurable per deployment. The only business logic that carries real complexity.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web application (SPA + REST API)** -- separate frontend and backend starters required.

- **Backend:** Rails 8.1 API-only with PostgreSQL
- **Frontend:** Vue 3 with Vite, TypeScript, Pinia, Vue Router, PrimeVue (Aura), PWA

### Starter Options Considered

**Backend Starters:**

| Option | Assessment |
|--------|------------|
| `rails new --api` | Official Rails generator. API-only mode strips browser-related middleware. PostgreSQL flag built-in. Best choice. |
| Rails API templates (GitHub) | Various community templates. Unnecessary complexity for this project's simple requirements. |

**Frontend Starters:**

| Option | Assessment |
|--------|------------|
| `npm create vue@latest` | Official Vue scaffolding tool. Interactive prompts for TypeScript, Pinia, Vue Router, Vitest. Modern Vite-based. Best choice. |
| Vite vanilla (`npm create vite`) | Too minimal -- would need manual Vue Router, Pinia setup. |
| T3 Stack / Nuxt | Over-engineered for a Vue SPA that doesn't need SSR. |

### Selected Starters

#### Backend: Rails 8.1 API-only

**Rationale:** Official generator with API-only mode removes unnecessary middleware (views, cookies, sessions for browser). PostgreSQL support via `--database=postgresql`. Skip unused features to keep the app lean.

**Initialization Command:**

```bash
rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable
```

**Flags explained:**
- `--api` -- API-only mode, no browser middleware
- `--database=postgresql` -- PostgreSQL instead of SQLite
- `--skip-action-mailbox` -- No email processing needed
- `--skip-action-text` -- No rich text editing needed
- `--skip-active-storage` -- No file uploads needed
- `--skip-action-cable` -- No WebSockets needed (passive time-based lock, not real-time)

**What this provides:**
- Rails 8.1.2 with Ruby 3.x
- PostgreSQL adapter configured in `database.yml`
- API-only middleware stack (JSON responses, no cookies by default -- will add session middleware back for auth)
- Solid Queue available for background jobs (not needed for MVP)
- RSpec not included by default (add via Gemfile if desired)

#### Frontend: create-vue with full options

**Rationale:** Official Vue scaffolding with interactive prompts. Vite-based for fast development. TypeScript, Pinia, Vue Router all configurable at creation time.

**Initialization Command:**

```bash
npm create vue@latest frontend
```

**Interactive prompts to select:**
- Add TypeScript? **Yes**
- Add JSX Support? **No** (template syntax sufficient)
- Add Vue Router? **Yes**
- Add Pinia? **Yes**
- Add Vitest? **Yes** (unit testing)
- Add ESLint? **Yes**
- Add Prettier? **Yes**

**Post-scaffold additions required:**
1. PrimeVue + Aura theme: `npm install primevue @primeuix/themes`
2. PWA plugin: `npm install -D vite-plugin-pwa`
3. Vue i18n: `npm install vue-i18n`
4. Chart.js for bump chart: `npm install chart.js vue-chartjs`
5. Playwright for E2E testing: `npm init playwright@latest`

### Architectural Decisions Provided by Starters

**Backend (Rails 8.1 API-only):**

| Aspect | Decision |
|--------|----------|
| Language & Runtime | Ruby 3.x, Rails 8.1.2 |
| Database | PostgreSQL with ActiveRecord |
| API Format | JSON (Jbuilder available) |
| Testing | Minitest default (RSpec optional) |
| Background Jobs | Solid Queue available (not used in MVP) |
| Code Organization | Standard Rails MVC structure |

**Frontend (create-vue):**

| Aspect | Decision |
|--------|----------|
| Language | TypeScript |
| Build Tool | Vite 5.x |
| State Management | Pinia |
| Routing | Vue Router 4 |
| Unit Testing | Vitest |
| Linting | ESLint + Prettier |
| Code Organization | `src/` with `components/`, `views/`, `stores/`, `router/` |

**Additional Setup Required (post-scaffold):**

| Aspect | Configuration |
|--------|---------------|
| UI Framework | PrimeVue 4.x with Aura preset |
| PWA | vite-plugin-pwa with manifest and service worker |
| i18n | vue-i18n with PL/EN translation files |
| Charts | Chart.js via vue-chartjs for bump chart |

### Monorepo Structure

```
typerek-2.0/
├── backend/           # Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   └── ...
├── frontend/          # Vue SPA
│   ├── src/
│   ├── public/
│   └── ...
├── docker-compose.yml # Orchestration
├── nginx/             # nginx config for production
└── README.md
```

**Note:** Project initialization using these commands should be the first implementation stories.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling (odds storage, scoring engine)
- Authentication approach (session middleware, invite tokens, security guards)
- API structure (versioned namespace, error format)

**Important Decisions (Shape Architecture):**
- Frontend state management (Pinia stores)
- Component organization
- Development workflow

**Deferred Decisions (Post-MVP):**
- API rate limiting (50 users doesn't need it)
- Caching strategy (small data volume, not needed yet)
- CI/CD pipeline (manual deployment acceptable for MVP)

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Odds storage | 6 columns on Match table | Fixed 6-option system won't change. No joins, odds always fetched with match. Simplest and most performant. |
| Scoring engine | Pure Ruby class (`ScoringEngine`) | Testable, configurable via constants, plays to developer's Ruby strength. |
| Points storage | `points_earned` column on Bet | Calculated once when admin enters score, stored for fast leaderboard queries. |
| Leaderboard totals | Computed via `SUM(points_earned)` | 50 users x 64 matches = 3,200 bets max. No need for pre-computed totals. |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session management | Re-add session middleware to Rails API | Standard Rails sessions, easy to audit, works with single-domain nginx setup. |
| Session storage | Cookie store (encrypted) | No Redis dependency, sufficient for 50 concurrent users. |
| Invite token format | Signed token with expiry (`MessageVerifier`) | Self-validating, embedded user_id and timestamp, can enforce expiry without DB lookup. |
| Password hashing | bcrypt via `has_secure_password` | Rails built-in, proven secure, NFR12 compliant. |
| Security guards | Rails concerns (`BetTimingGuard`, `BetVisibilityGuard`, `OwnershipGuard`, `AdminGuard`) | Isolated, testable, auditable. Included in controllers as needed. |

**Security Guard Specifications:**

| Guard | Purpose | Check |
|-------|---------|-------|
| `BetTimingGuard` | Reject bet mutations after kickoff | `Time.current < match.kickoff_time` |
| `BetVisibilityGuard` | Hide others' bets before kickoff | Filter bets by `match.kickoff_time <= Time.current` |
| `OwnershipGuard` | Users can only modify their own bets | `bet.user_id == current_user.id` |
| `AdminGuard` | Restrict admin-only actions | `current_user.admin?` |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL namespace | `/api/v1/` | Future-proof for open-source releases, minimal overhead. |
| Response format | Simple raw objects | Single frontend consumer, no need for JSON:API verbosity. |
| Error format | Structured `{ error: { code, message, field } }` | Error codes enable frontend i18n translation, consistent handling. |
| HTTP client (frontend) | Native fetch wrapper | Minimal dependencies, typed methods like `api.get<Match[]>('/matches')`. |

**Error Codes (examples):**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `BET_LOCKED` | 403 | Match has started, bet rejected |
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | Not authorized for this action |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Invalid input (field specified) |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pinia organization | Domain-based stores | `useAuthStore`, `useMatchesStore`, `useLeaderboardStore`, `useBetsStore`. Maps to API resources, focused and testable. |
| API client | Typed fetch wrapper (`src/api/client.ts`) | Minimal dependencies, type-safe, simple error handling. |
| Component organization | Grouped by type | `components/ui/`, `components/match/`, `components/leaderboard/`. Clear organization without deep nesting. |
| Custom components | 5 typerek-specific | `BetSelector`, `MatchCard`, `LeaderboardRow`, `RevealList`, `BumpChart`. All others from PrimeVue. |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| nginx config | Single `nginx.conf` | Simple setup: serve `/` from Vue build, proxy `/api` to Rails. |
| Environment variables | `.env` + `.env.example` | Standard open-source pattern, clear documentation without committing secrets. |
| Development workflow | Hybrid (PostgreSQL in Docker, Rails/Vue local) | Fast iteration, no container rebuilds for code changes, simple DB setup. |
| Database seeding | YAML data files + `seeds.rb` loader | Tournament data easy to edit and swap. `db/seeds/data/world_cup_2026.yml` pattern. |

### Decision Impact Analysis

**Implementation Sequence:**
1. Rails API scaffold with PostgreSQL (starter command)
2. Re-add session middleware, configure cookie store
3. User model with `has_secure_password`, invite token generation
4. Match model with 6 odds columns, kickoff_time
5. Bet model with user/match associations, bet_type enum, points_earned
6. Security guard concerns (4 guards)
7. ScoringEngine class with compound bet resolution
8. API controllers with guards applied
9. Vue frontend scaffold (starter command)
10. Pinia stores mirroring API resources
11. Custom components (BetSelector, MatchCard, etc.)
12. Docker Compose + nginx configuration

**Cross-Component Dependencies:**
- Security guards depend on User model (admin role) and Match model (kickoff_time)
- ScoringEngine depends on Match (odds columns) and Bet (bet_type)
- Frontend stores depend on API error format for consistent error handling
- PWA service worker depends on Vite build configuration

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming (Rails Conventions):**

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case plural | `users`, `matches`, `bets` |
| Columns | snake_case | `kickoff_time`, `bet_type`, `points_earned` |
| Foreign keys | `{table_singular}_id` | `user_id`, `match_id` |
| Timestamps | Rails default | `created_at`, `updated_at` |
| Indexes | Rails default | `index_bets_on_user_id` |

**API Naming:**

| Element | Convention | Example |
|---------|------------|---------|
| Endpoints | Plural resources | `/api/v1/matches`, `/api/v1/bets` |
| Route params | Rails style | `/api/v1/matches/:id` |
| JSON fields | camelCase | `kickoffTime`, `betType`, `pointsEarned` |
| Query params | camelCase | `?matchId=1&userId=2` |

**Frontend Code Naming (TypeScript/Vue):**

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase `.vue` | `MatchCard.vue`, `BetSelector.vue` |
| Composables | camelCase with `use` prefix | `useAuthStore.ts`, `useMatches.ts` |
| Utilities | camelCase | `api.ts`, `formatDate.ts` |
| Types/Interfaces | PascalCase | `Match`, `Bet`, `User`, `ApiError` |
| Variables/functions | camelCase | `kickoffTime`, `getUserBets()` |
| Constants | SCREAMING_SNAKE_CASE | `BET_TYPES`, `API_BASE_URL` |

### Structure Patterns

**Backend (Rails) Structure:**

| Concern | Location | Notes |
|---------|----------|-------|
| Models | `app/models/` | Standard Rails |
| Controllers | `app/controllers/api/v1/` | Namespaced for versioning |
| Security guards | `app/controllers/concerns/` | `BetTimingGuard`, etc. |
| Scoring engine | `app/services/scoring_engine.rb` | Pure Ruby service object |
| Serializers | `app/serializers/` | snake_case → camelCase conversion |
| Seed data | `db/seeds/data/*.yml` | YAML files per tournament |
| Seed loader | `db/seeds.rb` | Loads and processes YAML files |

**Frontend (Vue) Structure:**

```
src/
├── api/                    # API client and types
│   ├── client.ts           # Fetch wrapper with error handling
│   └── types.ts            # API response/request types
├── components/
│   ├── match/              # Match-related components
│   │   ├── MatchCard.vue
│   │   ├── BetSelector.vue
│   │   └── RevealList.vue
│   ├── leaderboard/        # Leaderboard components
│   │   ├── LeaderboardRow.vue
│   │   └── BumpChart.vue
│   └── ui/                 # Shared UI components
├── composables/            # Shared composition functions
├── locales/                # i18n translation files
│   ├── en.json
│   └── pl.json
├── router/                 # Vue Router configuration
│   └── index.ts
├── stores/                 # Pinia stores
│   ├── auth.ts
│   ├── matches.ts
│   ├── bets.ts
│   └── leaderboard.ts
├── views/                  # Route-level view components
│   ├── LeaderboardView.vue
│   ├── MatchesView.vue
│   ├── HistoryView.vue
│   └── AdminView.vue
├── App.vue
└── main.ts
```

**Test Location:**

| Stack | Location | Pattern |
|-------|----------|---------|
| Backend | `spec/` or `test/` | Rails convention (Minitest or RSpec) |
| Frontend | Co-located | `ComponentName.spec.ts` next to source |

### Format Patterns

**API Response Format:**

Success (single resource):
```json
{
  "data": {
    "id": 1,
    "kickoffTime": "2026-06-15T21:00:00Z",
    "homeTeam": "Brazil",
    "awayTeam": "Germany"
  }
}
```

Success (collection):
```json
{
  "data": [...],
  "meta": { "count": 10 }
}
```

Error:
```json
{
  "error": {
    "code": "BET_LOCKED",
    "message": "Match has started",
    "field": null
  }
}
```

**Date/Time Format:**

| Context | Format | Example |
|---------|--------|---------|
| API communication | ISO 8601 UTC | `"2026-06-15T21:00:00Z"` |
| Database storage | `timestamp with time zone` | PostgreSQL native |
| Frontend display | i18n-aware formatter | Localized per user preference |

**Numeric Format:**

| Type | Storage | Precision |
|------|---------|-----------|
| Odds | `decimal(4,2)` | `2.10`, `3.45` |
| Points | `decimal(6,2)` | Accumulated totals |
| API | Number type | Not strings |

### Process Patterns

**Loading State Pattern:**

Each Pinia store manages its own state:
```typescript
interface StoreState {
  data: T[]
  loading: boolean
  error: ApiError | null
}
```

Rules:
- Set `loading: true` before API call
- Set `loading: false` after success or error
- Clear `error: null` on new request start
- Store error object on failure

**Optimistic UI Pattern (Bet Placement):**

1. User taps bet option → UI updates immediately (selected state)
2. API call fires in background
3. On success → no UI change needed (already reflected)
4. On error → revert to previous state, show PrimeVue Toast with error

**Authentication Flow:**

1. App loads → `GET /api/v1/me` to check session
2. 401 response → redirect to `/login`
3. Login success → store user in `useAuthStore`, redirect to `/`
4. Logout → clear all stores, redirect to `/login`

**Error Handling Pattern:**

| Layer | Handling |
|-------|----------|
| API client | Catch errors, parse response, throw typed `ApiError` |
| Pinia stores | Catch `ApiError`, store in `error` state |
| Components | Read `error` from store, display via Toast or inline |
| Network errors | Show generic "Connection error, try again" |

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow Rails conventions for all backend code (naming, structure, patterns)
2. Use camelCase for all JSON API response fields
3. Use camelCase for all frontend TypeScript/Vue code
4. Place security guards in `app/controllers/concerns/` as includable modules
5. Place custom Vue components in `components/{domain}/` subdirectories
6. Use the structured error format `{ error: { code, message, field } }` for all API errors
7. Store loading/error state within each Pinia store, not globally
8. Use ISO 8601 for all date/time values in API responses
9. Use PrimeVue components before creating custom UI components
10. Use vue-i18n `$t()` function for all user-facing strings

**Anti-Patterns to Avoid:**

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| Mixing snake_case/camelCase in frontend | camelCase everywhere in frontend |
| Business logic in controllers | Use service objects (`app/services/`) |
| Global loading state | Per-store loading state |
| Inconsistent error formats | Always use `{ error: { code, message, field } }` |
| Hardcoded UI strings | Use i18n keys (`$t('matches.betLocked')`) |
| Custom CSS for standard UI | Use PrimeVue components and design tokens |
| Direct DOM manipulation | Use Vue reactivity and refs |

### Pattern Examples

**Good: API Controller with Guards**
```ruby
# app/controllers/api/v1/bets_controller.rb
class Api::V1::BetsController < ApplicationController
  include BetTimingGuard
  include OwnershipGuard

  before_action :authenticate_user!
  before_action :set_bet, only: [:update, :destroy]
  before_action :verify_bet_timing, only: [:create, :update, :destroy]
  before_action :verify_ownership, only: [:update, :destroy]
end
```

**Good: Pinia Store with Loading State**
```typescript
// stores/matches.ts
export const useMatchesStore = defineStore('matches', {
  state: () => ({
    matches: [] as Match[],
    loading: false,
    error: null as ApiError | null,
  }),
  actions: {
    async fetchMatches() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<Match[]>('/matches')
        this.matches = response.data
      } catch (e) {
        this.error = e as ApiError
      } finally {
        this.loading = false
      }
    }
  }
})
```

**Good: Component with i18n**
```vue
<template>
  <Button @click="placeBet" :disabled="loading">
    {{ $t('matches.placeBet') }}
  </Button>
  <Message v-if="error" severity="error">
    {{ $t(`errors.${error.code}`) }}
  </Message>
</template>
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
typerek-2.0/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.dev.yml
│
├── nginx/
│   └── nginx.conf
│
├── backend/
│   ├── Gemfile
│   ├── Gemfile.lock
│   ├── Rakefile
│   ├── config.ru
│   ├── .ruby-version
│   │
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb
│   │   │   ├── concerns/
│   │   │   │   ├── bet_timing_guard.rb
│   │   │   │   ├── bet_visibility_guard.rb
│   │   │   │   ├── ownership_guard.rb
│   │   │   │   └── admin_guard.rb
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           ├── sessions_controller.rb
│   │   │           ├── users_controller.rb
│   │   │           ├── matches_controller.rb
│   │   │           ├── bets_controller.rb
│   │   │           ├── leaderboard_controller.rb
│   │   │           └── admin/
│   │   │               ├── users_controller.rb
│   │   │               ├── matches_controller.rb
│   │   │               └── invitations_controller.rb
│   │   │
│   │   ├── models/
│   │   │   ├── application_record.rb
│   │   │   ├── user.rb
│   │   │   ├── match.rb
│   │   │   └── bet.rb
│   │   │
│   │   ├── serializers/
│   │   │   ├── user_serializer.rb
│   │   │   ├── match_serializer.rb
│   │   │   ├── bet_serializer.rb
│   │   │   └── leaderboard_entry_serializer.rb
│   │   │
│   │   └── services/
│   │       ├── scoring_engine.rb
│   │       └── invite_token_service.rb
│   │
│   ├── config/
│   │   ├── application.rb
│   │   ├── environment.rb
│   │   ├── routes.rb
│   │   ├── database.yml
│   │   ├── initializers/
│   │   │   ├── cors.rb
│   │   │   └── session_store.rb
│   │   └── environments/
│   │       ├── development.rb
│   │       ├── test.rb
│   │       └── production.rb
│   │
│   ├── db/
│   │   ├── migrate/
│   │   │   ├── XXXXXX_create_users.rb
│   │   │   ├── XXXXXX_create_matches.rb
│   │   │   └── XXXXXX_create_bets.rb
│   │   ├── schema.rb
│   │   ├── seeds.rb
│   │   └── seeds/
│   │       └── data/
│   │           └── world_cup_2026.yml
│   │
│   ├── spec/
│   │   ├── spec_helper.rb
│   │   ├── rails_helper.rb
│   │   ├── models/
│   │   │   ├── user_spec.rb
│   │   │   ├── match_spec.rb
│   │   │   └── bet_spec.rb
│   │   ├── services/
│   │   │   └── scoring_engine_spec.rb
│   │   ├── controllers/
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           ├── bets_controller_spec.rb
│   │   │           └── matches_controller_spec.rb
│   │   └── concerns/
│   │       ├── bet_timing_guard_spec.rb
│   │       └── bet_visibility_guard_spec.rb
│   │
│   └── Dockerfile
│
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── .eslintrc.cjs
    ├── .prettierrc
    │
    ├── public/
    │   ├── favicon.ico
    │   └── icons/
    │       ├── icon-192x192.png
    │       └── icon-512x512.png
    │
    ├── src/
    │   ├── main.ts
    │   ├── App.vue
    │   │
    │   ├── api/
    │   │   ├── client.ts
    │   │   └── types.ts
    │   │
    │   ├── components/
    │   │   ├── match/
    │   │   │   ├── MatchCard.vue
    │   │   │   ├── MatchCard.spec.ts
    │   │   │   ├── BetSelector.vue
    │   │   │   ├── BetSelector.spec.ts
    │   │   │   ├── RevealList.vue
    │   │   │   └── RevealList.spec.ts
    │   │   ├── leaderboard/
    │   │   │   ├── LeaderboardRow.vue
    │   │   │   ├── LeaderboardRow.spec.ts
    │   │   │   ├── BumpChart.vue
    │   │   │   └── BumpChart.spec.ts
    │   │   └── ui/
    │   │       └── AppNavigation.vue
    │   │
    │   ├── composables/
    │   │   └── useToast.ts
    │   │
    │   ├── locales/
    │   │   ├── en.json
    │   │   └── pl.json
    │   │
    │   ├── router/
    │   │   └── index.ts
    │   │
    │   ├── stores/
    │   │   ├── auth.ts
    │   │   ├── matches.ts
    │   │   ├── bets.ts
    │   │   └── leaderboard.ts
    │   │
    │   └── views/
    │       ├── LoginView.vue
    │       ├── ActivateView.vue
    │       ├── LeaderboardView.vue
    │       ├── MatchesView.vue
    │       ├── HistoryView.vue
    │       └── admin/
    │           ├── AdminLayout.vue
    │           ├── OddsEntryView.vue
    │           ├── ScoreEntryView.vue
    │           └── UserManagementView.vue
    │
    ├── e2e/                    # Playwright E2E tests
    │   ├── auth.spec.ts
    │   ├── matches.spec.ts
    │   └── leaderboard.spec.ts
    │
    └── Dockerfile
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Endpoints | Authentication |
|----------|-----------|----------------|
| Public | `POST /api/v1/sessions` (login), `POST /api/v1/users/activate` | None |
| Player | `/api/v1/matches`, `/api/v1/bets`, `/api/v1/leaderboard`, `/api/v1/me` | Session required |
| Admin | `/api/v1/admin/*` | Session + admin role |

**Component Boundaries (Frontend):**

| Boundary | Components | State Source |
|----------|------------|--------------|
| Match domain | `MatchCard`, `BetSelector`, `RevealList` | `useMatchesStore`, `useBetsStore` |
| Leaderboard domain | `LeaderboardRow`, `BumpChart` | `useLeaderboardStore` |
| Auth domain | `LoginView`, `ActivateView` | `useAuthStore` |
| Admin domain | `AdminLayout`, `*EntryView` | `useMatchesStore` (admin actions) |

**Data Boundaries:**

| Layer | Responsibility | Location |
|-------|----------------|----------|
| Database | PostgreSQL with ActiveRecord | `backend/db/` |
| Serialization | snake_case → camelCase | `backend/app/serializers/` |
| API Client | HTTP + error handling | `frontend/src/api/` |
| State | Pinia stores | `frontend/src/stores/` |

### Requirements to Structure Mapping

**FR1-FR7 (Betting & Predictions):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| Match viewing (FR1) | `matches_controller.rb`, `match_serializer.rb` | `MatchesView.vue`, `MatchCard.vue` |
| Bet placement (FR2-FR4) | `bets_controller.rb`, `bet.rb` | `BetSelector.vue`, `useBetsStore` |
| Kickoff lock (FR5) | `bet_timing_guard.rb` | Match state in `MatchCard.vue` |
| Bet visibility (FR6-FR7) | `bet_visibility_guard.rb` | `RevealList.vue` |

**FR8-FR12 (Scoring & Points):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| Point calculation (FR8-FR11) | `scoring_engine.rb` | Display in `RevealList.vue` |
| Point transparency (FR12) | `bet_serializer.rb` | `HistoryView.vue` |

**FR13-FR17 (Leaderboard & History):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| Leaderboard (FR13-FR15) | `leaderboard_controller.rb` | `LeaderboardView.vue`, `LeaderboardRow.vue` |
| Player history (FR16-FR17) | `users_controller.rb` (show) | `HistoryView.vue` |

**FR18-FR25 (Authentication):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| User creation (FR18-FR19) | `admin/invitations_controller.rb`, `invite_token_service.rb` | `UserManagementView.vue` |
| Account activation (FR20) | `users_controller.rb` (activate) | `ActivateView.vue` |
| Sign in/out (FR21-FR22) | `sessions_controller.rb` | `LoginView.vue`, `useAuthStore` |
| Admin management (FR23-FR25) | `admin/users_controller.rb`, `admin_guard.rb` | `UserManagementView.vue` |

**FR26-FR30 (Administration):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| Tournament seeding (FR26-FR27) | `db/seeds.rb`, `db/seeds/data/*.yml` | N/A (CLI only) |
| Odds entry (FR28) | `admin/matches_controller.rb` (update) | `OddsEntryView.vue` |
| Score entry (FR29-FR30) | `admin/matches_controller.rb` (score) | `ScoreEntryView.vue` |

**FR31-FR34 (i18n & PWA):**

| Requirement | Backend | Frontend |
|-------------|---------|----------|
| Language selection (FR31-FR32) | N/A | `locales/*.json`, vue-i18n config |
| PWA install (FR33) | N/A | `vite.config.ts` (vite-plugin-pwa) |
| Responsive design (FR34) | N/A | PrimeVue components |

### Integration Points

**Internal Communication:**

```
┌─────────────┐     HTTP/JSON      ┌─────────────┐
│   Vue SPA   │ ◄───────────────► │  Rails API  │
│  (Pinia)    │   /api/v1/*       │ (Controllers)│
└─────────────┘                    └─────────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │ PostgreSQL  │
                                   │  (Docker)   │
                                   └─────────────┘
```

**Data Flow (Bet Placement):**

1. User taps `BetSelector` → `useBetsStore.placeBet(matchId, betType)`
2. Store calls `api.post('/bets', { matchId, betType })`
3. `BetsController` → `BetTimingGuard` check → create/update Bet
4. Response serialized via `BetSerializer` (camelCase)
5. Store updates state, UI reflects

**Data Flow (Score Entry):**

1. Admin submits score in `ScoreEntryView`
2. `Admin::MatchesController#score` receives request
3. Transaction: update Match score → `ScoringEngine.calculate_all(match)` → update all Bets' `points_earned`
4. Response confirms success
5. Leaderboard reflects new totals on next fetch

### File Organization Patterns

**Configuration Files:**

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production orchestration (nginx, rails, postgres) |
| `docker-compose.dev.yml` | Development (postgres only) |
| `.env.example` | Environment variable documentation |
| `backend/config/database.yml` | PostgreSQL connection |
| `frontend/vite.config.ts` | Vite + PWA + proxy configuration |

**Development Workflow:**

```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Backend (terminal 1)
cd backend && rails server -p 3000

# Frontend (terminal 2)
cd frontend && npm run dev
```

**Production Deployment:**

```bash
docker compose up -d
# nginx :80 → Vue static + /api proxy → Rails :3000
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Rails 8.1 + PostgreSQL + Vue 3 + PrimeVue -- all mature, compatible technologies
- Session cookies work correctly with single-domain nginx proxy setup
- API-only Rails mode + re-added session middleware is a documented pattern
- camelCase JSON serialization aligns with TypeScript/Vue conventions
- No version conflicts detected

**Pattern Consistency:**
- Naming patterns align: Rails snake_case internally, camelCase at API boundary, camelCase in frontend
- Security guards as Rails concerns match the controller organization pattern
- Domain-based Pinia stores map cleanly to API resources
- Component grouping (`components/match/`, `components/leaderboard/`) matches store organization

**Structure Alignment:**
- Monorepo structure (`/backend`, `/frontend`) supports the split-stack decision
- API versioning (`/api/v1/`) reflected in controller namespacing
- Test locations follow technology conventions
- Docker Compose structure matches deployment decision

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| Category | FRs | Status |
|----------|-----|--------|
| Betting & Predictions | FR1-FR7 | ✅ Mapped to controllers, guards, components |
| Scoring & Points | FR8-FR12 | ✅ ScoringEngine service + serializers |
| Leaderboard & Rankings | FR13-FR15 | ✅ LeaderboardController + Vue views |
| Player History | FR16-FR17 | ✅ UsersController + HistoryView |
| Authentication | FR18-FR25 | ✅ Sessions, invitations, guards specified |
| Administration | FR26-FR30 | ✅ Admin namespace + seed system |
| Internationalization | FR31-FR32 | ✅ vue-i18n + locale files |
| PWA & Mobile | FR33-FR34 | ✅ vite-plugin-pwa + PrimeVue responsive |

**Non-Functional Requirements Coverage:**

| Category | NFRs | Status |
|----------|------|--------|
| Performance | NFR1-5 | ✅ Comfortable targets for stack; PWA caching specified |
| Security | NFR6-13 | ✅ 4 guards specified; bcrypt, HttpOnly cookies, signed tokens |
| Data Integrity | NFR14-17 | ✅ PostgreSQL volumes, transactional scoring, referential integrity |
| Deployment | NFR18-21 | ✅ Docker Compose, .env pattern, 3 containers, no external deps |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific choices and rationale
- Technology versions specified (Rails 8.1.2, Vue 3, etc.)
- Integration patterns defined (API format, error format, data flow)
- Examples provided for controllers, stores, components

**Structure Completeness:**
- Complete directory tree with all files and directories
- Every FR mapped to specific files
- Integration points documented (bet placement flow, score entry flow)
- Configuration files enumerated

**Pattern Completeness:**
- Naming conventions comprehensive (database, API, frontend code)
- Enforcement guidelines with "MUST" rules
- Anti-patterns explicitly listed
- Code examples for good patterns

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (non-blocking):**
- CORS configuration details (simple same-origin in production)
- PWA manifest icons (design task, not architecture)
- Database indexes (Rails migrations handle common cases)

**Deferred (per decision):**
- API rate limiting
- Caching layer
- CI/CD pipeline
- Monitoring/logging

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low complexity, 50 users)
- [x] Technical constraints identified (solo dev, frontend-new, tournament deadline)
- [x] Cross-cutting concerns mapped (time-based access, auth, i18n, PWA)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established (database, API, frontend)
- [x] Structure patterns defined (Rails MVC, Vue component organization)
- [x] Communication patterns specified (API format, error handling)
- [x] Process patterns documented (loading states, optimistic UI, auth flow)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear separation between backend (Rails) and frontend (Vue) with well-defined API contract
- Security-first design with 4 explicit, testable guards
- Simple deployment story (`docker compose up`)
- Technology choices aligned with developer skills (Rails = comfort zone, Vue + PrimeVue = approachable)
- Comprehensive implementation patterns prevent AI agent conflicts

**Areas for Future Enhancement:**
- Add API rate limiting if exposed publicly (post-MVP)
- Add caching if performance becomes an issue (unlikely at 50 users)
- Add CI/CD pipeline for automated testing and deployment
- Add monitoring/alerting for production visibility

### Testing Strategy

| Layer | Tool | Location |
|-------|------|----------|
| Backend unit/integration | RSpec or Minitest | `backend/spec/` or `backend/test/` |
| Frontend unit | Vitest | Co-located `*.spec.ts` files |
| Frontend E2E | Playwright | `frontend/e2e/` |

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Refer to this document for all architectural questions
5. Use the specified naming conventions without deviation
6. Implement security guards before any bet-related controllers

**First Implementation Priority:**

```bash
# Step 1: Initialize backend
rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable

# Step 2: Initialize frontend
npm create vue@latest frontend
# Select: TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier

# Step 3: Post-scaffold frontend additions
cd frontend
npm install primevue @primeuix/themes vue-i18n chart.js vue-chartjs
npm install -D vite-plugin-pwa
npm init playwright@latest

# Step 4: Set up development Docker
# Create docker-compose.dev.yml with postgres service
```
