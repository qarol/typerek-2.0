# Leaderboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the standings page with medal-colored rows (gold/silver/bronze), PrimeIcons badges, position-change arrow indicators, and a zero-state screen before any games are scored.

**Architecture:** `LeaderboardRow` handles individual row styling (medal class, badge, movement icon) based on props. `LeaderboardView` detects the zero-state condition and passes `isCoWinner` down. No backend changes needed — `previousPosition` is already in the API.

**Tech Stack:** Vue 3, PrimeIcons (already installed as `primeicons`), Vitest + Vue Test Utils

---

## Chunk 1: LeaderboardRow — medal styling + PrimeIcons

### Task 1: Update LeaderboardRow props and medal class logic

**Files:**
- Modify: `frontend/src/components/leaderboard/LeaderboardRow.vue`
- Modify: `frontend/src/components/leaderboard/LeaderboardRow.spec.ts`

- [ ] **Step 1: Add `isCoWinner` prop and update existing tests first**

Open `frontend/src/components/leaderboard/LeaderboardRow.spec.ts`.

The existing tests reference `.movement` class and use `▲`/`▼` text — these will break once we replace the text arrows with PrimeIcon elements. Update the movement tests to check for CSS classes instead of text content, and add the new prop to all `mount()` calls:

```typescript
// At the top of the file, update the createEntry helper call sites —
// add isCoWinner: false to all mount() props objects:
// props: { entry, isCurrentUser: false, isCoWinner: false }

// Replace the movement text-content tests with class-based checks:
describe('movement indicator', () => {
  it('renders up-arrow icon when player moved up', () => {
    const entry = createEntry({ position: 2, previousPosition: 5 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.movement-up').exists()).toBe(true)
    expect(wrapper.find('.pi-arrow-up').exists()).toBe(true)
  })

  it('renders down-arrow icon when player moved down', () => {
    const entry = createEntry({ position: 5, previousPosition: 2 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.movement-down').exists()).toBe(true)
    expect(wrapper.find('.pi-arrow-down').exists()).toBe(true)
  })

  it('renders dash when position unchanged', () => {
    const entry = createEntry({ position: 3, previousPosition: 3 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.movement-same').exists()).toBe(true)
  })

  it('renders "new" label when previousPosition is null', () => {
    const entry = createEntry({ position: 1, previousPosition: null })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.movement-new').exists()).toBe(true)
  })
})

describe('medal row class', () => {
  it('applies row-gold class for position 1', () => {
    const entry = createEntry({ position: 1 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.leaderboard-row').classes()).toContain('row-gold')
  })

  it('applies row-silver class for position 2', () => {
    const entry = createEntry({ position: 2 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.leaderboard-row').classes()).toContain('row-silver')
  })

  it('applies row-bronze class for position 3', () => {
    const entry = createEntry({ position: 3 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.leaderboard-row').classes()).toContain('row-bronze')
  })

  it('applies row-plain class for position 4+', () => {
    const entry = createEntry({ position: 4 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.leaderboard-row').classes()).toContain('row-plain')
  })

  it('applies row-you class when isCurrentUser (overrides medal)', () => {
    const entry = createEntry({ position: 1 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: true, isCoWinner: false }
    })
    expect(wrapper.find('.leaderboard-row').classes()).toContain('row-you')
    expect(wrapper.find('.leaderboard-row').classes()).not.toContain('row-gold')
  })
})

describe('badge', () => {
  it('shows crown icon for position 1', () => {
    const entry = createEntry({ position: 1 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.pi-crown').exists()).toBe(true)
  })

  it('shows crown icon for co-winner', () => {
    const entry = createEntry({ position: 1 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: true }
    })
    expect(wrapper.find('.pi-crown').exists()).toBe(true)
  })

  it('shows star-fill icon for position 2', () => {
    const entry = createEntry({ position: 2 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.pi-star-fill').exists()).toBe(true)
  })

  it('shows trophy icon for position 3', () => {
    const entry = createEntry({ position: 3 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.pi-trophy').exists()).toBe(true)
  })

  it('shows no badge icon for position 4+', () => {
    const entry = createEntry({ position: 4 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: false, isCoWinner: false }
    })
    expect(wrapper.find('.row-badge').exists()).toBe(false)
  })

  it('shows user icon badge when isCurrentUser', () => {
    const entry = createEntry({ position: 4 })
    const wrapper = mount(LeaderboardRow, {
      props: { entry, isCurrentUser: true, isCoWinner: false }
    })
    expect(wrapper.find('.pi-user').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && mise exec -- npm run test -- --reporter=verbose LeaderboardRow
```

