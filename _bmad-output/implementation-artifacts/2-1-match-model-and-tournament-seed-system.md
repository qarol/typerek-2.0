# Story 2.1: Match Model and Tournament Seed System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to load a complete tournament schedule from a seed file,
So that all matches are available in the app before the tournament starts.

## Acceptance Criteria

1. Match model migration creates a `matches` table with: `id`, `home_team` (string, not null), `away_team` (string, not null), `kickoff_time` (timestamp with time zone, not null), `group_label` (string), `home_score` (integer), `away_score` (integer), `odds_home` (decimal 4,2), `odds_draw` (decimal 4,2), `odds_away` (decimal 4,2), `odds_home_draw` (decimal 4,2), `odds_draw_away` (decimal 4,2), `odds_home_away` (decimal 4,2), `created_at`, `updated_at`
2. A YAML seed file exists at `db/seeds/data/world_cup_2026.yml` with tournament match data including team names, kickoff times (UTC), and group labels
3. Running `rails db:seed` loads all matches from the YAML file into the database with correct team names, kickoff times, and group labels
4. `GET /api/v1/matches` called by an authenticated user returns all matches serialized with camelCase fields (`homeTeam`, `awayTeam`, `kickoffTime`, `groupLabel`, `homeScore`, `awayScore`, odds fields) in `{ data: [...], meta: { count: N } }` format with dates in ISO 8601 UTC format
5. There is no option to add or delete matches through the application UI (FR27)
6. Referential integrity is maintained -- no orphaned bets, scores, or user records (NFR17)
7. Seed loading is idempotent -- running `rails db:seed` multiple times does not create duplicate matches

## Tasks / Subtasks

