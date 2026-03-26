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
import type { Match } from '@/api/types'
import HistoryMatchEntry from '@/components/history/HistoryMatchEntry.vue'
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
  <!-- Other player's history — unchanged -->
  <div v-if="!isOwnHistory" class="view-container">
    <div class="history-header">
      <button class="back-button" @click="router.back()" :aria-label="t('common.back')">←</button>
      <h1>{{ pageTitle }}</h1>
    </div>
    <div v-if="historyStore.loading" class="history-loading">{{ t('history.loading') }}</div>
    <div v-else-if="historyStore.error" class="history-error">
      {{ t(`errors.${historyStore.error.code}`, t('errors.UNKNOWN_ERROR')) }}
    </div>
    <div v-else-if="historyStore.entries.length === 0" class="history-empty">
      {{ t('history.empty') }}
    </div>
    <ul v-else role="list" class="history-list">
      <HistoryMatchEntry
        v-for="entry in historyStore.entries"
        :key="entry.matchId"
        :entry="entry"
      />
    </ul>
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
        <p>{{ $t('history.empty') }}</p>
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
/* ── Other player history (unchanged) ── */
.view-container {
  padding: 1rem;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.history-header h1 {
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #0d9488;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-loading,
.history-error,
.history-empty {
  padding: 2rem 0;
  text-align: center;
  color: #64748b;
}

/* ── Own history — matches-style layout ── */
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
  text-align: center;
  padding: 3rem 1rem;
  color: #6d7a77;
  font-size: 0.9375rem;
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
