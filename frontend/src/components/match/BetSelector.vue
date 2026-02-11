<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useBetsStore } from '@/stores/bets'
import type { Match } from '@/api/types'

interface Props {
  match: Match
}

const props = defineProps<Props>()

const { t } = useI18n()
const toast = useToast()
const betsStore = useBetsStore()

// Bet type configuration
const BET_OPTIONS = [
  { type: '1', labelKey: 'matches.betSelector.homeWin', oddsField: 'oddsHome' as keyof Match },
  { type: 'X', labelKey: 'matches.betSelector.draw', oddsField: 'oddsDraw' as keyof Match },
  { type: '2', labelKey: 'matches.betSelector.awayWin', oddsField: 'oddsAway' as keyof Match },
  { type: '1X', labelKey: 'matches.betSelector.homeOrDraw', oddsField: 'oddsHomeDraw' as keyof Match },
  { type: 'X2', labelKey: 'matches.betSelector.drawOrAway', oddsField: 'oddsDrawAway' as keyof Match },
  { type: '12', labelKey: 'matches.betSelector.homeOrAway', oddsField: 'oddsHomeAway' as keyof Match },
] as const

// State management
const savingBetType = ref<string | null>(null)
const optimisticSelection = ref<string | null>(null)
const previousBetType = ref<string | null>(null)

const currentBet = computed(() => betsStore.getBetForMatch(props.match.id))

const effectiveSelection = computed(() => {
  return optimisticSelection.value ?? currentBet.value?.betType ?? null
})

// Get odds value from match
function getOdds(oddsField: keyof Match): number | null {
  return (props.match[oddsField] as number | null) ?? null
}

// Check if option is selected
function isSelected(betType: string): boolean {
  return effectiveSelection.value === betType
}

// Get tabindex for roving tabindex pattern
function getTabIndex(option: { type: string }): number {
  return effectiveSelection.value === option.type || (!effectiveSelection.value && option.type === '1') ? 0 : -1
}

// Handle selection
async function handleSelect(betType: string) {
  previousBetType.value = currentBet.value?.betType ?? null

  // If clicking the same bet, remove it
  if (currentBet.value?.betType === betType) {
    optimisticSelection.value = null
    savingBetType.value = betType
    try {
      await betsStore.removeBet(currentBet.value.id)
    } catch {
      // Error already handled by store
      revertSelection()
      showErrorToast()
    } finally {
      savingBetType.value = null
    }
    return
  }

  // Set optimistic selection
  optimisticSelection.value = betType
  savingBetType.value = betType

  try {
    if (currentBet.value) {
      // Update existing bet
      await betsStore.updateBet(currentBet.value.id, betType)
    } else {
      // Place new bet
      await betsStore.placeBet(props.match.id, betType)
    }
  } catch {
    // Error already handled by store
    revertSelection()
    showErrorToast()
  } finally {
    optimisticSelection.value = null
    savingBetType.value = null
  }
}

function revertSelection() {
  optimisticSelection.value = previousBetType.value
}

function showErrorToast() {
  toast.add({
    severity: 'error',
    summary: t('matches.betSelector.errorTitle'),
    detail: t('matches.betSelector.errorSaveFailed'),
    life: 4000,
  })
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent, option: (typeof BET_OPTIONS)[number]) {
  if (!['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
    return
  }

  event.preventDefault()

  if (event.key === 'Enter' || event.key === ' ') {
    handleSelect(option.type)
    return
  }

  // Arrow navigation
  const currentIndex = BET_OPTIONS.findIndex((o) => o.type === option.type)
  let nextIndex = currentIndex

  if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + BET_OPTIONS.length) % BET_OPTIONS.length
  } else if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % BET_OPTIONS.length
  }

  // Focus next button
  const nextButton = document.querySelector(
    `[data-bet-type="${BET_OPTIONS[nextIndex].type}"]`,
  ) as HTMLButtonElement
  if (nextButton) {
    nextButton.focus()
  }
}
</script>

<template>
  <div class="bet-selector" role="radiogroup" :aria-label="t('matches.betSelector.ariaLabel')">
    <button
      v-for="option in BET_OPTIONS"
      :key="option.type"
      :data-bet-type="option.type"
      role="radio"
      :aria-checked="isSelected(option.type)"
      :aria-label="`${option.type} - ${t(option.labelKey)} - ${getOdds(option.oddsField) ?? t('matches.betSelector.noOdds')}`"
      :disabled="savingBetType === option.type"
      @click="handleSelect(option.type)"
      @keydown="handleKeydown($event, option)"
      :tabindex="getTabIndex(option)"
      class="bet-button"
      :class="{ selected: isSelected(option.type), saving: savingBetType === option.type }"
    >
      <span class="bet-label">{{ option.type }}</span>
      <span class="bet-odds">{{ getOdds(option.oddsField) ?? '—' }}</span>
    </button>
  </div>
</template>

<style scoped>
.bet-selector {
  display: flex;
  gap: 4px;
  width: 100%;
}

.bet-button {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 2px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  font-family: inherit;
  font-size: inherit;
}

.bet-button:not(.selected):hover:not(:disabled) {
  background-color: #f0fdfa;
  border-color: #0d9488;
}

.bet-button.selected {
  background-color: #0d9488;
  border-color: #0d9488;
  color: white;
}

.bet-button:disabled {
  opacity: 0.7;
}

.bet-label {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.bet-odds {
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0.8;
}

.bet-button.selected .bet-odds {
  opacity: 1;
}
</style>
