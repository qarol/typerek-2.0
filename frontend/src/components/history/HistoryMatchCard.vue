<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HistoryEntry } from '@/api/types'

const props = defineProps<{ entry: HistoryEntry }>()
const { t } = useI18n()

type EntryState = 'correct' | 'wrong' | 'missed' | 'pending' | 'no-bet'

const entryState = computed((): EntryState => {
  const { correct, betType } = props.entry
  if (correct === null) return betType !== null ? 'pending' : 'no-bet'
  if (correct === true) return 'correct'
  return betType !== null ? 'wrong' : 'missed'
})

const isScored = computed(() =>
  props.entry.homeScore !== null && props.entry.awayScore !== null
)

const formattedKickoffTime = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.entry.kickoffTime))
)

const TEAM_FLAGS: Record<string, string> = {
  Mexico: '🇲🇽', Jamaica: '🇯🇲', Colombia: '🇨🇴', Senegal: '🇸🇳',
  USA: '🇺🇸', Morocco: '🇲🇦', Argentina: '🇦🇷', Denmark: '🇩🇰',
  Canada: '🇨🇦', Australia: '🇦🇺', Germany: '🇩🇪', Japan: '🇯🇵',
  Brazil: '🇧🇷', Nigeria: '🇳🇬', Spain: '🇪🇸', 'South Korea': '🇰🇷',
  France: '🇫🇷', 'Saudi Arabia': '🇸🇦', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Netherlands: '🇳🇱',
  Portugal: '🇵🇹', Ecuador: '🇪🇨', Italy: '🇮🇹', Ghana: '🇬🇭',
  Belgium: '🇧🇪', Ukraine: '🇺🇦', Serbia: '🇷🇸', Switzerland: '🇨🇭',
  Austria: '🇦🇹', Pakistan: '🇵🇰', Czechia: '🇨🇿', Turkey: '🇹🇷',
  Greece: '🇬🇷', Slovakia: '🇸🇰', Norway: '🇳🇴', 'New Zealand': '🇳🇿',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Hong Kong': '🇭🇰', Hungary: '🇭🇺', Malta: '🇲🇹',
  Iceland: '🇮🇸', Guatemala: '🇬🇹', Kazakhstan: '🇰🇿', Slovenia: '🇸🇮',
  Croatia: '🇭🇷', China: '🇨🇳', Cameroon: '🇨🇲', Poland: '🇵🇱', Albania: '🇦🇱',
}

function getFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? '🏳️'
}
</script>

<template>
  <div class="history-match-card">
    <div class="card-left">
      <!-- Top meta row -->
      <div class="card-top">
        <span class="kickoff-meta">{{ formattedKickoffTime }}</span>
        <div class="status-badge" :class="isScored ? 'status-scored' : 'status-pending'">
          {{ isScored ? t('matches.scored') : t('matches.open') }}
        </div>
      </div>

      <!-- Teams row -->
      <div class="teams-row">
        <span class="team-name">{{ getFlag(entry.homeTeam) }} {{ entry.homeTeam }}</span>
        <div class="match-center">
          <div v-if="isScored" class="score-box">
            <span class="score-num">{{ entry.homeScore }}</span>
            <span class="score-sep">–</span>
            <span class="score-num">{{ entry.awayScore }}</span>
          </div>
          <span v-else class="vs-text">VS</span>
        </div>
        <span class="team-name team-away">{{ entry.awayTeam }} {{ getFlag(entry.awayTeam) }}</span>
      </div>
    </div>

    <!-- Bet result area -->
    <div class="bet-info-box" :class="`bet-${entryState}`">
      <div class="bet-left">
        <span class="bet-label">{{ t('matches.yourBet') }}:</span>
        <span v-if="entry.betType" class="bet-pill" :class="`pill-${entryState}`">
          {{ entry.betType }}
        </span>
        <span v-else class="no-bet">—</span>
      </div>
      <div class="bet-right">
        <template v-if="entryState === 'correct'">
          <span class="points correct-pts">{{ t('history.pointsEarned', { points: entry.pointsEarned.toFixed(2) }) }}</span>
        </template>
        <template v-else-if="entryState === 'wrong'">
          <span class="points zero-pts">{{ t('history.pointsZero') }}</span>
        </template>
        <template v-else-if="entryState === 'missed'">
          <span class="points zero-pts">{{ t('history.missed') }}</span>
        </template>
        <template v-else-if="entryState === 'pending'">
          <span class="points pending-pts">{{ t('history.pending') }}</span>
        </template>
        <template v-else>
          <span class="points zero-pts">{{ t('history.noBet') }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-match-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 104, 95, 0.06);
  border: 1px solid rgba(188, 201, 198, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

/* ── Card top meta row ── */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kickoff-meta {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6d7a77;
  white-space: nowrap;
}

.status-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-scored {
  background: #eeeeee;
  color: #3d4947;
}

.status-pending {
  background: #eeeeee;
  color: #3d4947;
}

/* ── Teams row ── */
.teams-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #1a1c1c;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-away {
  text-align: right;
}

.match-center {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
}

.vs-text {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem;
  color: #6d7a77;
  font-style: italic;
}

.score-box {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #eeeeee;
  border-radius: 8px;
  padding: 4px 10px;
}

.score-num {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.125rem;
  color: #1a1c1c;
  line-height: 1;
}

.score-sep {
  color: #6d7a77;
  font-weight: 600;
  font-size: 0.875rem;
}

/* ── Bet info box ── */
.bet-info-box {
  background: rgba(0, 104, 95, 0.05);
  border: 1px solid rgba(0, 104, 95, 0.1);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.bet-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.bet-label {
  font-size: 0.75rem;
  color: #3d4947;
  font-weight: 500;
  white-space: nowrap;
}

.bet-pill {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  color: white;
}

.pill-correct  { background: #00685f; }
.pill-wrong    { background: #9ca3af; }
.pill-missed   { background: #9ca3af; }
.pill-pending  { background: #0d9488; }
.pill-no-bet   { background: #9ca3af; }

.no-bet {
  color: #6d7a77;
  font-weight: 500;
  font-size: 0.75rem;
}

.bet-right {
  flex-shrink: 0;
}

.points {
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.correct-pts  { color: #00685f; }
.zero-pts     { color: #9ca3af; }
.pending-pts  { color: #6d7a77; }

@media (min-width: 768px) {
  .history-match-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 24px;
    padding: 18px 24px;
  }

  .team-name {
    font-size: 1.0625rem;
  }
}
</style>
