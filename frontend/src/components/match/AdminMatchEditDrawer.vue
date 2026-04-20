<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :position="isDesktop ? 'right' : 'bottom'"
    :style="isDesktop ? { width: '400px' } : { height: 'auto', maxHeight: '90dvh' }"
    :pt="{ content: { style: 'overflow-y: auto; padding: 1rem' } }"
  >
    <template #header>
      <span class="drawer-match-title">{{ t('admin.matchEdit.title') }}</span>
    </template>
    <form @submit.prevent="handleSave">
      <div class="fields">
        <div class="field">
          <label for="homeTeam">{{ t('admin.matchEdit.homeTeam') }}</label>
          <InputText
            id="homeTeam"
            v-model="formData.homeTeam"
            :disabled="saving"
            class="full-width"
          />
        </div>
        <div class="field">
          <label for="awayTeam">{{ t('admin.matchEdit.awayTeam') }}</label>
          <InputText
            id="awayTeam"
            v-model="formData.awayTeam"
            :disabled="saving"
            class="full-width"
          />
        </div>
        <div class="field">
          <label for="kickoffTime">{{ t('admin.matchEdit.kickoffTime') }}</label>
          <input
            id="kickoffTime"
            type="datetime-local"
            v-model="formData.kickoffTimeLocal"
            :disabled="saving"
            class="datetime-input"
          />
        </div>
      </div>

      <div v-if="formError" class="error-message">{{ formError }}</div>

      <Transition name="success-fade">
        <div v-if="showSuccess" class="success-indicator">
          <i class="pi pi-check"></i>
          {{ t('admin.matchEdit.saved') }}
        </div>
      </Transition>

      <Button
        type="submit"
        :label="saving ? t('admin.matchEdit.saving') : t('admin.matchEdit.save')"
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
import InputText from 'primevue/inputtext'
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
  homeTeam: '',
  awayTeam: '',
  kickoffTimeLocal: '',
})
const saving = ref(false)
const formError = ref('')
const showSuccess = ref(false)

const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null
function onMediaChange(e: MediaQueryListEvent) { isDesktop.value = e.matches }

const isFormComplete = computed(
  () => formData.value.homeTeam.trim() !== '' &&
        formData.value.awayTeam.trim() !== '' &&
        formData.value.kickoffTimeLocal !== ''
)

function toLocalDatetimeInput(utcIso: string): string {
  const dt = new Date(utcIso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function resetForm(match: typeof props.match) {
  if (match) {
    formData.value = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoffTimeLocal: toLocalDatetimeInput(match.kickoffTime),
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
    formError.value = t('admin.matchEdit.allFieldsRequired')
    return
  }

  saving.value = true
  formError.value = ''

  const success = await matchesStore.updateMatchDetails(props.match.id, {
    homeTeam: formData.value.homeTeam.trim(),
    awayTeam: formData.value.awayTeam.trim(),
    kickoffTime: new Date(formData.value.kickoffTimeLocal).toISOString(),
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
      : matchesStore.error?.message || t('admin.matchEdit.saveFailed')
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

.fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.full-width {
  width: 100%;
}

.datetime-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--p-surface-200);
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  color: var(--p-text-color);
  background: var(--p-surface-0);
  box-sizing: border-box;
}

.datetime-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
