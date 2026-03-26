# Grouped Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-player `LeaderboardRow` list with a grouped tier layout that clusters tied players into avatar grids, with gold/silver/bronze accents for top 3 positions.

**Architecture:** A new `LeaderboardTier.vue` component encapsulates one position group (header + avatar grid). `LeaderboardView.vue` groups the flat `standings` array by `position` and renders one `LeaderboardTier` per group, emitting navigation events up to the router. No backend changes.

**Tech Stack:** Vue 3 Composition API, TypeScript, vue-i18n, Vitest + Vue Test Utils, scoped CSS (no Tailwind, no new packages).

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `frontend/src/components/leaderboard/LeaderboardTier.vue` | New tier block component |
| **Create** | `frontend/src/components/leaderboard/LeaderboardTier.spec.ts` | Unit tests for LeaderboardTier |
| **Modify** | `frontend/src/views/LeaderboardView.vue` | Replace LeaderboardRow loop with LeaderboardTier, add grouping computed |
| **Modify** | `frontend/src/locales/en.json` | Add 5 new leaderboard i18n keys |
| **Modify** | `frontend/src/locales/pl.json` | Add 5 new leaderboard i18n keys (Polish) |
| **Keep unchanged** | `frontend/src/components/leaderboard/LeaderboardRow.vue` | Still used; do not touch |
| **Keep unchanged** | `frontend/src/components/leaderboard/LeaderboardRow.spec.ts` | All passing; do not touch |

---

## Chunk 1: i18n Keys + LeaderboardTier Component

### Task 1: Add i18n keys

**Files:**
- Modify: `frontend/src/locales/en.json`
- Modify: `frontend/src/locales/pl.json`

- [ ] **Step 1.1: Add keys to en.json**

Inside the existing `"leaderboard"` object, add after the last key:

```json
"tierPlayerCount": "{count} players",
"avatarHistoryLabel": "View {nickname}'s history",
"moveUpLabel": "Moved up {n}",
"moveDownLabel": "Moved down {n}",
"noChangeLabel": "No change"
```

- [ ] **Step 1.2: Add keys to pl.json**

Inside the existing `"leaderboard"` object, add after the last key:

```json
"tierPlayerCount": "{count} graczy",
"avatarHistoryLabel": "Zobacz historię gracza {nickname}",
"moveUpLabel": "Awans o {n}",
"moveDownLabel": "Spadek o {n}",
"noChangeLabel": "Bez zmian"
```

- [ ] **Step 1.3: Commit**

```bash
git add frontend/src/locales/en.json frontend/src/locales/pl.json
git commit -m "feat(i18n): add leaderboard tier keys for grouped view"
```

---

### Task 2: Create LeaderboardTier — failing tests first

**Files:**
- Create: `frontend/src/components/leaderboard/LeaderboardTier.spec.ts`
- Create: `frontend/src/components/leaderboard/LeaderboardTier.vue` (stub only at this step)

- [ ] **Step 2.1: Create a minimal stub so the test file can import it**

Create `frontend/src/components/leaderboard/LeaderboardTier.vue`:

```vue
<script setup lang="ts">
import type { LeaderboardEntry } from '@/api/types'
defineProps<{
  position: number
  totalPoints: number
  players: LeaderboardEntry[]
  currentUserId: number | null
}>()
defineEmits<{ navigate: [userId: number] }>()
</script>
<template><div class="leaderboard-tier"></div></template>
```

- [ ] **Step 2.2: Write all tests**

