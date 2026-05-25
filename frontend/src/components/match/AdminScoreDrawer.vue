<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :position="isDesktop ? 'right' : 'bottom'"
    :style="isDesktop ? { width: '400px' } : { height: 'auto', maxHeight: '90dvh' }"
    :pt="{ content: { style: 'overflow-y: auto; padding: 1rem' } }"
  >
    <template #header>
      <span class="drawer-match-title">
        {{ match?.homeTeam }} <span class="vs">vs</span> {{ match?.awayTeam }}
      </span>
    </template>
    <form @submit.prevent="handleSave">
      <div ref="scoresContainerRef" class="scores-container" @keyup="checkInputsFilled" @paste="() => nextTick(checkInputsFilled)">
        <div class="score-field">
          <label for="homeScore">{{ match?.homeTeam }}</label>
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
          <label for="awayScore">{{ match?.awayTeam }}</label>
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchesStore } from '@/stores/matches'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Drawer from 'primevue/drawer'
import type { Match } from '@/api/types'

const props = defineProps<{
  match: Match | null
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { t } = useI18n()
const matchesStore = useMatchesStore()

const formData = ref({
  homeScore: null as number | null,
  awayScore: null as number | null,
})
const saving = ref(false)
const formError = ref('')
const showSuccess = ref(false)
const playersScored = ref(0)
const scoresContainerRef = ref<HTMLElement | null>(null)
const allInputsFilled = ref(false)

const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null
function onMediaChange(e: MediaQueryListEvent) { isDesktop.value = e.matches }

function checkInputsFilled() {
  const inputs = scoresContainerRef.value?.querySelectorAll<HTMLInputElement>('input') ?? []
  allInputsFilled.value = [...inputs].every(el => el.value.trim() !== '')
}

const isFormComplete = computed(
  () =>
    allInputsFilled.value ||
    (formData.value.homeScore !== null && formData.value.awayScore !== null)
)

function resetForm(match: typeof props.match) {
  if (match) {
    formData.value = { homeScore: match.homeScore, awayScore: match.awayScore }
    formError.value = ''
    showSuccess.value = false
    playersScored.value = 0
    allInputsFilled.value = false
    nextTick(checkInputsFilled)
  }
}

watch([() => props.match, () => props.visible], ([match, visible]) => {
  if (visible) resetForm(match)
}, { immediate: true })

const handleSave = async () => {
  if (!props.match || !isFormComplete.value) {
    formError.value = t('admin.scores.bothRequired')
    return
  }

  saving.value = true
  formError.value = ''

  const result = await matchesStore.submitMatchScore(
    props.match.id,
    formData.value.homeScore!,
    formData.value.awayScore!
  )

  saving.value = false

  if (result.success) {
    playersScored.value = result.playersScored || 0
    showSuccess.value = true
    successTimer = setTimeout(() => {
      showSuccess.value = false
      emit('update:visible', false)
    }, 1500)
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

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
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

.success-fade-enter-active,
.success-fade-leave-active {
  transition: opacity 0.3s ease;
}

.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
}
</style>
