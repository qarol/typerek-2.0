---
stepsCompleted: ['step-01-validate-prerequisites(validated)', 'step-02-design-epics(validated)', 'step-03-create-stories(validated)', 'step-04-final-validation(validated)']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# typerek-2.0 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for typerek-2.0, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Player can view all tournament matches with team names, kickoff times, and group labels
FR2: Player can place a prediction by selecting one of 6 bet types (1, X, 2, 1X, X2, 12)
FR3: Player can place a prediction regardless of whether odds have been assigned
FR4: Player can change their prediction at any time before kickoff
FR5: Player cannot place or modify a prediction after kickoff time
FR6: Player can view all other players' predictions for a match only after kickoff
FR7: Player cannot view other players' predictions before kickoff
FR8: System calculates points for all players on a match when admin enters the final score
FR9: System awards points equal to the odds value of the selected bet type when correct
FR10: System awards zero points when no prediction was placed
FR11: System resolves compound bet types (1X, X2, 12) as winning if either covered outcome occurs
FR12: Player can view point calculation details per match (bet, odds, result, points earned)
FR13: Player can view a leaderboard ranking all players by total accumulated points
FR14: Leaderboard reflects latest totals including all scored matches
FR15: Player can view any other player's complete betting history
FR16: Player can view their own complete betting record (every match, prediction, result, points)
FR17: Player can view another player's betting record with the same detail
FR18: Admin can create a new user account by specifying a nickname
FR19: System generates a unique invite URL with token for each account
FR20: Invited user can activate their account via invite URL and set a password
FR21: User can sign in with nickname and password
FR22: User can sign out
FR23: Admin can assign or revoke admin role for any user
FR24: Multiple users can hold admin role simultaneously
FR25: Admin is subject to the same betting rules as all other players
FR26: Admin can load a complete tournament schedule via seed script (`rails db:seed`)
FR27: Matches cannot be added or deleted through the application UI
FR28: Admin can enter or update odds for each of the 6 bet types on any match
FR29: Admin can enter the final score for a completed match
FR30: System prevents modification of match results after points have been calculated
FR31: User can select preferred language (Polish or English)
FR32: All user-facing text is available in both Polish and English
FR33: User can install the application as a PWA on their device's home screen
FR34: Application provides a responsive experience for mobile and desktop

### NonFunctional Requirements

NFR1: SPA page transitions complete within 500ms
NFR2: API responses return within 200ms under normal load (up to 50 concurrent users)
NFR3: PWA cold start loads and is interactive within 3 seconds on 4G
NFR4: PWA warm start (cached) loads within 1 second
NFR5: Leaderboard and match list render correctly with up to 100 matches and 50 players
NFR6: Bet modification requests rejected server-side after kickoff, regardless of client state
NFR7: Other players' bet data inaccessible server-side before kickoff
NFR8: Bet and score endpoints verify requesting user's ownership or admin role server-side
NFR9: Admin-only endpoints reject non-admin requests server-side
NFR10: Session cookies are HttpOnly and Secure
NFR11: Invite tokens are cryptographically random and single-use
NFR12: Passwords stored using bcrypt or equivalent one-way hash
NFR13: No user data stored beyond nickname and hashed password
NFR14: PostgreSQL data persists across container restarts, crashes, and redeployments via Docker named volumes
NFR15: Point calculations are deterministic -- same inputs always produce same outputs
NFR16: Score entry and point calculation occur within a database transaction
NFR17: Referential integrity maintained -- no orphaned bets, scores, or user records
NFR18: New deployment requires only `docker compose up` after seed data preparation
NFR19: Configuration managed through environment variables, not hardcoded
NFR20: Application runs as three containers (nginx, Rails, PostgreSQL) via single Docker Compose file
NFR21: No external service dependencies -- fully self-contained

### Additional Requirements

**From Architecture:**
- Starter template specified: Rails 8.1 API-only (`rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable`) + create-vue (`npm create vue@latest frontend` with TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier)
- Monorepo structure: `/backend`, `/frontend`, `docker-compose.yml` at root
- Re-add session middleware to Rails API-only mode for cookie-based auth
- Session storage: encrypted cookie store (no Redis dependency)
- Invite token format: signed token with expiry via Rails `MessageVerifier`
- Security guards implemented as Rails concerns: `BetTimingGuard`, `BetVisibilityGuard`, `OwnershipGuard`, `AdminGuard`
- ScoringEngine as pure Ruby service object in `app/services/scoring_engine.rb`
- API namespace: `/api/v1/` with versioned controller structure (`app/controllers/api/v1/`)
- JSON response format: `{ data: ... }` for success, `{ error: { code, message, field } }` for errors
- camelCase JSON serialization via serializers (`app/serializers/`)
- Pinia domain-based stores: `useAuthStore`, `useMatchesStore`, `useLeaderboardStore`, `useBetsStore`
- Typed fetch wrapper API client (`src/api/client.ts`)
- Odds stored as 6 decimal columns on Match table (`decimal(4,2)`)
- Points stored as `points_earned` column on Bet (`decimal(6,2)`)
- Leaderboard computed via `SUM(points_earned)` -- no pre-computed totals needed
- Development workflow: PostgreSQL in Docker (`docker-compose.dev.yml`), Rails/Vue running locally
- Production deployment: 3 containers (nginx, Rails, PostgreSQL) via `docker-compose.yml`
- nginx config: serve Vue static build at `/`, proxy `/api` to Rails, optional SSL termination (certificate management left to deployer)
- YAML seed data files for tournament data (`db/seeds/data/world_cup_2026.yml`)
- Post-scaffold frontend additions: PrimeVue + Aura, vite-plugin-pwa, vue-i18n, chart.js + vue-chartjs, Playwright