Create `frontend/src/components/leaderboard/LeaderboardTier.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LeaderboardTier from './LeaderboardTier.vue'
import type { LeaderboardEntry } from '@/api/types'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      leaderboard: {
        tierPlayerCount: '{count} players',
        avatarHistoryLabel: "View {nickname}'s history",
        moveUpLabel: 'Moved up {n}',
        moveDownLabel: 'Moved down {n}',
        noChangeLabel: 'No change',
      },
    },
  },
})

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  position: 1,
  userId: 1,
  nickname: 'Alice',
  totalPoints: 12.5,
  previousPosition: null,
  ...overrides,
})

const mountTier = (props: ConstructorParameters<typeof LeaderboardTier>[0]['propsData'] = {}) =>
  mount(LeaderboardTier, {
    props: {
      position: 1,
      totalPoints: 12.5,
      players: [makeEntry()],
      currentUserId: null,
      ...props,
    } as any,
    global: { plugins: [i18n] },
  })

describe('LeaderboardTier', () => {
  describe('tier accent classes', () => {
    it('applies tier-gold class for position 1', () => {
      const w = mountTier({ position: 1 })
      expect(w.find('.tier-head').classes()).toContain('tier-gold')
    })

    it('applies tier-silver class for position 2', () => {
      const w = mountTier({ position: 2 })
      expect(w.find('.tier-head').classes()).toContain('tier-silver')
    })

    it('applies tier-bronze class for position 3', () => {
      const w = mountTier({ position: 3 })
      expect(w.find('.tier-head').classes()).toContain('tier-bronze')
    })

    it('applies no medal class for position 4', () => {
      const w = mountTier({ position: 4 })
      const classes = w.find('.tier-head').classes()
      expect(classes).not.toContain('tier-gold')
      expect(classes).not.toContain('tier-silver')
      expect(classes).not.toContain('tier-bronze')
    })
  })

  describe('ordinal position label', () => {
    it('shows "1st" for position 1', () => {
      const w = mountTier({ position: 1 })
      expect(w.find('.tier-pos').text()).toContain('1')
      expect(w.find('.tier-pos').html()).toContain('st')
    })

    it('shows "2nd" for position 2', () => {
      const w = mountTier({ position: 2 })
      expect(w.find('.tier-pos').html()).toContain('nd')
    })

    it('shows "3rd" for position 3', () => {
      const w = mountTier({ position: 3 })
      expect(w.find('.tier-pos').html()).toContain('rd')
    })

    it('shows "4th" for position 4', () => {
      const w = mountTier({ position: 4 })
      expect(w.find('.tier-pos').html()).toContain('th')
    })

    it('shows "11th" not "11st" (English exception)', () => {
      const w = mountTier({ position: 11 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('st')
    })

    it('shows "12th" not "12nd"', () => {
      const w = mountTier({ position: 12 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('nd')
    })

    it('shows "13th" not "13rd"', () => {
      const w = mountTier({ position: 13 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('rd')
    })

    it('shows "21st" for position 21', () => {
      const w = mountTier({ position: 21 })
      expect(w.find('.tier-pos').html()).toContain('st')
    })
  })

  describe('player count badge', () => {
    it('hides count badge when only 1 player', () => {
      const w = mountTier({ players: [makeEntry()] })
      expect(w.find('.tier-count').exists()).toBe(false)
    })

    it('shows count badge when 2+ players', () => {
      const w = mountTier({
        players: [makeEntry({ userId: 1 }), makeEntry({ userId: 2, nickname: 'Bob' })],
      })
      expect(w.find('.tier-count').exists()).toBe(true)
      expect(w.find('.tier-count').text()).toContain('2')
    })
  })

  describe('avatar grid', () => {
    it('renders one avatar per player', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
        makeEntry({ userId: 3, nickname: 'Carol' }),
      ]
      const w = mountTier({ players })
      expect(w.findAll('.av-circle').length).toBe(3)
    })

    it('shows first letter of nickname uppercased in avatar', () => {
      const w = mountTier({ players: [makeEntry({ nickname: 'alice' })] })
      expect(w.find('.av-circle').text()).toContain('A')
    })
  })

  describe('current user', () => {
    it('applies av-circle--me class to current user avatar', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
      ]
      const w = mountTier({ players, currentUserId: 2 })
      const circles = w.findAll('.av-circle')
      // Current user (Bob, userId=2) should have --me class
      const meCircle = circles.find(c => c.classes().includes('av-circle--me'))
      expect(meCircle).toBeDefined()
    })

    it('places current user avatar first', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
        makeEntry({ userId: 3, nickname: 'Carol' }),
      ]
      const w = mountTier({ players, currentUserId: 2 })
      const names = w.findAll('.av-name').map(n => n.text())
      expect(names[0]).toContain('Bob')
    })

    it('applies av-name--me class to current user name', () => {
      const w = mountTier({
        players: [makeEntry({ userId: 5, nickname: 'Bob' })],
        currentUserId: 5,
      })
      expect(w.find('.av-name--me').exists()).toBe(true)
    })

    it('does not apply --me class when currentUserId is null', () => {
      const w = mountTier({ players: [makeEntry({ userId: 1 })], currentUserId: null })
      expect(w.find('.av-circle--me').exists()).toBe(false)
    })
  })

  describe('movement badge', () => {
    it('shows up badge when previousPosition > position (moved up)', () => {
      const w = mountTier({
        players: [makeEntry({ position: 2, previousPosition: 5 })],
      })
      expect(w.find('.av-badge--up').exists()).toBe(true)
      expect(w.find('.av-badge--up').text()).toContain('3') // diff = previousPosition - position = 5 - 2 = 3
    })

    it('shows correct up value', () => {
      const w = mountTier({
        players: [makeEntry({ position: 1, previousPosition: 4 })],
      })
      // diff = previousPosition - position = 4 - 1 = 3
      expect(w.find('.av-badge--up').text()).toContain('3')
    })

    it('shows down badge when previousPosition < position (moved down)', () => {
      const w = mountTier({
        players: [makeEntry({ position: 5, previousPosition: 2 })],
      })
      expect(w.find('.av-badge--dn').exists()).toBe(true)
      expect(w.find('.av-badge--dn').text()).toContain('3')
    })

    it('shows dash badge when position unchanged', () => {
      const w = mountTier({
        players: [makeEntry({ position: 3, previousPosition: 3 })],
      })
      expect(w.find('.av-badge--nc').exists()).toBe(true)
    })

    it('hides badge when previousPosition is null', () => {
      const w = mountTier({
        players: [makeEntry({ previousPosition: null })],
      })
      expect(w.find('.av-badge--up').exists()).toBe(false)
      expect(w.find('.av-badge--dn').exists()).toBe(false)
      expect(w.find('.av-badge--nc').exists()).toBe(false)
    })

    it('up badge has aria-label "Moved up N"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 1, previousPosition: 4 })],
      })
      // diff = 4 - 1 = 3
      expect(w.find('.av-badge--up').attributes('aria-label')).toBe('Moved up 3')
    })

    it('down badge has aria-label "Moved down N"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 5, previousPosition: 2 })],
      })
      // diff = |2 - 5| = 3
      expect(w.find('.av-badge--dn').attributes('aria-label')).toBe('Moved down 3')
    })

    it('no-change badge has aria-label "No change"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 3, previousPosition: 3 })],
      })
      expect(w.find('.av-badge--nc').attributes('aria-label')).toBe('No change')
    })
  })

  describe('accessibility', () => {
    it('has role="listitem" on root element', () => {
      const w = mountTier()
      expect(w.find('[role="listitem"]').exists()).toBe(true)
    })

    it('each avatar has tabindex="0"', () => {
      const w = mountTier({ players: [makeEntry({ userId: 1 }), makeEntry({ userId: 2, nickname: 'Bob' })] })
      w.findAll('.av-circle').forEach(c => {
        expect(c.attributes('tabindex')).toBe('0')
      })
    })

    it('each avatar has aria-label with nickname', () => {
      const w = mountTier({ players: [makeEntry({ nickname: 'Alice' })] })
      expect(w.find('.av-circle').attributes('aria-label')).toContain('Alice')
    })
  })

  describe('navigation', () => {
    it('emits navigate with userId when avatar is clicked', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 42 })] })
      await w.find('.av-circle').trigger('click')
      expect(w.emitted('navigate')).toBeTruthy()
      expect(w.emitted('navigate')![0]).toEqual([42])
    })

    it('emits navigate when Enter is pressed on avatar', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 7 })] })
      await w.find('.av-circle').trigger('keydown', { key: 'Enter' })
      expect(w.emitted('navigate')![0]).toEqual([7])
    })

    it('emits navigate when Space is pressed on avatar', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 7 })] })
      await w.find('.av-circle').trigger('keydown', { key: ' ' })
      expect(w.emitted('navigate')![0]).toEqual([7])
    })
  })
})
```

