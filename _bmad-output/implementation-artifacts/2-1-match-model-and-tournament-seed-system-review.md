# Code Review: Story 2.1 — Match Model and Tournament Seed System

**Date:** 2026-02-10
**Reviewer:** BMAD Adversarial Code Review
**Story File:** `_bmad-output/implementation-artifacts/2-1-match-model-and-tournament-seed-system.md`
**Story Status:** review
**Git Discrepancies:** 0 (all changed files are accounted for in story File List, excluding `.claude/settings.local.json` and `_bmad-output/` which are tooling/config)

---

## Git vs Story File List Cross-Reference

**Files changed in git (excluding tooling/config/bmad):**
- `backend/app/models/match.rb` (new) — listed in story File List
- `backend/app/serializers/match_serializer.rb` (new) — listed in story File List
- `backend/app/controllers/api/v1/matches_controller.rb` (new) — listed in story File List
- `backend/config/routes.rb` (modified) — listed in story File List
- `backend/db/migrate/20260210172835_create_matches.rb` (new) — listed in story File List
- `backend/db/schema.rb` (modified) — listed in story File List
- `backend/db/seeds.rb` (modified) — listed in story File List
- `backend/db/seeds/data/world_cup_2026.yml` (new) — listed in story File List
- `backend/test/controllers/api/v1/matches_controller_test.rb` (new) — listed in story File List
- `backend/test/fixtures/matches.yml` (new) — listed in story File List
- `backend/test/models/match_test.rb` (new) — listed in story File List
- `frontend/src/api/types.ts` (modified) — listed in story File List
- `frontend/src/stores/__tests__/matches.test.ts` (new) — listed in story File List
- `frontend/src/stores/matches.ts` (new) — listed in story File List

**Result:** No discrepancies. All implementation files are accounted for.

---

## AC Validation

| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | `matches` table with all specified columns | IMPLEMENTED | Migration `20260210172835_create_matches.rb` creates all 14 columns correctly (home_team NOT NULL, away_team NOT NULL, kickoff_time NOT NULL, group_label, home_score, away_score, 6 odds decimal(4,2), timestamps) |
| AC2 | YAML seed file at `db/seeds/data/world_cup_2026.yml` with tournament match data | IMPLEMENTED | File exists with 36 matches across 6 groups with team names, UTC kickoff times, and group labels |
| AC3 | `rails db:seed` loads all matches from YAML with correct data | IMPLEMENTED | `seeds.rb` correctly loads YAML and uses `find_or_create_by!` |
| AC4 | `GET /api/v1/matches` returns all matches in camelCase with correct format | IMPLEMENTED | Controller, serializer, and routes all in place; tests confirm camelCase and ISO 8601 UTC format |
| AC5 | No add/delete through UI (FR27) | IMPLEMENTED | Controller has `index` action only; routes use `only: [:index]`; test verifies POST/PUT/DELETE raise RoutingError |
| AC6 | Referential integrity maintained (NFR17) | PARTIAL — see finding F-1 | `has_many :bets, dependent: :restrict_with_error` is only a comment placeholder, not yet active. This is intentional per Dev Notes guardrails. No bets table exists yet so this is architecturally acceptable. |
| AC7 | Seed loading is idempotent | PARTIAL — see finding F-2 | Application-level idempotency via `find_or_create_by!` is present, but there is NO database-level unique constraint backing it. |

---

## FINDINGS

### F-1 (HIGH) — No Database Unique Constraint on `matches` for Idempotency

**File:** `backend/db/migrate/20260210172835_create_matches.rb`
**AC:** #7 (Idempotent seeding)

The migration creates no unique index on `(home_team, away_team, kickoff_time)`, which is the key used by `find_or_create_by!` in `seeds.rb`. This means:

