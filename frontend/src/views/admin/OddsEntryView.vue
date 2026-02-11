<template>
  <div class="view-container">
    <!-- Header -->
    <div class="odds-entry-header">
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        @click="router.push('/more')"
        :aria-label="t('admin.odds.backToMore')"
      />
      <h1>{{ t('admin.odds.title') }}</h1>
    </div>

    <!-- Match List -->
    <div class="content-card">
      <h2 v-if="matchesWithoutOdds.length > 0" class="list-count">
        {{ t('admin.odds.matchesRemaining', { count: matchesWithoutOdds.length }) }}
      </h2>
      <p v-else class="no-matches-message">{{ t('admin.odds.noMatchesNeeded') }}</p>
      <div class="match-list">
        <div
          v-for="match in matchesWithoutOdds"
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
            {{ t('admin.odds.kickoffTime', { time: formatTime(match.kickoffTime) }) }}
          </div>
          <div v-if="match.groupLabel" class="match-group">
            {{ t('admin.odds.groupLabel', { group: match.groupLabel }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Odds Drawer -->
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
        <div class="odds-grid">
          <div class="odds-field">
            <label for="oddsHome">{{ truncate(t('admin.odds.homeWin')) }}</label>
            <InputNumber
              id="oddsHome"
              v-model="formData.oddsHome"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
          <div class="odds-field">
            <label for="oddsDraw">{{ truncate(t('admin.odds.draw')) }}</label>
            <InputNumber
              id="oddsDraw"
              v-model="formData.oddsDraw"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
          <div class="odds-field">
            <label for="oddsAway">{{ truncate(t('admin.odds.awayWin')) }}</label>
            <InputNumber
              id="oddsAway"
              v-model="formData.oddsAway"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
          <div class="odds-field">
            <label for="oddsHomeDraw">{{ truncate(t('admin.odds.homeOrDraw')) }}</label>
            <InputNumber
              id="oddsHomeDraw"
              v-model="formData.oddsHomeDraw"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
          <div class="odds-field">
            <label for="oddsDrawAway">{{ truncate(t('admin.odds.drawOrAway')) }}</label>
            <InputNumber
              id="oddsDrawAway"
              v-model="formData.oddsDrawAway"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
          <div class="odds-field">
            <label for="oddsHomeAway">{{ truncate(t('admin.odds.homeOrAway')) }}</label>
            <InputNumber
              id="oddsHomeAway"
              v-model="formData.oddsHomeAway"
              :min="1.01" :max="99.99"
              :minFractionDigits="2" :maxFractionDigits="2"
              mode="decimal" inputmode="decimal"
              :placeholder="'1.00'" :disabled="saving"
            />
          </div>
        </div>

        <div v-if="formError" class="error-message">{{ formError }}</div>

        <Transition name="success-fade">
          <div v-if="showSuccess" class="success-indicator">
            <i class="pi pi-check"></i>
            {{ t('admin.odds.saved') }}
          </div>
        </Transition>

        <Button
          type="submit"
          :label="saving ? t('admin.odds.saving') : t('admin.odds.saveOdds')"
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
  oddsHome: null as number | null,
  oddsDraw: null as number | null,
  oddsAway: null as number | null,
  oddsHomeDraw: null as number | null,
  oddsDrawAway: null as number | null,
  oddsHomeAway: null as number | null,
})
const saving = ref(false)
const formError = ref('')
const showSuccess = ref(false)

const truncate = (str: string, n = 25) => str.length > n ? str.slice(0, n) + '…' : str

const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null
function onMediaChange(e: MediaQueryListEvent) { isDesktop.value = e.matches }
const drawerOpen = ref(false)

function selectMatch(match: Match) {
  selectedMatch.value = match
  drawerOpen.value = true
}

// Computed
const matchesWithoutOdds = computed(() =>
  matchesStore.matches
    .filter(
      (m) =>
        m.oddsHome === null ||
        m.oddsDraw === null ||
        m.oddsAway === null ||
        m.oddsHomeDraw === null ||
        m.oddsDrawAway === null ||
        m.oddsHomeAway === null
    )
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
)

const isFormComplete = computed(
  () =>
    formData.value.oddsHome &&
    formData.value.oddsDraw &&
    formData.value.oddsAway &&
    formData.value.oddsHomeDraw &&
    formData.value.oddsDrawAway &&
    formData.value.oddsHomeAway
)

// Watch for selectedMatch changes to update form
const updateForm = () => {
  if (selectedMatch.value) {
    formData.value = {
      oddsHome: selectedMatch.value.oddsHome,
      oddsDraw: selectedMatch.value.oddsDraw,
      oddsAway: selectedMatch.value.oddsAway,
      oddsHomeDraw: selectedMatch.value.oddsHomeDraw,
      oddsDrawAway: selectedMatch.value.oddsDrawAway,
      oddsHomeAway: selectedMatch.value.oddsHomeAway,
    }
    formError.value = ''
    showSuccess.value = false
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
    formError.value = t('admin.odds.allFieldsRequired')
    return
  }

  saving.value = true
  formError.value = ''

  const success = await matchesStore.updateMatchOdds(selectedMatch.value.id, {
    oddsHome: formData.value.oddsHome!,
    oddsDraw: formData.value.oddsDraw!,
    oddsAway: formData.value.oddsAway!,
    oddsHomeDraw: formData.value.oddsHomeDraw!,
    oddsDrawAway: formData.value.oddsDrawAway!,
    oddsHomeAway: formData.value.oddsHomeAway!,
  })

  saving.value = false

  if (success) {
    showSuccess.value = true

    // Auto-advance to next match after 2 seconds
    setTimeout(() => {
      const nextMatch = matchesWithoutOdds.value[0] || null
      if (nextMatch && nextMatch.id !== selectedMatch.value?.id) {
        selectedMatch.value = nextMatch
        updateForm()
      } else {
        showSuccess.value = false
      }
    }, 2000)
  } else {
    if (matchesStore.error?.field) {
      formError.value = `${matchesStore.error.message} (${matchesStore.error.field})`
    } else {
      formError.value = matchesStore.error?.message || t('admin.odds.saveFailed')
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

.odds-entry-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.odds-entry-header h1 {
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

.odds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 0.75rem;
}

@media (min-width: 768px) {
  .odds-grid {
    gap: 1.25rem 1rem;
  }
}

.odds-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.odds-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.odds-field :deep(input) {
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--p-surface-200);
  border-radius: 4px;
  font-size: 1rem;
}

.error-message {
  padding: 0.75rem 1rem;
  background: var(--p-red-50);
  color: var(--p-red-700);
  border-radius: 4px;
  border: 1px solid var(--p-red-200);
  font-size: 0.875rem;
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
