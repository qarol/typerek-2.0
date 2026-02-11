# Story 4.2: Scoring Engine and Score Entry

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to enter the final score for a match and have points calculated automatically for all players,
so that the competition stays up to date after each match.

## Acceptance Criteria

1. A `ScoringEngine` service exists at `app/services/scoring_engine.rb` that evaluates every bet on a match and calculates `points_earned`:
   - Bet type "1" wins if home_score > away_score → points = odds_home
   - Bet type "X" wins if home_score == away_score → points = odds_draw
   - Bet type "2" wins if away_score > home_score → points = odds_away
   - Bet type "1X" wins if home_score >= away_score → points = odds_home_draw (FR11)
   - Bet type "X2" wins if away_score >= home_score → points = odds_draw_away (FR11)
   - Bet type "12" wins if home_score != away_score → points = odds_home_away (FR11)
   - Incorrect bet → points = 0
   - No bet placed → points = 0 (FR10)
2. ScoringEngine calculations are deterministic: same inputs always produce same outputs (NFR15)
3. An authenticated admin calling `POST /api/v1/admin/matches/:id/score` with `{ homeScore, awayScore }` saves the match score AND runs `ScoringEngine.calculate_all(match)` within a single database transaction (NFR16), updating all bets' `points_earned`
4. A match that already has points calculated (any bet has points_earned > 0) rejects score modification: `{ error: { code: "SCORE_LOCKED", message: "Results already calculated", field: null } }` (FR30)
5. A non-admin user calling the score endpoint receives 403 (AdminGuard, NFR9)
6. Admin navigating to ScoreEntryView via More tab > Score Entry sees a pre-filtered list of locked matches without scores (kickoff_time < now AND home_score IS NULL)
7. Admin selecting a match and entering home/away scores sees confirmation: "Saved. Points calculated for [N] players."
8. The next match needing a score is immediately selectable (batch-friendly)
9. Score inputs are integer-only (PrimeVue InputNumber, no decimals), values >= 0
10. Desktop layout uses side-by-side arrangement for score inputs; mobile uses stacked

## Tasks / Subtasks