- [ ] **Step 2.3: Run tests — confirm they fail**

```bash
cd frontend && mise exec -- npm run test:unit -- LeaderboardTier.spec.ts
```

Expected: multiple FAIL — component is a stub.

---

### Task 3: Implement LeaderboardTier.vue

**Files:**
- Modify: `frontend/src/components/leaderboard/LeaderboardTier.vue`

- [ ] **Step 3.1: Implement the component**

Replace the stub with the full implementation:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/api/types'

const props = defineProps<{
  position: number
  totalPoints: number
  players: LeaderboardEntry[]
  currentUserId: number | null
}>()

const emit = defineEmits<{ navigate: [userId: number] }>()

const { t } = useI18n()

// ── Ordinal suffix ────────────────────────────────────────
function ordinalSuffix(n: number): string {
  // 11, 12, 13 always take 'th'
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const suffix = computed(() => ordinalSuffix(props.position))

// ── Accent class ─────────────────────────────────────────
const tierAccentClass = computed(() => {
  if (props.position === 1) return 'tier-gold'
  if (props.position === 2) return 'tier-silver'
  if (props.position === 3) return 'tier-bronze'
  return ''
})

// ── Sorted players: current user first ───────────────────
const sortedPlayers = computed(() => {
  if (props.currentUserId === null) return props.players
  return [...props.players].sort((a, b) => {
    if (a.userId === props.currentUserId) return -1
    if (b.userId === props.currentUserId) return 1
    return 0
  })
})

// ── Show count badge only when 2+ players ────────────────
const showCount = computed(() => props.players.length >= 2)

// ── Per-player helpers ───────────────────────────────────
function initial(nickname: string): string {
  return (nickname[0] ?? '?').toUpperCase()
}

function movement(entry: LeaderboardEntry) {
  if (entry.previousPosition === null) return null
  const diff = entry.previousPosition - entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
}

function avatarAriaLabel(nickname: string): string {
  return t('leaderboard.avatarHistoryLabel', { nickname })
}

function badgeAriaLabel(entry: LeaderboardEntry): string | undefined {
  const m = movement(entry)
  if (!m) return undefined
  if (m.type === 'up')   return t('leaderboard.moveUpLabel',   { n: m.value })
  if (m.type === 'down') return t('leaderboard.moveDownLabel', { n: m.value })
  return t('leaderboard.noChangeLabel')
}

function handleClick(userId: number) {
  emit('navigate', userId)
}

function handleKeydown(e: KeyboardEvent, userId: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('navigate', userId)
  }
}
</script>

