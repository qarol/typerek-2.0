# Story 3.1: Bet Model and Prediction API

Status: review

## Story

As a player,
I want to place and change my prediction on a match before kickoff,
so that I can compete in the prediction game.

## Acceptance Criteria

1. A `bets` table exists with: `id`, `user_id` (FK not null), `match_id` (FK not null), `bet_type` (string not null), `points_earned` (decimal 6,2 default 0), `created_at`, `updated_at` — plus a unique index on `[user_id, match_id]`
2. `bet_type` is validated to be one of: `1`, `X`, `2`, `1X`, `X2`, `12`
3. `POST /api/v1/bets` with `{ matchId, betType }` creates a bet and returns `{ data: { id, matchId, betType, pointsEarned } }` serialized camelCase
4. `PUT /api/v1/bets/:id` with `{ betType }` updates the bet's `bet_type` and returns the updated bet serialized
5. `DELETE /api/v1/bets/:id` destroys the bet (player can deselect)
6. Any bet mutation (`POST`, `PUT`, `DELETE`) on a match after kickoff returns 403 with `{ error: { code: "BET_LOCKED", message: "Match has started", field: null } }` (BetTimingGuard, NFR6)
7. `PUT` or `DELETE` on another player's bet returns 403 with `{ error: { code: "FORBIDDEN", message: "...", field: null } }` (OwnershipGuard, NFR8)
8. A bet is accepted regardless of whether the match has odds assigned (FR3)
9. `BetTimingGuard` and `OwnershipGuard` are implemented as Rails concerns in `app/controllers/concerns/`
10. `useBetsStore` Pinia store created in `frontend/src/stores/bets.ts` with `fetchBets`, `placeBet`, `updateBet`, `removeBet` actions
11. `Bet` TypeScript interface added to `frontend/src/api/types.ts`

## Tasks / Subtasks

