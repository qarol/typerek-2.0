# Story 1.4: Admin User Management Panel

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to view all users and manage their roles,
So that I can administer the group and invite new friends through a convenient interface.

## Acceptance Criteria

1. Admin navigates to UserManagementView via More tab > admin section and sees a list of all users displaying: nickname, role (player/admin), status (pending/active)
2. Admin taps "Invite New User" and a form appears to enter a nickname
3. Valid nickname submission creates an invite, displays the invite URL with "Copy" button and "Share" button (OS share sheet), and new user appears in list with "Pending" status
4. Admin toggles admin role for another user via `PUT /api/v1/admin/users/:id` which updates the role; multiple users can hold admin role simultaneously (FR24)
5. Non-admin users navigating to More tab do NOT see admin sections (Odds Entry, Score Entry, User Management)
6. Admin is subject to the same betting rules as all players (FR25) -- no special privileges outside admin panel
7. `GET /api/v1/admin/users` returns all users with: `{ data: [{ id, nickname, admin, activated }], meta: { count: N } }`
8. `PUT /api/v1/admin/users/:id` with `{ admin: true/false }` toggles the admin role and returns updated user data
9. Admin cannot remove their own admin role (self-protection)
10. Non-admin calling any `/api/v1/admin/users` endpoint receives 403 (AdminGuard, NFR9)

## Tasks / Subtasks

