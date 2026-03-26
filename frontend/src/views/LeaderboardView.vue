<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from 'primevue/skeleton'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow.vue'

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

const podiumStandings = computed(() =>
  leaderboardStore.standings.filter(e => e.position <= 3)
)

const restStandings = computed(() =>
  leaderboardStore.standings.filter(e => e.position > 3)
)

const showLegend = computed(() =>
  leaderboardStore.standings.some(e => e.previousPosition !== null)
)

function navigateToHistory(userId: number) {
  router.push({ name: 'history', params: { userId } })
}
</script>

<template>
  <div class="lb-wrapper">

    <!-- Tournament progress card -->
    <section v-if="leaderboardStore.totalMatches > 0" class="progress-card">
      <div class="progress-card-top">
        <h2 class="progress-title">{{ $t('leaderboard.matchesPlayed') }}</h2>
        <span class="progress-count">
          {{ leaderboardStore.scoredMatches }}<span class="progress-total"> / {{ leaderboardStore.totalMatches }}</span>
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${tournamentPct}%` }" />
      </div>
    </section>

    <!-- Section header -->
    <div class="section-header">
      <h1 class="section-title">{{ $t('nav.standings') }}</h1>
    </div>

    <!-- Loading -->
    <div v-if="leaderboardStore.loading" class="skeleton-list">
      <Skeleton v-for="i in 8" :key="i" height="56px" class="skeleton-item" />
    </div>

    <!-- Error -->
    <div v-else-if="leaderboardStore.error" class="state-message state-error">
      {{ $t(`errors.${leaderboardStore.error.code}`) }}
    </div>

    <!-- Empty -->
    <div v-else-if="leaderboardStore.standings.length === 0" class="state-message">
      {{ $t('leaderboard.empty') }}
    </div>

    <!-- Zero-state -->
    <div v-else-if="isZeroState" class="zero-card">
      <i class="pi pi-trophy zero-icon" />
      <p class="zero-title">{{ $t('leaderboard.zeroState') }}</p>
      <p class="zero-hint">{{ $t('leaderboard.zeroStateHint') }}</p>
      <hr class="zero-divider" />
      <p class="zero-players-label">{{ $t('leaderboard.playersRegistered', { n: leaderboardStore.standings.length }) }}</p>
      <div class="zero-avatars">
        <div
          v-for="entry in leaderboardStore.standings"
          :key="entry.userId"
          class="zero-av"
          :class="{ 'zero-av--me': entry.userId === authStore.user?.id }"
        >
          <div class="zero-av-circle"><i class="pi pi-user" /></div>
          <span class="zero-av-name">
            {{ entry.userId === authStore.user?.id ? $t('leaderboard.you') : entry.nickname }}
          </span>
        </div>
      </div>
    </div>

    <!-- Standings list -->
    <template v-else>
      <!-- Podium (positions 1–3) -->
      <div v-if="podiumStandings.length" class="podium-section">
        <LeaderboardRow
          v-for="entry in podiumStandings"
          :key="entry.userId"
          :entry="entry"
          :isCurrentUser="entry.userId === authStore.user?.id"
        />
      </div>

      <!-- Rest (positions 4+) -->
      <div v-if="restStandings.length" class="rest-section">
        <LeaderboardRow
          v-for="entry in restStandings"
          :key="entry.userId"
          :entry="entry"
          :isCurrentUser="entry.userId === authStore.user?.id"
        />
      </div>

      <!-- Legend -->
      <div v-if="showLegend" class="legend">
        <span><i class="pi pi-arrow-up legend-up" /> {{ $t('leaderboard.legend.up') }}</span>
        <span><i class="pi pi-arrow-down legend-down" /> {{ $t('leaderboard.legend.down') }}</span>
        <span class="legend-same">— {{ $t('leaderboard.legend.same') }}</span>
        <span class="legend-new">{{ $t('leaderboard.newPlayer') }} · {{ $t('leaderboard.legend.new') }}</span>
      </div>
    </template>

  </div>
</template>

<style scoped>
.lb-wrapper {
  padding: 16px 16px 80px;
  max-width: 640px;
  margin: 0 auto;
}

/* ── Tournament progress card ───────────────────────── */
.progress-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 4px 16px rgba(0, 40, 37, 0.06);
  margin-bottom: 20px;
}

.progress-card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.progress-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6d7a77;
  margin: 0;
}

.progress-count {
  font-size: 0.875rem;
  font-weight: 800;
  color: #00685f;
  font-variant-numeric: tabular-nums;
}

.progress-total {
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
}

.progress-track {
  height: 8px;
  background: #e8e8e8;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00685f, #0d9488);
  border-radius: 99px;
  transition: width 0.6s ease;
}

/* ── Section header ──────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 2px;
}

.section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.375rem;
  font-weight: 800;
  color: #1a1c1c;
  letter-spacing: -0.02em;
  margin: 0;
  text-transform: uppercase;
}

/* ── Podium section ──────────────────────────────────── */
.podium-section {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Rest section ────────────────────────────────────── */
.rest-section {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

/* ── Loading skeleton ────────────────────────────────── */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-item {
  border-radius: 12px !important;
}

/* ── State messages ──────────────────────────────────── */
.state-message {
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
}
.state-error { color: #ef4444; }

/* ── Zero-state ──────────────────────────────────────── */
.zero-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.zero-icon { font-size: 44px; color: #e2e8f0; display: block; margin-bottom: 12px; }
.zero-title { font-weight: 700; font-size: 16px; color: #374151; margin-bottom: 6px; }
.zero-hint { color: #9ca3af; font-size: 13px; line-height: 1.5; max-width: 280px; margin: 0 auto 16px; }
.zero-divider { border: none; border-top: 1px solid #f1f5f9; margin-bottom: 16px; }
.zero-players-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: #9ca3af; margin-bottom: 14px;
}
.zero-avatars { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.zero-av { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.zero-av-circle {
  width: 36px; height: 36px; border-radius: 50%;
  background: #e5e7eb; display: flex; align-items: center; justify-content: center;
}
.zero-av-circle .pi { color: #9ca3af; font-size: 14px; }
.zero-av--me .zero-av-circle { background: #0d9488; }
.zero-av--me .zero-av-circle .pi { color: white; }
.zero-av-name { font-size: 10px; color: #9ca3af; }
.zero-av--me .zero-av-name { color: #0d9488; font-weight: 600; }

/* ── Legend ──────────────────────────────────────────── */
.legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  padding: 0 4px;
  font-size: 11px;
  color: #94a3b8;
}
.legend .pi { font-size: 10px; }
.legend-up   { color: #00685f; }
.legend-down { color: #ba1a1a; }
.legend-same { color: #cbd5e1; }
.legend-new  { color: #e2e8f0; }

@media (min-width: 640px) {
  .lb-wrapper { padding: 24px 24px 80px; }
}
</style>