- [x] Task 1: Create Match model migration (AC: #1, #6)
  - [x] Generate migration creating `matches` table with all specified columns
  - [x] Add `home_team` (string, not null), `away_team` (string, not null), `kickoff_time` (datetime, not null with time zone)
  - [x] Add `group_label` (string, nullable)
  - [x] Add `home_score` (integer, nullable), `away_score` (integer, nullable)
  - [x] Add 6 odds columns: `odds_home`, `odds_draw`, `odds_away`, `odds_home_draw`, `odds_draw_away`, `odds_home_away` (all decimal 4,2, nullable)
  - [x] Add timestamps (`created_at`, `updated_at`)
  - [x] Run migration and verify schema

- [x] Task 2: Create Match model with validations (AC: #1, #6)
  - [x] Create `backend/app/models/match.rb` inheriting from `ApplicationRecord`
  - [x] Add presence validations: `home_team`, `away_team`, `kickoff_time`
  - [x] Add numericality validation for score fields (integer, >= 0, allow nil)
  - [x] Add numericality validation for odds fields (> 1.00, allow nil) -- validates decimal(4,2) constraints
  - [x] Add `has_many :bets, dependent: :restrict_with_error` association (for future Bet model referential integrity)

- [x] Task 3: Create YAML seed data file and seed loader (AC: #2, #3, #7)
  - [x] Create `backend/db/seeds/data/world_cup_2026.yml` with sample World Cup 2026 tournament data (group stage matches with realistic team pairings, kickoff times in UTC, group labels like "Group A", "Group B", etc.)
  - [x] Update `backend/db/seeds.rb` to load match data from YAML file using `find_or_create_by!` for idempotent seeding
  - [x] Seed loader parses YAML, iterates matches, creates Match records with team names, kickoff times, and group labels
  - [x] Ensure seed loading preserves existing admin user seed (keep `User.find_or_create_by!` for admin)
  - [x] Verify `rails db:seed` creates all matches successfully
  - [x] Verify running `rails db:seed` twice does not create duplicates

- [x] Task 4: Create MatchSerializer (AC: #4)
  - [x] Create `backend/app/serializers/match_serializer.rb` following existing UserSerializer pattern
  - [x] Implement `self.serialize(match)` returning hash with all match fields
  - [x] Apply `.transform_keys { |key| key.to_s.camelize(:lower) }` for camelCase output
  - [x] Serialize fields: `id`, `homeTeam`, `awayTeam`, `kickoffTime` (ISO 8601 UTC), `groupLabel`, `homeScore`, `awayScore`, `oddsHome`, `oddsDraw`, `oddsAway`, `oddsHomeDraw`, `oddsDrawAway`, `oddsHomeAway`
  - [x] Ensure `kickoff_time` serialized as ISO 8601 UTC string

- [x] Task 5: Create MatchesController with index action (AC: #4, #5)
  - [x] Create `backend/app/controllers/api/v1/matches_controller.rb` namespaced as `Api::V1::MatchesController`
  - [x] Include `Authentication` concern (all match endpoints require auth)
  - [x] Implement `index` action: fetch all matches ordered by `kickoff_time ASC`, serialize each, return `{ data: [...], meta: { count: N } }`
  - [x] No `create`, `update`, or `destroy` actions (FR27 -- no match CRUD through UI)

- [x] Task 6: Add matches routes (AC: #4)
  - [x] Add `resources :matches, only: [:index]` to `config/routes.rb` inside `namespace :api do namespace :v1 do`
  - [x] Verify route: `GET /api/v1/matches` maps to `Api::V1::MatchesController#index`

- [x] Task 7: Write Match model tests (AC: #1, #6)
  - [x] Test presence validations: `home_team`, `away_team`, `kickoff_time` are required
  - [x] Test optional fields: `group_label`, `home_score`, `away_score`, all odds columns accept nil
  - [x] Test numericality: scores must be >= 0 integers when present
  - [x] Test numericality: odds must be > 1.00 when present
  - [x] Test valid match creation with all fields
  - [x] Test valid match creation with only required fields

- [x] Task 8: Create match test fixtures (AC: #7)
  - [x] Create `backend/test/fixtures/matches.yml` with test match data
  - [x] Include fixtures: `upcoming` (future kickoff, no score, no odds), `with_odds` (future kickoff, odds set, no score), `locked` (past kickoff, no score), `scored` (past kickoff, score + odds set)
  - [x] Use realistic team names and UTC timestamps

- [x] Task 9: Write MatchesController tests (AC: #4, #5)
  - [x] Test `GET /api/v1/matches`: authenticated user gets list of all matches with correct camelCase fields
  - [x] Test `GET /api/v1/matches`: response format is `{ data: [...], meta: { count: N } }`
  - [x] Test `GET /api/v1/matches`: matches ordered by kickoff_time ASC
  - [x] Test `GET /api/v1/matches`: unauthenticated user gets 401
  - [x] Test `GET /api/v1/matches`: serialized fields include all expected camelCase keys
  - [x] Test `GET /api/v1/matches`: kickoff_time is in ISO 8601 UTC format
  - [x] Test `GET /api/v1/matches`: null odds/scores serialize as null (not omitted)
  - [x] Test no POST/PUT/DELETE routes exist for matches (FR27)

- [x] Task 10: Add Match TypeScript types to frontend (AC: #4)
  - [x] Add `Match` interface to `frontend/src/api/types.ts` with fields: `id`, `homeTeam`, `awayTeam`, `kickoffTime`, `groupLabel`, `homeScore`, `awayScore`, `oddsHome`, `oddsDraw`, `oddsAway`, `oddsHomeDraw`, `oddsDrawAway`, `oddsHomeAway`
  - [x] Use `number | null` for nullable numeric fields (scores, odds)
  - [x] Use `string | null` for nullable string fields (`groupLabel`)

- [x] Task 11: Create useMatchesStore (AC: #4)
  - [x] Create `frontend/src/stores/matches.ts` as a Pinia store following existing store patterns
  - [x] State: `matches: Match[]`, `loading: boolean`, `error: string | null`
  - [x] Action: `fetchMatches()` calls `GET /api/v1/matches`, stores result in `matches`
  - [x] Follow existing store pattern: loading/error state, `ApiClientError` handling
  - [x] Return `matches`, `loading`, `error`, `fetchMatches`

- [x] Task 12: Write frontend store test (AC: #4)
  - [x] Test `useMatchesStore.fetchMatches()`: successful fetch populates matches list
  - [x] Test `useMatchesStore.fetchMatches()`: sets loading state during fetch
  - [x] Test `useMatchesStore.fetchMatches()`: API error sets error code in store

## Dev Notes

### Architecture Patterns & Constraints

- **Match model** is the foundation for the entire betting system. Later stories (Epic 3: Bets, Epic 4: Scoring) depend on this model. The 6 odds columns are stored directly on Match as `decimal(4,2)` per architecture decision -- no separate Odds table.
- **No Match CRUD through UI** (FR27). The only way to add matches is via `rails db:seed`. The controller exposes only `index` (read-only). This is a deliberate design choice -- tournament data is loaded once before the tournament starts.
- **Serializer pattern:** Follow the existing `UserSerializer` pattern -- plain Ruby class with `self.serialize(match)` class method returning a hash. Apply `.transform_keys` for camelCase. Do NOT use ActiveModelSerializers or jbuilder.
- **Controller pattern:** Follow existing `Api::V1::SessionsController` pattern. Namespace under `Api::V1`. Include `Authentication` concern (via `ApplicationController`). Return structured JSON with `{ data: ... }` wrapper.
- **Seed idempotency:** Use `find_or_create_by!` keyed on `home_team`, `away_team`, and `kickoff_time` to prevent duplicates on re-run. Preserve existing admin user seed.
- **Response format for collections:** `{ data: [...], meta: { count: N } }` -- same pattern used by `Admin::UsersController#index`.
- **ISO 8601 UTC dates:** Rails serializes `datetime` fields as ISO 8601 by default. Ensure `kickoff_time` is stored with time zone (`timestamp with time zone` in PostgreSQL) and serialized as UTC.
- **Future associations:** The Match model will later have `has_many :bets` (Story 3.1). Add `dependent: :restrict_with_error` to prevent deletion of matches that have bets (NFR17 referential integrity). Since bets don't exist yet, this association declaration will be a forward reference -- it won't break anything, but ensures the constraint is in place when Bet model arrives.

### Critical Developer Guardrails

- **DO NOT** create `create`, `update`, or `destroy` controller actions for matches. Only `index` is needed. Admin odds/score updates are separate stories (Epic 4).
- **DO NOT** add a `show` action -- individual match endpoints are not needed for Story 2.1.
- **DO NOT** use `dependent: :destroy` on any association. Use `dependent: :restrict_with_error` to enforce referential integrity (NFR17).
- **DO NOT** create a custom JSON renderer or middleware. Use simple `render json:` with hash.
- **DO NOT** add the `has_many :bets` line to the Match model yet if it would cause errors (Bet model doesn't exist). Instead, add a comment `# has_many :bets, dependent: :restrict_with_error  # Added in Story 3.1` as a placeholder.
- **DO** use `decimal(4,2)` for odds columns -- matches the architecture spec exactly. Values like `2.10`, `3.45` are expected.
- **DO** use `timestamp with time zone` (PostgreSQL's `timestamptz`) for `kickoff_time` -- Rails `datetime` type maps to this by default in PostgreSQL.
- **DO** order matches by `kickoff_time ASC` in the controller index action.
- **DO** include `meta: { count: N }` in the collection response.
- **DO** make seed data realistic -- use actual World Cup 2026 host country teams (USA, Mexico, Canada) and typical group stage pairings.
- **DO** use `$t()` for any i18n strings in frontend (though this story has minimal frontend UI).
- **DO** keep the `User.find_or_create_by!` admin seed intact when updating `seeds.rb`.

### Previous Story Intelligence (Story 1.4)

**Learnings from Story 1.4:**
- **camelCase serialization:** `serialize_for_admin` uses `.transform_keys { |key| key.to_s.camelize(:lower) }`. Apply the same pattern to MatchSerializer. The regular `serialize` method in UserSerializer does NOT transform keys (returns symbol keys). For consistency with admin endpoints, the MatchSerializer should transform keys to camelCase strings.
- **Controller test pattern:** Login first via `post api_v1_sessions_url, params: { nickname: "admin", password: "password" }, as: :json`, then call the target endpoint. Use `JSON.parse(response.body)` to assert response structure.
- **Fixture pattern:** Users fixtures use `<%= BCrypt::Password.create('password') %>` for password_digest. Match fixtures need realistic data: team names, UTC timestamps, decimal odds values.
- **Frontend store pattern:** Composition API style with `ref()`, `async function`, try/catch with `ApiClientError`, loading/error state management. Follow `useAdminStore` as closest reference.
- **Test file location:** Controller tests go in `backend/test/controllers/api/v1/`, model tests in `backend/test/models/`. Frontend tests co-located in `__tests__/` directory next to store file.
- **ConfirmDialog and ToastService:** Already configured in `main.ts` from Story 1.4 -- no additional setup needed.
- **Router types:** `router/types.d.ts` extends `RouteMeta` -- available for future route meta if needed.
- **Session test helper:** Tests authenticate by posting to sessions endpoint. There's no shared test helper for login -- each test file handles auth inline.

### Git Intelligence

**Recent commits (most recent first):**
```
c0050ef Fix Sign Out bug and improve /more page desktop layout
d4a2313 Fixed Polish special characters in translations
c7f013c Implemented admin user management panel and code review fixes
07b21a5 Update BMAD Method
d566cac Implemented invite token generation, account activation, and code review fixes
2f95355 Implemented user authentication with session-based login and code review security fixes
0196054 Scaffolded monorepo with Rails API backend, Vue SPA frontend, and Docker PostgreSQL
```

**Key observations:**
- Backend uses **Minitest** (not RSpec) -- `test/` directory structure with fixtures
- Tests use `ActionDispatch::IntegrationTest` for controller integration tests
- `ActiveSupport::TestCase` for model tests
- All tests run via `mise exec -- bin/rails test`
- Frontend tests run via `mise exec -- npm run test:unit`
- Serializers are **plain Ruby classes** with class methods, not ActiveModelSerializers
- `ApplicationController` includes `ActionController::Cookies` and `Authentication` concern
- `authentication.rb` concern provides `current_user`, `authenticate_user!`, `logged_in?` helpers
- Password for all test fixtures is `"password"` (standardized in Story 1.4)

### Library/Framework Requirements

| Library | Version | Usage in Story 2.1 |
|---------|---------|-------------------|
| Rails | 8.1.2 | Match model, migration, controller, seed loader |
| PostgreSQL | 16 | matches table with decimal(4,2) and timestamptz columns |
| Vue | 3.5.27 | (minimal -- types and store only) |
| Pinia | 3.0.4 | useMatchesStore |
| TypeScript | 5.9.3 | Match interface types |

### File Structure After Story 2.1

```
backend/
├── app/
│   ├── models/
│   │   ├── application_record.rb       (EXISTING - no change)
│   │   ├── user.rb                     (EXISTING - no change)
│   │   └── match.rb                    (NEW)
│   ├── controllers/
│   │   ├── application_controller.rb   (EXISTING - no change)
│   │   ├── concerns/
│   │   │   ├── authentication.rb       (EXISTING - no change)
│   │   │   └── admin_guard.rb          (EXISTING - no change)
│   │   └── api/
│   │       └── v1/
│   │           ├── matches_controller.rb   (NEW)
│   │           ├── sessions_controller.rb  (EXISTING - no change)
│   │           ├── me_controller.rb        (EXISTING - no change)
│   │           ├── users_controller.rb     (EXISTING - no change)
│   │           └── admin/
│   │               ├── invitations_controller.rb  (EXISTING - no change)
│   │               └── users_controller.rb        (EXISTING - no change)
│   ├── serializers/
│   │   ├── user_serializer.rb          (EXISTING - no change)
│   │   └── match_serializer.rb         (NEW)
│   └── services/                       (EXISTING - empty, no change)
├── config/
│   └── routes.rb                       (MODIFIED: add matches route)
├── db/
│   ├── migrate/
│   │   ├── 20260205214732_create_users.rb               (EXISTING)
│   │   ├── 20260205215759_add_lower_nickname_index.rb    (EXISTING)
│   │   ├── 20260205221433_allow_null_password_digest.rb  (EXISTING)
│   │   └── XXXXXXXX_create_matches.rb                    (NEW)
│   ├── schema.rb                       (AUTO-UPDATED by migration)
│   ├── seeds.rb                        (MODIFIED: add match seed loading)
│   └── seeds/
│       └── data/
│           └── world_cup_2026.yml      (NEW)
└── test/
    ├── fixtures/
    │   ├── users.yml                   (EXISTING - no change)
    │   └── matches.yml                 (NEW)
    ├── models/
    │   ├── user_test.rb                (EXISTING - no change)
    │   └── match_test.rb              (NEW)
    └── controllers/
        └── api/
            └── v1/
                ├── matches_controller_test.rb  (NEW)
                └── ...                         (EXISTING - no change)

frontend/
├── src/
│   ├── api/
│   │   ├── client.ts                   (EXISTING - no change)
│   │   └── types.ts                    (MODIFIED: add Match interface)
│   ├── stores/
│   │   ├── auth.ts                     (EXISTING - no change)
│   │   ├── admin.ts                    (EXISTING - no change)
│   │   ├── matches.ts                  (NEW)
│   │   └── __tests__/
│   │       ├── admin.test.ts           (EXISTING - no change)
│   │       └── matches.test.ts         (NEW)
│   └── ...                             (no other frontend changes)
```

### Testing Requirements

**Backend (Minitest):**

Model tests (`test/models/match_test.rb`):
- Match valid with all required fields (home_team, away_team, kickoff_time)
- Match valid with only required fields (optional fields nil)
- Match invalid without home_team
- Match invalid without away_team
- Match invalid without kickoff_time
- Scores must be >= 0 integer when present
- Odds must be > 1.00 when present
- Match creation with all fields including odds and scores

Controller tests (`test/controllers/api/v1/matches_controller_test.rb`):
- `GET /api/v1/matches`: admin gets all matches
- `GET /api/v1/matches`: player gets all matches
- `GET /api/v1/matches`: unauthenticated gets 401
- `GET /api/v1/matches`: response uses `{ data: [...], meta: { count: N } }` format
- `GET /api/v1/matches`: matches ordered by kickoff_time ASC
- `GET /api/v1/matches`: response fields are camelCase
- `GET /api/v1/matches`: kickoff_time in ISO 8601 format
- `GET /api/v1/matches`: null fields serialize as null
- No POST/PUT/DELETE routes for matches (assert routing error or 404)

**Frontend (Vitest):**
- `useMatchesStore.fetchMatches()`: successful fetch populates matches list
- `useMatchesStore.fetchMatches()`: loading state toggled during fetch
- `useMatchesStore.fetchMatches()`: error handling sets error code

### UX Requirements

- **Minimal frontend impact** in this story. Story 2.1 is primarily backend (model, seed, API).
- Frontend changes limited to: adding `Match` TypeScript interface and creating `useMatchesStore`.
- No view changes -- the MatchesView with MatchCard rendering is Story 2.2.
- The store prepares data fetching infrastructure so Story 2.2 can focus on UI.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] -- Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] -- Odds as 6 columns on Match, decimal(4,2)
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- `/api/v1/` namespace, response format, error format, camelCase
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] -- YAML seed data pattern, `db/seeds/data/world_cup_2026.yml`
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] -- Match controller location, serializer location, test locations
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] -- Database snake_case, API camelCase, tables plural
- [Source: _bmad-output/planning-artifacts/prd.md#Tournament & Match Administration] -- FR26, FR27
- [Source: _bmad-output/planning-artifacts/prd.md#Data Integrity & Reliability] -- NFR17 referential integrity
- [Source: _bmad-output/implementation-artifacts/1-4-admin-user-management-panel.md] -- Previous story patterns, serializer camelCase, test conventions

### Project Context Reference

- **Run Rails commands:** `mise exec -- bin/rails ...` from `/backend`
- **Run npm commands:** `mise exec -- npm ...` from `/frontend`
- **Start PostgreSQL:** `docker compose -f docker-compose.dev.yml up -d` from project root
- **Start Rails:** `mise exec -- bin/rails server` from `/backend` (port 3000)
- **Start Vue:** `mise exec -- npm run dev` from `/frontend` (port 5173)
- **Run migrations:** `mise exec -- bin/rails db:migrate` from `/backend`
- **Run seeds:** `mise exec -- bin/rails db:seed` from `/backend`
- **Run backend tests:** `mise exec -- bin/rails test` from `/backend`
- **Run frontend tests:** `mise exec -- npm run test:unit` from `/frontend`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Sessions controller tests have 5 pre-existing failures (tests use `password: "secret123"` but fixture has `password: "password"`) — not caused by this story

### Completion Notes List

- Task 1: Created `matches` table migration with all 14 columns (home_team, away_team, kickoff_time NOT NULL; group_label nullable; home_score/away_score integer nullable; 6 odds columns decimal(4,2) nullable; timestamps). Migration ran successfully.
- Task 2: Created Match model with presence validations (home_team, away_team, kickoff_time), numericality validations (scores >= 0 integer, odds > 1.00), and commented placeholder for future `has_many :bets` association per Dev Notes guardrails.
- Task 3: Created YAML seed file with 36 realistic World Cup 2026 group stage matches across 6 groups (A-F) featuring host countries (USA, Mexico, Canada) and top international teams. Seed loader uses `find_or_create_by!` keyed on home_team+away_team+kickoff_time for idempotency. Verified seeding twice produces 36 matches both times.
- Task 4: Created MatchSerializer with `self.serialize(match)` returning all 13 fields with `.transform_keys` for camelCase output. kickoff_time explicitly serialized as UTC ISO 8601.
- Task 5: Created MatchesController with `index` action only — fetches all matches ordered by kickoff_time ASC, returns `{ data: [...], meta: { count: N } }` format. No create/update/destroy actions (FR27).
- Task 6: Added `resources :matches, only: [:index]` route. Verified: `GET /api/v1/matches` -> `Api::V1::MatchesController#index`.
- Task 7: Wrote 10 Match model tests covering presence validations, optional nil fields, score integer/>=0 constraints, odds >1.00 constraints, and valid creation with all/required-only fields. All pass.
- Task 8: Created 4 match test fixtures: upcoming (future, no odds/scores), with_odds (future, all odds set), locked (past, no scores), scored (past, scores + odds).
- Task 9: Wrote 9 MatchesController integration tests covering admin auth, player auth, 401 unauthenticated, response format, kickoff_time ordering, camelCase keys, ISO 8601 dates, null serialization, and route restriction (no POST/PUT/DELETE). All pass.
- Task 10: Added Match TypeScript interface to `types.ts` with all 13 camelCase fields using `number | null` for nullable numerics and `string | null` for groupLabel.
- Task 11: Created `useMatchesStore` Pinia store following existing admin store pattern — matches ref, loading/error state, fetchMatches action with ApiClientError handling.
- Task 12: Wrote 3 frontend store tests: successful fetch populates list, loading state toggles during fetch, API error sets error code. All pass (25/25 frontend tests).

### Change Log

- 2026-02-10: Implemented Story 2.1 — Match model, migration, YAML seed data (36 matches), MatchSerializer, MatchesController (read-only index), routes, Match TypeScript types, useMatchesStore, and comprehensive tests (10 model + 9 controller + 3 frontend = 22 new tests)
- 2026-02-10: Adversarial Code Review — Fixed 5 issues: (H1) Changed `matches.count` to `matches.size` to avoid extra SQL query; (H2) Added odds upper bound validation (`less_than: 100`) for all 6 odds columns; (H3) Expanded seed data from 6 to 12 groups (72 total matches) for complete World Cup 2026 coverage; (M1) Removed non-null assertion in frontend store with null check; (M2) Expanded seed loader to handle all match attributes. Added 3 new test cases for odds validation bounds. All 31 tests passing.

### File List

**New files:**
- backend/app/models/match.rb
- backend/app/serializers/match_serializer.rb
- backend/app/controllers/api/v1/matches_controller.rb
- backend/db/migrate/20260210172835_create_matches.rb
- backend/db/migrate/20260210210805_add_index_to_matches_kickoff_time.rb
- backend/db/seeds/data/world_cup_2026.yml
- backend/test/models/match_test.rb
- backend/test/fixtures/matches.yml
- backend/test/controllers/api/v1/matches_controller_test.rb
- frontend/src/stores/matches.ts
- frontend/src/stores/__tests__/matches.test.ts

**Modified files:**
- backend/config/routes.rb (added matches route)
- backend/db/seeds.rb (enhanced to load all match attributes)
- backend/db/schema.rb (auto-updated by migrations)
- frontend/src/api/types.ts (added Match interface)