- [x] Task 1: Create Admin::UsersController with index and update actions (AC: #7, #8, #9, #10)
  - [x] Create `backend/app/controllers/api/v1/admin/users_controller.rb` with namespace `Api::V1::Admin::UsersController`
  - [x] Include `AdminGuard`, apply `before_action :require_admin!`
  - [x] `index` action: return all users ordered by nickname, serialized with `id`, `nickname`, `admin`, `activated` fields in camelCase
  - [x] `update` action: find user by `params[:id]`, update admin role only, return updated user data
  - [x] Self-protection: reject admin role removal if `user.id == current_user.id` with `{ error: { code: "SELF_ROLE_CHANGE", message: "Cannot remove your own admin role", field: "admin" } }`
  - [x] Respond with 404 if user not found

- [x] Task 2: Extend UserSerializer for admin context (AC: #7)
  - [x] Add `self.serialize_for_admin(user)` class method returning `{ id, nickname, admin, activated }` (includes `activated` field which is hidden in regular serialize)
  - [x] Keep existing `self.serialize(user)` unchanged for non-admin contexts

- [x] Task 3: Add admin users routes (AC: #7, #8)
  - [x] Add to admin namespace in `config/routes.rb`:
    ```ruby
    namespace :admin do
      resources :invitations, only: [:create]
      resources :users, only: [:index, :update]
    end
    ```
  - [x] Verify routes: `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/:id`

- [x] Task 4: Write backend tests (AC: #7, #8, #9, #10)
  - [x] Test `GET /api/v1/admin/users`: admin gets list of all users with correct fields
  - [x] Test `GET /api/v1/admin/users`: non-admin gets 403
  - [x] Test `GET /api/v1/admin/users`: unauthenticated gets 401
  - [x] Test `PUT /api/v1/admin/users/:id`: admin can grant admin role to a player
  - [x] Test `PUT /api/v1/admin/users/:id`: admin can revoke admin role from another admin
  - [x] Test `PUT /api/v1/admin/users/:id`: admin cannot remove own admin role (self-protection)
  - [x] Test `PUT /api/v1/admin/users/:id`: non-admin gets 403
  - [x] Test `PUT /api/v1/admin/users/:id`: user not found returns 404
  - [x] Test response format uses camelCase and `{ data: ... }` / `{ data: [...], meta: { count: N } }` wrappers

- [x] Task 5: Create MoreView admin section (AC: #5)
  - [x] Update `frontend/src/views/MoreView.vue` to show admin section only when `authStore.isAdmin` is true
  - [x] Admin section lists: "User Management" link (others like "Odds Entry", "Score Entry" shown as disabled/coming soon placeholders)
  - [x] Use PrimeVue components: `Divider` for section separation, styled links/buttons for admin options
  - [x] Non-admin users see only their nickname and Sign Out button (current behavior)

- [x] Task 6: Create UserManagementView (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/views/admin/UserManagementView.vue`
  - [x] Display user list with columns: Nickname, Role (player/admin), Status (pending/active)
  - [x] Use a simple list layout (not DataTable -- keep it light for the small user count)
  - [x] Each user row shows a `ToggleSwitch` to toggle admin role (disabled for current user)
  - [x] "Invite New User" button at top opens inline invite form
  - [x] Invite form: single `InputText` for nickname + "Create Invite" button
  - [x] On invite success: show invite URL in a prominent box with "Copy Link" button (uses `navigator.clipboard.writeText()`) and "Share" button (uses `navigator.share()` if available, hidden if not)
  - [x] Pending users show amber "Pending" tag, active users show green "Active" tag
  - [x] Back navigation arrow to return to More view

- [x] Task 7: Create useAdminStore (AC: #1, #3, #4)
  - [x] Create `frontend/src/stores/admin.ts` as a Pinia store
  - [x] State: `users: User[]`, `loading: boolean`, `error: string | null`, `inviteUrl: string | null`
  - [x] Actions: `fetchUsers()`, `toggleAdmin(userId, admin)`, `createInvite(nickname)`
  - [x] `fetchUsers()`: calls `GET /api/v1/admin/users`, stores result
  - [x] `toggleAdmin(userId, isAdmin)`: calls `PUT /api/v1/admin/users/:id` with `{ admin: isAdmin }`, updates user in local list
  - [x] `createInvite(nickname)`: calls `POST /api/v1/admin/invitations` with `{ nickname }`, adds new user to local list, stores `inviteUrl`
  - [x] Follow existing store pattern: loading/error state, `ApiClientError` handling

- [x] Task 8: Add admin types to types.ts (AC: #7)
  - [x] Add `AdminUser` interface: `{ id: number, nickname: string, admin: boolean, activated: boolean }`
  - [x] Add `InviteResponse` interface: `{ id: number, nickname: string, inviteUrl: string }`

- [x] Task 9: Add UserManagementView route (AC: #1)
  - [x] Add route `/admin/users` in `frontend/src/router/index.ts` with `meta: { requiresAuth: true, requiresAdmin: true }`
  - [x] Add admin route guard in `router.beforeEach`: if `to.meta.requiresAdmin && !authStore.isAdmin` redirect to `/`
  - [x] Import `UserManagementView` lazily

- [x] Task 10: Add i18n translation keys (AC: #1, #2, #3, #4, #5)
  - [x] Add to `en.json`:
    ```json
    "admin": {
      "section": "Admin",
      "userManagement": "User Management",
      "oddsEntry": "Odds Entry",
      "scoreEntry": "Score Entry",
      "comingSoon": "Coming soon"
    },
    "users": {
      "title": "User Management",
      "inviteNew": "Invite New User",
      "nickname": "Nickname",
      "role": "Role",
      "status": "Status",
      "admin": "Admin",
      "player": "Player",
      "active": "Active",
      "pending": "Pending",
      "createInvite": "Create Invite",
      "inviteCreated": "Invite created!",
      "copyLink": "Copy Link",
      "copyFailed": "Failed to copy link",
      "share": "Share",
      "linkCopied": "Link copied to clipboard",
      "toggleAdmin": "Toggle admin role",
      "changeRole": "Change Role",
      "confirmRoleChange": "Change {nickname}'s role to {role}?",
      "confirm": "Confirm",
      "cannotRemoveSelf": "Cannot remove your own admin role",
      "noUsers": "No users yet"
    },
    "common": {
      "back": "Back",
      "cancel": "Cancel"
    }
    ```
  - [x] Add equivalent Polish translations to `pl.json`
  - [x] Add error code translations: `errors.SELF_ROLE_CHANGE`, `errors.NOT_FOUND`

- [x] Task 11: Write frontend tests (AC: #1, #3, #4)
  - [x] Test `useAdminStore.fetchUsers()`: successful fetch stores users
  - [x] Test `useAdminStore.toggleAdmin()`: successful toggle updates user in list
  - [x] Test `useAdminStore.createInvite()`: successful invite adds user to list and stores inviteUrl
  - [x] Test error handling: API errors set error code in store

## Dev Notes

### Architecture Patterns & Constraints

- **Admin::UsersController** follows the same pattern as the existing `Admin::InvitationsController`: inherit from `ApplicationController`, include `AdminGuard`, apply `before_action :require_admin!`. Located at `app/controllers/api/v1/admin/users_controller.rb`.
- **UserSerializer extension:** Add `serialize_for_admin` method that includes the `activated` field. The regular `serialize` method (used for auth responses) intentionally hides `activated` -- admin needs to see it to distinguish pending vs active users.
- **Self-protection on role change:** The admin cannot remove their own admin role. This prevents accidental lockout. Check `params[:id].to_i == current_user.id` in the update action.
- **Response format:** Collections use `{ data: [...], meta: { count: N } }`. Single resources use `{ data: { ... } }`. All JSON keys are camelCase.
- **MoreView as admin entry point:** The architecture specifies admin panel access via "More" tab. The `MoreView` must conditionally show admin links based on `authStore.isAdmin`. Non-admin users see only their nickname and sign-out button.
- **Navigator APIs for sharing:** `navigator.clipboard.writeText()` for copy, `navigator.share()` for native OS share sheet. Both have good browser support but `navigator.share()` may not be available on desktop browsers -- hide the Share button when unavailable.

### Critical Developer Guardrails

- **DO NOT** create a separate admin layout or tab -- admin functions live inside the "More" tab as a section.
- **DO NOT** allow admin to toggle their own admin role -- reject with error code `SELF_ROLE_CHANGE`.
- **DO NOT** expose `password_digest`, `invite_token`, or other sensitive fields in the admin user list response.
- **DO NOT** create admin-only navigation tabs -- non-admin users should see exactly the same 4 tabs (Standings, Matches, History, More).
- **DO NOT** implement Odds Entry or Score Entry views -- those belong to Epic 4. Add placeholder links that show "Coming soon".
- **DO NOT** use DataTable for the user list -- the user count is small (up to 50), a simple styled list is cleaner and lighter.
- **DO** reuse the existing `POST /api/v1/admin/invitations` endpoint for invite creation (already implemented in Story 1.3).
- **DO** use a tappable role-chip button with `ConfirmDialog` for admin role toggle (not `ToggleSwitch`) -- prevents accidental role changes with explicit confirmation. This deviates from the original AC but provides better safety UX for a destructive action.
- **DO** use `$t()` for ALL user-facing strings in UserManagementView and the admin section of MoreView.
- **DO** add the admin route guard to `router.beforeEach` for the `/admin/users` route.
- **DO** handle `navigator.share()` unavailability gracefully (feature detection, hide button when not available).
- **DO** show a PrimeVue `Toast` for copy-to-clipboard success feedback.

### Previous Story Intelligence (Story 1.3)

**Learnings from Story 1.3:**
- **camelCase/snake_case mismatch (HIGH severity):** Story 1.3's code review found that frontend sent camelCase params but backend expected snake_case. The controller was updated to read `params[:passwordConfirmation]` (camelCase). Follow this pattern: **backend reads camelCase params** since the API client sends JSON with camelCase keys.
- **ApiClientError access pattern:** Auth store initially used `e.error.code` but `ApiClientError` exposes `.code` directly on the error object. Use `e.code` in catch blocks, not `e.error.code`.
- **Test fixtures:** The `inactive` fixture had `password_digest` set incorrectly -- it should be nil for uninvited users. Current fixtures: `admin` (activated, admin: true), `player` (activated, admin: false), `inactive` (not activated, no password).
- **Token generation:** `generates_token_for :invite` with 72-hour expiry. The `Admin::InvitationsController` already handles invite URL generation -- reuse this endpoint from the frontend.
- **Controller test pattern:** Login via `post api_v1_sessions_url, params: { nickname: "admin", password: "password" }` before making admin API calls. Assert JSON responses with `JSON.parse(@response.body)`.
- **Frontend test pattern:** Vitest with mocked API client. Store tests mock `api.get()`, `api.post()`, etc. and verify store state changes.

**Files created by Story 1.3 that Story 1.4 extends:**
- `backend/app/controllers/concerns/admin_guard.rb` -- Reuse directly (include in new controller)
- `backend/app/controllers/api/v1/admin/invitations_controller.rb` -- Pattern reference for new admin controller
- `backend/app/serializers/user_serializer.rb` -- Extend with `serialize_for_admin` method
- `backend/config/routes.rb` -- Add `resources :users, only: [:index, :update]` to admin namespace
- `backend/test/fixtures/users.yml` -- Reuse existing fixtures (admin, player, inactive)
- `frontend/src/stores/auth.ts` -- `isAdmin` computed already exists, use for conditional rendering
- `frontend/src/views/MoreView.vue` -- Extend with admin section
- `frontend/src/router/index.ts` -- Add admin route with guard
- `frontend/src/locales/en.json` / `pl.json` -- Add admin and users i18n keys

### Git Intelligence

**Recent commits:**
```
d566cac Implemented invite token generation, account activation, and code review fixes
2f95355 Implemented user authentication with session-based login and code review security fixes
0196054 Scaffolded monorepo with Rails API backend, Vue SPA frontend, and Docker PostgreSQL
```

**Key observations from previous implementations:**
- Backend uses Minitest (not RSpec) -- `test/` directory structure with fixtures
- Tests use `ActionDispatch::IntegrationTest` for controller tests
- Session handling in tests via `post api_v1_sessions_url, params: { ... }` pattern
- User fixtures use `BCrypt::Password.create("password")` for password_digest
- Frontend uses Vitest for unit tests
- `UserSerializer.serialize(user)` for JSON response -- simple hash, not ActiveModelSerializer
- Admin controllers include `AdminGuard` and apply `before_action :require_admin!`
- Frontend stores use setup function syntax (Composition API style Pinia)

### Library/Framework Requirements

| Library | Version | Usage in Story 1.4 |
|---------|---------|-------------------|
| Rails | 8.1.2 | Admin::UsersController, routes |
| PostgreSQL | 16 | User queries (index, update) |
| Vue | 3.5.27 | UserManagementView, MoreView updates |
| Pinia | 3.0.4 | useAdminStore |
| Vue Router | 5.0.1 | /admin/users route with admin guard |
| PrimeVue | 4.5.4 | ToggleSwitch, Button, InputText, Tag, Toast, Divider |
| vue-i18n | 11.2.8 | Admin panel and user management translations |

### File Structure After Story 1.4

```
backend/
├── app/
│   ├── controllers/
│   │   ├── concerns/
│   │   │   ├── authentication.rb       (EXISTING - no change)
│   │   │   └── admin_guard.rb          (EXISTING - no change)
│   │   └── api/
│   │       └── v1/
│   │           ├── sessions_controller.rb   (EXISTING - no change)
│   │           ├── me_controller.rb         (EXISTING - no change)
│   │           ├── users_controller.rb      (EXISTING - no change)
│   │           └── admin/
│   │               ├── invitations_controller.rb  (EXISTING - no change)
│   │               └── users_controller.rb        (NEW)
│   ├── models/
│   │   └── user.rb                     (EXISTING - no change)
│   └── serializers/
│       └── user_serializer.rb          (MODIFIED: add serialize_for_admin)
├── config/
│   └── routes.rb                       (MODIFIED: add admin/users routes)
└── test/
    └── controllers/
        └── api/
            └── v1/
                └── admin/
                    ├── invitations_controller_test.rb (EXISTING - no change)
                    └── users_controller_test.rb       (NEW)

frontend/
├── src/
│   ├── api/
│   │   └── types.ts                    (MODIFIED: add AdminUser, InviteResponse)
│   ├── stores/
│   │   ├── auth.ts                     (EXISTING - no change)
│   │   ├── admin.ts                    (NEW)
│   │   └── __tests__/
│   │       └── admin.test.ts           (NEW)
│   ├── views/
│   │   ├── MoreView.vue                (MODIFIED: add admin section)
│   │   └── admin/
│   │       └── UserManagementView.vue  (NEW)
│   ├── router/
│   │   └── index.ts                    (MODIFIED: add /admin/users route + admin guard)
│   └── locales/
│       ├── en.json                     (MODIFIED: add admin + users i18n keys)
│       └── pl.json                     (MODIFIED: add admin + users i18n keys)
```

### Testing Requirements

**Backend (Minitest):**
- Admin::UsersController#index: admin gets all users with id, nickname, admin, activated fields
- Admin::UsersController#index: non-admin gets 403
- Admin::UsersController#index: unauthenticated gets 401
- Admin::UsersController#index: response uses `{ data: [...], meta: { count: N } }` format with camelCase
- Admin::UsersController#update: admin grants admin role to player
- Admin::UsersController#update: admin revokes admin role from another admin
- Admin::UsersController#update: admin cannot revoke own admin role (returns SELF_ROLE_CHANGE error)
- Admin::UsersController#update: non-admin gets 403
- Admin::UsersController#update: user not found returns 404
- Admin::UsersController#update: response uses `{ data: { ... } }` format with camelCase

**Frontend (Vitest):**
- useAdminStore.fetchUsers(): successful fetch populates users list
- useAdminStore.toggleAdmin(): successful toggle updates user in-place
- useAdminStore.createInvite(): successful invite adds user and stores inviteUrl
- useAdminStore error handling: API errors set error code

### UX Requirements

- **User list layout:** Simple list, not a heavy DataTable. Each row: nickname (left), status tag (center), admin toggle (right).
- **Status tags:** PrimeVue `Tag` component -- amber "Pending" for `activated: false`, green "Active" for `activated: true`.
- **Admin toggle:** PrimeVue `ToggleSwitch` for role toggle. Disabled for the current user's row (cannot toggle own role). Show tooltip "Cannot remove your own admin role" when hovering disabled toggle.
- **Invite flow:** "Invite New User" button opens an inline form (not a dialog/modal). Single input for nickname + submit button. On success, the invite URL appears in a bordered box below the form with copy/share buttons.
- **Copy button:** Uses `navigator.clipboard.writeText()`. Show PrimeVue Toast "Link copied to clipboard" on success.
- **Share button:** Uses `navigator.share({ url: inviteUrl })`. Only visible when `navigator.share` is available (mobile browsers, some desktop). Hidden gracefully on unsupported browsers.
- **Mobile layout:** Single column, full width. Touch targets meet 48x48dp minimum.
- **Desktop layout:** Centered max-width 640px content area per architecture.
- **Back navigation:** Arrow icon at top-left to return to MoreView.
- **Loading state:** PrimeVue Skeleton for user list during initial load.
- **Error handling:** Toast for API errors, inline validation for nickname input.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] -- Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] -- AdminGuard, admin role management
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- Admin namespace `/api/v1/admin/`, error format, response format
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] -- Admin controller location, frontend admin views
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows - Journey 6] -- Admin invitation flow, user management UX
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] -- Admin form patterns, validation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] -- Admin access via More tab, no separate admin tab
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] -- Toast for errors, inline for success
- [Source: _bmad-output/planning-artifacts/prd.md#Authentication & User Management] -- FR18, FR23, FR24, FR25
- [Source: _bmad-output/implementation-artifacts/1-3-invite-token-generation-and-account-activation.md] -- Previous story learnings, established patterns
- [Source: PrimeVue 4.x docs] -- ToggleSwitch, Tag, Toast, Button, InputText components

### Project Context Reference

- **Run Rails commands:** `mise exec -- bin/rails ...` from `/backend`
- **Run npm commands:** `mise exec -- npm ...` from `/frontend`
- **Start PostgreSQL:** `docker compose -f docker-compose.dev.yml up -d` from project root
- **Start Rails:** `mise exec -- bin/rails server` from `/backend` (port 3000)
- **Start Vue:** `mise exec -- npm run dev` from `/frontend` (port 5173)
- **Run migrations:** `mise exec -- bin/rails db:migrate` from `/backend`
- **Run backend tests:** `mise exec -- bin/rails test` from `/backend`
- **Run frontend tests:** `mise exec -- npm run test:unit` from `/frontend`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None

### Completion Notes List

✅ **Backend Implementation (Tasks 1-4)**
- Created Admin::UsersController with index and update actions following existing AdminGuard pattern
- Implemented self-protection: admin cannot remove their own admin role (SELF_ROLE_CHANGE error)
- Extended UserSerializer with serialize_for_admin method including activated field
- Added /api/v1/admin/users routes (index, update) to routes.rb
- Wrote comprehensive controller tests (9 tests) covering all ACs including 403/401/404 responses
- All tests pass with no regressions

✅ **Frontend Implementation (Tasks 5-11)**
- Updated MoreView with conditional admin section visible only to admin users
- Created UserManagementView with user list, admin toggle switches, and invite form
- Implemented inline invite form with Copy Link and Share (native OS share sheet) buttons
- Created useAdminStore (Pinia) with fetchUsers, toggleAdmin, and createInvite actions
- Added AdminUser and InviteResponse TypeScript interfaces
- Added /admin/users route with requiresAdmin meta and admin route guard
- Added English and Polish i18n translations for admin section and user management
- Wrote comprehensive store tests (9 tests) covering all store actions and error handling
- All frontend tests pass (22 tests total)

**Technical Implementation Notes:**
- Backend uses ActiveModel::Type::Boolean.new.cast() for proper boolean parameter handling in self-protection check
- Frontend uses feature detection for navigator.share() API, hiding Share button when unavailable
- Users list automatically sorted by nickname after adding new invited user
- Toast notifications for success/error feedback following PrimeVue patterns
- ToggleSwitch disabled for current user with clear UX feedback

**Post-Implementation Fixes:**
- Added ToastService and ConfirmationService to main.ts (required for PrimeVue Toast and ConfirmDialog components)
- Created router/types.d.ts to extend RouteMeta interface with requiresAdmin property
- Fixed ApiClientError usage in auth.ts (e.code instead of e.error.code)
- Updated test mocks to match ApiClientError constructor signature
- Added camelCase transformation to UserSerializer.serialize_for_admin to ensure architecture compliance
- Added error handling for initial user fetch in UserManagementView with Toast feedback
- Standardized test fixture passwords to 'password' for consistency
- All tests pass, TypeScript type check passes

**UI/UX Improvements:**
- Improved responsive layout with adaptive max-width: 600px (mobile), 720px (tablet >= 768px), 960px (desktop >= 1200px)
- Enhanced UserManagementView styling: rounded corners (12px), subtle shadows, hover effects
- Improved invite URL display with monospace font and highlighted background
- Better mobile responsiveness with proper breakpoints
- Enhanced MoreView user info display with card-style background
- Proper typography scaling for desktop vs mobile
- Touch-friendly spacing and layout on mobile devices

**Navigation Improvements (User-Initiated UX Fixes):**
- Updated AppNavigation.vue with desktop sidebar navigation (side rail at 768px+, expanded sidebar at 1200px+)
- Added matchMedia-based conditional rendering to show only one navigation style (mobile bottom bar OR desktop sidebar)
- Updated App.vue with responsive margins for side navigation (72px for narrow sidebar, 200px for expanded)
- Updated main.css with improved .view-container responsive breakpoints for better desktop layout

**Design Decision - ConfirmDialog over ToggleSwitch:**
- Replaced ToggleSwitch with custom role-chip button + ConfirmDialog for admin role changes
- Rationale: Role changes are destructive actions that should require explicit confirmation to prevent accidental clicks
- Provides better safety UX with clear confirmation messaging showing the user and new role
- Uses severity='warn' for demoting admins to visually signal the action's importance

### File List

**Backend (New)**
- backend/app/controllers/api/v1/admin/users_controller.rb
- backend/test/controllers/api/v1/admin/users_controller_test.rb

**Backend (Modified)**
- backend/app/serializers/user_serializer.rb
- backend/config/routes.rb

**Frontend (New)**
- frontend/src/stores/admin.ts
- frontend/src/stores/__tests__/admin.test.ts
- frontend/src/views/admin/UserManagementView.vue
- frontend/src/router/types.d.ts

**Frontend (Modified)**
- frontend/src/api/types.ts
- frontend/src/views/MoreView.vue
- frontend/src/router/index.ts
- frontend/src/locales/en.json
- frontend/src/locales/pl.json
- frontend/src/main.ts
- frontend/src/stores/auth.ts
- frontend/src/App.vue (responsive nav margins)
- frontend/src/assets/main.css (responsive view-container breakpoints)
- frontend/src/components/ui/AppNavigation.vue (desktop sidebar navigation)