**From UX Design:**
- PrimeVue (Styled Mode) with Aura theme + design token overrides for typerek branding
- Hybrid B+C design direction: elevated cards for match list, full-width rows for leaderboard
- Bottom tab navigation: 4 tabs (Standings, Matches, History, More)
- 5 custom components: BetSelector, MatchCard, LeaderboardRow, RevealList, BumpChart
- BetSelector: 6 inline buttons with bet label + odds value, single-tap = save (optimistic UI), ARIA radiogroup
- MatchCard: container with match info, BetSelector, status tags, reveal section -- handles all match states (open/locked/scored)
- LeaderboardRow: position + movement indicator (green up/red down) + name + points
- RevealList: all players' bets shown after kickoff, nested in MatchCard
- BumpChart: interactive Chart.js line chart for leaderboard progression over matchdays
- Mobile-first responsive: 2 breakpoints only (< 768px mobile, >= 768px desktop with max-width 640px centered)
- Color system: teal primary (#0D9488), amber secondary (#F59E0B), semantic green/gray/red
- Typography: Inter typeface, 16px base, larger scale for accessibility
- Touch targets: 48x48dp minimum everywhere
- Spacing: 8px base unit scale
- Light mode only (no dark mode in MVP)
- PrimeIcons for UI icons, emoji flags for country identifiers
- "How it works" single-screen onboarding after account activation (skippable)
- "Rules" page always accessible from navigation
- Accessibility: WCAG 2.1 AA via PrimeVue defaults + semantic HTML + ARIA labels on custom components
- i18n: Polish and English via vue-i18n with JSON translation files, language switcher in "More" tab
- PWA: vite-plugin-pwa, manifest with teal theme color, iOS meta tags, safe-area-inset handling
- No confirmation dialogs for bet placement/change
- Toast for errors (non-blocking, auto-dismiss 4 seconds)
- Skeleton loading states via PrimeVue Skeleton
- Match list sorted: today's open matches first, then upcoming, then locked/scored
- Admin panel in "More" tab section: Odds Entry, Score Entry, User Management
- Admin forms: desktop-optimized side-by-side layouts, numeric keyboard on mobile

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | View all tournament matches |
| FR2 | Epic 3 | Place prediction (6 bet types) |
| FR3 | Epic 3 | Predict regardless of odds |
| FR4 | Epic 3 | Change prediction before kickoff |
| FR5 | Epic 3 | Cannot predict after kickoff |
| FR6 | Epic 3 | View others' predictions after kickoff |
| FR7 | Epic 3 | Cannot view others' predictions before kickoff |
| FR8 | Epic 4 | Points calculated on score entry |
| FR9 | Epic 4 | Points equal odds value when correct |
| FR10 | Epic 4 | Zero points for no prediction |
| FR11 | Epic 4 | Compound bet resolution |
| FR12 | Epic 4 | View point calculation details |
| FR13 | Epic 5 | View leaderboard rankings |
| FR14 | Epic 5 | Leaderboard reflects latest totals |
| FR15 | Epic 5 | View any player's betting history |
| FR16 | Epic 5 | View own betting record |
| FR17 | Epic 5 | View another player's record |
| FR18 | Epic 1 | Admin creates user account |
| FR19 | Epic 1 | System generates invite URL |
| FR20 | Epic 1 | Activate account via invite URL |
| FR21 | Epic 1 | Sign in with nickname/password |
| FR22 | Epic 1 | Sign out |
| FR23 | Epic 1 | Admin assign/revoke admin role |
| FR24 | Epic 1 | Multiple admins supported |
| FR25 | Epic 1 | Admin same betting rules as players |
| FR26 | Epic 2 | Load tournament via seed script |
| FR27 | Epic 2 | No match add/delete via UI |
| FR28 | Epic 4 | Admin enter/update odds |
| FR29 | Epic 4 | Admin enter final score |
| FR30 | Epic 4 | Prevent result modification after scoring |
| FR31 | Epic 6 | Select preferred language |
| FR32 | Epic 6 | All text in PL and EN |
| FR33 | Epic 6 | PWA home screen install |
| FR34 | Epic 6 | Responsive mobile and desktop |

## Epic List

### Epic 1: Project Foundation & User Access
Users can be invited via token link, activate their accounts, log in, and access the app. Admin can manage users and roles. Includes project scaffolding (Rails API + Vue SPA starters), development Docker setup, authentication system, invite flow, session management, and admin user management.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

### Epic 2: Tournament Schedule & Match Browsing
Players can browse the full tournament schedule with team names, kickoff times, and group labels. Admin loads matches via seed script. Includes Match model, YAML seed system, match list view with MatchCard component, and match state display (open/locked/scored visual states).
**FRs covered:** FR1, FR26, FR27

### Epic 3: Predictions & Kickoff Lock
Players can place and change predictions using the 6-option bet system. Bets lock automatically at kickoff and all predictions become visible to everyone. Includes BetSelector component, bet placement/change, security guards (timing, visibility, ownership, admin), the kickoff lock, and the bet reveal moment.
**FRs covered:** FR2, FR3, FR4, FR5, FR6, FR7

### Epic 4: Scoring, Odds & Points
Admin enters odds and match scores. System calculates points automatically. Players see transparent point breakdowns per match. Includes admin odds entry panel, admin score entry panel, ScoringEngine service (including compound bet resolution), automatic point calculation, and results display in RevealList.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR28, FR29, FR30

### Epic 5: Leaderboard, Rankings & Player History
Players can track competition standings with movement indicators, and view any player's complete betting record match by match. Includes leaderboard view (home screen) with LeaderboardRow component, position movement indicators, and player history view.
**FRs covered:** FR13, FR14, FR15, FR16, FR17

### Epic 6: PWA, Internationalization & Production Deployment
Users get a full mobile experience with home screen install, bilingual support (PL/EN), and the app is production-ready via Docker Compose. Includes PWA setup, i18n with vue-i18n, language switcher, "How it works" onboarding screen, production Docker Compose with nginx, and final responsive polish.
**FRs covered:** FR31, FR32, FR33, FR34

## Epic 1: Project Foundation & User Access

Users can be invited via token link, activate their accounts, log in, and access the app. Admin can manage users and roles.

### Story 1.1: Project Scaffolding and Development Environment

As a developer,
I want to initialize the monorepo with Rails API backend, Vue SPA frontend, and a development PostgreSQL instance,
So that I have a working development environment for building typerek features.

**Acceptance Criteria:**

**Given** an empty project directory
**When** the backend is initialized with `rails new backend --api --database=postgresql --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable`
**Then** a Rails 8.1 API-only application exists at `/backend` with PostgreSQL configured

**Given** the backend exists
**When** the frontend is initialized with `npm create vue@latest frontend` (TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier)
**Then** a Vue 3 SPA exists at `/frontend` with all selected features configured

**Given** the frontend exists
**When** post-scaffold dependencies are installed (PrimeVue + Aura, vite-plugin-pwa, vue-i18n)
**Then** all dependencies are available and the frontend builds successfully

**Given** both projects exist
**When** `docker-compose.dev.yml` is created with a PostgreSQL service
**Then** `docker compose -f docker-compose.dev.yml up -d` starts PostgreSQL accessible from Rails

**Given** the development environment is running
**When** the developer starts Rails (`rails server`) and Vue (`npm run dev`)
**Then** both servers start successfully and the Vue app is accessible in the browser
**And** the monorepo follows `/backend`, `/frontend`, `docker-compose.dev.yml` at root
**And** PrimeVue Aura theme is configured with typerek design tokens (teal primary `#0D9488`)
**And** the Vue app shell renders with bottom tab navigation placeholder (Standings, Matches, History, More)
**And** the API client wrapper (`src/api/client.ts`) is created with typed fetch methods and structured error handling `{ error: { code, message, field } }`

### Story 1.2: User Model and Session Authentication

As a user,
I want to log in with my nickname and password and log out,
So that I can securely access the app.

**Acceptance Criteria:**

**Given** the database is initialized
**When** the User model migration runs
**Then** a `users` table exists with: `id`, `nickname` (unique, not null), `password_digest` (not null), `admin` (boolean, default false), `invite_token` (string), `activated` (boolean, default false), `created_at`, `updated_at`
**And** `has_secure_password` is configured (bcrypt, NFR12)

**Given** session middleware is re-added to Rails API
**When** a session is created
**Then** it is stored in an encrypted cookie (HttpOnly, Secure in production -- NFR10)

**Given** an activated user with nickname "Tomek" and valid password
**When** `POST /api/v1/sessions` is called with correct credentials
**Then** a session cookie is set and user data returned in `{ data: { id, nickname, admin } }` format

**Given** a valid session exists
**When** `GET /api/v1/me` is called
**Then** the current user's data is returned

**Given** no valid session
**When** `GET /api/v1/me` is called
**Then** 401 with `{ error: { code: "UNAUTHORIZED", message: "Not logged in", field: null } }`

**Given** a valid session exists
**When** `DELETE /api/v1/sessions` is called
**Then** the session is destroyed and subsequent requests return 401

**Given** the backend auth is working
**When** the frontend LoginView is accessed
**Then** a login form with nickname and password fields is displayed with a teal "Sign In" button

**Given** valid credentials submitted
**When** authentication succeeds
**Then** user is stored in `useAuthStore` and redirected to the leaderboard (home) route

**Given** user is not authenticated
**When** they access any protected route
**Then** Vue Router guard redirects to `/login`

**And** error on invalid credentials: "Incorrect nickname or password" (no information leakage)
**And** no user data stored beyond nickname and hashed password (NFR13)

### Story 1.3: Invite Token Generation and Account Activation

As an admin,
I want to create a user account and generate an invite link,
So that I can invite friends to join the app.

As an invited user,
I want to activate my account via the invite link and set a password,
So that I can start using the app.

**Acceptance Criteria:**

**Given** an admin user is authenticated
**When** `POST /api/v1/admin/invitations` is called with `{ nickname: "Ania" }`
**Then** a user record is created (activated: false) and a signed invite token is generated via Rails `MessageVerifier` with embedded user_id and timestamp
**And** the response returns the full invite URL

**Given** nickname "Ania" already exists
**When** invite is attempted
**Then** 422 with `{ error: { code: "VALIDATION_ERROR", message: "Nickname already taken", field: "nickname" } }`

**Given** a non-admin user is authenticated
**When** `POST /api/v1/admin/invitations` is called
**Then** 403 returned (AdminGuard, NFR9)

**Given** a valid, unexpired invite token
**When** `POST /api/v1/users/activate` is called with token and password
**Then** password is set, `activated: true`, token invalidated, session created (auto-login)

**Given** an expired or invalid token
**When** activation is attempted
**Then** clear error: "Invalid or expired invite link. Contact your group admin."

**Given** an invite link is opened in the browser
**When** ActivateView loads
**Then** nickname is pre-filled (read-only) with password + confirm password fields shown

**Given** valid matching passwords submitted (minimum 6 characters)
**When** activation succeeds
**Then** user is auto-logged in and redirected to leaderboard

**And** invite tokens are cryptographically random and single-use (NFR11)

### Story 1.4: Admin User Management Panel

As an admin,
I want to view all users and manage their roles,
So that I can administer the group and invite new friends through a convenient interface.

**Acceptance Criteria:**

**Given** an admin is authenticated
**When** they navigate to UserManagementView via More tab > admin section
**Then** a list of all users is displayed: nickname, role (player/admin), status (pending/active)

**Given** the user management view is displayed
**When** admin taps "Invite New User"
**Then** a form appears to enter a nickname

**Given** valid nickname submitted
**When** invitation succeeds
**Then** invite URL is displayed with "Copy" button and "Share" button (OS share sheet)
**And** new user appears in list with "Pending" status

**Given** admin views the user list
**When** they toggle admin role for another user
**Then** `PUT /api/v1/admin/users/:id` updates the role
**And** multiple users can hold admin role simultaneously (FR24)

**Given** a non-admin user navigates to More tab
**When** the page renders
**Then** admin sections (Odds Entry, Score Entry, User Management) are not visible

**And** admin is subject to the same betting rules as all players (FR25)

## Epic 2: Tournament Schedule & Match Browsing

Players can browse the full tournament schedule with team names, kickoff times, and group labels. Admin loads matches via seed script.

### Story 2.1: Match Model and Tournament Seed System

As an admin,
I want to load a complete tournament schedule from a seed file,
So that all matches are available in the app before the tournament starts.

**Acceptance Criteria:**

**Given** the database is initialized
**When** the Match model migration runs
**Then** a `matches` table exists with: `id`, `home_team` (string, not null), `away_team` (string, not null), `kickoff_time` (timestamp with time zone, not null), `group_label` (string), `home_score` (integer), `away_score` (integer), `odds_home` (decimal 4,2), `odds_draw` (decimal 4,2), `odds_away` (decimal 4,2), `odds_home_draw` (decimal 4,2), `odds_draw_away` (decimal 4,2), `odds_home_away` (decimal 4,2), `created_at`, `updated_at`

**Given** a YAML seed file exists at `db/seeds/data/world_cup_2026.yml` with tournament match data
**When** `rails db:seed` is executed
**Then** all matches from the YAML file are loaded into the database with correct team names, kickoff times, and group labels

**Given** matches exist in the database
**When** `GET /api/v1/matches` is called by an authenticated user
**Then** all matches are returned serialized with camelCase fields (`homeTeam`, `awayTeam`, `kickoffTime`, `groupLabel`, `homeScore`, `awayScore`, odds fields) in `{ data: [...], meta: { count: N } }` format
**And** dates are in ISO 8601 UTC format

**Given** matches are loaded via seed
**When** an admin accesses the application UI
**Then** there is no option to add or delete matches through the interface (FR27)

**And** referential integrity is maintained (NFR17)

### Story 2.2: Match List View and MatchCard Component

As a player,
I want to browse all tournament matches with team names, kickoff times, and match status,
So that I can see the full schedule and know which matches need my attention.

**Acceptance Criteria:**

**Given** matches exist in the database
**When** the player navigates to the Matches tab
**Then** MatchesView displays all matches as MatchCard components grouped by date

**Given** the match list is displayed
**When** the player scans the list
**Then** matches within each date group are sorted by kickoff time (earliest first)
**And** today's open matches appear first, then upcoming, then locked/scored at bottom

**Given** a match has not reached kickoff time
**When** the MatchCard renders
**Then** it shows: home team (with emoji flag) vs away team (with emoji flag), kickoff time, group label, and a green-tinted "Open" status tag

**Given** a match has passed kickoff time but has no score entered
**When** the MatchCard renders
**Then** it shows a gray "Locked" status tag with slightly muted text

**Given** a match has a score entered
**When** the MatchCard renders
**Then** it shows a green "Scored" status tag with the final score displayed prominently

**Given** the match list contains up to 100 matches
**When** the view renders
**Then** all matches render correctly with smooth scrolling (NFR5)

**And** MatchCards use elevated card styling (soft shadow on `#FAFAFA` background, 12px border-radius) per UX design direction
**And** touch targets meet 48x48dp minimum
**And** the view is responsive: full-width cards on mobile, centered max-width 640px on desktop

## Epic 3: Predictions & Kickoff Lock

Players can place and change predictions using the 6-option bet system. Bets lock automatically at kickoff and all predictions become visible to everyone.

### Story 3.1: Bet Model and Prediction API

As a player,
I want to place and change my prediction on a match before kickoff,
So that I can compete in the prediction game.

**Acceptance Criteria:**

**Given** the database is initialized
**When** the Bet model migration runs
**Then** a `bets` table exists with: `id`, `user_id` (foreign key, not null), `match_id` (foreign key, not null), `bet_type` (string, not null), `points_earned` (decimal 6,2, default 0), `created_at`, `updated_at`
**And** a unique index exists on `[user_id, match_id]` (one bet per user per match)
**And** `bet_type` is validated to be one of: `1`, `X`, `2`, `1X`, `X2`, `12`

**Given** an authenticated player and a match before kickoff
**When** `POST /api/v1/bets` is called with `{ matchId, betType }`
**Then** a bet is created and returned serialized with camelCase fields in `{ data: { id, matchId, betType, pointsEarned } }`

**Given** a player already has a bet on a match before kickoff
**When** `PUT /api/v1/bets/:id` is called with a new `{ betType }`
**Then** the bet is updated to the new type (FR4)

**Given** a player has a bet on a match before kickoff
**When** `DELETE /api/v1/bets/:id` is called
**Then** the bet is removed (player can deselect)

**Given** a match has passed kickoff time
**When** any bet mutation (`POST`, `PUT`, `DELETE`) is attempted
**Then** 403 with `{ error: { code: "BET_LOCKED", message: "Match has started", field: null } }` (BetTimingGuard, NFR6)

**Given** a player tries to modify another player's bet
**When** `PUT /api/v1/bets/:id` or `DELETE /api/v1/bets/:id` is called
**Then** 403 returned (OwnershipGuard, NFR8)

**Given** a match has no odds assigned
**When** a player places a bet
**Then** the bet is accepted regardless (FR3)

**And** BetTimingGuard and OwnershipGuard are implemented as Rails concerns in `app/controllers/concerns/`

### Story 3.2: BetSelector Component and Betting Interface

As a player,
I want to tap a prediction option on a match card and see instant visual feedback,
So that placing bets feels fast and intuitive.

**Acceptance Criteria:**

**Given** a match is open (before kickoff) and displayed in MatchesView
**When** the MatchCard renders
**Then** a BetSelector component is displayed with 6 buttons: "1 - Home win", "X - Draw", "2 - Away win", "1X - Home or draw", "X2 - Draw or away", "12 - Home or away"

**Given** odds are assigned to the match
**When** the BetSelector renders
**Then** each button shows the bet label (top line, semibold) and odds value (bottom line, smaller)

**Given** no odds are assigned
**When** the BetSelector renders
**Then** each button shows the bet label and "—" for odds, with an amber "No odds yet" tag on the card

**Given** the player taps a bet option
**When** the selection is made
**Then** the button highlights immediately with teal background and white text (optimistic UI)
**And** the bet is saved to the server via `useBetsStore` in the background
**And** no confirmation dialog is shown

**Given** the player taps a different option on the same match
**When** the new selection is made
**Then** the previous option deselects, the new option highlights, and the update is saved

**Given** the player taps the currently selected option
**When** the deselection is made
**Then** the option deselects (bet removed) and the deletion is saved

**Given** a server save fails (network error)
**When** the error response is received
**Then** the selection reverts to the previous state and a Toast appears: "Couldn't save bet, try again" (auto-dismiss 4 seconds)

**Given** a player has already placed a bet on a match
**When** the MatchCard renders
**Then** the selected option is highlighted and a teal "Your bet: [option]" indicator is shown

**Given** a player has not placed a bet on an open match
**When** the MatchCard renders
**Then** an amber "No bet placed yet" warning is displayed

**And** BetSelector uses ARIA radiogroup with radio buttons for accessibility
**And** keyboard navigation: arrow keys between options, Enter/Space to select
**And** all 6 buttons fit in a single row on mobile (minimum 48x48dp touch targets)

### Story 3.3: Kickoff Lock and Bet Reveal

As a player,
I want to see everyone's predictions after kickoff,
So that I can enjoy the social reveal moment and discuss picks with friends.

**Acceptance Criteria:**

**Given** an authenticated player requests bets for a match before kickoff
**When** `GET /api/v1/matches/:id/bets` is called
**Then** only the requesting player's own bet is returned (BetVisibilityGuard, NFR7)

**Given** an authenticated player requests bets for a match after kickoff
**When** `GET /api/v1/matches/:id/bets` is called
**Then** all players' bets for that match are returned with player nicknames

**Given** a match has passed kickoff time
**When** the MatchCard renders in the UI
**Then** the BetSelector is removed (no bet buttons visible)
**And** the match card shows "Locked" status tag with slightly muted text
**And** a RevealList component appears showing all players' bets

**Given** the RevealList is displayed
**When** the player scans the list
**Then** each row shows: player nickname + bet type badge (e.g., "1 - Home win")
**And** the current user's row is highlighted with teal background
**And** players who didn't bet show "— missed" in gray

**Given** a player has the app open and a match reaches kickoff
**When** the player navigates or refreshes
**Then** the match card transitions to locked state with reveal section visible (state driven by server data, not client timer)

**Given** a player tries to submit a bet at the exact kickoff boundary
**When** the server rejects the bet
**Then** the UI reverts the selection and shows Toast: "Match has started, bet not saved"
**And** the match card transitions to locked state

**And** BetVisibilityGuard is implemented as a Rails concern in `app/controllers/concerns/`
**And** RevealList uses ARIA table/list structure for screen reader accessibility

## Epic 4: Scoring, Odds & Points

Admin enters odds and match scores. System calculates points automatically. Players see transparent point breakdowns per match.

### Story 4.1: Admin Odds Entry

As an admin,
I want to enter odds for each of the 6 bet types on a match,
So that players can see potential point values and the scoring engine can calculate results.

**Acceptance Criteria:**

**Given** an admin is authenticated
**When** `PUT /api/v1/admin/matches/:id` is called with odds values for all 6 bet types
**Then** the match record is updated with `odds_home`, `odds_draw`, `odds_away`, `odds_home_draw`, `odds_draw_away`, `odds_home_away`

**Given** a non-admin user is authenticated
**When** `PUT /api/v1/admin/matches/:id` is called
**Then** 403 returned (AdminGuard, NFR9)

**Given** odds values are submitted
**When** validation runs
**Then** all 6 values must be numbers greater than 1.00
**And** validation errors return `{ error: { code: "VALIDATION_ERROR", message: "...", field: "oddsHome" } }`

**Given** admin navigates to OddsEntryView via More tab > Odds Entry
**When** the view loads
**Then** a pre-filtered list of matches without odds is displayed

**Given** admin selects a match
**When** the odds form is displayed
**Then** 6 numeric input fields are shown with labels: "1 - Home win", "X - Draw", "2 - Away win", "1X - Home or draw", "X2 - Draw or away", "12 - Home or away"
**And** numeric keyboard is triggered on mobile (PrimeVue InputNumber, mode="decimal", minFractionDigits=2)

**Given** all 6 odds are entered and submitted
**When** save succeeds
**Then** inline success indicator shown: green checkmark + "Saved"
**And** the next match needing odds is immediately selectable (batch-friendly)

**And** desktop layout uses side-by-side arrangement for efficient data entry
**And** mobile layout uses single-column stacked inputs

### Story 4.2: Scoring Engine and Score Entry

As an admin,
I want to enter the final score for a match and have points calculated automatically for all players,
So that the competition stays up to date after each match.

**Acceptance Criteria:**

**Given** a ScoringEngine service exists at `app/services/scoring_engine.rb`
**When** called with a match that has a final score and odds
**Then** it evaluates every bet on that match and calculates `points_earned`:
- Bet type "1" wins if home_score > away_score → points = odds_home
- Bet type "X" wins if home_score == away_score → points = odds_draw
- Bet type "2" wins if away_score > home_score → points = odds_away
- Bet type "1X" wins if home_score >= away_score → points = odds_home_draw (FR11)
- Bet type "X2" wins if away_score >= home_score → points = odds_draw_away (FR11)
- Bet type "12" wins if home_score != away_score → points = odds_home_away (FR11)
- Incorrect bet → points = 0 (FR9)
- No bet placed → points = 0 (FR10)

**Given** the ScoringEngine is called
**When** calculations complete
**Then** results are deterministic: same inputs always produce same outputs (NFR15)

**Given** an admin is authenticated
**When** `POST /api/v1/admin/matches/:id/score` is called with `{ homeScore, awayScore }`
**Then** the match score is saved AND `ScoringEngine.calculate_all(match)` runs within a single database transaction (NFR16)
**And** all bets for that match have their `points_earned` updated

**Given** a match already has points calculated
**When** admin tries to modify the score
**Then** the request is rejected: `{ error: { code: "SCORE_LOCKED", message: "Results already calculated", field: null } }` (FR30)

**Given** admin navigates to ScoreEntryView via More tab > Score Entry
**When** the view loads
**Then** a pre-filtered list of locked matches without scores is displayed

**Given** admin selects a match and enters home/away scores
**When** save succeeds
**Then** confirmation shown: "Saved. Points calculated for [N] players."
**And** the next match needing a score is immediately selectable

**And** score inputs are integer-only (PrimeVue InputNumber, no decimals), values >= 0

### Story 4.3: Points Display and Match Results

As a player,
I want to see detailed point calculations for each match,
So that I can understand exactly how scores were derived and verify the results are fair.

**Acceptance Criteria:**

**Given** a match has been scored
**When** the MatchCard renders
**Then** the card shows a green "Scored" tag and the final score prominently: "Home [score] : [score] Away"
**And** the result interpretation is shown (e.g., "1 - Home win")

**Given** a scored match displays the RevealList
**When** the player views the list
**Then** each row shows: player nickname + bet type badge + correct/incorrect indicator + points earned

**Given** a player's bet was correct
**When** their row renders in RevealList
**Then** a green checkmark is shown with green "+X.XX" points text (FR12)

**Given** a player's bet was incorrect
**When** their row renders
**Then** a gray "X" is shown with neutral "0" points text (not red)

**Given** a player did not place a bet
**When** their row renders
**Then** "— missed" is shown in gray with "0" points (FR10)

**Given** the current user's row is in the RevealList
**When** it renders
**Then** the row is highlighted with teal background for quick self-identification

**Given** a player views their own bet on a scored match
**When** the MatchCard displays
**Then** they can see: their bet type, the odds at time of bet, the match result, and points earned -- full transparency (FR12)

## Epic 5: Leaderboard, Rankings & Player History

Players can track competition standings with movement indicators, and view any player's complete betting record match by match.

### Story 5.1: Leaderboard API and Standings View

As a player,
I want to see a leaderboard ranking all players by total points with position movement indicators,
So that I can track the competition and see who's climbing or falling.

**Acceptance Criteria:**

**Given** matches have been scored and points calculated
**When** `GET /api/v1/leaderboard` is called by an authenticated user
**Then** all players are returned ranked by total `SUM(points_earned)` descending
**And** each entry includes: `position`, `nickname`, `totalPoints`, `previousPosition` (for movement calculation)
**And** response format: `{ data: [...], meta: { count: N } }`

**Given** two or more players have the same total points
**When** the leaderboard is calculated
**Then** they share the same position number using standard competition ranking (1, 2, 2, 4 -- positions skipped after ties)
**And** tied players are ordered alphabetically by nickname as secondary sort

**Given** no matches have been scored yet
**When** `GET /api/v1/leaderboard` is called
**Then** all registered (activated) players are returned with 0.00 points and no movement indicators

**Given** the player opens the app (PWA or browser)
**When** they land on the Standings tab (home screen)
**Then** the LeaderboardView displays all players as LeaderboardRow components

**Given** the leaderboard is displayed
**When** the player scans the list
**Then** each row shows: position number (bold, right-aligned) + movement indicator + player name + total points (bold, tabular figures, right-aligned)

**Given** a player has moved up since the last scoring event
**When** their row renders
**Then** a green "▲N" indicator is shown (N = positions gained)

**Given** a player has moved down
**When** their row renders
**Then** a red "▼N" indicator is shown

**Given** a player's position is unchanged
**When** their row renders
**Then** a gray "—" indicator is shown

**Given** the current user is in the leaderboard
**When** their row renders
**Then** it is highlighted with a light teal background for quick self-identification

**Given** the leaderboard has up to 50 players
**When** the view renders
**Then** all players render correctly with smooth scrolling (NFR5)

**And** API responses for leaderboard and all other endpoints return within 200ms under normal load of up to 50 concurrent users (NFR2)
**And** leaderboard uses full-width row styling (no card boundaries, clean horizontal dividers) per UX design direction
**And** LeaderboardRow uses ARIA list with listitem roles
**And** each row is tappable -- navigates to that player's history view
**And** keyboard: focusable rows, Enter to navigate

### Story 5.2: Player History View

As a player,
I want to view my own or any other player's complete betting record match by match,
So that I can analyze betting strategies and review past performance.

**Acceptance Criteria:**

**Given** an authenticated user
**When** `GET /api/v1/users/:id/history` is called
**Then** the player's complete betting record is returned: every match with their bet type, the match result, odds, and points earned
**And** matches are sorted by kickoff time (most recent first)

**Given** a player taps a row in the leaderboard
**When** the navigation occurs
**Then** the HistoryView loads for the selected player

**Given** the player taps the History tab in bottom navigation
**When** the view loads
**Then** it displays the current user's own history by default (FR16)

**Given** the HistoryView is displayed for any player
**When** the player scans the list
**Then** each match entry shows: teams, kickoff date, match result (if scored), the player's bet type, whether correct/incorrect, and points earned

**Given** a match the player bet on was scored correctly
**When** the entry renders
**Then** it shows green checkmark + bet type + "+X.XX" points

**Given** a match the player bet on was scored incorrectly
**When** the entry renders
**Then** it shows gray indicator + bet type + "0" points

**Given** a match the player did not bet on
**When** the entry renders
**Then** it shows "— missed" in gray with "0" points

**Given** a match has not been scored yet (locked or open)
**When** the entry renders
**Then** it shows the player's bet type (if placed) with "pending" status, or "no bet" if open and unbetted

**Given** the player views another player's history (FR15, FR17)
**When** the view loads
**Then** the player's nickname is shown as the page title with a back arrow to return to the previous view
**And** the same detail level is shown as for the current user's own history

**Given** no matches have been played yet
**When** the history view loads
**Then** an empty state message is shown: "No match results yet. Check back after the first matchday."

## Epic 6: PWA, Internationalization & Production Deployment

Users get a full mobile experience with home screen install, bilingual support (PL/EN), and the app is production-ready via Docker Compose.

### Story 6.1: Internationalization (Polish and English)

As a user,
I want to switch the app between Polish and English,
So that I can use the app in my preferred language.

**Acceptance Criteria:**

**Given** vue-i18n is configured with translation files at `src/locales/en.json` and `src/locales/pl.json`
**When** the app loads
**Then** the language is detected from browser settings, with English as fallback

**Given** translation files exist for both languages
**When** any user-facing text is rendered
**Then** it uses `$t()` i18n function -- no hardcoded strings in components (FR32)

**Given** the user navigates to the More tab
**When** the language selector is displayed
**Then** they can switch between Polish and English (FR31)

**Given** the user switches language
**When** the selection is made
**Then** all UI text updates reactively without page reload
**And** the selected language is persisted in localStorage across sessions
**And** the `<html lang="">` attribute updates to match ("pl" or "en")

**Given** Polish text is typically 20-30% longer than English
**When** views render in Polish
**Then** all layouts accommodate longer labels without overflow or breaking

**Given** translation scope
**When** reviewing coverage
**Then** all UI labels, buttons, navigation items, status tags, feedback messages, empty state messages, form labels, validation messages, and admin panel labels are translated
**And** team names, player nicknames, and numeric values (odds, points, scores) are NOT translated

**And** translation key structure follows: `{view}.{component}.{element}` (e.g., `matches.betSelector.homeWin`)

### Story 6.2: PWA Setup and Mobile Experience

As a user,
I want to install the app on my phone's home screen and have a fast, native-feeling experience,
So that I can access typerek quickly as part of my daily routine.

**Acceptance Criteria:**

**Given** vite-plugin-pwa is configured in `vite.config.ts`
**When** the app is built for production
**Then** a service worker is generated for static asset caching
**And** a `manifest.json` is generated with: app name "typerek", theme color teal (`#0D9488`), background color white, display "standalone", and icons (192x192, 512x512)

**Given** a user visits the app on mobile Chrome (Android) or Safari (iOS)
**When** they choose to add to home screen
**Then** the app installs as a PWA with the typerek icon and opens without browser chrome (FR33)

**Given** iOS-specific meta tags are configured
**When** the app loads on iOS Safari
**Then** `apple-mobile-web-app-capable`, viewport with `viewport-fit=cover`, and status bar style are set
**And** safe-area-inset CSS environment variables are handled for notched phones (especially bottom tab bar)

**Given** the PWA is installed
**When** cold start on 4G
**Then** the app is interactive within 3 seconds (NFR3)

**Given** the PWA is installed and has cached assets
**When** warm start
**Then** the app loads within 1 second (NFR4)

**Given** the user has no network connection
**When** the app opens
**Then** a graceful message is shown: "You're offline. Connect to place bets." -- not a blank screen

**Given** the app is running
**When** SPA page transitions occur
**Then** they complete within 500ms (NFR1)

**And** the viewport meta tag is set: `width=device-width, initial-scale=1, viewport-fit=cover`
**And** the app is responsive: mobile-first with desktop adaptation at >= 768px (FR34)
**And** Inter typeface is loaded for consistent typography

### Story 6.3: Production Docker Compose and Deployment

As an admin deploying typerek,
I want to run `docker compose up` and have a fully working production instance,
So that the app is accessible to all invited players.

**Acceptance Criteria:**

**Given** a `docker-compose.yml` exists at the project root
**When** `docker compose up -d` is run
**Then** three containers start: nginx, Rails, PostgreSQL (NFR20)

**Given** a `backend/Dockerfile` exists
**When** the Rails container builds
**Then** it runs the Rails API server with production configuration

**Given** a `frontend/Dockerfile` exists
**When** the frontend container builds
**Then** the Vue SPA is built for production and static files are available

**Given** an `nginx/nginx.conf` exists
**When** nginx starts
**Then** it serves the Vue static build at `/` and proxies `/api` to the Rails container
**And** SSL termination is supported but certificate management is left to the deployer (self-signed, reverse proxy, or ACME client -- not baked into the Docker setup)

**Given** PostgreSQL is running with Docker named volumes
**When** containers are restarted, crash, or are redeployed
**Then** all data persists (NFR14)

**Given** a `.env.example` file documents all configuration
**When** the deployer copies it to `.env` and fills in values
**Then** all configuration is managed through environment variables (NFR19) including: database credentials, Rails secret key, domain name for SSL

**Given** the production instance is running
**When** a user accesses the app
**Then** session cookies are set with HttpOnly and Secure flags (NFR10)

**And** no external service dependencies -- fully self-contained (NFR21)
**And** deployment from clone to running app is achievable in under 5 minutes with documentation

### Story 6.4: Onboarding and Rules Page

As a new user,
I want to understand how the prediction game works after activating my account,
So that I can start betting confidently without needing to ask friends for help.

As any user,
I want to access a "How it works" page at any time,
So that I can refresh my understanding of scoring rules and bet types.

**Acceptance Criteria:**

**Given** a user has just activated their account (first login)
**When** they are redirected after activation
**Then** a single "How it works" screen is displayed before reaching the leaderboard

**Given** the onboarding screen is displayed
**When** the user reads or decides to skip
**Then** they can tap "Got it" or "Skip" to proceed to the leaderboard
**And** the onboarding screen is only shown once (tracked in localStorage)

**Given** the onboarding content
**When** it renders
**Then** it briefly explains: the 6 bet types with descriptive labels (1 - Home win, X - Draw, etc.), odds-as-points scoring ("your points = the odds of your correct bet"), the kickoff lock ("bets lock at kickoff, everyone's picks revealed"), and missed bets ("no bet = 0 points")

**Given** any user navigates to the More tab
**When** they look for game rules
**Then** a "How it works" / "Rules" link is always visible and accessible

**Given** the user taps the Rules link
**When** the rules page loads
**Then** it displays the full game rules: bet type definitions, scoring mechanics, kickoff lock explanation, and compound bet resolution (1X, X2, 12)

**And** all content on both onboarding and rules pages is translated via i18n (PL/EN)