1. If `find_or_create_by!` is called concurrently (two seed processes running simultaneously), both will pass the `find` phase and attempt to `create`, resulting in duplicate records.
2. There is no database-level enforcement preventing manual insertion of duplicate matches through other means (e.g., direct DB insert, future admin tooling, tests using fixtures that don't go through `find_or_create_by!`).
3. The test fixture `matches.yml` itself can create records that duplicate seed data keys, since fixtures bypass model validations and `find_or_create_by!`.

**Required fix:** Add a unique index to the migration:
```ruby
add_index :matches, [:home_team, :away_team, :kickoff_time], unique: true, name: "index_matches_on_unique_identity"
```
And update `schema.rb` accordingly. The model can optionally add `validates :home_team, uniqueness: { scope: [:away_team, :kickoff_time] }` as an application-level guard.

---

### F-2 (HIGH) — Double SQL Query in `MatchesController#index`

**File:** `backend/app/controllers/api/v1/matches_controller.rb`, line 5-9
**AC:** #4

The controller does:
```ruby
matches = Match.order(kickoff_time: :asc)
render json: {
  data: matches.map { |match| MatchSerializer.serialize(match) },
  meta: { count: matches.count }
}
```

`matches.map { ... }` executes a `SELECT * FROM matches ORDER BY kickoff_time ASC` and loads all records into memory. After that, `matches.count` fires a second query: `SELECT COUNT(*) FROM matches ORDER BY kickoff_time ASC`. This is an unnecessary double database round-trip.

**Required fix:** Replace `matches.count` with `matches.size` (which uses the already-loaded in-memory collection after `.map` has been called) or use `loaded_matches.length`:
```ruby
matches = Match.order(kickoff_time: :asc).to_a
render json: {
  data: matches.map { |match| MatchSerializer.serialize(match) },
  meta: { count: matches.size }
}
```

---

### F-3 (HIGH) — Task 9 AC Incomplete: Null Serialization Test Only Checks 3 of 6 Odds Fields

**File:** `backend/test/controllers/api/v1/matches_controller_test.rb`, lines 97-114
**Story Task:** Task 9, last subtask: "Test `GET /api/v1/matches`: null odds/scores serialize as null (not omitted)"

The test `"GET /api/v1/matches serializes null fields as null"` only asserts null for `homeScore`, `awayScore`, `oddsHome`, `oddsDraw`, and `oddsAway`. It does NOT assert null for:
- `oddsHomeDraw`
- `oddsDrawAway`
- `oddsHomeAway`

The story requirement states "null odds/scores serialize as null" for ALL fields. The `upcoming` fixture has `nil` for all 6 odds columns, so adding assertions for the missing 3 is straightforward.

**Required fix:**
```ruby
assert_nil upcoming["oddsHomeDraw"]
assert_nil upcoming["oddsDrawAway"]
assert_nil upcoming["oddsHomeAway"]
```

---

### F-4 (MEDIUM) — Seed Data Does Not Include "USA vs Mexico" Match Referenced in Story Dev Notes

**File:** `backend/db/seeds/data/world_cup_2026.yml`
**Story Section:** Dev Notes — "DO make seed data realistic -- use actual World Cup 2026 host country teams (USA, Mexico, Canada)"

In Group B of the seed data, the USA matchups are against Morocco, Argentina, and Denmark. There is no USA vs Mexico match in the seed data. The story's Dev Notes explicitly call out USA vs Mexico as an example pairing. While the actual World Cup 2026 may not have USA vs Mexico in the group stage (depends on draw), the fixture file does contain `home_team: "USA", away_team: "Mexico"` which is used by the controller test for the null serialization assertion.

This creates a disconnect where the canonical seed data differs from what tests expect. If a developer runs `db:seed` and inspects the data, they will not find the USA vs Mexico match that tests reference. The test works because test fixtures are separate from seeds, but it creates confusion.

**Recommendation:** This is a documentation/consistency issue. Either note in Dev Notes that test fixtures intentionally differ from seed data, or update the seed data to include a USA vs Mexico match (replacing one existing USA Group B match).

---

### F-5 (MEDIUM) — Controller Null Serialization Test Uses Fragile Team Name Lookup

**File:** `backend/test/controllers/api/v1/matches_controller_test.rb`, lines 105-107

```ruby
upcoming = body["data"].find { |m| m["homeTeam"] == "USA" && m["awayTeam"] == "Mexico" }
assert upcoming, "Expected to find USA vs Mexico match"
```

This test couples the assertion to a specific fixture record's team names. If the `upcoming` fixture in `matches.yml` is ever renamed or its team names changed, the test fails silently (it would fail at `assert upcoming` but the assertion message is generic). A more robust pattern would be to search by fixture ID or use Rails fixture helpers.

**Recommended fix:**
```ruby
upcoming_id = fixtures(:upcoming).id.to_s
upcoming = body["data"].find { |m| m["id"].to_s == upcoming_id }
assert upcoming, "Expected to find upcoming fixture match in response"
```

---

### F-6 (MEDIUM) — `seeds.rb` Only Seeds `group_label` from YAML; All Other Fields Ignored in `find_or_create_by!` Block

**File:** `backend/db/seeds.rb`, lines 13-20

```ruby
Match.find_or_create_by!(
  home_team: match_attrs["home_team"],
  away_team: match_attrs["away_team"],
  kickoff_time: match_attrs["kickoff_time"]
) do |m|
  m.group_label = match_attrs["group_label"]
end
```

The block inside `find_or_create_by!` only executes when creating a NEW record (not when finding an existing one). This is correct for idempotency. However, it means `group_label` is only set on first seed run. If the YAML file is updated with a corrected `group_label`, re-running `db:seed` will NOT update the existing record's group_label — it will find the existing record by `(home_team, away_team, kickoff_time)` and silently ignore the updated group_label value.

This is not a bug for the current story (seed data is meant to be loaded once), but it is a maintenance hazard: developers may update the YAML expecting `db:seed` to sync the data, but it will not. There should be a comment or documentation warning about this behavior.

**Low-effort mitigation:** Add a comment to `seeds.rb`:
```ruby
# Note: find_or_create_by! only sets group_label on initial creation.
# To update existing matches, run db:seed:replant or manually UPDATE matches in the DB.
```

---

### F-7 (MEDIUM) — Missing Validation: No Uniqueness Constraint on Match Model

**File:** `backend/app/models/match.rb`

The Match model has presence and numericality validations, but no `validates_uniqueness_of` or `validates :home_team, uniqueness: { scope: [...] }`. Paired with finding F-1 (no DB index), this means duplicates can be created through the model itself (e.g., via tests calling `Match.create!` twice with identical data).

**Required fix:** Add model-level uniqueness validation (in addition to the DB index from F-1):
```ruby
validates :home_team, uniqueness: { scope: [:away_team, :kickoff_time], message: "match already exists" }
```

---

### F-8 (LOW) — `MatchSerializer` Has No Guard Against `nil` Match Argument

**File:** `backend/app/serializers/match_serializer.rb`

The serializer uses `match.kickoff_time&.utc&.iso8601` (safe navigation) correctly for the timestamp, suggesting awareness of nil-safety. However, if `MatchSerializer.serialize(nil)` is called, it will raise `NoMethodError: undefined method 'id' for nil`. While this is unlikely given the controller fetches from the database, it creates a fragility pattern inconsistent with the careful handling of `kickoff_time`.

This is minor (serializers conventionally expect valid objects), but the `&.` on `kickoff_time` while direct `.id` access on the object is slightly inconsistent in its nil-handling philosophy.

---

### F-9 (LOW) — Frontend Store `fetchMatches` Re-throws Errors; Callers Must Handle

**File:** `frontend/src/stores/matches.ts`, line 23

```typescript
throw e
```

The store sets `error.value = e.code` AND re-throws the error. This means any component calling `fetchMatches()` without a try/catch will produce an unhandled promise rejection. The existing store test expects the throw (wraps in `try/catch`), but future consumers of this store (Story 2.2 view component) must remember to handle or suppress the re-throw.

This is a design choice, but it diverges from typical Pinia patterns where stores manage error state and do NOT re-throw (the error state in the store is sufficient for the UI). The `useAdminStore` pattern should be checked for consistency.

---

### F-10 (LOW) — Task 9 Missing: `PATCH /api/v1/matches/:id` Route Restriction Not Tested

**File:** `backend/test/controllers/api/v1/matches_controller_test.rb`, lines 116-128
**Story Task:** Task 9, subtask: "Test no POST/PUT/DELETE routes exist for matches (FR27)"

The routing test checks `POST /api/v1/matches`, `PUT /api/v1/matches/1`, and `DELETE /api/v1/matches/1` but does not check `PATCH /api/v1/matches/1`. Rails REST routes include both `put` and `patch` for updates. While `resources :matches, only: [:index]` correctly excludes `patch` too, the test should verify this explicitly to fully cover FR27.

---

## Summary

| Severity | Count | Findings |
|----------|-------|----------|
| HIGH | 3 | F-1 (no DB unique index), F-2 (double SQL query), F-3 (incomplete null test) |
| MEDIUM | 4 | F-4 (seed vs fixture team name mismatch), F-5 (fragile test lookup), F-6 (seed update behavior), F-7 (missing model uniqueness validation) |
| LOW | 3 | F-8 (serializer nil guard inconsistency), F-9 (store re-throw pattern), F-10 (PATCH route not tested) |

**Total: 10 issues found.**

---

## Overall Assessment

The implementation is structurally sound and faithfully follows the story's architectural patterns (plain Ruby serializers, Authentication concern via ApplicationController, Pinia store composition API style, Minitest conventions). The core feature works correctly.

The two most impactful defects are:

1. **Missing database unique index (F-1 + F-7):** The idempotency guarantee relies entirely on application-level code with no database enforcement. For a production system where multiple processes might seed concurrently, or where future stories add match management tooling, this is a genuine data integrity risk.

2. **Double SQL query in controller (F-2):** Every call to `GET /api/v1/matches` executes two database queries when one suffices. As match count grows (36 now, potentially more groups later), this is wasteful.

The incomplete test coverage (F-3, F-10) represents tasks marked [x] that are not fully done — F-3 in particular omits assertions for 3 of 6 odds fields in the null serialization test.

---

## Recommended Story Status

**in-progress** — HIGH issues F-1 (no DB unique constraint), F-2 (double SQL query), F-3 (incomplete null test assertions), and F-7 (no model uniqueness validation) must be addressed before this story can be marked `done`.
