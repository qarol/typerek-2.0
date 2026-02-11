<template>
  <div class="view-container">
    <!-- Header -->
    <div class="score-entry-header">
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        @click="router.push('/more')"
        :aria-label="t('admin.scores.backToMore')"
      />
      <h1>{{ t('admin.scores.title') }}</h1>
    </div>

    <!-- Match List -->
    <div class="content-card">
      <h2 v-if="matchesNeedingScores.length > 0" class="list-count">
        {{ t('admin.scores.matchesRemaining', { count: matchesNeedingScores.length }) }}
      </h2>
      <p v-else class="no-matches-message">{{ t('admin.scores.noMatchesNeeded') }}</p>
      <div class="match-list">
        <div
          v-for="match in matchesNeedingScores"
          :key="match.id"
          class="match-item"
          :class="{ active: selectedMatch?.id === match.id }"
          @click="selectMatch(match)"
          role="button"
          tabindex="0"
          @keyup.enter="selectMatch(match)"
        >
          <div class="match-teams">
            {{ match.homeTeam }} <span class="vs">vs</span> {{ match.awayTeam }}
          </div>
          <div class="match-kickoff">
            {{ t('admin.scores.kickoffTime', { time: formatTime(match.kickoffTime) }) }}
          </div>
          <div v-if="match.groupLabel" class="match-group">
            {{ t('admin.scores.groupLabel', { group: match.groupLabel }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Score Drawer -->
    <Drawer
      v-model:visible="drawerOpen"
      :position="isDesktop ? 'right' : 'bottom'"
      :style="isDesktop ? { width: '400px' } : { height: 'auto', maxHeight: '90dvh' }"
      :pt="{ content: { style: 'overflow-y: auto; padding: 1rem' } }"
    >
      <template #header>
        <span class="drawer-match-title">
          {{ selectedMatch?.homeTeam }} <span class="vs">vs</span> {{ selectedMatch?.awayTeam }}
        </span>
      </template>
      <form @submit.prevent="handleSave">
        <div class="scores-container">
          <div class="score-field">
            <label for="homeScore">{{ selectedMatch?.homeTeam }}</label>
            <InputNumber
              id="homeScore"
              v-model="formData.homeScore"
              :min="0"
              :max="99"
              inputmode="numeric"
              placeholder="0"
              :disabled="saving"
            />
          </div>
          <div class="score-divider">:</div>
          <div class="score-field">
            <label for="awayScore">{{ selectedMatch?.awayTeam }}</label>
            <InputNumber
              id="awayScore"
              v-model="formData.awayScore"
              :min="0"
              :max="99"
              inputmode="numeric"
              placeholder="0"
              :disabled="saving"
            />
          </div>
        </div>

        <div v-if="formError" class="error-message">{{ formError }}</div>

        <Transition name="success-fade">
          <div v-if="showSuccess" class="success-indicator">
            <i class="pi pi-check"></i>
            {{ t('admin.scores.saved', { count: playersScored }) }}
          </div>
        </Transition>

        <Button
          type="submit"
          :label="saving ? t('admin.scores.saving') : t('admin.scores.saveScore')"
          :loading="saving"
          :disabled="saving || !isFormComplete"
          class="save-button"
        />
      </form>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMatchesStore } from '@/stores/matches'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Drawer from 'primevue/drawer'
import type { Match } from '@/api/types'

const router = useRouter()
const { t } = useI18n()
const matchesStore = useMatchesStore()
const authStore = useAuthStore()

// State
const selectedMatch = ref<Match | null>(null)
const formData = ref({
  homeScore: null as number | null,
  awayScore: null as number | null,
})
const saving = ref(false)
const formError = ref('')
const showSuccess = ref(false)
const playersScored = ref(0)

const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null
function onMediaChange(e: MediaQueryListEvent) { isDesktop.value = e.matches }
const drawerOpen = ref(false)

function selectMatch(match: Match) {
  selectedMatch.value = match
  drawerOpen.value = true
}

// Computed
const matchesNeedingScores = computed(() =>
  matchesStore.matches
    .filter(
      (m) =>
        new Date(m.kickoffTime) < new Date() && m.homeScore === null
    )
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())
)

const isFormComplete = computed(
  () =>
    formData.value.homeScore !== null &&
    formData.value.awayScore !== null
)

// Watch for selectedMatch changes to update form
const updateForm = () => {
  if (selectedMatch.value) {
    formData.value = {
      homeScore: selectedMatch.value.homeScore,
      awayScore: selectedMatch.value.awayScore,
    }
    formError.value = ''
    showSuccess.value = false
    playersScored.value = 0
  }
}

// Methods
const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString(authStore.language === 'pl' ? 'pl-PL' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleSave = async () => {
  if (!selectedMatch.value || !isFormComplete.value) {
    formError.value = t('admin.scores.bothRequired')
    return
  }

  saving.value = true
  formError.value = ''

  const result = await matchesStore.submitMatchScore(
    selectedMatch.value.id,
    formData.value.homeScore!,
    formData.value.awayScore!
  )

  saving.value = false

  if (result.success) {
    playersScored.value = result.playersScored || 0
    showSuccess.value = true

    // Auto-advance to next match after 2 seconds
    setTimeout(() => {
      const nextMatch = matchesNeedingScores.value[0] || null
      if (nextMatch && nextMatch.id !== selectedMatch.value?.id) {
        selectedMatch.value = nextMatch
        updateForm()
      } else {
        // No more matches: clear form and close drawer
        showSuccess.value = false
        drawerOpen.value = false
        selectedMatch.value = null
      }
    }, 2000)
  } else {
    if (matchesStore.error?.code === 'SCORE_LOCKED') {
      formError.value = t('admin.scores.scoreLocked')
    } else if (matchesStore.error?.field) {
      formError.value = `${matchesStore.error.message} (${matchesStore.error.field})`
    } else {
      formError.value = matchesStore.error?.message || t('admin.scores.saveFailed')
    }
  }
}

// Load matches on component mount
onMounted(async () => {
  if (matchesStore.matches.length === 0) {
    await matchesStore.fetchMatches()
  }

  mediaQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})

// Watch for selectedMatch changes
watch(selectedMatch, updateForm, { immediate: true })
</script>

<style scoped>
.content-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

@media (min-width: 768px) {
  .content-card {
    padding: 1.5rem;
  }
}

.score-entry-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.score-entry-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.list-count {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.no-matches-message {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--p-text-muted-color);
  font-style: italic;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.match-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--p-surface-200);
  cursor: pointer;
  transition: all 0.15s ease;
  background: transparent;
}

.match-item:last-child {
  border-bottom: none;
}

.match-item:hover {
  background: var(--p-surface-50);
}

.match-item.active {
  background: var(--p-primary-50);
  color: var(--p-primary-700);
}

.match-teams {
  font-weight: 600;
  font-size: 0.9375rem;
}

.match-teams .vs {
  margin: 0 0.5rem;
  opacity: 0.7;
}

.match-kickoff,
.match-group {
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}

.drawer-match-title {
  font-weight: 600;
  font-size: 1rem;
}

.drawer-match-title .vs {
  margin: 0 0.5rem;
  opacity: 0.7;
}

.scores-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .scores-container {
    gap: 1rem;
  }
}

.score-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.score-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.score-field :deep(input) {
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--p-surface-200);
  border-radius: 4px;
  font-size: 1rem;
  text-align: center;
}

.score-divider {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  margin-bottom: 0.5rem;
}

.error-message {
  padding: 0.75rem 1rem;
  background: var(--p-red-50);
  color: var(--p-red-700);
  border-radius: 4px;
  border: 1px solid var(--p-red-200);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--p-green-50);
  color: var(--p-green-700);
  border-radius: 4px;
  border: 1px solid var(--p-green-200);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.success-indicator i {
  font-size: 1rem;
}

.save-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 1rem;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Success fade animation */
.success-fade-enter-active,
.success-fade-leave-active {
  transition: opacity 0.3s ease;
}

.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
}
</style>
