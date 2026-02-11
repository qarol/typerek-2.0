<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import { useMatchesStore } from '@/stores/matches'
import { useBetsStore } from '@/stores/bets'
import { sortMatchesForDisplay } from '@/utils/matchSorting'
import MatchCard from '@/components/match/MatchCard.vue'

const matchesStore = useMatchesStore()
const betsStore = useBetsStore()

onMounted(async () => {
  try {
    await Promise.all([matchesStore.fetchMatches(), betsStore.fetchBets()])
  } catch (error) {
    // Errors are stored in stores, display will show them
  }
})

const sortedMatches = computed(() => {
  return sortMatchesForDisplay(matchesStore.matches)
})

const groupedMatches = computed(() => {
  const groups: Record<string, typeof sortedMatches.value> = {}

  for (const match of sortedMatches.value) {
    const date = new Date(match.kickoffTime)
    // Use UTC date string for grouping to match Dev Notes spec: "Group by UTC date of kickoffTime"
    const dateKey = date.toISOString().split('T')[0]

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(match)
  }

  // Sort groups by date
  const sortedGroups: typeof groups = {}
  Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sortedGroups[key] = groups[key]
    })

  return sortedGroups
})

const dateLabels = computed(() => {
  return Object.keys(groupedMatches.value).map((dateKey) => {
    // Parse ISO date string (YYYY-MM-DD) back to UTC date for formatting
    const [year, month, day] = dateKey.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  })
})
</script>

<template>
  <div class="view-container">
    <div class="matches-view">
      <h1>{{ $t('nav.matches') }}</h1>

      <!-- Loading state -->
      <div v-if="matchesStore.loading" class="skeleton-container">
        <Skeleton v-for="i in 3" :key="i" height="80px" class="skeleton-card" />
      </div>

      <!-- Error state -->
      <div v-if="matchesStore.error && !matchesStore.loading" class="error-section">
        <Message
          severity="error"
          :text="$t(`errors.${matchesStore.error}`)"
          class="error-message"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="
          !matchesStore.loading &&
          matchesStore.matches.length === 0 &&
          !matchesStore.error
        "
        class="empty-state"
      >
        <p>{{ $t('matches.empty') }}</p>
      </div>

      <!-- Matches grouped by date -->
      <div v-if="!matchesStore.loading && matchesStore.matches.length > 0" class="matches-list">
        <template v-for="(dateKey, index) in Object.keys(groupedMatches)" :key="dateKey">
          <div class="date-group">
            <h2 class="date-header">{{ dateLabels[index] }}</h2>
            <div class="cards-container">
              <MatchCard v-for="match in groupedMatches[dateKey]" :key="match.id" :match="match" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matches-view {
  width: 100%;
}

.matches-view h1 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card {
  border-radius: 12px;
}

.error-section {
  margin-bottom: 1.25rem;
}

.error-message {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
  font-size: 0.9375rem;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-header {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
  padding: 0 8px;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Mobile layout */
.view-container {
  padding: 1rem;
  padding-bottom: 72px;
}

/* Desktop layout */
@media (min-width: 768px) {
  .view-container {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .matches-view h1 {
    font-size: 1.5rem;
  }
}
</style>
