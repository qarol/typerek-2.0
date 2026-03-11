<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Avatar from 'primevue/avatar'
import type { LeaderboardEntry } from '@/api/types'
import { formatPoints } from '@/utils/formatPoints'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  isCoWinner: boolean
  maxPoints?: number
  gapToPrev?: number | null
}

const props = withDefaults(defineProps<Props>(), { maxPoints: 0, gapToPrev: null })
const router = useRouter()
useI18n()

// Palette for non-podium players — deterministic per userId
const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#f97316','#84cc16','#06b6d4','#3b82f6','#64748b']

const rowClass = computed(() => {
  if (props.entry.position === 1) return 'row-gold'
  if (props.entry.position === 2) return 'row-silver'
  if (props.entry.position === 3) return 'row-bronze'
  if (props.isCurrentUser) return 'row-you'
  return 'row-plain'
})

const isPodium = computed(() => props.entry.position <= 3)

const avatarLabel = computed(() => props.entry.nickname[0]?.toUpperCase() ?? '?')

const avatarStyle = computed(() => {
  if (props.entry.position === 1) return { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white' }
  if (props.entry.position === 2) return { background: 'linear-gradient(135deg,#94a3b8,#64748b)', color: 'white' }
  if (props.entry.position === 3) return { background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white' }
  if (props.isCurrentUser) return { background: '#0d9488', color: 'white' }
  return { background: PALETTE[props.entry.userId % PALETTE.length], color: 'white' }
})

const movement = computed(() => {
  if (props.entry.previousPosition === null) return null
  const diff = props.entry.previousPosition - props.entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
})

const barWidth = computed(() => {
  if (props.maxPoints <= 0) return '0%'
  return `${Math.min(Math.round((props.entry.totalPoints / props.maxPoints) * 100), 100)}%`
})

const handleClick = () => router.push({ name: 'history', params: { userId: props.entry.userId } })

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
}
</script>

<template>
  <div
    role="listitem"
    class="leaderboard-row"
    :class="[rowClass, { 'is-current-user': isCurrentUser, 'is-podium': isPodium }]"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <!-- Rank -->
    <div class="rank" :class="{ 'rank-podium': isPodium }">
      <i v-if="entry.position === 1" class="pi pi-crown rank-icon rank-gold-icon" />
      <span v-else class="rank-num">{{ entry.position }}</span>
    </div>

    <!-- Avatar -->
    <Avatar
      :label="avatarLabel"
      :style="avatarStyle"
      shape="circle"
      class="player-avatar"
      :class="{ 'avatar-podium': isPodium }"
    />

    <!-- Name + gap + bar -->
    <div class="row-info">
      <div class="row-top-line">
        <span class="row-name">{{ entry.nickname }}</span>
        <span v-if="isCurrentUser" class="you-label">{{ $t('leaderboard.you') }}</span>
      </div>

      <div v-if="gapToPrev != null && gapToPrev > 0" class="gap-to-prev">
        +{{ formatPoints(gapToPrev) }} {{ $t('leaderboard.gapToPrev') }}
      </div>

      <div class="row-bar-line">
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: barWidth }" />
        </div>
      </div>
    </div>

    <!-- Points + movement -->
    <div class="row-right">
      <div class="points">{{ formatPoints(entry.totalPoints) }}</div>
      <div class="movement">
        <template v-if="movement === null">
          <span class="movement-new">{{ $t('leaderboard.newPlayer') }}</span>
        </template>
        <template v-else-if="movement.type === 'up'">
          <span class="movement-up"><i class="pi pi-arrow-up" />{{ movement.value }}</span>
        </template>
        <template v-else-if="movement.type === 'down'">
          <span class="movement-down"><i class="pi pi-arrow-down" />{{ movement.value }}</span>
        </template>
        <template v-else>
          <span class="movement-same">—</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Row shell ──────────────────────────────────────── */
.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-left: 3px solid transparent;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
  transition: background 0.12s ease, filter 0.12s ease;
}
.leaderboard-row:last-child { border-bottom: none; }
.leaderboard-row:hover { filter: brightness(0.965); }
.leaderboard-row:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}
.is-podium { padding: 13px 16px; }

/* ── Row colours ─────────────────────────────────────── */
.row-gold   { background: linear-gradient(90deg,#fffbeb,#fef3c7); border-left-color: #f59e0b; }
.row-silver { background: linear-gradient(90deg,#f8fafc,#f1f5f9); border-left-color: #94a3b8; }
.row-bronze { background: linear-gradient(90deg,#fffaf5,#fff7ed); border-left-color: #d97706; }
.row-you    { background: linear-gradient(90deg,#f0fdf9,#ccfbf1); border-left-color: #0d9488; }
.row-plain  { background: #ffffff; border-left-color: transparent; }

/* ── Rank ────────────────────────────────────────────── */
.rank {
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
.rank-num {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
}
.rank-podium .rank-num {
  font-size: 15px;
  color: #64748b;
}
.rank-icon {
  font-size: 18px;
}
.rank-gold-icon { color: #f59e0b; }

/* ── Avatar ──────────────────────────────────────────── */
.player-avatar {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 13px;
  width: 34px !important;
  height: 34px !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.avatar-podium {
  width: 38px !important;
  height: 38px !important;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}

/* ── Row info (name + bar) ───────────────────────────── */
.row-info {
  flex: 1;
  min-width: 0;
}
.row-top-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.row-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
}
.row-gold   .row-name { color: #78350f; font-weight: 700; }
.row-silver .row-name { color: #1e293b; font-weight: 700; }
.row-bronze .row-name { color: #7c2d12; font-weight: 700; }
.row-you    .row-name { color: #134e4a; font-weight: 700; }

.you-label {
  font-size: 9px;
  font-weight: 800;
  color: #0d9488;
  background: #ccfbf1;
  padding: 1px 6px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.gap-to-prev {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 3px;
  font-variant-numeric: tabular-nums;
}

/* ── Progress bar ────────────────────────────────────── */
.row-bar-line { display: flex; align-items: center; }
.progress-track {
  flex: 1;
  height: 5px;
  background: rgba(0,0,0,0.07);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  background: #cbd5e1;
}
.row-gold   .progress-bar { background: linear-gradient(90deg,#fbbf24,#f59e0b); }
.row-silver .progress-bar { background: linear-gradient(90deg,#94a3b8,#64748b); }
.row-bronze .progress-bar { background: linear-gradient(90deg,#fb923c,#d97706); }
.row-you    .progress-bar { background: linear-gradient(90deg,#2dd4bf,#0d9488); }
.row-plain  .progress-bar { background: #a5b4fc; }

/* ── Right column (points + movement) ───────────────── */
.row-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 54px;
}
.points {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  font-size: 16px;
  line-height: 1;
  color: #1e293b;
}
.is-podium .points { font-size: 18px; }
.row-gold   .points { color: #92400e; }
.row-silver .points { color: #334155; }
.row-bronze .points { color: #7c2d12; }
.row-you    .points { color: #0f766e; }
.row-plain  .points { color: #475569; }

.movement {
  font-size: 10px;
  font-weight: 700;
  text-align: right;
}
.movement .pi { font-size: 9px; margin-right: 1px; }
.movement-up   { color: #10b981; }
.movement-down { color: #f43f5e; }
.movement-same { color: #cbd5e1; font-size: 12px; }
.movement-new  { color: #e2e8f0; font-size: 9px; font-weight: 500; }
</style>
