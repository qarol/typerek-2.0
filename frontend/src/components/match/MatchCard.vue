<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Match } from '@/api/types'
import { getMatchState } from '@/utils/matchSorting'
import BetSelector from './BetSelector.vue'
import RevealDrawer from './RevealDrawer.vue'

interface Props {
  match: Match
  needsBet?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const TEAM_FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽',
  'Jamaica': '🇯🇲',
  'Colombia': '🇨🇴',
  'Senegal': '🇸🇳',
  'USA': '🇺🇸',
  'Morocco': '🇲🇦',
  'Argentina': '🇦🇷',
  'Denmark': '🇩🇰',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Germany': '🇩🇪',
  'Japan': '🇯🇵',
  'Brazil': '🇧🇷',
  'Nigeria': '🇳🇬',
  'Spain': '🇪🇸',
  'South Korea': '🇰🇷',
  'France': '🇫🇷',
  'Saudi Arabia': '🇸🇦',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Netherlands': '🇳🇱',
  'Portugal': '🇵🇹',
  'Ecuador': '🇪🇨',
  'Italy': '🇮🇹',
  'Ghana': '🇬🇭',
  'Belgium': '🇧🇪',
  'Ukraine': '🇺🇦',
  'Serbia': '🇷🇸',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Pakistan': '🇵🇰',
  'Czechia': '🇨🇿',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Slovakia': '🇸🇰',
  'Norway': '🇳🇴',
  'New Zealand': '🇳🇿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Hong Kong': '🇭🇰',
  'Hungary': '🇭🇺',
  'Malta': '🇲🇹',
  'Iceland': '🇮🇸',
  'Guatemala': '🇬🇹',
  'Kazakhstan': '🇰🇿',
  'Slovenia': '🇸🇮',
  'Croatia': '🇭🇷',
  'China': '🇨🇳',
  'Cameroon': '🇨🇲',
  'Poland': '🇵🇱',
  'Albania': '🇦🇱',
}

function getFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? '🏳️'
}

const matchState = computed(() => getMatchState(props.match))
const isScored = computed(() => matchState.value === 'scored')
const isLocked = computed(() => matchState.value === 'locked')

const formattedKickoffTime = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.match.kickoffTime)),
)
</script>

<template>
  <div
    class="match-card"
    :class="{
      'is-muted': isLocked,
      'needs-bet': needsBet && !isLocked,
    }"
  >
    <div class="card-left">
      <!-- Top meta row -->
      <div class="card-top">
        <div class="meta-left">
          <span v-if="match.groupLabel" class="group-pill">{{ match.groupLabel }}</span>
          <span class="kickoff-meta">{{ formattedKickoffTime }}</span>
        </div>
        <div class="status-badge" :class="`status-${matchState}`">
          <span v-if="isLocked" class="live-dot" />
          {{ t(`matches.${matchState}`) }}
        </div>
      </div>

      <!-- Teams row -->
      <div class="teams-row">
        <span class="team-name">{{ getFlag(match.homeTeam) }} {{ match.homeTeam }}</span>
        <div class="match-center">
          <div v-if="isScored" class="score-box">
            <span class="score-num">{{ match.homeScore }}</span>
            <span class="score-sep">–</span>
            <span class="score-num">{{ match.awayScore }}</span>
          </div>
          <span v-else class="vs-text">VS</span>
        </div>
        <span class="team-name team-away">{{ match.awayTeam }} {{ getFlag(match.awayTeam) }}</span>
      </div>
    </div>

    <!-- Bet / reveal area -->
    <div class="card-right">
      <div v-if="matchState === 'open'" class="open-section">
        <BetSelector :match="match" />
      </div>
      <RevealDrawer v-if="isLocked || isScored" :match="match" />
    </div>
  </div>
</template>

<style scoped>
/* ── Card container ── */
.match-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 104, 95, 0.06);
  border: 1px solid rgba(188, 201, 198, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card.needs-bet {
  border-left: 4px solid #f59e0b;
  padding-left: 12px;
}

.match-card.is-muted {
  opacity: 0.82;
}

/* ── card-left / card-right ── */
.card-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.card-right {
  min-width: 0;
}

/* ── Card top meta row ── */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.group-pill {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  background: #eeeeee;
  color: #3d4947;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.kickoff-meta {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6d7a77;
  white-space: nowrap;
}

/* ── Status badge ── */
.status-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-open {
  background: #eeeeee;
  color: #3d4947;
}

.status-locked {
  background: rgba(186, 26, 26, 0.1);
  color: #ba1a1a;
}

.status-scored {
  background: #eeeeee;
  color: #3d4947;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ba1a1a;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
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

/* ── Bet / reveal sections ── */
.open-section {
  padding-top: 12px;
  border-top: 1px solid #f0f1f1;
}

/* Remove top border from RevealDrawer on mobile (it has its own) */
:deep(.reveal-summary-wrapper) {
  margin-top: 0;
}

/* ── Desktop: side-by-side layout ── */
@media (min-width: 768px) {
  .match-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 24px;
    padding: 18px 24px;
  }

  .match-card.needs-bet {
    padding-left: 20px;
  }

  .card-left {
    min-width: 0;
    gap: 8px;
  }

  .card-right {
    min-width: 0;
  }

  .open-section {
    padding-top: 0;
    border-top: none;
  }

  :deep(.reveal-summary-wrapper) {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  .team-name {
    font-size: 1.0625rem;
  }
}
</style>
