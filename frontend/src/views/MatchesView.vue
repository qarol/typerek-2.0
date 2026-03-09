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

const openMatches = computed(() =>
  matchesStore.matches
    .filter((m) => getMatchState(m) !== 'scored')
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()),
)

const finishedMatches = computed(() =>
  matchesStore.matches
    .filter((m) => getMatchState(m) === 'scored')
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime()),
)

const lastSeenResultsCount = ref(
  parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10),
)

const newResultsCount = computed(() =>
  Math.max(0, finishedMatches.value.length - lastSeenResultsCount.value),
)

function onTabChange(value: string | number) {
  if (value === 'results') {
    lastSeenResultsCount.value = finishedMatches.value.length
    localStorage.setItem(STORAGE_KEY, String(finishedMatches.value.length))
  }
}
</script>

<template>
  <div class="view-container">
    <div class="matches-view">
      <!-- Loading state -->
      <div v-if="matchesStore.loading" class="skeleton-container">
        <Skeleton v-for="i in 3" :key="i" height="80px" class="skeleton-card" />
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

        <Tabs
          v-else
          v-model:value="activeTab"
          @update:value="onTabChange"
        >
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
              <div v-if="openMatches.length === 0" class="empty-state">
                <p>{{ $t('matches.noOpenMatches') }}</p>
              </div>
              <div v-else class="cards-container">
                <MatchCard
                  v-for="match in openMatches"
                  :key="match.id"
                  :match="match"
                  :needs-bet="!betsStore.getBetForMatch(match.id)"
                />
              </div>
            </TabPanel>

            <!-- Results tab -->
            <TabPanel value="results">
              <div v-if="finishedMatches.length === 0" class="empty-state">
                <p>{{ $t('matches.noResults') }}</p>
              </div>
              <div v-else class="cards-container">
                <MatchCard
                  v-for="match in finishedMatches"
                  :key="match.id"
                  :match="match"
                />
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

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 1rem;
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
}
</style>
