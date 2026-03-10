<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/api/types'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  isCoWinner: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const { t } = useI18n()

// Row style class — current user always gets teal, overrides medal
const rowClass = computed(() => {
  if (props.isCurrentUser) return 'row-you'
  if (props.entry.position === 1) return 'row-gold'
  if (props.entry.position === 2) return 'row-silver'
  if (props.entry.position === 3) return 'row-bronze'
  return 'row-plain'
})

// Rank circle style class
const rankClass = computed(() => {
  if (props.isCurrentUser) return 'rank-you'
  if (props.entry.position === 1) return 'rank-gold'
  if (props.entry.position === 2) return 'rank-silver'
  if (props.entry.position === 3) return 'rank-bronze'
  return 'rank-plain'
})

// Badge config — icon class + label. null = no badge shown
const badge = computed<{ icon: string; label: string; cssClass: string } | null>(() => {
  if (props.isCurrentUser) {
    return { icon: 'pi-user', label: t('leaderboard.you'), cssClass: 'badge-you' }
  }
  if (props.entry.position === 1) {
    const label = props.isCoWinner ? t('leaderboard.coWinner') : t('leaderboard.leader')
    return { icon: 'pi-crown', label, cssClass: 'badge-gold' }
  }
  if (props.entry.position === 2) {
    return { icon: 'pi-star-fill', label: t('leaderboard.secondPlace'), cssClass: 'badge-silver' }
  }
  if (props.entry.position === 3) {
    return { icon: 'pi-trophy', label: t('leaderboard.thirdPlace'), cssClass: 'badge-bronze' }
  }
  return null
})

// Movement — null means no previous position data
const movement = computed(() => {
  if (props.entry.previousPosition === null) return null
  const diff = props.entry.previousPosition - props.entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
})

const handleClick = () => {
  router.push({ name: 'history', params: { userId: props.entry.userId } })
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    role="listitem"
    class="leaderboard-row"
    :class="[rowClass, { 'is-current-user': isCurrentUser }]"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <!-- Rank circle -->
    <div class="rank-circle" :class="rankClass">
      {{ entry.position }}
    </div>

    <!-- Name + badge -->
    <div class="row-info">
      <div class="row-name">{{ entry.nickname }}</div>
      <div v-if="badge" class="row-badge" :class="badge.cssClass">
        <i class="pi" :class="badge.icon" />
        {{ badge.label }}
      </div>
    </div>

    <!-- Movement indicator -->
    <div class="movement">
      <template v-if="movement === null">
        <span class="movement-new">{{ $t('leaderboard.newPlayer') }}</span>
      </template>
      <template v-else-if="movement.type === 'up'">
        <span class="movement-up">
          <i class="pi pi-arrow-up" />{{ movement.value }}
        </span>
      </template>
      <template v-else-if="movement.type === 'down'">
        <span class="movement-down">
          <i class="pi pi-arrow-down" />{{ movement.value }}
        </span>
      </template>
      <template v-else>
        <span class="movement-same">—</span>
      </template>
    </div>

    <!-- Points -->
    <div class="points">{{ entry.totalPoints.toFixed(2) }}</div>
  </div>
</template>

<style scoped>
/* Layout */
.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.leaderboard-row:last-child { border-bottom: none; }
.leaderboard-row:hover { filter: brightness(0.97); }
.leaderboard-row:focus {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}

/* Medal row backgrounds */
.row-gold   { background: linear-gradient(135deg,#fef9c3,#fef08a); border-bottom-color: #fbbf24; }
.row-silver { background: linear-gradient(135deg,#f1f5f9,#e2e8f0); border-bottom-color: #94a3b8; }
.row-bronze { background: linear-gradient(135deg,#fff7ed,#fed7aa); border-bottom-color: #f97316; }
.row-you    { background: #f0fdfa; border-bottom-color: #99f6e4; }
.row-plain  { background: white; border-bottom-color: #f3f4f6; }

/* Rank circle */
.rank-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}
.rank-gold   { background: linear-gradient(135deg,#f59e0b,#d97706); color: white; box-shadow: 0 2px 6px rgba(245,158,11,.45); }
.rank-silver { background: linear-gradient(135deg,#94a3b8,#64748b); color: white; box-shadow: 0 2px 5px rgba(100,116,139,.35); }
.rank-bronze { background: linear-gradient(135deg,#d97706,#b45309); color: white; box-shadow: 0 2px 5px rgba(180,83,9,.35); }
.rank-you    { background: #0d9488; color: white; }
.rank-plain  { background: #e5e7eb; color: #6b7280; }

/* Row info */
.row-info {
  flex: 1;
  padding: 0 12px;
  overflow: hidden;
}
.row-name {
  font-weight: 700;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-gold   .row-name { color: #78350f; }
.row-silver .row-name { color: #1e293b; }
.row-bronze .row-name { color: #7c2d12; }
.row-you    .row-name { color: #134e4a; }
.row-plain  .row-name { color: #374151; font-weight: 500; }

/* Badge */
.row-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
}
.row-badge .pi { font-size: 11px; }
.badge-gold   { color: #b45309; }
.badge-silver { color: #64748b; }
.badge-bronze { color: #c2410c; }
.badge-you    { color: #0d9488; text-transform: uppercase; letter-spacing: .4px; font-size: 10px; }

/* Movement */
.movement {
  min-width: 38px;
  text-align: right;
  margin-right: 12px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.movement .pi { font-size: 11px; margin-right: 1px; }
.movement-up   { color: #10b981; }
.movement-down { color: #ef4444; }
.movement-same { color: #9ca3af; font-size: 14px; }
.movement-new  { color: #d1d5db; font-size: 10px; font-weight: 500; }

/* Points */
.points {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  font-size: 15px;
  min-width: 52px;
  text-align: right;
  flex-shrink: 0;
}
.row-gold   .points { color: #78350f; }
.row-silver .points { color: #334155; font-size: 14px; }
.row-bronze .points { color: #7c2d12; }
.row-you    .points { color: #134e4a; font-size: 14px; }
.row-plain  .points { color: #6b7280; font-size: 14px; }
</style>
