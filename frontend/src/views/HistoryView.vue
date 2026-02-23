<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'
import HistoryMatchEntry from '@/components/history/HistoryMatchEntry.vue'

const props = defineProps<{
  userId?: string
}>()

const router = useRouter()
const { t } = useI18n()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
const leaderboardStore = useLeaderboardStore()

const targetUserId = computed(() =>
  props.userId ? Number(props.userId) : authStore.user?.id
)

const isOwnHistory = computed(() =>
  !props.userId || Number(props.userId) === authStore.user?.id
)

const playerNickname = computed(() => {
  if (isOwnHistory.value) return null
  const standing = leaderboardStore.standings.find(s => s.userId === Number(props.userId))
  return standing?.nickname ?? null
})

const pageTitle = computed(() => {
  if (isOwnHistory.value) return t('nav.history')
  return playerNickname.value ?? t('nav.history')
})

onMounted(async () => {
  if (!isOwnHistory.value && !leaderboardStore.standings.length) {
    try {
      await leaderboardStore.fetchLeaderboard()
    } catch {
      // standings unavailable — title will fall back gracefully
    }
  }
  if (targetUserId.value) {
    try {
      await historyStore.fetchHistory(targetUserId.value)
    } catch {
      // error already stored in historyStore.error; swallow to avoid unhandled rejection
    }
  }
})
</script>

<template>
  <div class="view-container">
    <div v-if="!isOwnHistory" class="history-header">
      <button class="back-button" @click="router.back()" :aria-label="t('common.back')">←</button>
      <h1>{{ pageTitle }}</h1>
    </div>
    <h1 v-else>{{ t('nav.history') }}</h1>

    <div v-if="historyStore.loading" class="history-loading">{{ t('history.loading') }}</div>
    <div v-else-if="historyStore.error" class="history-error">
      {{ t(`errors.${historyStore.error.code}`, t('errors.UNKNOWN_ERROR')) }}
    </div>
    <div v-else-if="historyStore.entries.length === 0" class="history-empty">
      {{ t('history.empty') }}
    </div>
    <ul v-else role="list" class="history-list">
      <HistoryMatchEntry
        v-for="entry in historyStore.entries"
        :key="entry.matchId"
        :entry="entry"
      />
    </ul>
  </div>
</template>

<style scoped>
.history-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.history-header h1 {
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #0d9488;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-loading,
.history-error,
.history-empty {
  padding: 2rem 0;
  text-align: center;
  color: #64748b;
}
</style>
