# Story 1.2: User Model and Session Authentication

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to log in with my nickname and password and log out,
So that I can securely access the app.

## Acceptance Criteria

1. A `users` table exists with: `id`, `nickname` (unique, not null), `password_digest` (not null), `admin` (boolean, default false), `invite_token` (string), `activated` (boolean, default false), `created_at`, `updated_at`, and `has_secure_password` is configured (bcrypt, NFR12)
2. Session middleware is re-added to Rails API and sessions are stored in encrypted cookies (HttpOnly, Secure in production -- NFR10)
3. `POST /api/v1/sessions` with correct credentials sets a session cookie and returns user data in `{ data: { id, nickname, admin } }` format
4. `GET /api/v1/me` returns the current user's data when a valid session exists
5. `GET /api/v1/me` returns 401 with `{ error: { code: "UNAUTHORIZED", message: "Not logged in", field: null } }` when no valid session exists
6. `DELETE /api/v1/sessions` destroys the session and subsequent requests return 401
7. A LoginView with nickname and password fields and a teal "Sign In" button is displayed when the frontend auth endpoint is accessed
8. On successful authentication, the user is stored in `useAuthStore` and redirected to the leaderboard (home) route
9. Vue Router guard redirects unauthenticated users to `/login` for any protected route
10. Error on invalid credentials: "Incorrect nickname or password" (no information leakage about which field is wrong)
11. No user data stored beyond nickname and hashed password (NFR13)

## Tasks / Subtasks

