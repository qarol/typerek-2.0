<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useMatchesStore } from '@/stores/matches'
import { useBetsStore } from '@/stores/bets'
import { getMatchState } from '@/utils/matchSorting'
import type { Match, HistoryEntry } from '@/api/types'
import HistoryMatchCard from '@/components/history/HistoryMatchCard.vue'
import MatchCard from '@/components/match/MatchCard.vue'

const props = defineProps<{
  userId?: string
}>()

const router = useRouter()
const { t } = useI18n()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
const leaderboardStore = useLeaderboardStore()
const matchesStore = useMatchesStore()
const betsStore = useBetsStore()

const isOwnHistory = computed(() =>
  !props.userId || Number(props.userId) === authStore.user?.id
)

const playerNickname = computed(() => {
  if (isOwnHistory.value) return null
  const standing = leaderboardStore.standings.find(s => s.userId === Number(props.userId))
  return standing?.nickname ?? null
})

const pageTitle = computed(() => {
  if (isOwnHistory.value) return t('nav.history')
  return playerNickname.value ?? t('nav.history')
})

interface DayGroup {
  label: string
  matches: Match[]
}

function groupByDay(matches: Match[]): DayGroup[] {
  const groups: Record<string, Match[]> = {}
  for (const match of matches) {
    const dateKey = new Date(match.kickoffTime).toISOString().split('T')[0]!
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey]!.push(match)
  }
  return Object.keys(groups)
    .sort()
    .reverse()
    .map((dateKey) => {
      const [year, month, day] = dateKey.split('-').map(Number) as [number, number, number]
      const date = new Date(Date.UTC(year, month - 1, day))
      return {
        label: new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        }).format(date),
        matches: groups[dateKey]!.slice().sort(
          (a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime()
        ),
      }
    })
}

const matchGroups = computed(() => {
  const scored = matchesStore.matches.filter((m) => getMatchState(m) === 'scored')
  return groupByDay(scored)
})

interface HistoryDayGroup {
  label: string
  entries: HistoryEntry[]
}

const historyMatchGroups = computed((): HistoryDayGroup[] => {
  const groups: Record<string, HistoryEntry[]> = {}
  for (const entry of historyStore.entries) {
    const dateKey = new Date(entry.kickoffTime).toISOString().split('T')[0]!
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey]!.push(entry)
  }
  return Object.keys(groups)
    .sort()
    .reverse()
    .map((dateKey) => {
      const [year, month, day] = dateKey.split('-').map(Number) as [number, number, number]
      const date = new Date(Date.UTC(year, month - 1, day))
      return {
        label: new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        }).format(date),
        entries: groups[dateKey]!.slice().sort(
          (a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime()
        ),
      }
    })
})

onMounted(async () => {
  if (!isOwnHistory.value) {
    if (!leaderboardStore.standings.length) {
      try {
        await leaderboardStore.fetchLeaderboard()
      } catch {
        // standings unavailable — title will fall back gracefully
      }
    }
    const targetUserId = Number(props.userId)
    try {
      await historyStore.fetchHistory(targetUserId)
    } catch {
      // error already stored in historyStore.error; swallow to avoid unhandled rejection
    }
  } else {
    try {
      await Promise.all([matchesStore.fetchMatches(), betsStore.fetchBets()])
    } catch {
      // Errors are stored in stores, display will show them
    }
  }
})
</script>

<template>
  <!-- Other player's history -->
  <div v-if="!isOwnHistory" class="matches-wrapper">
    <div class="other-user-header">
      <button class="back-button" @click="router.back()" :aria-label="t('common.back')">
        <i class="pi pi-arrow-left" />
      </button>
      <h1 class="other-user-title">{{ pageTitle }}</h1>
    </div>

    <div v-if="historyStore.loading" class="skeleton-container">
      <Skeleton v-for="i in 5" :key="i" height="90px" class="skeleton-card" />
    </div>

    <div v-else-if="historyStore.error" class="error-section">
      <Message
        severity="error"
        :text="t(`errors.${historyStore.error.code}`, t('errors.UNKNOWN_ERROR'))"
      />
    </div>

    <div v-else-if="historyMatchGroups.length === 0" class="empty-state">
      <div class="empty-icon-wrap"><i class="pi pi-history" /></div>
      <p class="empty-text">{{ t('history.empty') }}</p>
    </div>

    <div v-else class="days-container">
      <template v-for="group in historyMatchGroups" :key="group.label">
        <h2 class="day-header">{{ group.label }}</h2>
        <div class="cards-list">
          <HistoryMatchCard
            v-for="entry in group.entries"
            :key="entry.matchId"
            :entry="entry"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Own history — card-based design matching Matches page -->
  <div v-else class="matches-wrapper">
    <!-- Loading state -->
    <div v-if="matchesStore.loading" class="skeleton-container">
      <Skeleton v-for="i in 5" :key="i" height="90px" class="skeleton-card" />
    </div>

    <!-- Error state -->
    <div v-if="matchesStore.error && !matchesStore.loading" class="error-section">
      <Message
        severity="error"
        :text="matchesStore.error.message || $t(`errors.${matchesStore.error.code}`)"
      />
    </div>

    <div v-if="!matchesStore.loading">
      <div
        v-if="matchGroups.length === 0 && !matchesStore.error"
        class="empty-state"
      >
        <div class="empty-icon-wrap"><i class="pi pi-history" /></div>
        <p class="empty-text">{{ $t('history.empty') }}</p>
      </div>

      <div v-else class="days-container">
        <template v-for="group in matchGroups" :key="group.label">
          <h2 class="day-header">{{ group.label }}</h2>
          <div class="cards-list">
            <MatchCard
              v-for="match in group.matches"
              :key="match.id"
              :match="match"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Other user header ── */
.other-user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.25rem;
  padding-top: 0.25rem;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f4;
  border: none;
  cursor: pointer;
  color: #0d9488;
  font-size: 0.875rem;
  flex-shrink: 0;
  transition: background 0.15s;
}

.back-button:hover {
  background: #e2ecea;
}

.other-user-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.375rem;
  font-weight: 800;
  color: #1a1c1c;
  letter-spacing: -0.02em;
  margin: 0;
  text-transform: uppercase;
}

/* ── Shared layout ── */
.matches-wrapper {
  padding: 1rem;
  padding-bottom: 80px;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 1rem;
}

.skeleton-card {
  border-radius: 12px;
}

.error-section {
  margin-bottom: 1.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  padding: 3.5rem 1rem;
  color: #6d7a77;
}

.empty-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0faf9;
  color: #0d9488;
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.empty-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  max-width: 260px;
  margin: 0;
}

.days-container {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
}

.day-header {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6d7a77;
  margin: 1.25rem 0 0.625rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.day-header:first-child {
  margin-top: 0;
}

.day-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(188, 201, 198, 0.35);
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .matches-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }

  .cards-list {
    gap: 10px;
  }

  .day-header {
    font-size: 0.75rem;
    margin: 1.75rem 0 0.75rem;
  }
}
</style>
