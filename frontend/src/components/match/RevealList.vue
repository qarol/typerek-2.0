<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
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

const sortedRevealedBets = computed(() =>
  [...revealedBets.value].sort((a, b) => a.nickname.localeCompare(b.nickname)),
)

const allPlayers = computed(() => {
  // Use allPlayers from store meta (populated after kickoff)
  return betsStore.getAllPlayers(props.match.id) ?? []
})

const missedPlayers = computed(() => {
  const bettingPlayers = new Set(revealedBets.value.map((b) => b.nickname))
  // Return players who didn't bet (calculated from all players list)
  return allPlayers.value.filter((name) => !bettingPlayers.has(name)).sort((a, b) => a.localeCompare(b))
})

const isCurrentUser = (bet: RevealedBet) => bet.userId === authStore.user?.id

const getBetTypeLabel = (betType: string): string => {
  return BET_TYPE_LABELS[betType] ? t(BET_TYPE_LABELS[betType]) : betType
}

const isScored = computed(() => getMatchState(props.match) === 'scored')

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
    <!-- Loading skeleton -->
    <template v-if="loading">
      <Skeleton v-for="i in 6" :key="i" height="3rem" border-radius="10px" class="mb-2" />
    </template>

    <!-- Bet list -->
    <template v-else>
      <div
        v-for="bet in sortedRevealedBets"
        :key="bet.id"
        role="listitem"
        class="reveal-row"
        :class="{ 'is-current-user': isCurrentUser(bet), 'has-points': isScored }"
      >
        <div class="player-col">
          <span class="reveal-nickname">{{ bet.nickname }}</span>
          <span v-if="isCurrentUser(bet)" class="you-badge">{{ t('matches.reveal.you') }}</span>
        </div>
        <div class="bet-col">
          <span class="bet-code">{{ bet.betType }}</span>
          <span class="bet-label">{{ getBetTypeLabel(bet.betType) }}</span>
        </div>
        <div v-if="isScored" class="points-col">
          <i
            :class="Number(bet.pointsEarned) > 0 ? 'pi pi-check' : 'pi pi-times'"
            :style="{ color: getPointsColor(bet) }"
          />
          <span class="points-text" :style="{ color: getPointsColor(bet) }">
            {{ getPointsDisplay(bet) }}
          </span>
        </div>
      </div>

      <!-- Players who didn't bet -->
      <template v-if="missedPlayers.length">
        <div class="missed-divider">{{ t('matches.reveal.noBet') }}</div>
        <div
          v-for="name in missedPlayers"
          :key="name"
          role="listitem"
          class="reveal-row missed"
          :class="{ 'has-points': isScored }"
        >
          <div class="player-col">
            <span class="reveal-nickname">{{ name }}</span>
          </div>
          <div class="bet-col">
            <span class="reveal-missed">{{ t('matches.reveal.missed') }}</span>
          </div>
          <div v-if="isScored" class="points-col">
            <span class="points-text" style="color: #9ca3af">{{ t('matches.reveal.pointsZero') }}</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.reveal-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reveal-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid transparent;
  transition: background 0.1s;
}

.reveal-row.has-points {
  grid-template-columns: 1fr auto auto;
}

.reveal-row.is-current-user {
  background-color: #f0fdfa;
  border-color: rgba(13, 148, 136, 0.15);
}

.reveal-row.missed {
  opacity: 0.5;
}

.player-col {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.reveal-nickname {
  font-weight: 600;
  color: #1c2b29;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.you-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #0d9488;
  color: white;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bet-col {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bet-code {
  font-weight: 700;
  font-size: 0.8125rem;
  color: #0d9488;
  background: rgba(13, 148, 136, 0.1);
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

.bet-label {
  font-size: 0.8125rem;
  color: #4b5563;
  white-space: nowrap;
}

.points-col {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 3.5rem;
  justify-content: flex-end;
}

.points-text {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 0.875rem;
}

.reveal-missed {
  font-size: 0.8125rem;
  color: #9ca3af;
  font-style: italic;
}

.missed-divider {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  padding: 8px 12px 4px;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>
