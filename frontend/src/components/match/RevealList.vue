<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import type { Match, RevealedBet } from '@/api/types'
import { useBetsStore } from '@/stores/bets'
import { useAuthStore } from '@/stores/auth'
import { getMatchState } from '@/utils/matchSorting'

interface Props {
  match: Match
}

const props = defineProps<Props>()
const { t } = useI18n()
const betsStore = useBetsStore()
const authStore = useAuthStore()

const loading = ref(true)

const BET_TYPE_LABELS: Record<string, string> = {
  '1': 'matches.betSelector.homeWin',
  'X': 'matches.betSelector.draw',
  '2': 'matches.betSelector.awayWin',
  '1X': 'matches.betSelector.homeOrDraw',
  'X2': 'matches.betSelector.drawOrAway',
  '12': 'matches.betSelector.homeOrAway',
}

const revealedBets = computed(() => betsStore.getRevealedBets(props.match.id) ?? [])

const allPlayers = computed(() => {
  // Use allPlayers from store meta (populated after kickoff)
  return betsStore.getAllPlayers(props.match.id) ?? []
})

const missedPlayers = computed(() => {
  const bettingPlayers = new Set(revealedBets.value.map((b) => b.nickname))
  // Return players who didn't bet (calculated from all players list)
  return allPlayers.value.filter((name) => !bettingPlayers.has(name))
})

const isCurrentUser = (bet: RevealedBet) => bet.userId === authStore.user?.id

const getBetTypeLabel = (betType: string): string => {
  return BET_TYPE_LABELS[betType] ? t(BET_TYPE_LABELS[betType]) : betType
}

const isScored = computed(() => getMatchState(props.match) === 'scored')

const isBetCorrect = (bet: RevealedBet): boolean => {
  // Simple approach: check if points were earned
  return Number(bet.pointsEarned) > 0
}

const getPointsDisplay = (bet: RevealedBet): string => {
  const points = Number(bet.pointsEarned) || 0
  if (points > 0) {
    return `+${points.toFixed(2)}`
  }
  return '0'
}

const getPointsColor = (bet: RevealedBet): string => {
  return Number(bet.pointsEarned) > 0 ? '#10B981' : '#9CA3AF'
}

const getCorrectnessCssClass = (bet: RevealedBet): string => {
  return Number(bet.pointsEarned) > 0 ? 'correct' : 'incorrect'
}

// Get the odds that applied to this bet type
const getOddsForBetType = (betType: string): number | null => {
  switch (betType) {
    case '1':
      return props.match.oddsHome
    case 'X':
      return props.match.oddsDraw
    case '2':
      return props.match.oddsAway
    case '1X':
      return props.match.oddsHomeDraw
    case 'X2':
      return props.match.oddsDrawAway
    case '12':
      return props.match.oddsHomeAway
    default:
      return null
  }
}

onMounted(async () => {
  if (betsStore.getRevealedBets(props.match.id) !== undefined) {
    loading.value = false
    return
  }
  loading.value = true
  await betsStore.fetchMatchBets(props.match.id)
  loading.value = false
})
</script>

<template>
  <div class="reveal-list" role="list" :aria-label="t('matches.reveal.ariaLabel')">
    <div class="reveal-header">{{ t('matches.reveal.title') }}</div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <Skeleton v-for="i in 4" :key="i" height="2.5rem" class="mb-2" />
    </template>

    <!-- Bet list -->
    <template v-else>
      <div
        v-for="bet in revealedBets"
        :key="bet.id"
        role="listitem"
        class="reveal-row"
        :class="{ 'is-current-user': isCurrentUser(bet) }"
      >
        <span class="reveal-nickname">{{ bet.nickname }}</span>
        <div class="reveal-content">
          <Tag :value="`${bet.betType} - ${getBetTypeLabel(bet.betType)}`" severity="info" />
          <div v-if="isScored" class="scored-info">
            <i
              :class="[isBetCorrect(bet) ? 'pi pi-check' : 'pi pi-times', getCorrectnessCssClass(bet)]"
              class="correctness-icon"
              :style="{ color: getPointsColor(bet) }"
            />
            <span class="points-text" :style="{ color: getPointsColor(bet) }">
              {{ getPointsDisplay(bet) }}
            </span>
            <span
              v-if="isCurrentUser(bet) && getOddsForBetType(bet.betType) !== null"
              class="odds-display"
            >
              ({{ Number(getOddsForBetType(bet.betType)).toFixed(2) }})
            </span>
          </div>
        </div>
      </div>

      <!-- Players who didn't bet -->
      <div
        v-for="name in missedPlayers"
        :key="name"
        role="listitem"
        class="reveal-row missed"
      >
        <span class="reveal-nickname">{{ name }}</span>
        <div class="reveal-content">
          <span class="reveal-missed">{{ t('matches.reveal.missed') }}</span>
          <span v-if="isScored" class="points-text" style="color: #9ca3af">
            0
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.reveal-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.reveal-header {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.reveal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.reveal-row.is-current-user {
  background-color: #f0fdfa;
  border-radius: 6px;
  padding: 6px 8px;
  margin: 0 -8px;
}

.reveal-nickname {
  font-weight: 500;
}

.reveal-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scored-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.correctness-icon {
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
}

.points-text {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  min-width: 2.5rem;
  text-align: right;
}

.odds-display {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 400;
  margin-left: 4px;
}

.reveal-row.missed {
  color: #9ca3af;
}

.reveal-missed {
  font-style: italic;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>
