<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import { useMatchesStore } from '@/stores/matches'
import { useBetsStore } from '@/stores/bets'
import { getMatchState } from '@/utils/matchSorting'
import type { Match } from '@/api/types'
import MatchCard from '@/components/match/MatchCard.vue'

const matchesStore = useMatchesStore()
const betsStore = useBetsStore()

onMounted(async () => {
  try {
    await Promise.all([matchesStore.fetchMatches(), betsStore.fetchBets()])
  } catch {
    // Errors are stored in stores, display will show them
  }
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
        matches: groups[dateKey]!,
      }
    })
}

// Only show open + locked matches; scored matches belong to History
const matchGroups = computed(() => {
  const sorted = matchesStore.matches
    .filter((m) => getMatchState(m) !== 'scored')
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
  return groupByDay(sorted)
})
</script>

<template>
  <div class="matches-wrapper">
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
        <p>{{ $t('matches.empty') }}</p>
      </div>

      <div v-else class="days-container">
        <template v-for="group in matchGroups" :key="group.label">
          <h2 class="day-header">{{ group.label }}</h2>
          <div class="cards-list">
            <MatchCard
              v-for="match in group.matches"
              :key="match.id"
              :match="match"
              :needs-bet="getMatchState(match) === 'open' && !betsStore.getBetForMatch(match.id)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
