<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import { useMatchesStore } from '@/stores/matches'
import { useBetsStore } from '@/stores/bets'
import { getMatchState } from '@/utils/matchSorting'
import type { Match } from '@/api/types'
import MatchCard from '@/components/match/MatchCard.vue'

const matchesStore = useMatchesStore()
const betsStore = useBetsStore()

const STORAGE_KEY = 'lastSeenResultsCount'
const activeTab = ref('bet')

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

const openGroups = computed(() => {
  const sorted = matchesStore.matches
    .filter((m) => getMatchState(m) !== 'scored')
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
  return groupByDay(sorted)
})

const finishedGroups = computed(() => {
  const sorted = matchesStore.matches
    .filter((m) => getMatchState(m) === 'scored')
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())
  // Reverse day order so most recent day is first
  return groupByDay(sorted).reverse()
})

const finishedCount = computed(() =>
  matchesStore.matches.filter((m) => getMatchState(m) === 'scored').length,
)

const lastSeenResultsCount = ref(
  parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10),
)

const newResultsCount = computed(() =>
  Math.max(0, finishedCount.value - lastSeenResultsCount.value),
)

function onTabChange(value: string | number) {
  if (value === 'results') {
    lastSeenResultsCount.value = finishedCount.value
    localStorage.setItem(STORAGE_KEY, String(finishedCount.value))
  }
}
</script>

<template>
  <div class="view-container">
    <div class="matches-view">
      <!-- Loading state -->
      <div v-if="matchesStore.loading" class="skeleton-container">
        <Skeleton v-for="i in 6" :key="i" height="80px" class="skeleton-card" />
      </div>

      <!-- Error state -->
      <div v-if="matchesStore.error && !matchesStore.loading" class="error-section">
        <Message
          severity="error"
          :text="matchesStore.error.message || $t(`errors.${matchesStore.error.code}`)"
          class="error-message"
        />
      </div>

      <div v-if="!matchesStore.loading">
        <!-- Empty state -->
        <div
          v-if="matchesStore.matches.length === 0 && !matchesStore.error"
          class="empty-state"
        >
          <p>{{ $t('matches.empty') }}</p>
        </div>

        <Tabs v-else v-model:value="activeTab" @update:value="onTabChange">
          <TabList>
            <Tab value="bet">{{ $t('matches.tabs.bet') }}</Tab>
            <Tab value="results">
              {{ $t('matches.tabs.results') }}
              <span v-if="newResultsCount > 0" class="results-badge">
                {{ newResultsCount }}
              </span>
            </Tab>
          </TabList>

          <TabPanels>
            <!-- Bet now tab -->
            <TabPanel value="bet">
              <div v-if="openGroups.length === 0" class="empty-state">
                <p>{{ $t('matches.noOpenMatches') }}</p>
              </div>
              <div v-else class="days-container">
                <template v-for="group in openGroups" :key="group.label">
                  <h2 class="day-header">{{ group.label }}</h2>
                  <div class="cards-grid">
                    <MatchCard
                      v-for="match in group.matches"
                      :key="match.id"
                      :match="match"
                      :needs-bet="!betsStore.getBetForMatch(match.id)"
                    />
                  </div>
                </template>
              </div>
            </TabPanel>

            <!-- Results tab -->
            <TabPanel value="results">
              <div v-if="finishedGroups.length === 0" class="empty-state">
                <p>{{ $t('matches.noResults') }}</p>
              </div>
              <div v-else class="days-container">
                <template v-for="group in finishedGroups" :key="group.label">
                  <h2 class="day-header">{{ group.label }}</h2>
                  <div class="cards-grid">
                    <MatchCard
                      v-for="match in group.matches"
                      :key="match.id"
                      :match="match"
                    />
                  </div>
                </template>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matches-view {
  width: 100%;
}

.skeleton-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding-top: 1rem;
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

.results-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 3px;
  margin-left: 6px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  vertical-align: middle;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
}

.day-header {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin: 0 0 8px 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.day-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

/* Mobile layout */
.view-container {
  padding: 1rem;
  padding-bottom: 72px;
}

/* Desktop layout */
@media (min-width: 768px) {
  .view-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .skeleton-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