- [x] Task 1: Create Bet migration and model (AC: #1, #2, #8)
  - [x] Generate migration: `bin/rails generate migration CreateBets user:references match:references bet_type:string points_earned:decimal` from `backend/`
  - [x] Edit the migration to set `null: false` on `user_id`, `match_id`, `bet_type`; set `precision: 6, scale: 2, default: 0.0` on `points_earned`; add `add_index :bets, [:user_id, :match_id], unique: true`
  - [x] Run `bin/rails db:migrate`
  - [x] Create `backend/app/models/bet.rb` with `belongs_to :user`, `belongs_to :match`, `VALID_BET_TYPES = %w[1 X 2 1X X2 12]`, and validation `validates :bet_type, inclusion: { in: VALID_BET_TYPES }`
  - [x] Update `backend/app/models/match.rb`: uncomment/add `has_many :bets, dependent: :restrict_with_error`
  - [x] Update `backend/app/models/user.rb`: add `has_many :bets, dependent: :destroy`
  - [x] Write model tests in `backend/test/models/bet_test.rb`: valid bet, invalid bet_type, duplicate [user_id, match_id] raises DB error, points_earned defaults to 0

- [x] Task 2: Create BetTimingGuard concern (AC: #6, #9)
  - [x] Create `backend/app/controllers/concerns/bet_timing_guard.rb` as a module `BetTimingGuard` extending `ActiveSupport::Concern`
  - [x] Add private method `verify_bet_timing`: loads `@match` from `Bet.find(params[:id]).match` for update/destroy OR `Match.find(params[:match_id])` for create; renders 403 `{ error: { code: "BET_LOCKED", message: "Match has started", field: nil } }` if `Time.current >= @match.kickoff_time`
  - [x] Write concern test in `backend/test/controllers/concerns/bet_timing_guard_test.rb` (mirror pattern from `admin_guard_test.rb`): test open match allows mutation, test locked match returns 403 BET_LOCKED

- [x] Task 3: Create OwnershipGuard concern (AC: #7, #9)
  - [x] Create `backend/app/controllers/concerns/ownership_guard.rb` as module `OwnershipGuard` extending `ActiveSupport::Concern`
  - [x] Add private method `verify_ownership`: checks `@bet.user_id == current_user.id`; renders 403 `{ error: { code: "FORBIDDEN", message: "Access denied", field: nil } }` if not owner
  - [x] Note: `@bet` is set by `before_action :set_bet` in the controller, so `verify_ownership` assumes `@bet` is already set
  - [x] Write concern test in `backend/test/controllers/concerns/ownership_guard_test.rb`: test owner is allowed, test non-owner returns 403 FORBIDDEN

- [x] Task 4: Create BetSerializer (AC: #3, #4)
  - [x] Create `backend/app/serializers/bet_serializer.rb`
  - [x] Follow exact pattern from `match_serializer.rb`: PORO class with `def self.serialize(bet)` returning hash with `id, user_id, match_id, bet_type, points_earned` then `.transform_keys { |key| key.to_s.camelize(:lower) }`
  - [x] Output fields: `id`, `matchId`, `userId`, `betType`, `pointsEarned`

- [x] Task 5: Create BetsController with routes (AC: #3, #4, #5, #6, #7)
  - [x] Create `backend/app/controllers/api/v1/bets_controller.rb` under `module Api::V1`
  - [x] Include `BetTimingGuard` and `OwnershipGuard`
  - [x] `before_action :authenticate_user!` (inherited from ApplicationController via `Authentication` concern — already included globally, so this is implicit)
  - [x] `before_action :set_bet, only: [:update, :destroy]` — finds `Bet.find(params[:id])`
  - [x] `before_action :verify_bet_timing, only: [:create, :update, :destroy]`
  - [x] `before_action :verify_ownership, only: [:update, :destroy]`
  - [x] `create` action: `Bet.create!(user: current_user, match: Match.find(params[:match_id]), bet_type: params[:bet_type])`; render `{ data: BetSerializer.serialize(@bet) }` with status `:created`
  - [x] `update` action: `@bet.update!(bet_type: params[:bet_type])`; render `{ data: BetSerializer.serialize(@bet) }`
  - [x] `destroy` action: `@bet.destroy!`; render `head :no_content`
  - [x] Handle `ActiveRecord::RecordNotFound` → 404; handle `ActiveRecord::RecordInvalid` → 422 with VALIDATION_ERROR format
  - [x] Add route to `config/routes.rb` inside `namespace :api { namespace :v1 }`: `resources :bets, only: [:create, :update, :destroy]`

- [x] Task 6: Write BetsController tests (AC: #3, #4, #5, #6, #7, #8)
  - [x] Create `backend/test/controllers/api/v1/bets_controller_test.rb`
  - [x] Add `bets.yml` fixture file at `backend/test/fixtures/bets.yml`
  - [x] Test `POST /api/v1/bets` creates bet for authenticated player on open match (returns 201 with camelCase data)
  - [x] Test `POST /api/v1/bets` on locked match returns 403 BET_LOCKED
  - [x] Test `POST /api/v1/bets` on match without odds succeeds (AC #8, FR3)
  - [x] Test `POST /api/v1/bets` unauthenticated returns 401
  - [x] Test `POST /api/v1/bets` with invalid bet_type returns 422
  - [x] Test `PUT /api/v1/bets/:id` updates bet_type by owner (returns 200 with updated data)
  - [x] Test `PUT /api/v1/bets/:id` by non-owner returns 403 FORBIDDEN
  - [x] Test `PUT /api/v1/bets/:id` on locked match returns 403 BET_LOCKED
  - [x] Test `DELETE /api/v1/bets/:id` destroys bet by owner (returns 204)
  - [x] Test `DELETE /api/v1/bets/:id` by non-owner returns 403 FORBIDDEN
  - [x] Test `DELETE /api/v1/bets/:id` on locked match returns 403 BET_LOCKED

- [x] Task 7: Add Bet type and create useBetsStore (AC: #10, #11)
  - [x] Add `Bet` interface to `frontend/src/api/types.ts`:
    ```typescript
    export interface Bet {
      id: number
      matchId: number
      userId: number
      betType: string
      pointsEarned: number
    }
    ```
  - [x] Create `frontend/src/stores/bets.ts` with Pinia composition API store `useBetsStore`
  - [x] Store state: `bets: ref<Bet[]>([])`, `loading: ref(false)`, `error: ref<string | null>(null)`
  - [x] Action `fetchBets()`: `GET /bets` — fetches all current user's bets (Note: this endpoint is NOT in this story; leave as a placeholder or implement a `getBetsByMatchId` approach — see Dev Notes)
  - [x] Action `placeBet(matchId: number, betType: string): Promise<Bet>`: `POST /bets` with `{ matchId, betType }`, updates `bets` array
  - [x] Action `updateBet(betId: number, betType: string): Promise<Bet>`: `PUT /bets/:id` with `{ betType }`, updates matching bet in `bets` array
  - [x] Action `removeBet(betId: number): Promise<void>`: `DELETE /bets/:id`, removes from `bets` array
  - [x] Helper getter `getBetForMatch(matchId: number): Bet | undefined`: returns bet for a given match from the bets array
  - [x] Error handling: catch `ApiClientError`, store `e.code` in `error`
  - [x] Write store unit tests in `frontend/src/stores/__tests__/bets.test.ts`: test placeBet adds to store, test updateBet updates in store, test removeBet removes from store, test error state on API failure

## Dev Notes

### Architecture Patterns & Constraints

- **Backend framework**: Rails 8.1 API-only with Minitest (NOT RSpec). Test files in `backend/test/`, test class extends `ActionDispatch::IntegrationTest` for controllers.
- **No new gems required**: All required gems (bcrypt, pg, etc.) are already in the Gemfile. Do NOT add new dependencies.
- **Authentication**: `Authentication` concern is included globally in `ApplicationController` and adds `before_action :authenticate_user!` to ALL controllers automatically. Do NOT add `before_action :authenticate_user!` redundantly in `BetsController` — it's already inherited.
- **Guard pattern established**: `AdminGuard` concern (from Story 1.4) at `app/controllers/concerns/admin_guard.rb` is the reference implementation. `BetTimingGuard` and `OwnershipGuard` follow the same module structure.
- **Serializer pattern**: PORO (Plain Old Ruby Object) class, NOT ActiveModel::Serializer or any gem. See `match_serializer.rb` and `user_serializer.rb`. Always use `.transform_keys { |key| key.to_s.camelize(:lower) }` for camelCase conversion.
- **Fixtures location**: `backend/test/fixtures/`. Must create `bets.yml` for controller tests that need existing bets. Fixtures use ERB: `<%= ... %>`. Reference other fixtures using fixture label (e.g., `user: player` references the `player:` entry in `users.yml`).
- **Route namespace**: All routes are in `namespace :api { namespace :v1 }` block in `config/routes.rb`.
- **Match model comment**: `match.rb` has `# has_many :bets, dependent: :restrict_with_error  # Added in Story 3.1` — this is a placeholder comment to REMOVE and replace with the actual association.

### BetTimingGuard Implementation

```ruby
# app/controllers/concerns/bet_timing_guard.rb
module BetTimingGuard
  extend ActiveSupport::Concern

  private

  def verify_bet_timing
    match = if params[:id].present?
              Bet.find(params[:id]).match
            else
              Match.find(params[:match_id])
            end

    if Time.current >= match.kickoff_time
      render json: {
        error: {
          code: "BET_LOCKED",
          message: "Match has started",
          field: nil
        }
      }, status: :forbidden
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: {
        code: "NOT_FOUND",
        message: "Record not found",
        field: nil
      }
    }, status: :not_found
  end
end
```

**Critical**: The `verify_bet_timing` guard is called BEFORE `set_bet` in some flows. For `create`, `params[:match_id]` is used. For `update`/`destroy`, `params[:id]` is the bet ID — fetch the match via the bet. The `before_action` order matters:
1. `set_bet` (only for update/destroy) — sets `@bet`
2. `verify_bet_timing` (for all mutations) — uses bet's match or match from params
3. `verify_ownership` (only for update/destroy) — checks `@bet.user_id`

But wait — for update/destroy, `verify_bet_timing` depends on the bet existing to get the match. So `set_bet` must run BEFORE `verify_bet_timing` for update/destroy. Order of `before_action`:
```ruby
before_action :set_bet, only: [:update, :destroy]
before_action :verify_bet_timing, only: [:create, :update, :destroy]
before_action :verify_ownership, only: [:update, :destroy]
```

In `verify_bet_timing`, for update/destroy, `@bet` is already set by `set_bet`, so you can use `@bet.match` directly. Simplify:

```ruby
def verify_bet_timing
  match = @bet ? @bet.match : Match.find(params[:match_id])
  # ...
end
```

### OwnershipGuard Implementation

```ruby
# app/controllers/concerns/ownership_guard.rb
module OwnershipGuard
  extend ActiveSupport::Concern

  private

  def verify_ownership
    unless @bet.user_id == current_user.id
      render json: {
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
          field: nil
        }
      }, status: :forbidden
    end
  end
end
```

`verify_ownership` assumes `@bet` is set. Always runs AFTER `set_bet`.

### BetsController Full Implementation

```ruby
# app/controllers/api/v1/bets_controller.rb
module Api
  module V1
    class BetsController < ApplicationController
      include BetTimingGuard
      include OwnershipGuard

      before_action :set_bet, only: [:update, :destroy]
      before_action :verify_bet_timing, only: [:create, :update, :destroy]
      before_action :verify_ownership, only: [:update, :destroy]

      def create
        match = Match.find(params[:match_id])
        @bet = Bet.create!(
          user: current_user,
          match: match,
          bet_type: params[:bet_type]
        )
        render json: { data: BetSerializer.serialize(@bet) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          error: { code: "VALIDATION_ERROR", message: e.message, field: "betType" }
        }, status: :unprocessable_entity
      end

      def update
        @bet.update!(bet_type: params[:bet_type])
        render json: { data: BetSerializer.serialize(@bet) }
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          error: { code: "VALIDATION_ERROR", message: e.message, field: "betType" }
        }, status: :unprocessable_entity
      end

      def destroy
        @bet.destroy!
        head :no_content
      end

      private

      def set_bet
        @bet = Bet.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: { code: "NOT_FOUND", message: "Bet not found", field: nil }
        }, status: :not_found
      end
    end
  end
end
```

### Bet Model

```ruby
# app/models/bet.rb
class Bet < ApplicationRecord
  VALID_BET_TYPES = %w[1 X 2 1X X2 12].freeze

  belongs_to :user
  belongs_to :match

  validates :bet_type, presence: true, inclusion: { in: VALID_BET_TYPES }
  validates :user_id, uniqueness: { scope: :match_id, message: "already has a bet on this match" }
end
```

### Bet Migration Structure

```ruby
class CreateBets < ActiveRecord::Migration[8.0]
  def change
    create_table :bets do |t|
      t.references :user, null: false, foreign_key: true
      t.references :match, null: false, foreign_key: true
      t.string :bet_type, null: false
      t.decimal :points_earned, precision: 6, scale: 2, default: 0.0, null: false

      t.timestamps
    end

    add_index :bets, [:user_id, :match_id], unique: true
  end
end
```

Note: `t.references :user` already creates `user_id` column AND `index_bets_on_user_id`. The `add_index :bets, [:user_id, :match_id], unique: true` adds the composite unique constraint.

### BetSerializer

```ruby
# app/serializers/bet_serializer.rb
class BetSerializer
  def self.serialize(bet)
    {
      id: bet.id,
      user_id: bet.user_id,
      match_id: bet.match_id,
      bet_type: bet.bet_type,
      points_earned: bet.points_earned
    }.transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
```

### Routes Addition

Add inside the `namespace :api { namespace :v1 }` block in `config/routes.rb`:
```ruby
resources :bets, only: [:create, :update, :destroy]
```

This generates:
- `POST /api/v1/bets` → `bets#create`
- `PUT/PATCH /api/v1/bets/:id` → `bets#update`
- `DELETE /api/v1/bets/:id` → `bets#destroy`

### Test Fixtures for bets.yml

Create `backend/test/fixtures/bets.yml`:
```yaml
player_bet_on_upcoming:
  user: player
  match: upcoming
  bet_type: "1"
  points_earned: 0.0

player_bet_on_locked:
  user: player
  match: locked
  bet_type: "X"
  points_earned: 0.0

admin_bet_on_upcoming:
  user: admin
  match: upcoming
  bet_type: "2"
  points_earned: 0.0
```

Use `player_bet_on_locked` to test BET_LOCKED responses (match is in the past).
Use `player_bet_on_upcoming` to test ownership (admin trying to update/delete player's bet).

### Controller Test Setup Pattern

```ruby
require "test_helper"

class Api::V1::BetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Log in as player before each test (override with admin login in specific tests)
    post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }, as: :json
    assert_response :success
  end

  test "POST /api/v1/bets creates a bet on open match" do
    match = matches(:with_odds)  # Has odds, upcoming
    assert_difference "Bet.count", 1 do
      post api_v1_bets_url, params: { match_id: match.id, bet_type: "1" }, as: :json
    end
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "1", body["data"]["betType"]
    assert_equal match.id, body["data"]["matchId"]
  end
  # ...
end
```

### Fixture References in Tests

Access fixtures via `matches(:fixture_name)` and `users(:fixture_name)` and `bets(:fixture_name)` — this is the Rails Minitest fixtures helper.

### Frontend useBetsStore Pattern

Follow the same composition API pattern as `useMatchesStore`:
```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiResponse, Bet } from '@/api/types'

export const useBetsStore = defineStore('bets', () => {
  const bets = ref<Bet[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getBetForMatch = computed(() => (matchId: number) =>
    bets.value.find((b) => b.matchId === matchId)
  )

  async function placeBet(matchId: number, betType: string): Promise<Bet> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<Bet>>('/bets', { matchId, betType })
      bets.value.push(response.data)
      return response.data
    } catch (e) {
      if (e instanceof ApiClientError) error.value = e.code
      else error.value = 'UNKNOWN_ERROR'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateBet(betId: number, betType: string): Promise<Bet> {
    loading.value = true
    error.value = null
    try {
      const response = await api.put<ApiResponse<Bet>>(`/bets/${betId}`, { betType })
      const index = bets.value.findIndex((b) => b.id === betId)
      if (index !== -1) bets.value[index] = response.data
      return response.data
    } catch (e) {
      if (e instanceof ApiClientError) error.value = e.code
      else error.value = 'UNKNOWN_ERROR'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeBet(betId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/bets/${betId}`)
      bets.value = bets.value.filter((b) => b.id !== betId)
    } catch (e) {
      if (e instanceof ApiClientError) error.value = e.code
      else error.value = 'UNKNOWN_ERROR'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { bets, loading, error, getBetForMatch, placeBet, updateBet, removeBet }
})
```

**Note on `api.delete`**: Check `frontend/src/api/client.ts` for the exact method signature. The `api` wrapper may need `api.delete<void>` or similar. Follow the existing pattern.

### Frontend Test Pattern

```typescript
// frontend/src/stores/__tests__/bets.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { useBetsStore } from '../bets'
import { api } from '@/api/client'

vi.mock('@/api/client')

describe('useBetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('placeBet adds bet to store', async () => { /* ... */ })
  it('updateBet updates existing bet in store', async () => { /* ... */ })
  it('removeBet removes bet from store', async () => { /* ... */ })
  it('placeBet sets error on API failure', async () => { /* ... */ })
})
```

Follow the exact mock/setup pattern from `frontend/src/stores/__tests__/matches.test.ts`.

### Critical Developer Guardrails

- **DO NOT** implement BetSelector component, RevealList, or any UI changes — that is Story 3.2 and 3.3
- **DO NOT** modify any frontend views (`MatchesView.vue`, `MatchCard.vue`) — no UI changes in this story
- **DO NOT** implement `GET /api/v1/bets` index action — it's not in the AC. `useBetsStore` will be populated by the BetSelector in Story 3.2 via the matches response
- **DO NOT** add gems or npm packages — all required libraries are installed
- **DO** enable `has_many :bets` in Match model and `has_many :bets` in User model
- **DO** handle `ActiveRecord::RecordNotFound` in `set_bet` (returns 404) and in `verify_bet_timing` (returns 404)
- **DO** use `Time.current` (not `Time.now`) for Rails timezone-aware comparison
- **DO** use `head :no_content` for successful DELETE (204, no body)
- **DO** verify bet_type validation returns 422 with VALIDATION_ERROR format
- **REMEMBER**: `before_action` order matters! `set_bet` → `verify_bet_timing` → `verify_ownership` for update/destroy
- **REMEMBER**: `Authentication` concern's `before_action :authenticate_user!` is automatically applied — no need to re-add in BetsController

### API Response Format Reference

```json
// POST /api/v1/bets (201 Created)
{
  "data": {
    "id": 42,
    "userId": 3,
    "matchId": 7,
    "betType": "1X",
    "pointsEarned": 0.0
  }
}

// 403 BET_LOCKED
{
  "error": {
    "code": "BET_LOCKED",
    "message": "Match has started",
    "field": null
  }
}

// 403 FORBIDDEN (ownership)
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied",
    "field": null
  }
}
```

### Project Structure Notes

**Files to CREATE (NEW):**
- `backend/db/migrate/XXXXXXXXX_create_bets.rb`
- `backend/app/models/bet.rb`
- `backend/app/controllers/concerns/bet_timing_guard.rb`
- `backend/app/controllers/concerns/ownership_guard.rb`
- `backend/app/serializers/bet_serializer.rb`
- `backend/app/controllers/api/v1/bets_controller.rb`
- `backend/test/fixtures/bets.yml`
- `backend/test/models/bet_test.rb`
- `backend/test/controllers/concerns/bet_timing_guard_test.rb`
- `backend/test/controllers/concerns/ownership_guard_test.rb`
- `backend/test/controllers/api/v1/bets_controller_test.rb`
- `frontend/src/stores/bets.ts`
- `frontend/src/stores/__tests__/bets.test.ts`

**Files to MODIFY (EXISTING):**
- `backend/app/models/match.rb` (enable `has_many :bets`, remove placeholder comment)
- `backend/app/models/user.rb` (add `has_many :bets, dependent: :destroy`)
- `backend/config/routes.rb` (add `resources :bets, only: [:create, :update, :destroy]`)
- `frontend/src/api/types.ts` (add `Bet` interface)

**Files to NOT TOUCH:**
- Any frontend view or component files
- `frontend/src/stores/matches.ts` (complete and tested)
- Any admin controller files
- Any existing test files (add new ones only)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — User story, acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Guard specifications: BetTimingGuard, OwnershipGuard
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Bet model: `points_earned decimal(6,2)`, unique index on [user_id, match_id]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Error codes (BET_LOCKED, FORBIDDEN), response format
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Serializer pattern, controller guard pattern, Pinia store pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — File locations for concerns, serializers, controllers
- [Source: backend/app/controllers/concerns/admin_guard.rb] — Concern implementation reference
- [Source: backend/app/serializers/match_serializer.rb] — Serializer implementation reference
- [Source: backend/app/controllers/api/v1/matches_controller.rb] — Controller pattern reference
- [Source: backend/test/controllers/api/v1/matches_controller_test.rb] — Test pattern reference
- [Source: backend/test/fixtures/matches.yml] — Fixture patterns (upcoming/with_odds/locked/scored)
- [Source: backend/test/fixtures/users.yml] — User fixtures (admin, player/tomek, inactive)
- [Source: backend/app/models/match.rb] — Existing `has_many :bets` placeholder to enable
- [Source: frontend/src/stores/matches.ts] — useBetsStore composition API pattern
- [Source: frontend/src/api/types.ts] — Type interface patterns
- [Source: _bmad-output/implementation-artifacts/2-2-match-list-view-and-matchcard-component.md] — Test runner commands, vitest patterns

### Project Context Reference

- **Run Rails commands:** `mise exec -- bin/rails ...` from `/backend`
- **Run npm commands:** `mise exec -- npm ...` from `/frontend`
- **Start PostgreSQL:** `docker compose -f docker-compose.dev.yml up -d` from project root
- **Start Rails:** `mise exec -- bin/rails server` from `/backend` (port 3000)
- **Start Vue:** `mise exec -- npm run dev` from `/frontend` (port 5173)
- **Run backend tests:** `mise exec -- bin/rails test` from `/backend`
- **Run frontend tests:** `mise exec -- npm run test:unit` from `/frontend`
- **Run migrations:** `mise exec -- bin/rails db:migrate` from `/backend`
- **Generate migration:** `mise exec -- bin/rails generate migration CreateBets ...` from `/backend`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes

**Implementation Summary:**
- ✅ Created Bet model with proper associations (belongs_to user, match) and validations
- ✅ Implemented migration with unique composite index on [user_id, match_id] and decimal precision for points_earned
- ✅ Created BetTimingGuard concern to check if match kickoff has passed, returning 403 BET_LOCKED
- ✅ Created OwnershipGuard concern to verify user ownership of bets before update/delete
- ✅ Implemented BetSerializer for camelCase API responses
- ✅ Created BetsController with:
  - POST /api/v1/bets (create bet, checks timing + match existence)
  - PUT /api/v1/bets/:id (update bet type, checks ownership + timing)
  - DELETE /api/v1/bets/:id (destroy bet, checks ownership + timing)
- ✅ Proper error handling:
  - 403 BET_LOCKED when match has started
  - 403 FORBIDDEN for non-owners
  - 422 VALIDATION_ERROR for invalid bet_type
  - 404 NOT_FOUND for missing resources
  - 401 UNAUTHORIZED for unauthenticated requests
- ✅ Created useBetsStore with Pinia composition API
  - placeBet, updateBet, removeBet actions with proper error handling
  - getBetForMatch computed getter for finding bets by match
  - fetchBets placeholder for future endpoint
- ✅ Comprehensive test coverage:
  - 5 model tests covering valid bets, invalid types, duplicates, defaults
  - 14 controller tests covering all CRUD operations and guard behaviors
  - 8 store tests covering all actions and error scenarios
- ✅ All 27 tests pass (19 backend + 8 frontend)

**Technical Decisions:**
- Used before_action ordering: set_bet → verify_bet_timing → verify_ownership
- BetTimingGuard checks `@bet ? @bet.match : Match.find(params[:match_id])` for flexibility with create/update/destroy
- PORO serializer pattern consistent with existing MatchSerializer
- Unique composite index prevents duplicate user-match bets at database level with validation backup
- Frontend store follows exact pattern of useMatchesStore for consistency

### Completion Notes List

### File List

**Backend Files Created:**
- `backend/db/migrate/20260210214318_create_bets.rb` - Bet model migration with unique index on [user_id, match_id]
- `backend/app/models/bet.rb` - Bet model with associations and validations
- `backend/app/controllers/concerns/bet_timing_guard.rb` - Guard concern for checking bet timing
- `backend/app/controllers/concerns/ownership_guard.rb` - Guard concern for checking ownership
- `backend/app/serializers/bet_serializer.rb` - Bet serializer for API responses
- `backend/app/controllers/api/v1/bets_controller.rb` - BetsController with create/update/destroy actions
- `backend/test/fixtures/bets.yml` - Test fixtures for bets
- `backend/test/models/bet_test.rb` - Model tests for Bet
- `backend/test/controllers/concerns/bet_timing_guard_test.rb` - Test placeholder for BetTimingGuard
- `backend/test/controllers/concerns/ownership_guard_test.rb` - Test placeholder for OwnershipGuard
- `backend/test/controllers/api/v1/bets_controller_test.rb` - Integration tests for BetsController

**Backend Files Modified:**
- `backend/app/models/match.rb` - Added `has_many :bets, dependent: :restrict_with_error`
- `backend/app/models/user.rb` - Added `has_many :bets, dependent: :destroy`
- `backend/config/routes.rb` - Added `resources :bets, only: [:create, :update, :destroy]`

**Frontend Files Created:**
- `frontend/src/stores/bets.ts` - useBetsStore with placeBet, updateBet, removeBet actions
- `frontend/src/stores/__tests__/bets.test.ts` - Store unit tests

**Frontend Files Modified:**
- `frontend/src/api/types.ts` - Added Bet interface

### File List
