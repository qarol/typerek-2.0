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
      <div class="odds-grid">
        <div class="odds-field">
          <label for="oddsHome">{{ truncate(t('admin.odds.homeWin')) }}</label>
          <InputNumber
            id="oddsHome"
            v-model="formData.oddsHome"
            :min="1.01" :max="99.99"
            :minFractionDigits="2" :maxFractionDigits="2"
            mode="decimal" inputmode="decimal"
            placeholder="1.00" :disabled="saving"
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
            placeholder="1.00" :disabled="saving"
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
            placeholder="1.00" :disabled="saving"
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
            placeholder="1.00" :disabled="saving"
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
            placeholder="1.00" :disabled="saving"
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
            placeholder="1.00" :disabled="saving"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null
function onMediaChange(e: MediaQueryListEvent) { isDesktop.value = e.matches }

const truncate = (str: string, n = 25) => str.length > n ? str.slice(0, n) + '…' : str

const isFormComplete = computed(
  () =>
    formData.value.oddsHome &&
    formData.value.oddsDraw &&
    formData.value.oddsAway &&
    formData.value.oddsHomeDraw &&
    formData.value.oddsDrawAway &&
    formData.value.oddsHomeAway
)

function resetForm(match: typeof props.match) {
  if (match) {
    formData.value = {
      oddsHome: match.oddsHome,
      oddsDraw: match.oddsDraw,
      oddsAway: match.oddsAway,
      oddsHomeDraw: match.oddsHomeDraw,
      oddsDrawAway: match.oddsDrawAway,
      oddsHomeAway: match.oddsHomeAway,
    }
    formError.value = ''
    showSuccess.value = false
  }
}

watch([() => props.match, () => props.visible], ([match, visible]) => {
  if (visible) resetForm(match)
}, { immediate: true })

const handleSave = async () => {
  if (!props.match || !isFormComplete.value) {
    formError.value = t('admin.odds.allFieldsRequired')
    return
  }

  saving.value = true
  formError.value = ''

  const success = await matchesStore.updateMatchOdds(props.match.id, {
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
    successTimer = setTimeout(() => {
      showSuccess.value = false
      emit('update:visible', false)
    }, 1500)
  } else {
    formError.value = matchesStore.error?.field
      ? `${matchesStore.error.message} (${matchesStore.error.field})`
      : matchesStore.error?.message || t('admin.odds.saveFailed')
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
  margin-top: 1rem;
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
  margin-top: 1rem;
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
