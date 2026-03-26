<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/api/types'
import { formatPoints } from '@/utils/formatPoints'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const { t } = useI18n()

const isPodium = computed(() => props.entry.position <= 3)

const movement = computed(() => {
  if (props.entry.previousPosition === null) return null
  const diff = props.entry.previousPosition - props.entry.position
  if (diff > 0) return { type: 'up' as const, value: diff }
  if (diff < 0) return { type: 'down' as const, value: Math.abs(diff) }
  return { type: 'same' as const }
})

const isZeroPoints = computed(() => props.entry.totalPoints === 0)

const rowClass = computed(() => {
  if (isPodium.value) {
    if (props.entry.position === 1) return 'row-podium row-gold'
    if (props.entry.position === 2) return 'row-podium row-silver'
    return 'row-podium row-bronze'
  }
  if (props.isCurrentUser) return 'row-flat row-you'
  return 'row-flat'
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
    :class="[rowClass, { 'is-zero': isZeroPoints }]"
    tabindex="0"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <!-- Position column -->
    <div class="pos-col">
      <i v-if="entry.position === 1" class="pi pi-crown pos-crown" />
      <span v-else class="pos-num" :class="{ 'pos-podium': isPodium }">{{ entry.position }}</span>
    </div>

    <!-- Name + movement column -->
    <div class="info-col">
      <div class="name-row">
        <span class="player-name">{{ entry.nickname }}</span>
        <span v-if="isCurrentUser" class="me-badge">{{ t('leaderboard.you') }}</span>
      </div>
      <div class="movement-row">
        <template v-if="movement === null">
          <span class="mv-new">{{ t('leaderboard.newPlayer') }}</span>
        </template>
        <template v-else-if="movement.type === 'up'">
          <i class="pi pi-arrow-up mv-icon mv-up" />
          <span class="mv-label mv-up">+{{ movement.value }}</span>
        </template>
        <template v-else-if="movement.type === 'down'">
          <i class="pi pi-arrow-down mv-icon mv-down" />
          <span class="mv-label mv-down">-{{ movement.value }}</span>
        </template>
        <template v-else>
          <span class="mv-same">—</span>
        </template>
      </div>
    </div>

    <!-- Points column -->
    <div class="pts-col" :class="{ 'pts-accent': isPodium || isCurrentUser, 'pts-zero': isZeroPoints }">
      {{ $t('leaderboard.pointsFormat', { points: formatPoints(entry.totalPoints) }) }}
    </div>
  </div>
</template>

<style scoped>
/* ── Base row ────────────────────────────────────────── */
.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  outline: none;
  transition: filter 0.12s ease;
}

.leaderboard-row:hover { filter: brightness(0.96); }

.leaderboard-row:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}

/* ── Podium rows (cards) ─────────────────────────────── */
.row-podium {
  background: #ffffff;
  border-radius: 12px;
  border-left: 4px solid transparent;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  margin-bottom: 6px;
}

.row-gold   { border-left-color: #FFD700; }
.row-silver { border-left-color: #C0C0C0; }
.row-bronze { border-left-color: #CD7F32; }

/* ── Flat rows (position 4+) ─────────────────────────── */
.row-flat {
  background: rgba(243, 243, 243, 0.5);
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.row-flat:last-child { border-bottom: none; }

/* ── Current user (flat) ─────────────────────────────── */
.row-you {
  background: rgba(0, 104, 95, 0.04);
  border-top: 1px solid rgba(0, 104, 95, 0.1);
  border-bottom: 1px solid rgba(0, 104, 95, 0.1) !important;
}

/* ── Zero-point rows ─────────────────────────────────── */
.is-zero { opacity: 0.75; }

/* ── Position column ─────────────────────────────────── */
.pos-col {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pos-crown {
  font-size: 1.125rem;
  color: #FFD700;
}

.pos-num {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1;
}

.pos-podium { color: #64748b; font-size: 1.125rem; }

/* ── Info column ─────────────────────────────────────── */
.info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #1a1c1c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me-badge {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #ffffff;
  background: #00685f;
  padding: 1px 6px;
  border-radius: 3px;
}

/* ── Movement row ────────────────────────────────────── */
.movement-row {
  display: flex;
  align-items: center;
  gap: 3px;
}

.mv-icon {
  font-size: 0.625rem;
}

.mv-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mv-up   { color: #00685f; }
.mv-down { color: #ba1a1a; }
.mv-same { font-size: 0.75rem; color: #9ca3af; line-height: 1; }
.mv-new  { font-size: 0.625rem; color: #bcc9c6; font-weight: 500; }

/* ── Points column ───────────────────────────────────── */
.pts-col {
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #3d4947;
  text-align: right;
  white-space: nowrap;
}

.pts-accent { color: #00685f; }
.pts-zero   { color: rgba(61, 73, 71, 0.4); }
</style>
