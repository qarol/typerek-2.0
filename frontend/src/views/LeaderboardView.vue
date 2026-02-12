<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow.vue'

const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()

onMounted(async () => {
  await leaderboardStore.fetchLeaderboard()
})
</script>

<template>
  <div class="view-container">
    <h1>{{ $t('nav.standings') }}</h1>

    <!-- Loading state -->
    <div v-if="leaderboardStore.loading" class="state-message">
      {{ $t('leaderboard.loading') }}
    </div>

    <!-- Error state -->
    <div v-else-if="leaderboardStore.error" class="state-message error">
      {{ $t(`errors.${leaderboardStore.error.code}`) }}
    </div>

    <!-- Empty state -->
    <div v-else-if="leaderboardStore.standings.length === 0" class="state-message">
      {{ $t('leaderboard.empty') }}
    </div>

    <!-- Leaderboard -->
    <ul v-else role="list" class="leaderboard-list">
      <LeaderboardRow
        v-for="entry in leaderboardStore.standings"
        :key="entry.userId"
        :entry="entry"
        :isCurrentUser="entry.userId === authStore.user?.id"
      />
    </ul>
  </div>
</template>

<style scoped>
.view-container {
  padding: 16px;
}

.view-container h1 {
  margin-bottom: 24px;
}

.state-message {
  padding: 24px;
  text-align: center;
  color: #6b7280;
}

.state-message.error {
  color: #ef4444;
}

.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
</style>