<template>
  <div class="leaderboard-tier" role="listitem">

    <!-- Tier header -->
    <div class="tier-head" :class="tierAccentClass">
      <span class="tier-pos">
        {{ position }}<sup>{{ suffix }}</sup>
      </span>
      <div class="tier-meta">
        <span class="tier-pts">{{ $t('leaderboard.pointsFormat', { points: totalPoints }) }}</span>
        <span v-if="showCount" class="tier-count">
          {{ $t('leaderboard.tierPlayerCount', { count: players.length }) }}
        </span>
      </div>
    </div>

    <!-- Avatar grid -->
    <div class="tier-avatars">
      <div
        v-for="entry in sortedPlayers"
        :key="entry.userId"
        class="av-item"
      >
        <div
          class="av-circle"
          :class="{ 'av-circle--me': entry.userId === currentUserId }"
          tabindex="0"
          :aria-label="avatarAriaLabel(entry.nickname)"
          @click="handleClick(entry.userId)"
          @keydown="handleKeydown($event, entry.userId)"
        >
          {{ initial(entry.nickname) }}

          <!-- Movement badge -->
          <template v-if="movement(entry) !== null">
            <span
              v-if="movement(entry)!.type === 'up'"
              class="av-badge av-badge--up"
              :aria-label="badgeAriaLabel(entry)"
            >▲{{ movement(entry)!.value }}</span>
            <span
              v-else-if="movement(entry)!.type === 'down'"
              class="av-badge av-badge--dn"
              :aria-label="badgeAriaLabel(entry)"
            >▼{{ movement(entry)!.value }}</span>
            <span
              v-else
              class="av-badge av-badge--nc"
              :aria-label="badgeAriaLabel(entry)"
            >—</span>
          </template>
        </div>

        <span
          class="av-name"
          :class="{ 'av-name--me': entry.userId === currentUserId }"
        >{{ entry.nickname }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Tier block ──────────────────────────────────────────── */
.leaderboard-tier {
  border-bottom: 1px solid #e5e7eb;
}
.leaderboard-tier:last-child {
  border-bottom: none;
}

/* ── Tier header ─────────────────────────────────────────── */
.tier-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  border-left: 4px solid #e5e7eb;
  background: #fafafa;
}
.tier-gold   { border-left-color: #f59e0b; background: linear-gradient(90deg, #fffbeb 0%, #fafafa 65%); }
.tier-silver { border-left-color: #94a3b8; background: linear-gradient(90deg, #f8fafc 0%, #fafafa 65%); }
.tier-bronze { border-left-color: #c2855a; background: linear-gradient(90deg, #fdf4ee 0%, #fafafa 65%); }

.tier-pos {
  font-size: 16px;
  font-weight: 800;
  color: #374151;
  line-height: 1;
}
.tier-pos sup { font-size: 9px; font-weight: 700; }
.tier-gold   .tier-pos { color: #d97706; }
.tier-silver .tier-pos { color: #64748b; }
.tier-bronze .tier-pos { color: #c2855a; }

.tier-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tier-pts {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  font-variant-numeric: tabular-nums;
}
.tier-count {
  font-size: 10px;
  color: #9ca3af;
  background: #efefef;
  padding: 2px 7px;
  border-radius: 99px;
}

/* ── Avatar grid ─────────────────────────────────────────── */
.tier-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px 13px;
  background: white;
}

.av-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 48px;
}

.av-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  position: relative;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 0.12s ease;
  outline: none;
}
.av-circle:hover { filter: brightness(0.93); }
.av-circle:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: 2px;
}
.av-circle--me {
  background: #f0fdfa;
  border-color: #0d9488;
  color: #0d9488;
}

.av-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  font-size: 8px;
  font-weight: 800;
  background: white;
  border-radius: 99px;
  padding: 1px 3px;
  line-height: 1.2;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
  pointer-events: none;
}
.av-badge--up { color: #10b981; border-color: #bbf7d0; background: #f0fdf4; }
.av-badge--dn { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
.av-badge--nc { color: #9ca3af; border-color: #e5e7eb; }

.av-name {
  font-size: 9px;
  color: #6b7280;
  text-align: center;
  width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.av-name--me {
  color: #0d9488;
  font-weight: 700;
}
</style>
```

- [ ] **Step 3.2: Run tests — confirm they pass**

```bash
cd frontend && mise exec -- npm run test:unit -- LeaderboardTier.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 3.3: Commit**

```bash
git add frontend/src/components/leaderboard/LeaderboardTier.vue \
        frontend/src/components/leaderboard/LeaderboardTier.spec.ts
git commit -m "feat(leaderboard): add LeaderboardTier component with grouped avatar grid"
```

---

## Chunk 2: LeaderboardView Wiring

### Task 4: Update LeaderboardView to use LeaderboardTier

**Files:**
- Modify: `frontend/src/views/LeaderboardView.vue`

The view currently iterates `leaderboardStore.standings` flat and renders `<LeaderboardRow>` per entry. We need to:
1. Group standings by `position` into tiers
2. Replace the `<LeaderboardRow>` loop with `<LeaderboardTier>`
3. Remove computed properties that are no longer needed: `coWinnerUserIds`, `maxPoints`, `gapToPrevMap`, `hasPodiumDivider`
4. Add a `navigateToHistory` handler
5. Keep everything else: `isZeroState`, `tournamentPct`, loading/error/empty/zero-state templates, legend

- [ ] **Step 4.1: Replace the `<script setup>` section**

Replace the entire `<script setup>` block with:

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Skeleton from 'primevue/skeleton'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardTier from '@/components/leaderboard/LeaderboardTier.vue'
import type { LeaderboardEntry } from '@/api/types'

const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await leaderboardStore.fetchLeaderboard()
})

const isZeroState = computed(() =>
  leaderboardStore.standings.length > 0 &&
  leaderboardStore.standings.every(e => e.totalPoints === 0 && e.previousPosition === null)
)

const tournamentPct = computed(() => {
  if (!leaderboardStore.totalMatches) return 0
  return Math.round((leaderboardStore.scoredMatches / leaderboardStore.totalMatches) * 100)
})

// Group flat standings array into tiers by position
const tiers = computed(() => {
  const groups = new Map<number, LeaderboardEntry[]>()
  for (const entry of leaderboardStore.standings) {
    const group = groups.get(entry.position) ?? []
    group.push(entry)
    groups.set(entry.position, group)
  }
  return Array.from(groups.values())
})

const showLegend = computed(() =>
  leaderboardStore.standings.some(e => e.previousPosition !== null)
)

function navigateToHistory(userId: number) {
  router.push({ name: 'history', params: { userId } })
}
</script>
```

- [ ] **Step 4.2: Replace the leaderboard list template section**

Find this block in the template (inside `<template v-else>`):

```html
<Card class="list-card">
  <template #content>
    <ul role="list" class="leaderboard-list">
      <template v-for="(entry, index) in leaderboardStore.standings" :key="entry.userId">
        <LeaderboardRow
          :entry="entry"
          :isCurrentUser="entry.userId === authStore.user?.id"
          :isCoWinner="coWinnerUserIds.has(entry.userId)"
          :maxPoints="maxPoints"
          :gapToPrev="gapToPrevMap.get(entry.userId) ?? null"
        />
        <li
          v-if="hasPodiumDivider && entry.position <= 3 && index < leaderboardStore.standings.length - 1 && leaderboardStore.standings[index + 1]!.position > 3"
          class="podium-divider"
          role="separator"
          aria-hidden="true"
        />
      </template>
    </ul>
  </template>
</Card>
```

Replace with:

```html
<Card class="list-card">
  <template #content>
    <ul role="list" class="leaderboard-list">
      <LeaderboardTier
        v-for="tierPlayers in tiers"
        :key="tierPlayers[0]!.position"
        :position="tierPlayers[0]!.position"
        :totalPoints="tierPlayers[0]!.totalPoints"
        :players="tierPlayers"
        :currentUserId="authStore.user?.id ?? null"
        @navigate="navigateToHistory"
      />
    </ul>
  </template>
</Card>
```

- [ ] **Step 4.3: Remove the `podium-divider` CSS rule** (no longer used)

In the `<style scoped>` block, remove:

```css
/* ── Podium divider ─────────────────────────────────────── */
.podium-divider {
  list-style: none;
  height: 6px;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
```

- [ ] **Step 4.4: Run the full test suite**

```bash
cd frontend && mise exec -- npm run test:unit
```

Expected: all tests pass. Verify:
- `LeaderboardTier.spec.ts` — all pass
- `LeaderboardRow.spec.ts` — all still pass (unchanged component)

- [ ] **Step 4.5: Run type check**

```bash
cd frontend && mise exec -- npm run type-check
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add frontend/src/views/LeaderboardView.vue
git commit -m "feat(leaderboard): replace flat row list with grouped LeaderboardTier"
```

---

## Chunk 3: Manual Smoke Test

### Task 5: Verify visually in the browser

- [ ] **Step 5.1: Start the dev stack**

```bash
# Terminal 1 — backend
cd backend && mise exec -- bin/rails server

# Terminal 2 — frontend
cd frontend && mise exec -- npm run dev
```

Open http://localhost:5173

- [ ] **Step 5.2: Check leaderboard rendering**

Navigate to the Standings tab. Verify:
- [ ] Players grouped by position — one tier block per unique position value
- [ ] `1st`, `2nd`, `3rd` tier headers have gold/silver/bronze left border + gradient tint
- [ ] `4th`+ tier headers are neutral gray
- [ ] Player count badge appears when 2+ players share a position, hidden for solo
- [ ] Avatar circles show first letter of nickname, uppercased
- [ ] Current user appears first in their group with teal border
- [ ] Movement badges appear for players with a `previousPosition` (▲N green / ▼N red / — gray)
- [ ] No movement badge when `previousPosition` is null (new players / before first scoring)
- [ ] Tapping an avatar navigates to the history view for that player
- [ ] Loading skeleton, error, empty, and zero-state still display correctly

- [ ] **Step 5.3: Final commit**

```bash
git add -p   # review all changes once more
git commit -m "chore: finalize grouped leaderboard — smoke tested"
```

---

## Summary

| Task | Files | Tests |
|------|-------|-------|
| Task 1 — i18n keys | `en.json`, `pl.json` | — |
| Task 2 — failing tests | `LeaderboardTier.spec.ts`, `LeaderboardTier.vue` (stub) | write before code |
| Task 3 — implement component | `LeaderboardTier.vue` | all pass |
| Task 4 — wire view | `LeaderboardView.vue` | full suite passes |
| Task 5 — smoke test | — | manual |
