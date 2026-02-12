<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { LeaderboardEntry } from '@/api/types'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}

const props = defineProps<Props>()
const router = useRouter()

const movement = computed(() => {
  if (props.entry.previousPosition === null) return null
  const diff = props.entry.previousPosition - props.entry.position
  if (diff > 0) return { type: 'up', value: diff }
  if (diff < 0) return { type: 'down', value: Math.abs(diff) }
  return { type: 'same' }
})

const movementIndicator = computed(() => {
  if (!movement.value) return ''
  if (movement.value.type === 'up') return `▲${movement.value.value}`
  if (movement.value.type === 'down') return `▼${movement.value.value}`
  return '—'
})

const movementColor = computed(() => {
  if (!movement.value) return '#9CA3AF'
  if (movement.value.type === 'up') return '#10B981'
  if (movement.value.type === 'down') return '#EF4444'
  return '#9CA3AF'
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
    :class="{ 'is-current-user': isCurrentUser }"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <div class="row-content">
      <div class="position">
        {{ entry.position }}
      </div>
      <div class="nickname">
        {{ entry.nickname }}
      </div>
      <div v-if="movement" class="movement" :style="{ color: movementColor }">
        {{ movementIndicator }}
      </div>
      <div class="points">
        {{ entry.totalPoints.toFixed(2) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.leaderboard-row:hover {
  background-color: #f3f4f6;
}

.leaderboard-row:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.leaderboard-row.is-current-user {
  background-color: #f0fdfa;
}

.row-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.position {
  font-weight: 700;
  text-align: right;
  width: 48px;
  flex-shrink: 0;
}

.nickname {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movement {
  width: 40px;
  text-align: center;
  flex-shrink: 0;
  font-weight: 500;
}

.points {
  font-weight: 700;
  text-align: right;
  width: 60px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
</style>