- [x] Task 1: Create User model and migration (AC: #1)
  - [x] Generate migration: `rails generate model User nickname:string:uniq password_digest:string admin:boolean invite_token:string activated:boolean`
  - [x] Configure migration: `nickname` NOT NULL with unique index, `admin` default `false`, `activated` default `false`
  - [x] Add `has_secure_password` to User model (uses bcrypt already in Gemfile)
  - [x] Add model validations: `validates :nickname, presence: true, uniqueness: { case_sensitive: false }`, length (2-30 characters)
  - [x] Run migration: `mise exec -- bin/rails db:migrate`

- [x] Task 2: Create authentication concern for ApplicationController (AC: #2, #4, #5)
  - [x] Create `app/controllers/concerns/authentication.rb` with:
    - `current_user` method reading `session[:user_id]` and memoizing `@current_user`
    - `authenticate_user!` method returning 401 JSON error if no current user
    - `logged_in?` helper method
  - [x] Include `Authentication` concern in `ApplicationController`
  - [x] Apply `before_action :authenticate_user!` globally in ApplicationController
  - [x] Add `skip_before_action :authenticate_user!` capability for public endpoints

- [x] Task 3: Create Sessions controller (AC: #3, #6)
  - [x] Create `app/controllers/api/v1/sessions_controller.rb` with namespace `Api::V1::SessionsController`
  - [x] `create` action: look up user by nickname (case-insensitive), verify `activated: true` (reject with same generic error if not activated), authenticate password via `user&.authenticate(password)`, set `session[:user_id]`, return user data
  - [x] `destroy` action: reset session, return 204 No Content
  - [x] Skip authentication for `create` action
  - [x] Return structured error `{ error: { code: "INVALID_CREDENTIALS", message: "Incorrect nickname or password", field: null } }` on failed login (AC: #10)

- [x] Task 4: Create Me controller (AC: #4, #5)
  - [x] Create `app/controllers/api/v1/me_controller.rb` with namespace `Api::V1::MeController`
  - [x] `show` action: return current user in `{ data: { id, nickname, admin } }` format (camelCase via serializer)
  - [x] This endpoint is protected by default (no skip_before_action)

- [x] Task 5: Create User serializer (AC: #3, #4)
  - [x] Create `app/serializers/user_serializer.rb` that converts user to camelCase JSON: `{ id:, nickname:, admin: }`
  - [x] Ensure no password_digest or sensitive fields are exposed
  - [x] No invite_token in standard serialization (only in admin context, Story 1.3)

- [x] Task 6: Configure API routes (AC: #3, #4, #6)
  - [x] Add to `config/routes.rb`:
    ```ruby
    namespace :api do
      namespace :v1 do
        resource :sessions, only: [:create, :destroy]
        resource :me, only: [:show], controller: 'me'
      end
    end
    ```
  - [x] Verify routes: `POST /api/v1/sessions`, `DELETE /api/v1/sessions`, `GET /api/v1/me`

- [x] Task 7: Create seed admin user for development (AC: #1)
  - [x] Update `db/seeds.rb` to create an admin user: `User.find_or_create_by!(nickname: "admin") { |u| u.password = "password"; u.admin = true; u.activated = true }`
  - [x] Run seeds: `mise exec -- bin/rails db:seed`

- [x] Task 8: Write backend tests (AC: #1-6, #10, #11)
  - [x] Test User model validations (nickname uniqueness, presence, password hashing)
  - [x] Test sessions#create with valid credentials (returns 200 + user data + sets session)
  - [x] Test sessions#create with invalid credentials (returns 401 + error message, no leakage)
  - [x] Test sessions#create with non-existent user (returns 401, same error as wrong password)
  - [x] Test sessions#destroy (clears session, subsequent me request returns 401)
  - [x] Test me#show when authenticated (returns user data)
  - [x] Test me#show when not authenticated (returns 401)
  - [x] Test that password_digest is never exposed in API responses

- [x] Task 9: Create useAuthStore Pinia store (AC: #8)
  - [x] Create `frontend/src/stores/auth.ts` with setup store pattern:
    - State: `user: ref<User | null>(null)`, `loading: ref(false)`, `error: ref<string | null>(null)`
    - Computed: `isAuthenticated`, `isAdmin`
    - Actions: `login(nickname, password)`, `logout()`, `checkSession()`, `clearError()`
  - [x] `login()` calls `api.post<{ id: number, nickname: string, admin: boolean }>('/sessions', { nickname, password })`
  - [x] `logout()` calls `api.delete('/sessions')` and clears user state
  - [x] `checkSession()` calls `api.get('/me')` to restore session on app load (catches 401 silently)
  - [x] Add User type to `frontend/src/api/types.ts`

- [x] Task 10: Create LoginView component (AC: #7, #8, #10)
  - [x] Create `frontend/src/views/LoginView.vue` with PrimeVue components:
    - PrimeVue `InputText` for nickname field
    - PrimeVue `Password` for password field (with toggleMask for show/hide)
    - PrimeVue `Button` (teal primary, label "Sign In", full width on mobile)
    - PrimeVue `Message` or inline error text for login errors
  - [x] Disable submit button while loading (show loading spinner in button)
  - [x] On successful login, redirect to `/` (leaderboard home)
  - [x] On error, display "Incorrect nickname or password" (translated via i18n)
  - [x] Form submits on Enter key press
  - [x] Style: centered card layout, max-width 400px, typerek branding (teal accent)
  - [x] No "forgot password" link (admin regenerates invite -- Story 1.3)
  - [x] No "remember me" checkbox (session cookies handle persistence)

- [x] Task 11: Configure Vue Router auth guards (AC: #9)
  - [x] Add `/login` route to router (public, no auth required)
  - [x] Add `meta: { requiresAuth: boolean }` to route definitions
  - [x] Default all existing routes to `requiresAuth: true`
  - [x] Set `/login` route to `requiresAuth: false`
  - [x] Add global `router.beforeEach` guard:
    - If first load and no user state, call `authStore.checkSession()` to restore from cookie
    - If route requires auth and user is not authenticated, redirect to `/login`
    - If user is authenticated and navigating to `/login`, redirect to `/` (home)
  - [x] After successful login in LoginView, redirect to the originally requested route (if stored in query param) or `/` by default

- [x] Task 12: Update App.vue to conditionally show navigation (AC: #7, #9)
  - [x] Only show `<AppNavigation />` when user is authenticated
  - [x] Show `<RouterView />` always (login view renders without navigation)
  - [x] App shell should check auth state on mount via `authStore.checkSession()`

- [x] Task 13: Update i18n locale files (AC: #7, #10)
  - [x] Add to `en.json`:
    ```json
    "auth": {
      "nickname": "Nickname",
      "password": "Password",
      "signIn": "Sign In",
      "signingIn": "Signing in...",
      "signOut": "Sign Out",
      "invalidCredentials": "Incorrect nickname or password",
      "sessionExpired": "Your session has expired. Please log in again.",
      "loginTitle": "Welcome to typerek"
    }
    ```
  - [x] Add equivalent Polish translations to `pl.json`

- [x] Task 14: Add sign-out functionality to MoreView (AC: #6, #8)
  - [x] Add "Sign Out" button to MoreView (PrimeVue Button, outlined/text style)
  - [x] On click, call `authStore.logout()` which clears session and redirects to `/login`
  - [x] Display current user nickname at top of MoreView (e.g., "Logged in as Tomek")

## Dev Notes

### Architecture Patterns & Constraints

- **Session middleware already configured** in `config/application.rb` (Story 1.1). Uses encrypted cookie store with key `_typerek_session`. DO NOT move this to an initializer.
- **bcrypt gem already in Gemfile** (uncommented by Story 1.1). No additional gem installation needed.
- **CORS with credentials** already configured in `config/initializers/cors.rb` with `credentials: true` for `http://localhost:5173`. Session cookies will work cross-origin in development.
- **API client** already has `credentials: 'include'` set in `frontend/src/api/client.ts`. No changes needed to the fetch wrapper.
- **Vite proxy** already routes `/api/*` to `http://localhost:3000` in development.
- **API namespace:** All endpoints under `/api/v1/`. Controllers in `app/controllers/api/v1/`.
- **JSON response format:** Success: `{ data: ... }`, Error: `{ error: { code, message, field } }`. All JSON fields in camelCase.
- **No Session model (simplified approach):** Use Rails session hash (`session[:user_id]`) with the encrypted cookie store. This is simpler than the Rails 8 auth generator's database-backed sessions and sufficient for 50 users. The session data lives entirely in the cookie -- no Session table needed.
- **`User.authenticate_by` is available in Rails 8.1** for timing-safe authentication. Use it instead of `find_by + authenticate` to prevent user enumeration via timing attacks.
- **PrimeVue components for LoginView:** Use `InputText`, `Password` (with toggleMask), `Button`, `Message`. Import from `primevue/inputtext`, `primevue/password`, `primevue/button`, `primevue/message`.
- **Pinia setup store pattern:** Use `defineStore('auth', () => { ... })` with `ref()` and `computed()` for full TypeScript inference.

### Critical Developer Guardrails

- **DO NOT** create a Session model or sessions table. Use Rails session hash with cookie store only.
- **DO NOT** use JWT tokens. This project uses cookie-based sessions exclusively.
- **DO NOT** add email field to User model. Authentication is nickname + password only.
- **DO NOT** implement password reset flow. That's not in scope (admin regenerates invite in Story 1.3).
- **DO NOT** implement account activation/invite flow. That belongs to Story 1.3.
- **DO NOT** implement admin user management UI. That belongs to Story 1.4.
- **DO NOT** add Tailwind CSS or any CSS framework. Use PrimeVue components and design tokens only.
- **DO NOT** expose `password_digest`, `invite_token`, or `activated` in the user serializer for non-admin contexts.
- **DO** use `session[:user_id]` for session storage (not `cookies.signed`).
- **DO** use camelCase in all JSON API responses (serializer handles snake_case to camelCase conversion).
- **DO** use `$t()` for ALL user-facing strings in Vue components.
- **DO** use case-insensitive nickname lookup: `User.find_by("LOWER(nickname) = LOWER(?)", nickname)` or `where("LOWER(nickname) = ?", nickname.downcase)`.
- **DO** return the SAME error message for wrong nickname AND wrong password to prevent user enumeration.
- **DO** set session cookie as HttpOnly. The encrypted cookie store does this by default.
- **DO** seed an admin user in `db/seeds.rb` so you can test login immediately.
- **DO** configure `Secure` flag on cookies in production only (not development, since localhost is HTTP).

### Previous Story Intelligence (Story 1.1)

**Learnings from Story 1.1:**
- Node v17.8.0 was too old for create-vue (requires >=20.19.0) — project uses Node 22.22.0 via mise
- PrimeVue TypeScript gotcha: `inverseColor` is now `contrastColor` in primary color scheme
- PrimeVue component tokens nest under `root`: `{ card: { root: { borderRadius: '12px' } } }`
- `darkModeSelector: '.light-mode-only'` effectively disables dark mode (class never applied)
- Rails commands must be run via `mise exec -- bin/rails ...` from the `/backend` directory
- npm commands must be run via `mise exec -- npm ...` from the `/frontend` directory
- Removed Vue scaffold files (HelloWorld, TheWelcome, etc.) — clean slate for views
- Backend `.git` was removed (monorepo uses root `.git`)

**Files created by Story 1.1 that Story 1.2 extends:**
- `backend/config/application.rb` — session middleware already configured, DO NOT modify
- `backend/config/routes.rb` — add API routes here
- `backend/app/controllers/application_controller.rb` — add Authentication concern
- `backend/Gemfile` — bcrypt already available
- `backend/config/initializers/cors.rb` — CORS with credentials already configured
- `frontend/src/api/client.ts` — API client ready, `credentials: 'include'` set
- `frontend/src/api/types.ts` — extend with User type
- `frontend/src/router/index.ts` — add auth guard and login route
- `frontend/src/App.vue` — conditionally show navigation
- `frontend/src/locales/en.json` / `pl.json` — add auth translation keys
- `frontend/src/main.ts` — PrimeVue, Pinia, vue-i18n already configured

### Git Intelligence

**Recent commit pattern:**
```
0196054 Scaffolded monorepo with Rails API backend, Vue SPA frontend, and Docker PostgreSQL
```

**Key observations from Story 1.1 implementation:**
- 118 files created in single commit (full scaffolding)
- Backend uses Rails test framework (Minitest) by default — `test/` directory structure, `test/test_helper.rb`
- No RSpec installed — use Minitest for backend tests (or install RSpec if preferred, but Minitest is already set up)
- Frontend uses Vitest for unit tests, configured in `vitest.config.ts`
- ESLint + Prettier configured for frontend code quality
- `mise.toml` manages Ruby 3.3.6 and Node 22.22.0

### Library/Framework Requirements

| Library | Version | Usage in Story 1.2 |
|---------|---------|-------------------|
| Rails | 8.1.2 | API controllers, model, migration, sessions |
| bcrypt | ~> 3.1.7 | `has_secure_password` in User model |
| PostgreSQL | 16 | Users table storage |
| Vue | 3.x | LoginView component |
| Pinia | 3.0.4 | useAuthStore for auth state |
| Vue Router | 5.0.1 | Navigation guards, login route |
| PrimeVue | 4.5.4 | InputText, Password, Button, Message components |
| vue-i18n | 11.2.8 | Translation strings for auth UI |

### File Structure After Story 1.2

```
backend/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb  (MODIFIED: include Authentication)
│   │   ├── concerns/
│   │   │   └── authentication.rb      (NEW)
│   │   └── api/
│   │       └── v1/
│   │           ├── sessions_controller.rb  (NEW)
│   │           └── me_controller.rb        (NEW)
│   ├── models/
│   │   └── user.rb                    (NEW)
│   └── serializers/
│       └── user_serializer.rb         (NEW)
├── config/
│   └── routes.rb                      (MODIFIED: add API routes)
├── db/
│   ├── migrate/
│   │   └── XXXXXX_create_users.rb     (NEW)
│   ├── schema.rb                      (MODIFIED: auto-generated)
│   └── seeds.rb                       (MODIFIED: add admin user)
└── test/
    ├── models/
    │   └── user_test.rb               (NEW)
    └── controllers/
        └── api/
            └── v1/
                ├── sessions_controller_test.rb  (NEW)
                └── me_controller_test.rb        (NEW)

frontend/
├── src/
│   ├── api/
│   │   └── types.ts                   (MODIFIED: add User type)
│   ├── stores/
│   │   └── auth.ts                    (NEW)
│   ├── views/
│   │   ├── LoginView.vue              (NEW)
│   │   └── MoreView.vue               (MODIFIED: add sign-out)
│   ├── router/
│   │   └── index.ts                   (MODIFIED: auth guard, login route)
│   ├── App.vue                        (MODIFIED: conditional nav)
│   └── locales/
│       ├── en.json                    (MODIFIED: add auth keys)
│       └── pl.json                    (MODIFIED: add auth keys)
```

### Testing Requirements

**Backend (Minitest):**
- User model unit tests: validations, `has_secure_password`, nickname uniqueness (case-insensitive)
- Sessions controller integration tests: successful login, failed login (wrong password, wrong nickname — same error), logout
- Me controller integration tests: authenticated access, unauthenticated access (401)
- Test that inactive users (activated: false) CANNOT log in — even with correct credentials. This prevents pre-activation login before Story 1.3 implements the activation flow.
- Test session cookie is set on login (check response cookies)

**Frontend (Vitest):**
- useAuthStore unit tests: login sets user, logout clears user, checkSession restores state
- LoginView component tests are optional for MVP (Playwright E2E later will cover the flow)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria, user story, full BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Session management, cookie store, security guards
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — API namespace, error format, error codes
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, enforcement guidelines
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Directory structure, API boundaries
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — Login form layout, minimal fields, error handling
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — Bottom tab navigation, admin access via More tab
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Toast for errors, inline validation
- [Source: _bmad-output/planning-artifacts/prd.md#Authentication & User Management] — FR21 (sign in), FR22 (sign out), NFR10 (HttpOnly cookies), NFR12 (bcrypt), NFR13 (minimal data)
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-and-development-environment.md] — Previous story learnings, established file structure, debugging notes

### Project Context Reference

- **Run Rails commands:** `mise exec -- bin/rails ...` from `/backend`
- **Run npm commands:** `mise exec -- npm ...` from `/frontend`
- **Start PostgreSQL:** `docker compose -f docker-compose.dev.yml up -d` from project root
- **Start Rails:** `mise exec -- bin/rails server` from `/backend` (port 3000)
- **Start Vue:** `mise exec -- npm run dev` from `/frontend` (port 5173)
- **Create database:** `mise exec -- bin/rails db:create` from `/backend`
- **Run migrations:** `mise exec -- bin/rails db:migrate` from `/backend`
- **Run seeds:** `mise exec -- bin/rails db:seed` from `/backend`
- **Run backend tests:** `mise exec -- bin/rails test` from `/backend`
- **Run frontend tests:** `mise exec -- npm run test:unit` from `/frontend`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- User.authenticate_by does case-sensitive nickname lookup — switched to manual `where("LOWER(nickname) = LOWER(?)")` + `user.authenticate` approach with BCrypt timing protection for non-existent users.
- Fixture conflict: test for nickname uniqueness failed because fixture "tomek" already existed — used different nickname in test.
- Code review identified timing attack vulnerability in BCrypt placement — moved BCrypt dummy hash to always execute before authentication check.
- Code review identified missing server-side validation for empty credentials — added presence checks before database query.
- Code review identified frontend error handling storing English messages instead of i18n-friendly error codes — refactored to store error.code for translation.
- Code review identified router guard race condition with sessionChecked flag — added try-finally to ensure flag is always set.

### Completion Notes List

- Task 1: Created User model with migration, has_secure_password, and validations (nickname uniqueness case-insensitive, length 2-30). 9 model tests pass.
- Task 2: Created Authentication concern with current_user, authenticate_user!, logged_in? methods. Included in ApplicationController with global before_action.
- Task 3: Created SessionsController with case-insensitive nickname lookup, activation check, timing-safe auth, and structured error responses.
- Task 4: Created MeController returning current user data via serializer. Protected by default authentication.
- Task 5: Created UserSerializer exposing only id, nickname, admin — no sensitive fields.
- Task 6: Configured API routes for sessions (create/destroy) and me (show). Verified with `rails routes`.
- Task 7: Seeded admin user (nickname: "admin", password: "password", activated, admin).
- Task 8: Wrote 12 backend controller integration tests covering login success, failure modes (wrong password, non-existent user, inactive user), logout, session restore, and no password_digest exposure. Total: 21 backend tests, all passing.
- Task 9: Created useAuthStore with setup store pattern, login/logout/checkSession/clearError actions.
- Task 10: Created LoginView with PrimeVue InputText, Password (toggleMask), Button with loading state, inline error display, centered card layout.
- Task 11: Configured Vue Router auth guards with beforeEach, session check on first load, redirect to /login for protected routes, redirect query param preservation.
- Task 12: Updated App.vue to conditionally show AppNavigation only when authenticated.
- Task 13: Added auth translation keys to en.json and pl.json.
- Task 14: Updated MoreView with user nickname display and Sign Out button.
- Frontend tests: 9 Vitest tests for useAuthStore (login, logout, checkSession, clearError, loading state, error handling). All passing.
- TypeScript type-check: clean. Lint: clean.
- CODE REVIEW FIXES (Claude Sonnet 4.5):
  - Fixed session security config: added explicit httponly: true, secure: Rails.env.production? to cookie_store options (NFR10 compliance).
  - Fixed timing attack vulnerability: moved BCrypt dummy hash to execute BEFORE authentication check, preventing timing-based user enumeration.
  - Added database migration for case-insensitive nickname index: created functional index `LOWER(nickname)` to optimize login queries.
  - Fixed server-side validation: added presence checks for nickname/password params before database lookup (defense-in-depth).
  - Fixed frontend error handling: changed auth store to store error.code instead of error.message for proper i18n translation.
  - Added error code translations to en.json and pl.json: INVALID_CREDENTIALS, UNAUTHORIZED, UNKNOWN_ERROR.
  - Fixed router guard race condition: wrapped checkSession in try-finally to ensure sessionChecked flag is always set.
  - Fixed LoginView error display: updated to use `$t(\`errors.${authStore.error}\`)` pattern with fallback.
  - Improved checkSession error handling: distinguish between 401 (not logged in) and network errors.
  - Added 3 new backend tests for empty/missing credentials validation (24 total tests, all passing).

### Change Log

- 2026-02-05: Implemented Story 1.2 — User Model and Session Authentication (all 14 tasks completed)
- 2026-02-05: Code review fixes — security hardening, i18n compliance, timing attack mitigation (10 issues resolved)

### File List

**New files:**
- backend/app/models/user.rb
- backend/app/controllers/concerns/authentication.rb
- backend/app/controllers/api/v1/sessions_controller.rb
- backend/app/controllers/api/v1/me_controller.rb
- backend/app/serializers/user_serializer.rb
- backend/db/migrate/20260205214732_create_users.rb
- backend/db/migrate/20260205215759_add_lower_nickname_index_to_users.rb (code review fix)
- backend/test/models/user_test.rb
- backend/test/controllers/api/v1/sessions_controller_test.rb
- backend/test/controllers/api/v1/me_controller_test.rb
- frontend/src/stores/auth.ts
- frontend/src/stores/__tests__/auth.test.ts
- frontend/src/views/LoginView.vue

**Modified files:**
- backend/app/controllers/application_controller.rb
- backend/config/application.rb (code review fix: session security flags)
- backend/config/routes.rb
- backend/db/seeds.rb
- backend/db/schema.rb (auto-generated)
- backend/test/fixtures/users.yml
- frontend/src/api/types.ts
- frontend/src/router/index.ts
- frontend/src/App.vue
- frontend/src/views/MoreView.vue
- frontend/src/locales/en.json
- frontend/src/locales/pl.json
