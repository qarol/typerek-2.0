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

const revealedBets = computed(() => betsStore.getRevealedBets(props.match.id) ?? [])

const totalBets = computed(() => revealedBets.value.length)

const betDistribution = computed(() => {
  const counts: Record<string, number> = {}
  for (const bet of revealedBets.value) {
    counts[bet.betType] = (counts[bet.betType] ?? 0) + 1
  }
  // Sort by bet type order
  const order = ['1', 'X', '2', '1X', 'X2', '12']
  return order
    .filter((type) => counts[type] !== undefined)
    .map((type) => ({ type, count: counts[type]! }))
})

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
  <div class="reveal-summary-wrapper">
    <Skeleton v-if="loading" height="1.75rem" width="12rem" />
    <button v-else class="reveal-trigger" @click="drawerVisible = true">
      <i class="pi pi-users trigger-icon" />
      <span class="trigger-count">{{ t('matches.reveal.betCount', { n: totalBets }) }}</span>
      <span v-if="betDistribution.length" class="trigger-distribution">
        <span v-for="item in betDistribution" :key="item.type" class="dist-item">
          {{ item.type }}&thinsp;→&thinsp;{{ item.count }}
        </span>
      </span>
      <i class="pi pi-chevron-right trigger-chevron" />
    </button>

    <Drawer
      v-model:visible="drawerVisible"
      :header="t('matches.reveal.drawerTitle', { home: match.homeTeam, away: match.awayTeam })"
      position="bottom"
      style="height: auto; max-height: 80dvh"
    >
      <RevealList :match="match" />
    </Drawer>
  </div>
</template>

<style scoped>
.reveal-summary-wrapper {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.reveal-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #64748b;
  flex-wrap: wrap;
  text-decoration: none;
  transition: color 0.15s;
}

.reveal-trigger:hover {
  color: #0d9488;
}

.trigger-icon {
  font-size: 0.875rem;
  color: #0d9488;
  flex-shrink: 0;
}

.trigger-count {
  font-weight: 600;
  color: #475569;
  transition: color 0.15s;
}

.reveal-trigger:hover .trigger-count {
  color: #0d9488;
}

.trigger-distribution {
  display: flex;
  gap: 8px;
  flex: 1;
}

.dist-item {
  color: #94a3b8;
}

.trigger-chevron {
  font-size: 0.625rem;
  color: #0d9488;
  flex-shrink: 0;
  margin-left: auto;
}
</style>
