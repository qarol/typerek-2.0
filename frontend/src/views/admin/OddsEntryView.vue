<template>
  <div class="odds-entry-container">
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

    <!-- Main Content -->
    <div class="odds-entry-layout">
      <!-- Match List (Left/Top) -->
      <div class="odds-entry-matches">
        <h2 v-if="matchesWithoutOdds.length > 0">
          {{ t('admin.odds.matchesRemaining', { count: matchesWithoutOdds.length }) }}
        </h2>
        <p v-else class="no-matches-message">{{ t('admin.odds.noMatchesNeeded') }}</p>

        <div class="match-list">
          <div
            v-for="match in matchesWithoutOdds"
            :key="match.id"
            class="match-item"
            :class="{ active: selectedMatch?.id === match.id }"
            @click="selectedMatch = match"
            role="button"
            tabindex="0"
            @keyup.enter="selectedMatch = match"
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

      <!-- Odds Form (Right/Bottom) -->
      <div class="odds-entry-form" v-if="selectedMatch">
        <div class="form-header">
          <div class="match-header">
            {{ t('admin.odds.matchHeader', { home: selectedMatch.homeTeam, away: selectedMatch.awayTeam }) }}
          </div>
        </div>

        <form @submit.prevent="handleSave">
          <div class="odds-grid">
            <div class="odds-field">
              <label for="oddsHome">{{ t('admin.odds.homeWin') }}</label>
              <InputNumber
                id="oddsHome"
                v-model="formData.oddsHome"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>

            <div class="odds-field">
              <label for="oddsDraw">{{ t('admin.odds.draw') }}</label>
              <InputNumber
                id="oddsDraw"
                v-model="formData.oddsDraw"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>

            <div class="odds-field">
              <label for="oddsAway">{{ t('admin.odds.awayWin') }}</label>
              <InputNumber
                id="oddsAway"
                v-model="formData.oddsAway"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>

            <div class="odds-field">
              <label for="oddsHomeDraw">{{ t('admin.odds.homeOrDraw') }}</label>
              <InputNumber
                id="oddsHomeDraw"
                v-model="formData.oddsHomeDraw"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>

            <div class="odds-field">
              <label for="oddsDrawAway">{{ t('admin.odds.drawOrAway') }}</label>
              <InputNumber
                id="oddsDrawAway"
                v-model="formData.oddsDrawAway"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>

            <div class="odds-field">
              <label for="oddsHomeAway">{{ t('admin.odds.homeOrAway') }}</label>
              <InputNumber
                id="oddsHomeAway"
                v-model="formData.oddsHomeAway"
                :min="1.01"
                :max="99.99"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                inputmode="decimal"
                :placeholder="'1.00'"
                :disabled="saving"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="formError" class="error-message">
            {{ formError }}
          </div>

          <!-- Success Indicator -->
          <Transition name="success-fade">
            <div v-if="showSuccess" class="success-indicator">
              <i class="pi pi-check"></i>
              {{ t('admin.odds.saved') }}
            </div>
          </Transition>

          <!-- Save Button -->
          <Button
            type="submit"
            :label="saving ? t('admin.odds.saving') : t('admin.odds.saveOdds')"
            :loading="saving"
            :disabled="saving || !isFormComplete"
            class="save-button"
          />
        </form>
      </div>

      <!-- Empty State -->
      <div v-else class="odds-entry-empty">
        <p>{{ t('admin.odds.selectMatch') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMatchesStore } from '@/stores/matches'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
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
})

// Watch for selectedMatch changes
watch(selectedMatch, updateForm, { immediate: true })
</script>

<style scoped>
.odds-entry-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
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

.odds-entry-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.odds-entry-matches {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.odds-entry-matches h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.no-matches-message {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
}

.match-item {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--surface-card);
}

.match-item:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
}

.match-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.match-teams {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.match-teams .vs {
  margin: 0 0.5rem;
  opacity: 0.7;
}

.match-kickoff,
.match-group {
  font-size: 0.875rem;
  opacity: 0.75;
}

.odds-entry-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.match-header {
  font-size: 1.125rem;
  font-weight: 600;
}

.odds-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.odds-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.odds-field label {
  font-size: 0.875rem;
  font-weight: 500;
}

.odds-field :deep(input) {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  font-size: 1rem;
}

.error-message {
  padding: 0.75rem 1rem;
  background: var(--red-50);
  color: var(--red-700);
  border-radius: 4px;
  border: 1px solid var(--red-200);
  font-size: 0.875rem;
}

.success-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--green-50);
  color: var(--green-700);
  border-radius: 4px;
  border: 1px solid var(--green-200);
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
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.odds-entry-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
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

/* Responsive */
@media (max-width: 768px) {
  .odds-entry-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .odds-grid {
    grid-template-columns: 1fr;
  }

  .match-list {
    max-height: 300px;
  }

  .odds-entry-form {
    padding: 1rem;
  }
}
</style>