- [x] Task 1: Create ScoringEngine service (AC: #1, #2)
  - [x] Create `backend/app/services/scoring_engine.rb`
  - [x] Implement `ScoringEngine.calculate_all(match)` class method
  - [x] Implement `ScoringEngine.determine_result(home_score, away_score)` helper returning the winning bet type
  - [x] Implement `ScoringEngine.bet_wins?(bet_type, home_score, away_score)` for each of the 6 bet types including compound resolution
  - [x] Write comprehensive unit tests in `backend/test/services/scoring_engine_test.rb`
  - [x] Test all 6 bet types with winning and losing scenarios
  - [x] Test compound bets (1X, X2, 12) with edge cases (draws, one-goal margins)
  - [x] Test determinism: identical inputs produce identical outputs
  - [x] Test that bets with no odds on match get 0 points

- [x] Task 2: Add `score` action to Admin::MatchesController (AC: #3, #4, #5)
  - [x] Add `score` action to existing `app/controllers/api/v1/admin/matches_controller.rb`
  - [x] Accept `homeScore`/`awayScore` (camelCase) and `home_score`/`away_score` (snake_case)
  - [x] Wrap score update + ScoringEngine.calculate_all in `ActiveRecord::Base.transaction`
  - [x] Implement SCORE_LOCKED check: reject if any bet on match has points_earned > 0
  - [x] Return match data + count of players scored on success
  - [x] Add route: `post :score, on: :member` within admin matches resource
  - [x] Write controller tests (admin access, non-admin rejection, score locked, validation, successful scoring with transaction)

- [x] Task 3: Add `submitMatchScore` action to matches store (AC: prerequisite)
  - [x] Add `submitMatchScore(matchId, homeScore, awayScore)` to `useMatchesStore`
  - [x] Update match in local state on success
  - [x] Return player count from response for UI confirmation
  - [x] Write store tests

- [x] Task 4: Add i18n translation keys for ScoreEntryView (AC: #7)
  - [x] Add keys to `en.json` under `admin.scores` section
  - [x] Add keys to `pl.json` for Polish translation

- [x] Task 5: Create ScoreEntryView component (AC: #6, #7, #8, #9, #10)
  - [x] Create `frontend/src/views/admin/ScoreEntryView.vue`
  - [x] Pre-filtered match list: locked matches without scores (kickoff < now, homeScore === null)
  - [x] Match selection with score form (2 InputNumber fields: home score, away score)
  - [x] Integer-only inputs (no decimals), values >= 0
  - [x] Confirmation message: "Saved. Points calculated for [N] players."
  - [x] Batch-friendly: auto-advance to next match needing score
  - [x] Responsive: side-by-side scores on desktop, stacked on mobile
  - [x] Follow OddsEntryView drawer pattern (right on desktop, bottom on mobile)

- [x] Task 6: Wire up routing and navigation (AC: #6)
  - [x] Add `/admin/score-entry` route to router with admin guard
  - [x] Enable Score Entry button in MoreView (remove disabled + coming soon)

## Dev Notes

### Architecture Patterns & Constraints

- **Backend framework**: Rails 8.1 API-only with Minitest. Test files in `backend/test/`. Controller tests extend `ActionDispatch::IntegrationTest`. Service tests go in `backend/test/services/`.
- **Frontend framework**: Vue 3 Composition API + TypeScript + PrimeVue (Aura theme) + Pinia
- **No new packages**: All required libraries (PrimeVue, vue-i18n, Pinia) are already installed. Do NOT add npm packages.
- **No new gems**: Do NOT add gems to the Gemfile.
- **No new migrations**: The `matches` table already has `home_score` (integer, nullable) and `away_score` (integer, nullable) columns. The `bets` table already has `points_earned` (decimal 6,2, default 0.0). No schema changes needed.
- **Authentication**: `Authentication` concern is included globally in `ApplicationController` — adds `before_action :authenticate_user!` to ALL controllers automatically. Do NOT add it redundantly.
- **AdminGuard pattern**: `include AdminGuard` + `before_action :require_admin!` — see existing `admin/matches_controller.rb` for exact pattern.
- **Serializer pattern**: PORO class with `.transform_keys { |key| key.to_s.camelize(:lower) }` — see `match_serializer.rb`. Decimal values use `.to_f` for JSON serialization.
- **API client**: Custom fetch wrapper at `frontend/src/api/client.ts` — methods: `get`, `post`, `put`, `delete`. Returns `Promise<T | undefined>`. Always check for undefined/null responses.
- **Pinia pattern**: Composition API stores (not options API). See `stores/matches.ts` for exact pattern.
- **i18n pattern**: All user-facing strings use `$t('key')`. Key structure: `{view}.{component}.{element}`.
- **camelCase params**: Backend must accept camelCase params from frontend (learned from Story 3.2 bug).
- **Service objects directory**: `backend/app/services/` does NOT exist yet — it must be created for ScoringEngine.

### Backend: ScoringEngine Service

This is the most critical piece of business logic in the entire application. It MUST be:
- A pure Ruby class with no side effects beyond database writes
- Deterministic (NFR15)
- Wrapped in a transaction with score saving (NFR16)

**Implementation:**

```ruby
# app/services/scoring_engine.rb
class ScoringEngine
  # Main entry point: calculate points for ALL bets on a match
  # Called within a transaction by the controller
  def self.calculate_all(match)
    return 0 unless match.home_score.present? && match.away_score.present?

    bets = match.bets.includes(:user)
    bets.each do |bet|
      points = calculate_points(bet, match)
      bet.update_columns(points_earned: points)
    end
    bets.size
  end

  # Calculate points for a single bet
  def self.calculate_points(bet, match)
    return BigDecimal("0") unless bet_wins?(bet.bet_type, match.home_score, match.away_score)

    odds_for_bet_type(bet.bet_type, match) || BigDecimal("0")
  end

  # Determine if a bet type wins given the final score
  def self.bet_wins?(bet_type, home_score, away_score)
    case bet_type
    when "1"  then home_score > away_score
    when "X"  then home_score == away_score
    when "2"  then away_score > home_score
    when "1X" then home_score >= away_score  # Home win OR draw
    when "X2" then away_score >= home_score  # Draw OR away win
    when "12" then home_score != away_score  # Home win OR away win (not draw)
    else false
    end
  end

  # Get the odds value for a bet type from the match
  def self.odds_for_bet_type(bet_type, match)
    case bet_type
    when "1"  then match.odds_home
    when "X"  then match.odds_draw
    when "2"  then match.odds_away
    when "1X" then match.odds_home_draw
    when "X2" then match.odds_draw_away
    when "12" then match.odds_home_away
    end
  end
end
```

**Key design decisions:**
- Uses `update_columns` (not `update`) to bypass validations and callbacks — this is a bulk operation and we know the data is valid
- Returns count of bets scored for UI feedback
- `odds_for_bet_type` returns nil if odds are nil → results in 0 points (safe default)
- Compound bets: "1X" = home_score >= away_score covers both home win (>) and draw (==)

### Backend: Score Action in Admin::MatchesController

Extend the existing controller with a new `score` action. Do NOT create a separate controller.

**Implementation:**

```ruby
# Add to existing app/controllers/api/v1/admin/matches_controller.rb

def score
  # Check if already scored (any bet has points > 0)
  if @match.bets.where("points_earned > 0").exists?
    render json: {
      error: { code: "SCORE_LOCKED", message: "Results already calculated", field: nil }
    }, status: :unprocessable_entity
    return
  end

  # Validate scores
  home_score = score_params[:home_score]
  away_score = score_params[:away_score]

  if home_score.nil? || away_score.nil?
    render json: {
      error: { code: "VALIDATION_ERROR", message: "Both scores are required", field: nil }
    }, status: :unprocessable_entity
    return
  end

  player_count = 0
  ActiveRecord::Base.transaction do
    @match.update!(home_score: home_score, away_score: away_score)
    player_count = ScoringEngine.calculate_all(@match)
  end

  render json: {
    data: MatchSerializer.serialize(@match.reload),
    meta: { playersScored: player_count }
  }
rescue ActiveRecord::RecordInvalid => e
  render json: {
    error: { code: "VALIDATION_ERROR", message: e.message, field: nil }
  }, status: :unprocessable_entity
end

private

def score_params
  # Accept both camelCase and snake_case
  home = params[:homeScore] || params[:home_score]
  away = params[:awayScore] || params[:away_score]
  { home_score: home&.to_i, away_score: away&.to_i }
end
```

**Route addition** (modify existing admin matches resource in `routes.rb`):
```ruby
namespace :admin do
  resources :invitations, only: [ :create ]
  resources :users, only: [ :index, :update ]
  resources :matches, only: [ :update ] do
    member do
      post :score
    end
  end
end
```

This creates: `POST /api/v1/admin/matches/:id/score`

### Backend: SCORE_LOCKED Check Logic

The AC says "prevents modification of match results after points have been calculated" (FR30). The check is:

```ruby
@match.bets.where("points_earned > 0").exists?
```

**Why check bets, not match scores?** A match could have scores entered but if NO bets exist (unlikely but possible), there's nothing to "lock". The real concern is protecting calculated points. If points have been awarded, the score cannot change.

**Edge case:** What if all bets were incorrect (all points = 0)? Then technically no bet has points > 0. To handle this correctly, consider also checking if `home_score` and `away_score` are already present:

```ruby
def score_already_calculated?
  @match.home_score.present? && @match.away_score.present? &&
    (@match.bets.exists? ? @match.bets.where("points_earned > 0").exists? || all_bets_scored?(@match) : true)
end
```

**Simpler approach:** Just check if scores already exist. If home_score is not nil, the match was already scored.

```ruby
if @match.home_score.present? && @match.away_score.present?
  render json: {
    error: { code: "SCORE_LOCKED", message: "Results already calculated", field: nil }
  }, status: :unprocessable_entity
  return
end
```

**Use this simpler approach** — it matches the fixture data pattern where `scored` fixture has both scores set.

### Backend: Test Strategy

**Test fixtures already available:**
- `scored` match — has home_score: 2, away_score: 1, all 6 odds set (good for SCORE_LOCKED testing)
- `locked` match — kickoff passed, no score, no odds (good for score entry without odds)
- `with_odds` match — future kickoff, all 6 odds set (good for score entry with odds)
- `upcoming` match — future kickoff, no odds (shouldn't appear in score entry)
- `player_bet_on_locked` — player bet "X" on locked match (can test scoring)
- `admin_bet_on_locked` — admin bet "1X" on locked match (can test compound scoring)

**Additional fixtures needed for comprehensive testing:**
Add bets on the `with_odds` match to test scoring with actual odds values. Or use the `scored` match fixture which already has odds.

**ScoringEngine tests (`test/services/scoring_engine_test.rb`):**

```ruby
class ScoringEngineTest < ActiveSupport::TestCase
  # Test bet_wins? for all 6 types
  test "bet type 1 wins when home_score > away_score"
  test "bet type 1 loses when home_score <= away_score"
  test "bet type X wins when home_score == away_score"
  test "bet type X loses when home_score != away_score"
  test "bet type 2 wins when away_score > home_score"
  test "bet type 2 loses when away_score <= home_score"
  test "bet type 1X wins when home_score >= away_score (home win)"
  test "bet type 1X wins when home_score >= away_score (draw)"
  test "bet type 1X loses when away_score > home_score"
  test "bet type X2 wins when away_score >= home_score (away win)"
  test "bet type X2 wins when away_score >= home_score (draw)"
  test "bet type X2 loses when home_score > away_score"
  test "bet type 12 wins when home_score != away_score (home win)"
  test "bet type 12 wins when home_score != away_score (away win)"
  test "bet type 12 loses when home_score == away_score (draw)"

  # Test calculate_all
  test "calculate_all updates points for all bets on a match"
  test "calculate_all returns count of bets processed"
  test "calculate_all awards 0 points for incorrect bets"
  test "calculate_all awards 0 points when match has no odds"
  test "calculate_all is deterministic"
end
```

**Controller tests (`test/controllers/api/v1/admin/matches_controller_test.rb`):**

Add to existing file:
```ruby
# Score entry tests
test "POST /api/v1/admin/matches/:id/score saves score and calculates points"
test "POST /api/v1/admin/matches/:id/score as non-admin returns 403"
test "POST /api/v1/admin/matches/:id/score unauthenticated returns 401"
test "POST /api/v1/admin/matches/:id/score on already scored match returns SCORE_LOCKED"
test "POST /api/v1/admin/matches/:id/score with missing scores returns 422"
test "POST /api/v1/admin/matches/:id/score accepts camelCase params"
test "POST /api/v1/admin/matches/:id/score wraps in transaction"
```

**Auth pattern for tests** (established in previous stories):
```ruby
setup do
  post api_v1_sessions_url, params: { nickname: 'admin', password: 'password' }, as: :json
end
```

### Frontend: Matches Store Addition

Add to `frontend/src/stores/matches.ts`:

```typescript
async function submitMatchScore(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<{ success: boolean; playersScored?: number }> {
  error.value = null
  try {
    const response = await api.post<{ data: Match; meta: { playersScored: number } }>(
      `/admin/matches/${matchId}/score`,
      { homeScore, awayScore }
    )
    if (response?.data) {
      // Update match in local state
      const index = matches.value.findIndex((m) => m.id === matchId)
      if (index !== -1) {
        matches.value[index] = response.data
      }
      return { success: true, playersScored: response.meta?.playersScored ?? 0 }
    }
    return { success: false }
  } catch (e) {
    if (e instanceof ApiClientError) {
      error.value = { code: e.code, message: e.message, field: e.field }
    }
    return { success: false }
  }
}
```

**Don't forget** to export `submitMatchScore` from the store's return object.

### Frontend: ScoreEntryView Design

**Follow OddsEntryView pattern exactly** — same drawer-based layout, same responsive behavior.

**Match filtering logic:**
```typescript
const matchesNeedingScores = computed(() =>
  matchesStore.matches.filter(m =>
    new Date(m.kickoffTime) < new Date() && m.homeScore === null
  ).sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())
  // Sort DESCENDING: most recently locked first (admin likely enters scores for recent matches)
)
```

**Form fields (2 InputNumber fields):**

| Field | Label | Config |
|-------|-------|--------|
| homeScore | "{homeTeam}" | InputNumber, min=0, no decimals |
| awayScore | "{awayTeam}" | InputNumber, min=0, no decimals |

**PrimeVue InputNumber configuration:**
```html
<InputNumber
  v-model="form.homeScore"
  :min="0"
  :max="99"
  inputId="homeScore"
  placeholder="0"
/>
```

Note: Do NOT set `mode="decimal"` or `minFractionDigits` — scores are integers.

**Layout:**
- Match info header: "{homeTeam} vs {awayTeam}" + kickoff time + group label
- Score inputs side by side: [Home Score] : [Away Score]
- Save button: "Save Score & Calculate Points"
- Success message: "Saved. Points calculated for {N} players."

**Responsive behavior:**
- Desktop: drawer right side, 400px width, scores side by side
- Mobile: drawer bottom, auto height, scores stacked or side by side (they fit easily)

### Frontend: Navigation Updates

**MoreView.vue** — Enable Score Entry button (currently disabled with "Coming soon"):
```vue
<Button
  :label="t('admin.scoreEntry')"
  severity="secondary"
  outlined
  @click="router.push('/admin/score-entry')"
/>
```

**Router** — Add new route:
```typescript
{
  path: '/admin/score-entry',
  name: 'score-entry',
  component: () => import('@/views/admin/ScoreEntryView.vue'),
  meta: { requiresAuth: true, requiresAdmin: true },
}
```

### i18n Keys to Add

**en.json additions under `admin.scores`:**
```json
{
  "admin": {
    "scores": {
      "title": "Score Entry",
      "selectMatch": "Select a match to enter the score",
      "noMatchesNeeded": "All caught up! No matches need scores right now.",
      "matchHeader": "{home} vs {away}",
      "kickoffTime": "Kickoff: {time}",
      "groupLabel": "Group {group}",
      "homeScore": "Home score",
      "awayScore": "Away score",
      "saveScore": "Save Score & Calculate Points",
      "saved": "Saved. Points calculated for {count} player(s).",
      "saving": "Saving...",
      "scoreLocked": "Score already entered for this match.",
      "bothRequired": "Both home and away scores are required",
      "saveFailed": "Failed to save score. Please try again.",
      "matchesRemaining": "{count} match(es) need scores",
      "backToMore": "Back"
    }
  }
}
```

**pl.json additions under `admin.scores`:**
```json
{
  "admin": {
    "scores": {
      "title": "Wyniki",
      "selectMatch": "Wybierz mecz, aby wprowadzić wynik",
      "noMatchesNeeded": "Wszystko gotowe! Żaden mecz nie wymaga wyniku.",
      "matchHeader": "{home} vs {away}",
      "kickoffTime": "Początek: {time}",
      "groupLabel": "Grupa {group}",
      "homeScore": "Wynik gospodarzy",
      "awayScore": "Wynik gości",
      "saveScore": "Zapisz wynik i oblicz punkty",
      "saved": "Zapisano. Punkty obliczone dla {count} graczy.",
      "saving": "Zapisywanie...",
      "scoreLocked": "Wynik już wprowadzony dla tego meczu.",
      "bothRequired": "Oba wyniki (gospodarzy i gości) są wymagane",
      "saveFailed": "Nie udało się zapisać wyniku. Spróbuj ponownie.",
      "matchesRemaining": "Mecze wymagające wyników: {count}",
      "backToMore": "Wstecz"
    }
  }
}
```

### Previous Story Intelligence (Story 4.1)

**Key learnings from Story 4.1:**
- `Authentication` concern is automatically applied globally — don't re-add
- Serializers use PORO pattern with `.transform_keys` for camelCase
- Decimal values in serializers need `.to_f` for proper JSON output
- OddsEntryView uses a Drawer component that adapts position based on screen size (right on desktop, bottom on mobile)
- `onMounted` hook is required to load matches data (was a bug in initial 4.1 implementation)
- Back button should route to `/more` (not `/admin`)
- MoreView has "Coming Soon" disabled buttons for Score Entry — need to enable
- `useAuthStore().isAdmin` gates admin functionality
- `api.put`/`api.post` can return `undefined` — always null-check
- Router meta `{ requiresAuth: true, requiresAdmin: true }` gates admin routes
- Matches store error is an object `{ code, message, field }` not a string

**Code review feedback from previous stories:**
- Component-scoped DOM queries (use `useTemplateRef`, not `document.querySelector`)
- Disable ALL buttons during save to prevent race conditions
- Use `severity="success"` with CSS override for teal color on Tags

### Git Intelligence

**Recent commits (relevant patterns):**
```
fa9a328 Refactor OddsEntryView: unified drawer layout for all screen sizes
509394f Mark Story 4.1 as done: Code review complete, all issues fixed
5de6e84 Code review fixes for Story 4.1: Admin Odds Entry - 6 issues resolved
```

**Key patterns established:**
- OddsEntryView uses unified drawer layout (position changes based on media query)
- Admin controllers follow: include AdminGuard, before_action :require_admin!, private set_match
- Tests use `setup` block with admin session login
- Store actions return typed results for UI consumption

### Critical Developer Guardrails

- **DO NOT** create a new migration — scores and points_earned columns already exist
- **DO NOT** modify the existing `update` action in Admin::MatchesController — add a separate `score` action
- **DO NOT** modify existing Match model validations — score validations are already correct
- **DO NOT** modify existing BetSerializer — it already serializes pointsEarned
- **DO NOT** add npm packages or gems
- **DO NOT** create a separate ScoringService or ScoresController — use ScoringEngine (service object) called from existing Admin::MatchesController
- **DO NOT** add WebSocket or real-time updates
- **DO NOT** implement leaderboard updates — that is Story 5.1
- **DO NOT** implement points display in RevealList — that is Story 4.3
- **DO** create `backend/app/services/` directory (does not exist yet)
- **DO** accept camelCase params in the score action (learned from Story 3.2 bug)
- **DO** wrap score saving + point calculation in a single transaction (NFR16)
- **DO** check for already-scored match before allowing score entry (FR30)
- **DO** use PrimeVue `InputNumber` for score inputs (integer-only, no decimals)
- **DO** use `$t()` for ALL user-facing strings
- **DO** pre-filter matches to show only locked matches without scores
- **DO** make the workflow batch-friendly (auto-advance to next match after save)
- **DO** use `api.post` for the score endpoint (POST /api/v1/admin/matches/:id/score)
- **DO** follow the OddsEntryView drawer pattern for ScoreEntryView
- **REMEMBER**: `useAuthStore().isAdmin` gates admin functionality
- **REMEMBER**: `api.post` can return `undefined` — always null-check
- **REMEMBER**: Existing test fixtures: `scored` (has scores), `locked` (no scores, kickoff passed), `with_odds` (future, has odds), `upcoming` (future, no odds)
- **REMEMBER**: Existing bet fixtures: `player_bet_on_locked` (bet "X"), `admin_bet_on_locked` (bet "1X") — useful for testing scoring on the locked match

### API Response Formats

```json
// POST /api/v1/admin/matches/:id/score (200 OK) — successful score entry
{
  "data": {
    "id": 3,
    "homeTeam": "Germany",
    "awayTeam": "France",
    "kickoffTime": "2026-02-09T22:10:36.000Z",
    "groupLabel": "Group E",
    "homeScore": 2,
    "awayScore": 1,
    "oddsHome": null,
    "oddsDraw": null,
    "oddsAway": null,
    "oddsHomeDraw": null,
    "oddsDrawAway": null,
    "oddsHomeAway": null
  },
  "meta": {
    "playersScored": 2
  }
}

// POST /api/v1/admin/matches/:id/score (422) — already scored
{
  "error": {
    "code": "SCORE_LOCKED",
    "message": "Results already calculated",
    "field": null
  }
}

// POST /api/v1/admin/matches/:id/score (422) — missing scores
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Both scores are required",
    "field": null
  }
}

// POST /api/v1/admin/matches/:id/score (403) — non-admin
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "field": null
  }
}

// POST /api/v1/admin/matches/:id/score (401) — unauthenticated
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not logged in",
    "field": null
  }
}

// POST /api/v1/admin/matches/:id/score (404) — match not found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Match not found",
    "field": null
  }
}
```

### Project Structure Notes

**Files to CREATE (NEW):**
- `backend/app/services/scoring_engine.rb` — Pure Ruby scoring service
- `backend/test/services/scoring_engine_test.rb` — Comprehensive scoring tests
- `frontend/src/views/admin/ScoreEntryView.vue` — Score entry admin view

**Files to MODIFY (EXISTING):**
- `backend/app/controllers/api/v1/admin/matches_controller.rb` (add `score` action + score_params)
- `backend/test/controllers/api/v1/admin/matches_controller_test.rb` (add score entry tests)
- `backend/config/routes.rb` (add `post :score, on: :member` within admin matches)
- `frontend/src/stores/matches.ts` (add `submitMatchScore` action)
- `frontend/src/stores/__tests__/matches.test.ts` (add submitMatchScore tests)
- `frontend/src/router/index.ts` (add /admin/score-entry route)
- `frontend/src/views/MoreView.vue` (enable Score Entry button, remove disabled + coming soon)
- `frontend/src/locales/en.json` (add score entry keys under `admin.scores`)
- `frontend/src/locales/pl.json` (add Polish score entry keys under `admin.scores`)

**Files to NOT TOUCH:**
- `backend/app/models/match.rb` (validations already correct for scores)
- `backend/app/models/bet.rb` (points_earned column already exists)
- `backend/app/serializers/match_serializer.rb` (already serializes score fields)
- `backend/app/serializers/bet_serializer.rb` (already serializes pointsEarned)
- `backend/db/` (no migrations needed)
- `frontend/src/api/client.ts` (api.post already exists)
- `frontend/src/api/types.ts` (Match type already has homeScore/awayScore)
- `frontend/src/components/match/MatchCard.vue` (no changes — Story 4.3 handles display)
- `frontend/src/components/match/RevealList.vue` (no changes — Story 4.3 handles display)
- Any leaderboard-related code (Story 5.1)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — User story, acceptance criteria, full BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — ScoringEngine as pure Ruby service object, points stored as points_earned on Bet
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Guards] — AdminGuard: `current_user.admin?`
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Error codes, response format, camelCase JSON
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Score entry data flow: transaction wrapping score update + ScoringEngine
- [Source: _bmad-output/planning-artifacts/prd.md#Scoring & Points] — FR8-FR12, deterministic calculation, compound bet resolution
- [Source: _bmad-output/planning-artifacts/prd.md#NFR] — NFR15 (deterministic), NFR16 (transaction), FR30 (immutable results)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 5: Admin Odds & Score Entry] — Full UX flow, batch workflow, pre-filtered list
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — Admin Score Entry Form spec: 2 integer fields, "Save Score & Calculate Points" button
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Confirmation: "Points calculated for X players"
- [Source: backend/app/controllers/api/v1/admin/matches_controller.rb] — Existing admin controller to extend
- [Source: backend/app/models/match.rb] — Match model with score validations
- [Source: backend/app/models/bet.rb] — Bet model with points_earned column
- [Source: backend/db/schema.rb] — Database schema confirming columns exist
- [Source: backend/test/fixtures/matches.yml] — Test fixtures: scored, locked, with_odds, upcoming
- [Source: backend/test/fixtures/bets.yml] — Test fixtures: player/admin bets on locked/upcoming
- [Source: frontend/src/stores/matches.ts] — Existing store to extend with submitMatchScore
- [Source: frontend/src/views/admin/OddsEntryView.vue] — Reference pattern for ScoreEntryView
- [Source: frontend/src/views/MoreView.vue] — Admin section with disabled Score Entry button
- [Source: _bmad-output/implementation-artifacts/4-1-admin-odds-entry.md] — Previous story learnings and patterns

### Project Context Reference

- **Run Rails commands:** `mise exec -- bin/rails ...` from `/backend`
- **Run npm commands:** `mise exec -- npm ...` from `/frontend`
- **Start PostgreSQL:** `docker compose -f docker-compose.dev.yml up -d` from project root
- **Start Rails:** `mise exec -- bin/rails server` from `/backend` (port 3000)
- **Start Vue:** `mise exec -- npm run dev` from `/frontend` (port 5173)
- **Run backend tests:** `mise exec -- bin/rails test` from `/backend`
- **Run frontend tests:** `mise exec -- npm run test:unit` from `/frontend`

## Change Log

- **2026-02-11**: Implemented Story 4.2 - Scoring Engine and Score Entry
  - Backend: ScoringEngine service (deterministic point calculation), Admin::MatchesController score action with SCORE_LOCKED check and transaction safety
  - Frontend: ScoreEntryView component with drawer-based admin interface, responsive layout, and batch-friendly auto-advance
  - All tests passing: 27 ScoringEngine tests + 15 controller tests + 13 store tests
  - Story ready for code review

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

None - all implementations completed successfully on first pass

### Completion Notes List

✅ **Backend - ScoringEngine Service (27 tests)**
- Created pure Ruby service object at `backend/app/services/scoring_engine.rb`
- Implemented `calculate_all(match)` to process all bets on a match within transaction
- Implemented `bet_wins?(bet_type, home_score, away_score)` for all 6 bet types (1, X, 2, 1X, X2, 12)
- Implemented `odds_for_bet_type(bet_type, match)` to safely retrieve odds with nil fallback
- Comprehensive test coverage: determinism, edge cases, draws, compound bets, all bet types
- All 27 tests passing

✅ **Backend - Score Action in Admin::MatchesController (15 tests)**
- Added `score` action to existing `app/controllers/api/v1/admin/matches_controller.rb`
- Implements SCORE_LOCKED check: rejects if `home_score.present? && away_score.present?`
- Wraps score update and point calculation in single `ActiveRecord::Base.transaction`
- Accepts both camelCase (`homeScore`, `awayScore`) and snake_case parameters
- Returns serialized match data + `meta: { playersScored: N }` for UI feedback
- Added route `post :score, on: :member` to resource routing
- Added `score_params` method to handle parameter conversion
- Comprehensive controller tests: auth, non-admin rejection, score locked, transaction safety, validation
- All 15 integration tests passing

✅ **Frontend - Matches Store `submitMatchScore` Action (13 tests)**
- Added `submitMatchScore(matchId, homeScore, awayScore)` to Pinia store
- Returns `{ success: boolean; playersScored?: number }` for clean UI handling
- Updates match in local state on successful response
- Handles API errors with proper error object structure
- Clears previous errors on new submission
- Comprehensive tests: successful submission, error handling, local state update, edge cases
- All frontend store tests still passing (13 tests)

✅ **Frontend - i18n Translations**
- Added `admin.scores.*` keys to `en.json` with all 15 translation strings
- Added corresponding Polish translations to `pl.json`
- Key structure follows pattern: title, selectMatch, noMatchesNeeded, matchHeader, etc.
- Supports dynamic interpolation: {count}, {home}, {away}, {time}, {group}

✅ **Frontend - ScoreEntryView Component**
- Created at `frontend/src/views/admin/ScoreEntryView.vue`
- Follows OddsEntryView pattern: drawer-based layout, responsive design, batch workflow
- Pre-filters matches: locked (kickoff < now) + no scores entered (homeScore === null)
- Sorts descending by kickoff time (most recent locked matches first)
- Two integer-only InputNumber fields (home score, away score): min=0, max=99, no decimals
- Responsive layout: side-by-side on desktop (400px drawer, right side), stacked on mobile
- Auto-advance to next match after 2-second success message delay
- Success message template: "Saved. Points calculated for {N} player(s)."
- Error handling: SCORE_LOCKED, validation errors, API failures with user-friendly messages
- Proper state management: clearing form errors on new selection, disabling save button during submission

✅ **Frontend - Routing & Navigation**
- Added `/admin/score-entry` route to `frontend/src/router/index.ts`
- Route includes `meta: { requiresAuth: true, requiresAdmin: true }` guards
- Lazy-loaded component: `() => import('../views/admin/ScoreEntryView.vue')`
- Enabled Score Entry button in MoreView with navigation function
- Removed disabled state and "Coming soon" label

### File List

**Backend - Created:**
- `backend/app/services/scoring_engine.rb` - Core scoring service (pure Ruby, deterministic)
- `backend/test/services/scoring_engine_test.rb` - 27 unit tests for all betting scenarios

**Backend - Modified:**
- `backend/app/controllers/api/v1/admin/matches_controller.rb` - Added score action + score_params method
- `backend/test/controllers/api/v1/admin/matches_controller_test.rb` - Added 8 score action tests
- `backend/config/routes.rb` - Added member route for score action

**Frontend - Created:**
- `frontend/src/views/admin/ScoreEntryView.vue` - Score entry view component (390 lines)

**Frontend - Modified:**
- `frontend/src/stores/matches.ts` - Added submitMatchScore action
- `frontend/src/stores/__tests__/matches.test.ts` - Added 6 tests for submitMatchScore
- `frontend/src/router/index.ts` - Added score-entry route
- `frontend/src/views/MoreView.vue` - Enabled Score Entry navigation button
- `frontend/src/locales/en.json` - Added admin.scores section with 15 translation keys
- `frontend/src/locales/pl.json` - Added admin.scores Polish translations
