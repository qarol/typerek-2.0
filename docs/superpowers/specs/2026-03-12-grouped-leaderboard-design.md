# Grouped Leaderboard Design Spec

**Date:** 2026-03-12
**Status:** Draft
**Replaces:** Story 5.1 LeaderboardView (individual row per player)

---

## Problem

The current leaderboard renders one row per player using `LeaderboardRow`. With up to 50 players and standard competition ranking (1, 2, 2, 4…), early rounds produce many players sharing the same position. Showing 15 rows all labelled `#1` is noisy and hard to scan.

---

## Design Decision

Group players by position into **tier blocks**. Every position is a tier block — whether it contains 1 player or 20. The visual language is identical in both cases; the avatar grid simply wraps more or fewer circles.

---

## Visual Design

### Tier Block Structure

Each tier block has two parts:

**1. Tier header** — always visible
- Left border accent (4px) + subtle gradient wash to the right
- Ordinal position label (`1st`, `2nd`, `3rd`, `4th`…) — bold, coloured for top 3
- Points value — shown **once** for the whole group (e.g. `12.5 pts`)
- Player count pill badge — shown only when 2+ players share the position (e.g. `5 players`)

**2. Avatar grid** — wraps below the header
- 38px circles, initials, wrapping flex layout
- Movement badge (bottom-right of circle): `▲N` green / `▼N` red / `—` gray / hidden if no prior data
- Current user's avatar is always **first** in the grid, with a teal border and teal name

### Position Colour Accents (top 3 only)

| Position | Left border | Background tint | Label colour |
|----------|-------------|-----------------|--------------|
| 1st | `#f59e0b` amber | `#fffbeb` warm yellow | `#d97706` |
| 2nd | `#94a3b8` slate | `#f8fafc` cool gray | `#64748b` |
| 3rd | `#c2855a` bronze | `#fdf4ee` warm tan | `#c2855a` |
| 4th+ | `#e5e7eb` gray | `#fafafa` neutral | `#374151` |

### Avatar Spec

- **Size:** 38×38px circle
- **Background:** `#f3f4f6` default; `#f0fdfa` for current user
- **Border:** 2px transparent default; `#0d9488` teal for current user
- **Initials:** First character of nickname, 14px bold
- **Movement badge:** absolute, bottom-right of circle. Direction rule: "up" means `previousPosition > position` (lower rank number = better, e.g. was 3rd, now 1st → ▲2)
  - `▲N` (moved up, `previousPosition > position`) — green: `#10b981` text, `#bbf7d0` border, `#f0fdf4` bg
  - `▼N` (moved down, `previousPosition < position`) — red: `#ef4444` text, `#fecaca` border, `#fef2f2` bg
  - `—` (unchanged, `previousPosition === position`) — gray: `#9ca3af` text, `#e5e7eb` border
  - Hidden when `previousPosition === null` (no scoring event has occurred yet)
- **Name label:** 9px below circle, truncated with ellipsis at 48px width; `#0d9488` + bold for current user
- **Tap target:** tapping an avatar navigates to that player's history view (same behaviour as the current row tap in Story 5.1)

### Position Label Format

Ordinal suffix with superscript: `1<sup>st</sup>`, `2<sup>nd</sup>`, `3<sup>rd</sup>`, `4<sup>th</sup>`, `5<sup>th</sup>`…

---

## Component Architecture

### New component: `LeaderboardTier.vue`

Replaces `LeaderboardRow.vue` as the primary leaderboard unit.

```
Props:
  - position: number               — tier position number
  - totalPoints: number            — shared points for this tier
  - players: LeaderboardEntry[]    — all players at this position, current user first
  - currentUserId: number | null   — to identify and sort current user first

Emits:
  - navigate(userId: number)       — emitted when an avatar is tapped; parent (LeaderboardView) calls router.push to history view. Same pattern as Story 5.1's row click handler.
```

Internal logic:
- Compute `isFirst`, `isSecond`, `isThird` from `position` to apply accent class
- Sort `players` so current user appears first (if present in this tier)
- Compute ordinal suffix: `st` / `nd` / `rd` / `th`. English rule: 11, 12, 13 always take `th` regardless of last digit. All other numbers use last digit: 1→`st`, 2→`nd`, 3→`rd`, else `th`.
- Show player count badge only when `players.length >= 2`

### Updated: `LeaderboardView.vue`

- Group `store.standings` by `position` before rendering (array of `LeaderboardEntry[]` grouped by equal `position` value)
- Render one `<LeaderboardTier>` per group
- Remove `<LeaderboardRow>` usage

### Keep: `LeaderboardRow.vue`

No changes — `LeaderboardRow` is used elsewhere (admin views, history). Do not delete.

---

## Data & API

No backend changes required. The existing `GET /api/v1/leaderboard` response already provides `position`, `userId`, `nickname`, `totalPoints`, `previousPosition`. Grouping happens entirely in the frontend.

**Grouping logic** (in `LeaderboardView.vue` or a computed in the store):

```typescript
// Group entries by position
const tiers = computed(() => {
  const groups = new Map<number, LeaderboardEntry[]>()
  for (const entry of store.standings) {
    const group = groups.get(entry.position) ?? []
    group.push(entry)
    groups.set(entry.position, group)
  }
  return Array.from(groups.values())
})
```

Current user is sorted first within their tier inside `LeaderboardTier.vue`.

---

## Accessibility

- `role="list"` on the outer container, `role="listitem"` on each `LeaderboardTier`
- Each avatar button: `aria-label="View [nickname]'s history"`
- `tabindex="0"` on avatar circles, Enter/Space triggers navigation
- Movement badge: `aria-label="Moved up 2"` / `"Moved down 1"` / `"No change"` / omitted when null

---

## i18n Keys

**Existing keys that remain unchanged** (already in `en.json` / `pl.json`):
- `leaderboard.loading`, `leaderboard.empty`
- `leaderboard.moveUp` (`"▲{n}"`) — used as rendered display text in `LeaderboardRow`; keep as-is
- `leaderboard.moveDown` (`"▼{n}"`) — same
- `leaderboard.noChange` (`"—"`) — same
- `leaderboard.pointsFormat` (`"{points} pts"`) — note: key is `pointsFormat`, not `points`

**New keys to add:**

```json
"leaderboard": {
  "tierPlayerCount": "{count} players",
  "avatarHistoryLabel": "View {nickname}'s history",
  "moveUpLabel": "Moved up {n}",
  "moveDownLabel": "Moved down {n}",
  "noChangeLabel": "No change"
}
```

`moveUpLabel` / `moveDownLabel` / `noChangeLabel` are ARIA label strings only — separate from the display symbol keys (`moveUp` / `moveDown` / `noChange`). The badge renders the symbol from the existing display keys; the `aria-label` uses the new label keys.

`tierPlayerCount` is shown only when `players.length >= 2` so a singular form is never needed.

---

## What Changes vs Story 5.1

| | Story 5.1 (current) | This design |
|---|---|---|
| Component | `LeaderboardRow` per player | `LeaderboardTier` per position group |
| Points | Shown per row | Shown once per tier header |
| Position | `#1`, `#1`, `#1`… repeated | Shown once per tier header |
| Current user | Teal background row | Teal avatar border, always first in group |
| Movement | Text indicator in row | Badge on avatar circle |
| Tap target | Full row | Avatar circle |
| Backend | — | No change |

---

## Out of Scope

- Pinned "You" summary row at top (possible future enhancement)
- Collapsible tier groups
- Real-time updates
- Avatar photos (initials only for MVP)
