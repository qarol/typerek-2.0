<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Tag from 'primevue/tag'
import type { Match } from '@/api/types'
import { getMatchState, type MatchState } from '@/utils/matchSorting'
import { useBetsStore } from '@/stores/bets'
import BetSelector from './BetSelector.vue'
import RevealList from './RevealList.vue'

interface Props {
  match: Match
}

const props = defineProps<Props>()
const { t } = useI18n()
const betsStore = useBetsStore()

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
}

function getFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? '🏳️'
}

const matchState = computed(() => getMatchState(props.match))

const currentBet = computed(() => betsStore.getBetForMatch(props.match.id))

const hasOdds = computed(() => props.match.oddsHome !== null)

const formattedKickoffTime = computed(() => {
  const date = new Date(props.match.kickoffTime)
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

const statusTag = computed(() => {
  const state = matchState.value
  if (state === 'scored') {
    return {
      severity: 'success' as const,
      value: `${t('matches.scored')} · ${props.match.homeScore} : ${props.match.awayScore}`,
    }
  } else if (state === 'locked') {
    return {
      severity: 'secondary' as const,
      value: t('matches.locked'),
    }
  } else {
    return {
      severity: 'success' as const,
      value: t('matches.open'),
    }
  }
})

const isMuted = computed(() => matchState.value === 'locked')
</script>

<template>
  <div class="match-card" :class="{ 'is-muted': isMuted }">
    <div class="match-header">
      <div class="team-info">
        <span class="team-name">
          {{ getFlag(match.homeTeam) }} {{ match.homeTeam }}
        </span>
        <span class="vs">vs</span>
        <span class="team-name">
          {{ getFlag(match.awayTeam) }} {{ match.awayTeam }}
        </span>
      </div>
      <Tag :severity="statusTag.severity" :value="statusTag.value" />
    </div>

    <div class="match-details">
      <span class="kickoff-time">{{ formattedKickoffTime }}</span>
      <span v-if="match.groupLabel" class="group-label">
        {{ match.groupLabel }}
      </span>
      <Tag v-if="matchState === 'open' && !hasOdds" severity="warning" :value="t('matches.noOddsYet')" />
    </div>

    <div v-if="matchState === 'open'" class="bet-section">
      <BetSelector :match="match" />
      <div class="bet-status">
        <Tag
          v-if="currentBet"
          severity="success"
          :value="`${t('matches.yourBet')}: ${currentBet.betType}`"
          class="your-bet-tag"
        />
        <Tag v-else severity="warning" :value="t('matches.noBetPlaced')" />
      </div>
    </div>

    <RevealList v-if="matchState === 'locked' || matchState === 'scored'" :match="match" />
  </div>
</template>

<style scoped>
.match-card {
  background: #FAFAFA;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.match-card.is-muted .team-name,
.match-card.is-muted .kickoff-time {
  opacity: 0.6;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
  font-weight: 600;
  font-size: 0.9375rem;
}

.team-name {
  white-space: nowrap;
}

.vs {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8125rem;
}

.match-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8125rem;
  color: #64748b;
  flex-wrap: wrap;
}

.kickoff-time {
  font-weight: 500;
}

.group-label {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 4px;
  color: #0D9488;
  font-weight: 500;
}

.bet-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.bet-status {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Custom color for "Your bet" teal indicator */
:deep(.your-bet-tag) {
  background-color: #0d9488 !important;
  color: white !important;
}

/* Touch target minimum 48x48dp */
@media (pointer: coarse) {
  .match-card {
    min-height: 80px;
  }
}
</style>
