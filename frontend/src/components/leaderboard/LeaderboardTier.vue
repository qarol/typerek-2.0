<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/api/types'

const props = defineProps<{
  position: number
  totalPoints: number
  players: LeaderboardEntry[]
  currentUserId: number | null
}>()

const emit = defineEmits<{ navigate: [userId: number] }>()

const { t } = useI18n()

// ── Ordinal suffix ────────────────────────────────────────
function ordinalSuffix(n: number): string {
  // 11, 12, 13 always take 'th'
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const suffix = computed(() => ordinalSuffix(props.position))

// ── Accent class ─────────────────────────────────────────
const tierAccentClass = computed(() => {
  if (props.position === 1) return 'tier-gold'
  if (props.position === 2) return 'tier-silver'
  if (props.position === 3) return 'tier-bronze'
  return ''
})

// ── Sorted players: current user first ───────────────────
const sortedPlayers = computed(() => {
  if (props.currentUserId === null) return props.players
  return [...props.players].sort((a, b) => {
    if (a.userId === props.currentUserId) return -1
    if (b.userId === props.currentUserId) return 1
    return 0
  })
})

// ── Show count badge only when 2+ players ────────────────
const showCount = computed(() => props.players.length >= 2)

// ── Per-player helpers ───────────────────────────────────
function initial(nickname: string): string {
  return (nickname[0] ?? '?').toUpperCase()
}

function movement(entry: LeaderboardEntry) {
  if (entry.previousPosition === null) return null
  const diff = entry.previousPosition - entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
}

function avatarAriaLabel(nickname: string): string {
  return t('leaderboard.avatarHistoryLabel', { nickname })
}

function badgeAriaLabel(entry: LeaderboardEntry): string | undefined {
  const m = movement(entry)
  if (!m) return undefined
  if (m.type === 'up')   return t('leaderboard.moveUpLabel',   { n: m.value })
  if (m.type === 'down') return t('leaderboard.moveDownLabel', { n: m.value })
  return t('leaderboard.noChangeLabel')
}

function handleClick(userId: number) {
  emit('navigate', userId)
}

function handleKeydown(e: KeyboardEvent, userId: number) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('navigate', userId)
  }
}
</script>

<template>
  <div class="leaderboard-tier" role="listitem">

    <!-- Tier header -->
    <div class="tier-head" :class="tierAccentClass">
      <span class="tier-pos">
        {{ position }}<sup>{{ suffix }}</sup>
      </span>
      <div class="tier-meta">
        <span class="tier-pts">{{ $t('leaderboard.pointsFormat', { points: totalPoints }) }}</span>
        <span v-if="showCount" class="tier-count">
          {{ $t('leaderboard.tierPlayerCount', { count: players.length }) }}
        </span>
      </div>
    </div>

    <!-- Avatar grid -->
    <div class="tier-avatars">
      <div
        v-for="entry in sortedPlayers"
        :key="entry.userId"
        class="av-item"
      >
        <div
          class="av-circle"
          :class="{ 'av-circle--me': entry.userId === currentUserId }"
          tabindex="0"
          :aria-label="avatarAriaLabel(entry.nickname)"
          @click="handleClick(entry.userId)"
          @keydown="handleKeydown($event, entry.userId)"
        >
          {{ initial(entry.nickname) }}

          <!-- Movement badge -->
          <template v-if="movement(entry) !== null">
            <span
              v-if="movement(entry)!.type === 'up'"
              class="av-badge av-badge--up"
              :aria-label="badgeAriaLabel(entry)"
            >▲{{ movement(entry)!.value }}</span>
            <span
              v-else-if="movement(entry)!.type === 'down'"
              class="av-badge av-badge--dn"
              :aria-label="badgeAriaLabel(entry)"
            >▼{{ movement(entry)!.value }}</span>
            <span
              v-else
              class="av-badge av-badge--nc"
              :aria-label="badgeAriaLabel(entry)"
            >—</span>
          </template>
        </div>

        <span
          class="av-name"
          :class="{ 'av-name--me': entry.userId === currentUserId }"
        >{{ entry.nickname }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Tier block ──────────────────────────────────────────── */
.leaderboard-tier {
  border-bottom: 1px solid #e5e7eb;
}
.leaderboard-tier:last-child {
  border-bottom: none;
}

/* ── Tier header ─────────────────────────────────────────── */
.tier-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  border-left: 4px solid #e5e7eb;
  background: #fafafa;
}
.tier-gold   { border-left-color: #f59e0b; background: linear-gradient(90deg, #fffbeb 0%, #fafafa 65%); }
.tier-silver { border-left-color: #94a3b8; background: linear-gradient(90deg, #f8fafc 0%, #fafafa 65%); }
.tier-bronze { border-left-color: #c2855a; background: linear-gradient(90deg, #fdf4ee 0%, #fafafa 65%); }

.tier-pos {
  font-size: 16px;
  font-weight: 800;
  color: #374151;
  line-height: 1;
}
.tier-pos sup { font-size: 9px; font-weight: 700; }
.tier-gold   .tier-pos { color: #d97706; }
.tier-silver .tier-pos { color: #64748b; }
.tier-bronze .tier-pos { color: #c2855a; }

.tier-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tier-pts {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  font-variant-numeric: tabular-nums;
}
.tier-count {
  font-size: 10px;
  color: #9ca3af;
  background: #efefef;
  padding: 2px 7px;
  border-radius: 99px;
}

/* ── Avatar grid ─────────────────────────────────────────── */
.tier-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px 13px;
  background: white;
}

.av-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 48px;
}

.av-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  position: relative;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 0.12s ease;
  outline: none;
}
.av-circle:hover { filter: brightness(0.93); }
.av-circle:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: 2px;
}
.av-circle--me {
  background: #f0fdfa;
  border-color: #0d9488;
  color: #0d9488;
}

.av-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  font-size: 8px;
  font-weight: 800;
  background: white;
  border-radius: 99px;
  padding: 1px 3px;
  line-height: 1.2;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
  pointer-events: none;
}
.av-badge--up { color: #10b981; border-color: #bbf7d0; background: #f0fdf4; }
.av-badge--dn { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
.av-badge--nc { color: #9ca3af; border-color: #e5e7eb; }

.av-name {
  font-size: 9px;
  color: #6b7280;
  text-align: center;
  width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.av-name--me {
  color: #0d9488;
  font-weight: 700;
}
</style>
