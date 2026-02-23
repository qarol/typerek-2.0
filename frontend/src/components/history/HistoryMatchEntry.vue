<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HistoryEntry } from '@/api/types'

const props = defineProps<{
  entry: HistoryEntry
}>()

const { t, locale } = useI18n()

type EntryState = 'correct' | 'wrong' | 'missed' | 'pending' | 'no-bet'

const entryState = computed((): EntryState => {
  const { correct, betType } = props.entry
  if (correct === null) {
    return betType !== null ? 'pending' : 'no-bet'
  }
  if (correct === true) return 'correct'
  return betType !== null ? 'wrong' : 'missed'
})

const kickoffDate = computed(() => {
  return new Date(props.entry.kickoffTime).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
  })
})

const score = computed(() => {
  if (props.entry.homeScore === null || props.entry.awayScore === null) return null
  return `${props.entry.homeScore} - ${props.entry.awayScore}`
})
</script>

<template>
  <li role="listitem" class="history-match-entry" :data-state="entryState">
    <div class="entry-match-info">
      <span class="entry-teams">{{ entry.homeTeam }} vs {{ entry.awayTeam }}</span>
      <span class="entry-date">{{ kickoffDate }}</span>
      <span v-if="score" class="entry-score">{{ score }}</span>
    </div>
    <div class="entry-result">
      <template v-if="entryState === 'correct'">
        <span class="state-correct">✓ {{ entry.betType }} {{ t('history.pointsEarned', { points: entry.pointsEarned.toFixed(2) }) }}</span>
      </template>
      <template v-else-if="entryState === 'wrong'">
        <span class="state-wrong">{{ entry.betType }} {{ t('history.pointsZero') }}</span>
      </template>
      <template v-else-if="entryState === 'missed'">
        <span class="state-missed">{{ t('history.missed') }} {{ t('history.pointsZero') }}</span>
      </template>
      <template v-else-if="entryState === 'pending'">
        <span class="state-pending">{{ entry.betType }} · {{ t('history.pending') }}</span>
      </template>
      <template v-else>
        <span class="state-no-bet">{{ t('history.noBet') }}</span>
      </template>
    </div>
  </li>
</template>

<style scoped>
.history-match-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border, #e2e8f0);
}

.entry-match-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.entry-teams {
  font-weight: 500;
  font-size: 0.875rem;
}

.entry-date {
  font-size: 0.75rem;
  color: #64748b;
}

.entry-score {
  font-size: 0.75rem;
  color: #64748b;
}

.entry-result {
  text-align: right;
  font-size: 0.875rem;
}

.state-correct {
  color: #10B981;
  font-weight: 500;
}

.state-wrong,
.state-missed,
.state-no-bet {
  color: #9CA3AF;
}

.state-pending {
  color: #64748b;
}
</style>
