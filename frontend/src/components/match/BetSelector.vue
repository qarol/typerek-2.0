<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
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
      revertSelection()
      showErrorToast()
    } finally {
      savingBetType.value = null
      optimisticSelection.value = null
    }
    return
  }

  // Set optimistic selection
  optimisticSelection.value = betType
  savingBetType.value = betType

  try {
    if (currentBet.value) {
      await betsStore.updateBet(currentBet.value.id, betType)
    } else {
      await betsStore.placeBet(props.match.id, betType)
    }
  } catch {
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

  const currentIndex = BET_OPTIONS.findIndex((o) => o.type === option.type)
  let nextIndex = currentIndex

  if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + BET_OPTIONS.length) % BET_OPTIONS.length
  } else if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % BET_OPTIONS.length
  }

  const nextType = BET_OPTIONS[nextIndex]!.type
  const buttonRefs = useTemplateRef(`button-${nextType}`)
  const nextButton = Array.isArray(buttonRefs) ? buttonRefs[0] : buttonRefs
  if (nextButton instanceof HTMLElement) {
    nextButton.focus()
  }
}
</script>

<template>
  <div class="bet-selector" role="radiogroup" :aria-label="t('matches.betSelector.ariaLabel')">
    <button
      v-for="option in BET_OPTIONS"
      :key="option.type"
      :ref="`button-${option.type}`"
      role="radio"
      :aria-checked="isSelected(option.type)"
      :aria-label="`${option.type} - ${t(option.labelKey)} - ${getOdds(option.oddsField) ?? t('matches.betSelector.noOdds')}`"
      :disabled="savingBetType !== null"
      class="bet-button"
      :class="{ selected: isSelected(option.type), saving: savingBetType === option.type }"
      :tabindex="getTabIndex(option)"
      @click="handleSelect(option.type)"
      @keydown="handleKeydown($event, option)"
    >
      <span class="bet-label">{{ option.type }}</span>
      <span class="bet-odds">{{ getOdds(option.oddsField)?.toFixed(2) ?? '—' }}</span>
    </button>
  </div>
</template>

<style scoped>
.bet-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  width: 100%;
}

.bet-button {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid rgba(188, 201, 198, 0.25);
  background: #f3f3f3;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
  font-family: inherit;
}

.bet-button:not(.selected):hover:not(:disabled) {
  background: #c2ebe3;
  border-color: transparent;
}

.bet-button.selected {
  background: #0d9488;
  border-color: #0d9488;
  color: white;
}

.bet-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bet-label {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem;
  color: #00685f;
  line-height: 1.2;
}

.bet-button.selected .bet-label {
  color: white;
}

.bet-odds {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #6d7a77;
  line-height: 1;
}

.bet-button.selected .bet-odds {
  color: rgba(255, 255, 255, 0.85);
}

/* ── Desktop: two groups of 3 with a divider ── */
@media (min-width: 768px) {
  .bet-selector {
    gap: 6px;
  }

  .bet-button {
    width: 52px;
    min-height: 48px;
  }

  /* Visual divider between button 3 and 4 */
  .bet-button:nth-child(3) {
    margin-right: 14px;
    position: relative;
  }

  .bet-button:nth-child(3)::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 20%;
    height: 60%;
    width: 1px;
    background: rgba(188, 201, 198, 0.5);
  }
}
</style>
