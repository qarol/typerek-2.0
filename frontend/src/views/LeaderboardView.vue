<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow.vue'

const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()

onMounted(async () => {
  await leaderboardStore.fetchLeaderboard()
})

// True when every player has 0 points and no previous position —
// meaning no match has been scored yet.
const isZeroState = computed(() =>
  leaderboardStore.standings.length > 0 &&
  leaderboardStore.standings.every(e => e.totalPoints === 0 && e.previousPosition === null)
)

// Set of userIds that share position 1 (more than one = co-winner)
const coWinnerUserIds = computed<Set<number>>(() => {
  const pos1 = leaderboardStore.standings.filter(e => e.position === 1)
  if (pos1.length > 1) return new Set(pos1.map(e => e.userId))
  return new Set()
})

// Show legend only when movement data exists (at least one previousPosition set)
const showLegend = computed(() =>
  leaderboardStore.standings.some(e => e.previousPosition !== null)
)
</script>

<template>
  <div class="view-container">
    <h1>{{ $t('nav.standings') }}</h1>

    <!-- Loading -->
    <div v-if="leaderboardStore.loading" class="state-message">
      {{ $t('leaderboard.loading') }}
    </div>

    <!-- Error -->
    <div v-else-if="leaderboardStore.error" class="state-message error">
      {{ $t(`errors.${leaderboardStore.error.code}`) }}
    </div>

    <!-- Empty (no players at all) -->
    <div v-else-if="leaderboardStore.standings.length === 0" class="state-message">
      {{ $t('leaderboard.empty') }}
    </div>

    <!-- Zero-state: all players exist but no games scored yet -->
    <div v-else-if="isZeroState" class="leaderboard-zero-state">
      <i class="pi pi-trophy zero-icon" />
      <p class="zero-title">{{ $t('leaderboard.zeroState') }}</p>
      <p class="zero-hint">{{ $t('leaderboard.zeroStateHint') }}</p>

      <div class="zero-divider">
        <span class="zero-divider-line" />
        <span class="zero-divider-label">
          {{ $t('leaderboard.playersRegistered', { n: leaderboardStore.standings.length }) }}
        </span>
        <span class="zero-divider-line" />
      </div>

      <div class="zero-avatars">
        <div
          v-for="entry in leaderboardStore.standings"
          :key="entry.userId"
          class="zero-avatar"
          :class="{ 'zero-avatar--you': entry.userId === authStore.user?.id }"
        >
          <div class="zero-avatar-circle">
            <i class="pi pi-user" />
          </div>
          <span class="zero-avatar-name">
            {{ entry.userId === authStore.user?.id ? $t('leaderboard.you') : entry.nickname }}
          </span>
        </div>
      </div>
    </div>

    <!-- Leaderboard list -->
    <template v-else>
      <ul role="list" class="leaderboard-list">
        <LeaderboardRow
          v-for="entry in leaderboardStore.standings"
          :key="entry.userId"
          :entry="entry"
          :isCurrentUser="entry.userId === authStore.user?.id"
          :isCoWinner="coWinnerUserIds.has(entry.userId)"
        />
      </ul>

      <!-- Legend — only when movement data is available -->
      <div v-if="showLegend" class="leaderboard-legend">
        <span><i class="pi pi-arrow-up move-up" /> {{ $t('leaderboard.legend.up') }}</span>
        <span><i class="pi pi-arrow-down move-down" /> {{ $t('leaderboard.legend.down') }}</span>
        <span class="legend-same">— {{ $t('leaderboard.legend.same') }}</span>
        <span class="legend-new">{{ $t('leaderboard.newPlayer') }} · {{ $t('leaderboard.legend.new') }}</span>
      </div>
    </template>
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
.state-message.error { color: #ef4444; }

/* List */
.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}

/* Legend */
.leaderboard-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 0 4px;
  font-size: 11px;
  color: #9ca3af;
}
.leaderboard-legend .pi { font-size: 11px; }
.move-up   { color: #10b981; }
.move-down { color: #ef4444; }
.legend-same { color: #9ca3af; }
.legend-new  { color: #d1d5db; }

/* Zero-state */
.leaderboard-zero-state {
  text-align: center;
  padding: 40px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}
.zero-icon {
  font-size: 48px;
  color: #e5e7eb;
  display: block;
  margin-bottom: 12px;
}
.zero-title {
  font-weight: 700;
  font-size: 16px;
  color: #374151;
  margin-bottom: 6px;
}
.zero-hint {
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
  max-width: 280px;
  margin: 0 auto;
}
.zero-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px 0 16px;
}
.zero-divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}
.zero-divider-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  white-space: nowrap;
}
.zero-avatars {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.zero-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.zero-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zero-avatar-circle .pi { color: #9ca3af; font-size: 14px; }
.zero-avatar--you .zero-avatar-circle {
  background: #0d9488;
}
.zero-avatar--you .zero-avatar-circle .pi { color: white; }
.zero-avatar-name {
  font-size: 10px;
  color: #9ca3af;
}
.zero-avatar--you .zero-avatar-name {
  color: #0d9488;
  font-weight: 600;
}
</style>
