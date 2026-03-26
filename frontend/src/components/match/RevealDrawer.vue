<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import Skeleton from 'primevue/skeleton'
import type { Match } from '@/api/types'
import { useBetsStore } from '@/stores/bets'
import RevealList from './RevealList.vue'

interface Props {
  match: Match
}

const props = defineProps<Props>()
const { t } = useI18n()
const betsStore = useBetsStore()

const drawerVisible = ref(false)
const loading = ref(true)

const userBet = computed(() => betsStore.getBetForMatch(props.match.id))
const isScored = computed(() => props.match.homeScore !== null)

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
  <div class="reveal-wrapper">
    <Skeleton v-if="loading" height="2.75rem" border-radius="12px" />
    <div v-else class="bet-info-box">
      <div class="bet-info-left">
        <span class="your-bet-label">{{ t('matches.yourBet') }}:</span>
        <span v-if="userBet" class="bet-pill">{{ userBet.betType }}</span>
        <span v-else class="no-bet">—</span>
        <span
          v-if="isScored && userBet && userBet.pointsEarned > 0"
          class="points-earned"
        >
          {{ t('matches.reveal.pointsEarned', { points: userBet.pointsEarned }) }}
        </span>
      </div>
      <button class="view-all-btn" @click="drawerVisible = true">
        {{ t('matches.reveal.viewAllBets') }}
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>

    <Drawer
      v-model:visible="drawerVisible"
      :header="t('matches.reveal.drawerTitle', { home: match.homeTeam, away: match.awayTeam })"
      position="right"
    >
      <RevealList :match="match" />
    </Drawer>
  </div>
</template>

<style scoped>
.reveal-wrapper {
  margin-top: 0;
}

.bet-info-box {
  background: rgba(0, 104, 95, 0.05);
  border: 1px solid rgba(0, 104, 95, 0.1);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.bet-info-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.your-bet-label {
  font-size: 0.75rem;
  color: #3d4947;
  font-weight: 500;
  white-space: nowrap;
}

.bet-pill {
  background: #0d9488;
  color: white;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.no-bet {
  color: #6d7a77;
  font-weight: 500;
  font-size: 0.75rem;
}

.points-earned {
  color: #00685f;
  font-weight: 700;
  font-size: 0.75rem;
  white-space: nowrap;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  color: #00685f;
  font-size: 0.6875rem;
  font-weight: 700;
  font-family: inherit;
  padding: 0;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.view-all-btn:hover {
  opacity: 0.7;
}

.view-all-btn .material-symbols-outlined {
  font-size: 14px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
