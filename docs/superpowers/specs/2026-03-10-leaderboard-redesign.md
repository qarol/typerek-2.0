# Leaderboard Redesign Spec

**Date:** 2026-03-10
**Status:** Approved

## Summary

Redesign the standings (`LeaderboardView` + `LeaderboardRow`) from a plain unstyled list into a medal-row design using PrimeIcons, with proper tie handling and a zero-state screen before the first scored game.

## Design Decisions

### Medal Rows — color by rank number (always)

| Position | Row background | Circle style | Badge icon | Badge text |
|---|---|---|---|---|
| 1 | gold gradient (`#fef9c3→#fef08a`, border `#fbbf24`) | `#f59e0b→#d97706` + shadow | `pi-crown` | "Leader" (unique) / "Co-winner" (tied) |
| 2 | silver gradient (`#f1f5f9→#e2e8f0`, border `#94a3b8`) | `#94a3b8→#64748b` + shadow | `pi-star-fill` | "2nd place" |
| 3 | bronze gradient (`#fff7ed→#fed7aa`, border `#f97316`) | `#d97706→#b45309` + shadow | `pi-trophy` | "3rd place" |
| 4+ | white, border `#f3f4f6` | `#e5e7eb`, text `#6b7280` | — | — |
| current user (any rank) | teal `#f0fdfa`, border `#99f6e4` | `#0d9488` | `pi-user` | "You" (uppercase, small) |

**Tie rule:** color is determined purely by position number. If 5 players share position 1, all 5 get the gold row. No exceptions.

**Co-winner label:** only shown when position === 1 AND multiple players share that position (detected client-side by checking if next/prev entry has same position).

### Movement Indicators

Positioned between nickname and points. Uses `previousPosition` field already returned by the API.

| State | Display | Color |
|---|---|---|
| moved up | `pi-arrow-up` + count (e.g. `▲2` → icon + "2") | `#10b981` |
| moved down | `pi-arrow-down` + count | `#ef4444` |
| no change | `—` (dash) | `#9ca3af` |
| `previousPosition === null` | `new` (text) | `#d1d5db` |

### Zero-State (before first scored game)

Condition: all `totalPoints === 0` AND all `previousPosition === null`.

Shows instead of the list:
- Large `pi-trophy` icon in `#e5e7eb` (muted)
- Heading: "Season not started yet" (i18n key: `leaderboard.zeroState`)
- Subtext: "Standings will appear here once the first match result is entered." (i18n key: `leaderboard.zeroStateHint`)
- Row of player avatar circles (`pi-user` icon) with nicknames — current user highlighted in teal

### Legend

Small row below the list:
- `pi-arrow-up` (green) moved up
- `pi-arrow-down` (red) moved down
- `—` no change
- `new` first appearance

Only shown when at least one entry has a non-null `previousPosition`.

## Files to Change

- `frontend/src/components/leaderboard/LeaderboardRow.vue` — medal styling, PrimeIcons, movement indicators
- `frontend/src/views/LeaderboardView.vue` — zero-state logic, legend, pass `isCoWinner` prop
- `frontend/src/locales/pl.json` + `en.json` — add `leaderboard.zeroState`, `leaderboard.zeroStateHint` i18n keys

## What Is NOT Changing

- Backend API — `previousPosition` already exists and works
- Routing / store / types — no changes needed
- Click-to-history navigation on rows — preserved as-is
