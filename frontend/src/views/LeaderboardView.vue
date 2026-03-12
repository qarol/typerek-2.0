<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Skeleton from 'primevue/skeleton'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardTier from '@/components/leaderboard/LeaderboardTier.vue'
import type { LeaderboardEntry } from '@/api/types'

const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await leaderboardStore.fetchLeaderboard()
})

const isZeroState = computed(() =>
  leaderboardStore.standings.length > 0 &&
  leaderboardStore.standings.every(e => e.totalPoints === 0 && e.previousPosition === null)
)

const tournamentPct = computed(() => {
  if (!leaderboardStore.totalMatches) return 0
  return Math.round((leaderboardStore.scoredMatches / leaderboardStore.totalMatches) * 100)
})

// Group flat standings array into tiers by position
const tiers = computed(() => {
  const groups = new Map<number, LeaderboardEntry[]>()
  for (const entry of leaderboardStore.standings) {
    const group = groups.get(entry.position) ?? []
    group.push(entry)
    groups.set(entry.position, group)
  }
  return Array.from(groups.values())
})

const showLegend = computed(() =>
  leaderboardStore.standings.some(e => e.previousPosition !== null)
)

function navigateToHistory(userId: number) {
  router.push({ name: 'history', params: { userId } })
}
</script>

<template>
  <div class="view-container">

    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">{{ $t('nav.standings') }}</h1>

      <!-- Tournament progress -->
      <div v-if="leaderboardStore.totalMatches > 0" class="tournament-progress">
        <div class="progress-meta">
          <span class="progress-label">{{ $t('leaderboard.matchesPlayed') }}</span>
          <span class="progress-count">{{ leaderboardStore.scoredMatches }}<span class="progress-total"> / {{ leaderboardStore.totalMatches }}</span></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${tournamentPct}%` }" />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <Card v-if="leaderboardStore.loading" class="list-card">
      <template #content>
        <div class="skeleton-list">
          <Skeleton v-for="i in 8" :key="i" height="58px" border-radius="0" />
        </div>
      </template>
    </Card>

    <!-- Error -->
    <div v-else-if="leaderboardStore.error" class="state-message error">
      {{ $t(`errors.${leaderboardStore.error.code}`) }}
    </div>

    <!-- Empty -->
    <div v-else-if="leaderboardStore.standings.length === 0" class="state-message">
      {{ $t('leaderboard.empty') }}
    </div>

    <!-- Zero-state -->
    <Card v-else-if="isZeroState" class="list-card zero-card">
      <template #content>
        <i class="pi pi-trophy zero-icon" />
        <p class="zero-title">{{ $t('leaderboard.zeroState') }}</p>
        <p class="zero-hint">{{ $t('leaderboard.zeroStateHint') }}</p>
        <Divider />
        <p class="zero-players-label">{{ $t('leaderboard.playersRegistered', { n: leaderboardStore.standings.length }) }}</p>
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
      </template>
    </Card>

    <!-- Leaderboard list -->
    <template v-else>
      <Card class="list-card">
        <template #content>
          <ul role="list" class="leaderboard-list">
            <LeaderboardTier
              v-for="tierPlayers in tiers"
              :key="tierPlayers[0]!.position"
              :position="tierPlayers[0]!.position"
              :totalPoints="tierPlayers[0]!.totalPoints"
              :players="tierPlayers"
              :currentUserId="authStore.user?.id ?? null"
              @navigate="navigateToHistory"
            />
          </ul>
        </template>
      </Card>

      <!-- Legend -->
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
  padding: 16px 16px 80px;
  max-width: 640px;
  margin: 0 auto;
}

/* ── Page header ────────────────────────────────────── */
.page-header {
  margin-bottom: 14px;
}
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.3px;
}

/* ── Tournament progress ────────────────────────────── */
.tournament-progress {
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 7px;
}
.progress-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #94a3b8;
}
.progress-count {
  font-size: 14px;
  font-weight: 800;
  color: #0d9488;
  font-variant-numeric: tabular-nums;
}
.progress-total {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}
.progress-track {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d9488, #14b8a6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* ── Card wrapper ───────────────────────────────────── */
.list-card :deep(.p-card-body) { padding: 0; }
.list-card :deep(.p-card-content) { padding: 0; }

/* ── Skeleton ───────────────────────────────────────── */
.skeleton-list { display: flex; flex-direction: column; gap: 1px; overflow: hidden; border-radius: 10px; }

/* ── Leaderboard list ───────────────────────────────── */
.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: 10px;
  overflow: hidden;
}

/* ── Legend ─────────────────────────────────────────── */
.leaderboard-legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 0 4px;
  font-size: 11px;
  color: #94a3b8;
}
.leaderboard-legend .pi { font-size: 10px; }
.move-up   { color: #10b981; }
.move-down { color: #f43f5e; }
.legend-same { color: #cbd5e1; }
.legend-new  { color: #e2e8f0; }

/* ── State messages ─────────────────────────────────── */
.state-message {
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
}
.state-message.error { color: #ef4444; }

/* ── Zero-state ─────────────────────────────────────── */
.zero-card :deep(.p-card-content) { text-align: center; padding: 32px 24px; }
.zero-icon { font-size: 44px; color: #e2e8f0; display: block; margin-bottom: 12px; }
.zero-title { font-weight: 700; font-size: 16px; color: #374151; margin-bottom: 6px; }
.zero-hint { color: #9ca3af; font-size: 13px; line-height: 1.5; max-width: 280px; margin: 0 auto; }
.zero-players-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #9ca3af;
  margin-bottom: 14px;
}
.zero-avatars { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.zero-avatar { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.zero-avatar-circle {
  width: 36px; height: 36px; border-radius: 50%;
  background: #e5e7eb; display: flex; align-items: center; justify-content: center;
}
.zero-avatar-circle .pi { color: #9ca3af; font-size: 14px; }
.zero-avatar--you .zero-avatar-circle { background: #0d9488; }
.zero-avatar--you .zero-avatar-circle .pi { color: white; }
.zero-avatar-name { font-size: 10px; color: #9ca3af; }
.zero-avatar--you .zero-avatar-name { color: #0d9488; font-weight: 600; }

@media (min-width: 640px) {
  .view-container { padding: 24px 24px 80px; }
  .page-title { font-size: 26px; }
}
</style>