Expected: multiple failures (new tests reference classes/elements that don't exist yet, and `isCoWinner` prop is unknown).

- [ ] **Step 3: Rewrite LeaderboardRow.vue**

Replace the entire file content:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/api/types'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  isCoWinner: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const { t } = useI18n()

// Row style class — current user always gets teal, overrides medal
const rowClass = computed(() => {
  if (props.isCurrentUser) return 'row-you'
  if (props.entry.position === 1) return 'row-gold'
  if (props.entry.position === 2) return 'row-silver'
  if (props.entry.position === 3) return 'row-bronze'
  return 'row-plain'
})

// Rank circle style class
const rankClass = computed(() => {
  if (props.isCurrentUser) return 'rank-you'
  if (props.entry.position === 1) return 'rank-gold'
  if (props.entry.position === 2) return 'rank-silver'
  if (props.entry.position === 3) return 'rank-bronze'
  return 'rank-plain'
})

// Badge config — icon + label. null = no badge shown
const badge = computed<{ icon: string; label: string; cssClass: string } | null>(() => {
  if (props.isCurrentUser) {
    return { icon: 'pi-user', label: t('leaderboard.you'), cssClass: 'badge-you' }
  }
  if (props.entry.position === 1) {
    const label = props.isCoWinner ? t('leaderboard.coWinner') : t('leaderboard.leader')
    return { icon: 'pi-crown', label, cssClass: 'badge-gold' }
  }
  if (props.entry.position === 2) {
    return { icon: 'pi-star-fill', label: t('leaderboard.secondPlace'), cssClass: 'badge-silver' }
  }
  if (props.entry.position === 3) {
    return { icon: 'pi-trophy', label: t('leaderboard.thirdPlace'), cssClass: 'badge-bronze' }
  }
  return null
})

// Movement — null means no previous position data
const movement = computed(() => {
  if (props.entry.previousPosition === null) return null
  const diff = props.entry.previousPosition - props.entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
})

const handleClick = () => {
  router.push({ name: 'history', params: { userId: props.entry.userId } })
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    role="listitem"
    class="leaderboard-row"
    :class="[rowClass, { 'is-current-user': isCurrentUser }]"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <!-- Rank circle -->
    <div class="rank-circle" :class="rankClass">
      {{ entry.position }}
    </div>

    <!-- Name + badge -->
    <div class="row-info">
      <div class="row-name">{{ entry.nickname }}</div>
      <div v-if="badge" class="row-badge" :class="badge.cssClass">
        <i class="pi" :class="badge.icon" />
        {{ badge.label }}
      </div>
    </div>

    <!-- Movement indicator -->
    <div class="movement">
      <template v-if="movement === null">
        <span class="movement-new">{{ $t('leaderboard.newPlayer') }}</span>
      </template>
      <template v-else-if="movement.type === 'up'">
        <span class="movement-up">
          <i class="pi pi-arrow-up" />{{ movement.value }}
        </span>
      </template>
      <template v-else-if="movement.type === 'down'">
        <span class="movement-down">
          <i class="pi pi-arrow-down" />{{ movement.value }}
        </span>
      </template>
      <template v-else>
        <span class="movement-same">—</span>
      </template>
    </div>

    <!-- Points -->
    <div class="points">{{ entry.totalPoints.toFixed(2) }}</div>
  </div>
</template>

<style scoped>
/* Layout */
.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.leaderboard-row:last-child { border-bottom: none; }
.leaderboard-row:hover { filter: brightness(0.97); }
.leaderboard-row:focus {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}

/* Medal row backgrounds */
.row-gold   { background: linear-gradient(135deg,#fef9c3,#fef08a); border-bottom-color: #fbbf24; }
.row-silver { background: linear-gradient(135deg,#f1f5f9,#e2e8f0); border-bottom-color: #94a3b8; }
.row-bronze { background: linear-gradient(135deg,#fff7ed,#fed7aa); border-bottom-color: #f97316; }
.row-you    { background: #f0fdfa; border-bottom-color: #99f6e4; }
.row-plain  { background: white; border-bottom-color: #f3f4f6; }

/* Rank circle */
.rank-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}
.rank-gold   { background: linear-gradient(135deg,#f59e0b,#d97706); color: white; box-shadow: 0 2px 6px rgba(245,158,11,.45); }
.rank-silver { background: linear-gradient(135deg,#94a3b8,#64748b); color: white; box-shadow: 0 2px 5px rgba(100,116,139,.35); }
.rank-bronze { background: linear-gradient(135deg,#d97706,#b45309); color: white; box-shadow: 0 2px 5px rgba(180,83,9,.35); }
.rank-you    { background: #0d9488; color: white; }
.rank-plain  { background: #e5e7eb; color: #6b7280; }

/* Row info */
.row-info {
  flex: 1;
  padding: 0 12px;
  overflow: hidden;
}
.row-name {
  font-weight: 700;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-gold   .row-name { color: #78350f; }
.row-silver .row-name { color: #1e293b; }
.row-bronze .row-name { color: #7c2d12; }
.row-you    .row-name { color: #134e4a; }
.row-plain  .row-name { color: #374151; font-weight: 500; }

/* Badge */
.row-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
}
.row-badge .pi { font-size: 11px; }
.badge-gold   { color: #b45309; }
.badge-silver { color: #64748b; }
.badge-bronze { color: #c2410c; }
.badge-you    { color: #0d9488; text-transform: uppercase; letter-spacing: .4px; font-size: 10px; }

/* Movement */
.movement {
  min-width: 38px;
  text-align: right;
  margin-right: 12px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.movement .pi { font-size: 11px; margin-right: 1px; }
.movement-up   { color: #10b981; }
.movement-down { color: #ef4444; }
.movement-same { color: #9ca3af; font-size: 14px; }
.movement-new  { color: #d1d5db; font-size: 10px; font-weight: 500; }

/* Points */
.points {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  font-size: 15px;
  min-width: 52px;
  text-align: right;
  flex-shrink: 0;
}
.row-gold   .points { color: #78350f; }
.row-silver .points { color: #334155; font-size: 14px; }
.row-bronze .points { color: #7c2d12; }
.row-you    .points { color: #134e4a; font-size: 14px; }
.row-plain  .points { color: #6b7280; font-size: 14px; }
</style>
```

- [ ] **Step 4: Run tests**

```bash
cd frontend && mise exec -- npm run test -- --reporter=verbose LeaderboardRow
```

Expected: all tests pass. The old `▲3` / `▼3` text tests are now replaced with class-based ones.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/leaderboard/LeaderboardRow.vue \
        frontend/src/components/leaderboard/LeaderboardRow.spec.ts
git commit -m "feat: redesign LeaderboardRow with medal rows and PrimeIcons"
```

---

## Chunk 2: i18n keys + LeaderboardView (zero-state, legend, isCoWinner)

### Task 2: Add i18n keys

**Files:**
- Modify: `frontend/src/locales/en.json`
- Modify: `frontend/src/locales/pl.json`

- [ ] **Step 1: Add keys to en.json**

Inside the `"leaderboard"` object, add after the existing keys:

```json
"leader": "Leader",
"coWinner": "Co-winner",
"secondPlace": "2nd place",
"thirdPlace": "3rd place",
"you": "You",
"newPlayer": "new",
"zeroState": "Season not started yet",
"zeroStateHint": "Standings will appear here once the first match result is entered.",
"playersRegistered": "{n} players registered",
"legend": {
  "up": "moved up",
  "down": "moved down",
  "same": "no change",
  "new": "first appearance"
}
```

- [ ] **Step 2: Add keys to pl.json**

Inside the `"leaderboard"` object, add after the existing keys:

```json
"leader": "Lider",
"coWinner": "Współzwycięzca",
"secondPlace": "2. miejsce",
"thirdPlace": "3. miejsce",
"you": "Ty",
"newPlayer": "nowy",
"zeroState": "Sezon jeszcze się nie rozpoczął",
"zeroStateHint": "Tabela pojawi się tutaj po wpisaniu pierwszego wyniku meczu.",
"playersRegistered": "{n} zarejestrowanych graczy",
"legend": {
  "up": "awans",
  "down": "spadek",
  "same": "bez zmian",
  "new": "pierwsze pojawienie"
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/locales/en.json frontend/src/locales/pl.json
git commit -m "feat: add leaderboard i18n keys for medals, zero-state and legend"
```

---

### Task 3: Update LeaderboardView

**Files:**
- Modify: `frontend/src/views/LeaderboardView.vue`

Note: LeaderboardView has no spec file currently. Add a new one.

- [ ] **Step 1: Create LeaderboardView spec**

Create `frontend/src/views/LeaderboardView.spec.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useLeaderboardStore } from '@/stores/leaderboard'
import LeaderboardView from './LeaderboardView.vue'
import type { LeaderboardEntry } from '@/api/types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' }
}))

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  position: 1, userId: 1, nickname: 'Player', totalPoints: 0, previousPosition: null,
  ...overrides
})

describe('LeaderboardView', () => {
  describe('isCoWinner computation', () => {
    it('passes isCoWinner=true when multiple entries share position 1', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1 }),
        makeEntry({ position: 1, userId: 2 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 10 }),
      ]
      store.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0].props('isCoWinner')).toBe(true)
      expect(rows[1].props('isCoWinner')).toBe(true)
      expect(rows[2].props('isCoWinner')).toBe(false)
    })

    it('passes isCoWinner=false when position 1 is unique', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 50 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 30 }),
      ]
      store.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0].props('isCoWinner')).toBe(false)
    })
  })

  describe('zero-state', () => {
    it('shows zero-state when all players have 0 points and no previousPosition', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 0, previousPosition: null }),
        makeEntry({ position: 1, userId: 2, totalPoints: 0, previousPosition: null }),
      ]
      store.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-zero-state').exists()).toBe(true)
      expect(wrapper.find('.leaderboard-list').exists()).toBe(false)
    })

    it('shows list when at least one player has points > 0', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10, previousPosition: null }),
        makeEntry({ position: 2, userId: 2, totalPoints: 0, previousPosition: null }),
      ]
      store.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-zero-state').exists()).toBe(false)
      expect(wrapper.find('.leaderboard-list').exists()).toBe(true)
    })
  })

  describe('legend', () => {
    it('shows legend when at least one entry has a non-null previousPosition', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 50, previousPosition: 2 }),
      ]
      store.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-legend').exists()).toBe(true)
    })

    it('hides legend when no entry has a previousPosition', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(LeaderboardView, { global: { plugins: [pinia] } })
      const store = useLeaderboardStore()
      store.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10, previousPosition: null }),
      ]
      store.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-legend').exists()).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd frontend && mise exec -- npm run test -- --reporter=verbose LeaderboardView
```

Expected: failures — `leaderboard-zero-state`, `leaderboard-list`, `leaderboard-legend` classes don't exist yet; `isCoWinner` prop not passed.

- [ ] **Step 3: Rewrite LeaderboardView.vue**

Replace the entire file:

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow.vue'

const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()

onMounted(async () => {
  await leaderboardStore.fetchLeaderboard()
})

// True when every player has 0 points and no previous position —
// meaning no match has been scored yet.
const isZeroState = computed(() =>
  leaderboardStore.standings.length > 0 &&
  leaderboardStore.standings.every(e => e.totalPoints === 0 && e.previousPosition === null)
)

// Set of userIds that share position 1 (more than one = co-winner)
const coWinnerUserIds = computed<Set<number>>(() => {
  const pos1 = leaderboardStore.standings.filter(e => e.position === 1)
  if (pos1.length > 1) return new Set(pos1.map(e => e.userId))
  return new Set()
})

// Show legend only when movement data exists (at least one previousPosition set)
const showLegend = computed(() =>
  leaderboardStore.standings.some(e => e.previousPosition !== null)
)
</script>

<template>
  <div class="view-container">
    <h1>{{ $t('nav.standings') }}</h1>

    <!-- Loading -->
    <div v-if="leaderboardStore.loading" class="state-message">
      {{ $t('leaderboard.loading') }}
    </div>

    <!-- Error -->
    <div v-else-if="leaderboardStore.error" class="state-message error">
      {{ $t(`errors.${leaderboardStore.error.code}`) }}
    </div>

    <!-- Empty (no players at all) -->
    <div v-else-if="leaderboardStore.standings.length === 0" class="state-message">
      {{ $t('leaderboard.empty') }}
    </div>

    <!-- Zero-state: all players exist but no games scored yet -->
    <div v-else-if="isZeroState" class="leaderboard-zero-state">
      <i class="pi pi-trophy zero-icon" />
      <p class="zero-title">{{ $t('leaderboard.zeroState') }}</p>
      <p class="zero-hint">{{ $t('leaderboard.zeroStateHint') }}</p>

      <div class="zero-divider">
        <span class="zero-divider-line" />
        <span class="zero-divider-label">
          {{ $t('leaderboard.playersRegistered', { n: leaderboardStore.standings.length }) }}
        </span>
        <span class="zero-divider-line" />
      </div>

      <div class="zero-avatars">
        <div
          v-for="entry in leaderboardStore.standings"
          :key="entry.userId"
          class="zero-avatar"
          :class="{ 'zero-avatar--you': entry.userId === authStore.user?.id }"
        >
          <div class="zero-avatar-circle">
            <i class="pi pi-user" />
          </div>
          <span class="zero-avatar-name">
            {{ entry.userId === authStore.user?.id ? $t('leaderboard.you') : entry.nickname }}
          </span>
        </div>
      </div>
    </div>

    <!-- Leaderboard list -->
    <template v-else>
      <ul role="list" class="leaderboard-list">
        <LeaderboardRow
          v-for="entry in leaderboardStore.standings"
          :key="entry.userId"
          :entry="entry"
          :isCurrentUser="entry.userId === authStore.user?.id"
          :isCoWinner="coWinnerUserIds.has(entry.userId)"
        />
      </ul>

      <!-- Legend — only when movement data is available -->
      <div v-if="showLegend" class="leaderboard-legend">
        <span><i class="pi pi-arrow-up move-up" /> {{ $t('leaderboard.legend.up') }}</span>
        <span><i class="pi pi-arrow-down move-down" /> {{ $t('leaderboard.legend.down') }}</span>
        <span class="legend-same">— {{ $t('leaderboard.legend.same') }}</span>
        <span class="legend-new">{{ $t('leaderboard.newPlayer') }} · {{ $t('leaderboard.legend.new') }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.view-container {
  padding: 16px;
}

.view-container h1 {
  margin-bottom: 24px;
}

.state-message {
  padding: 24px;
  text-align: center;
  color: #6b7280;
}
.state-message.error { color: #ef4444; }

/* List */
.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}

/* Legend */
.leaderboard-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 0 4px;
  font-size: 11px;
  color: #9ca3af;
}
.leaderboard-legend .pi { font-size: 11px; }
.move-up   { color: #10b981; }
.move-down { color: #ef4444; }
.legend-same { color: #9ca3af; }
.legend-new  { color: #d1d5db; }

/* Zero-state */
.leaderboard-zero-state {
  text-align: center;
  padding: 40px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}
.zero-icon {
  font-size: 48px;
  color: #e5e7eb;
  display: block;
  margin-bottom: 12px;
}
.zero-title {
  font-weight: 700;
  font-size: 16px;
  color: #374151;
  margin-bottom: 6px;
}
.zero-hint {
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
  max-width: 280px;
  margin: 0 auto;
}
.zero-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px 0 16px;
}
.zero-divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}
.zero-divider-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  white-space: nowrap;
}
.zero-avatars {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.zero-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.zero-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zero-avatar-circle .pi { color: #9ca3af; font-size: 14px; }
.zero-avatar--you .zero-avatar-circle {
  background: #0d9488;
}
.zero-avatar--you .zero-avatar-circle .pi { color: white; }
.zero-avatar-name {
  font-size: 10px;
  color: #9ca3af;
}
.zero-avatar--you .zero-avatar-name {
  color: #0d9488;
  font-weight: 600;
}
</style>
```

- [ ] **Step 4: Run all leaderboard tests**

```bash
cd frontend && mise exec -- npm run test -- --reporter=verbose LeaderboardRow LeaderboardView
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/LeaderboardView.vue \
        frontend/src/views/LeaderboardView.spec.ts
git commit -m "feat: add zero-state, co-winner logic and legend to LeaderboardView"
```

---

## Chunk 3: Run full checks

### Task 4: Verify everything passes

**Files:** none new

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && mise exec -- npm run test
```

Expected: all tests pass, no regressions.

- [ ] **Step 2: Run type-check**

```bash
cd frontend && mise exec -- npm run type-check
```

Expected: no TypeScript errors.

- [ ] **Step 3: Run lint**

```bash
cd frontend && mise exec -- npm run lint
```

Expected: no lint errors.

- [ ] **Step 4: Final commit if any lint fixes were auto-applied**

```bash
git add -p
git commit -m "chore: lint fixes after leaderboard redesign"
```

Only needed if lint made changes. Skip if clean.
