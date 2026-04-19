<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { Match } from '@/api/types'
import { getMatchState, isBetCorrect } from '@/utils/matchSorting'
import { useBetsStore } from '@/stores/bets'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import BetSelector from './BetSelector.vue'

interface Props {
  match: Match
  needsBet?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'admin-edit': [match: Match] }>()
const { t } = useI18n()
const router = useRouter()
const betsStore = useBetsStore()
const authStore = useAuthStore()

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

const BET_OPTIONS = [
  { type: '1',  oddsField: 'oddsHome'     as keyof Match },
  { type: 'X',  oddsField: 'oddsDraw'     as keyof Match },
  { type: '2',  oddsField: 'oddsAway'     as keyof Match },
  { type: '1X', oddsField: 'oddsHomeDraw' as keyof Match },
  { type: 'X2', oddsField: 'oddsDrawAway' as keyof Match },
  { type: '12', oddsField: 'oddsHomeAway' as keyof Match },
] as const

function getFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? '🏳️'
}

function getOdds(oddsField: keyof Match): string {
  const val = props.match[oddsField] as number | null
  return val != null ? val.toFixed(2) : '—'
}

const matchState = computed(() => getMatchState(props.match))
const isScored = computed(() => matchState.value === 'scored')
const isLocked = computed(() => matchState.value === 'locked')

const hasNullOdds = computed(() =>
  props.match.oddsHome === null ||
  props.match.oddsDraw === null ||
  props.match.oddsAway === null ||
  props.match.oddsHomeDraw === null ||
  props.match.oddsDrawAway === null ||
  props.match.oddsHomeAway === null
)

const showAdminEdit = computed(() =>
  authStore.isAdmin && (
    (matchState.value === 'open' && hasNullOdds.value) ||
    matchState.value === 'locked'
  )
)

const userBet = computed(() => betsStore.getBetForMatch(props.match.id))

function isWinning(betType: string): boolean {
  if (!isScored.value || props.match.homeScore === null || props.match.awayScore === null) return false
  return isBetCorrect(betType, props.match.homeScore, props.match.awayScore)
}

const formattedKickoffTime = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.match.kickoffTime)),
)

function goToDetail() {
  if (isLocked.value || isScored.value) {
    router.push({ name: 'match-detail', params: { matchId: props.match.id } })
  }
}
</script>

<template>
  <div
    class="match-card"
    :class="{
      'is-live': isLocked,
      'is-scored': isScored,
      'needs-bet': needsBet && !isLocked,
    }"
    @click="goToDetail"
  >
    <div class="card-left">
      <!-- Top meta row -->
      <div class="card-top">
        <div class="meta-left">
          <span v-if="match.groupLabel" class="group-pill">{{ match.groupLabel }}</span>
          <span class="kickoff-meta">{{ formattedKickoffTime }}</span>
          <Button
            v-if="showAdminEdit"
            icon="pi pi-pencil"
            text
            severity="secondary"
            size="small"
            class="admin-edit-btn"
            @click.stop="emit('admin-edit', match)"
            :aria-label="'Edit match'"
          />
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

    <!-- Bet area: interactive for open, read-only for locked/scored -->
    <div class="card-right">

      <!-- Open: fully interactive BetSelector -->
      <div v-if="matchState === 'open'" class="bet-area open-area" @click.stop>
        <BetSelector :match="match" />
      </div>

      <!-- Locked: same layout, greyed out, user's pick shown -->
      <div v-else-if="isLocked" class="bet-area locked-area">
        <div class="bet-grid">
          <div
            v-for="opt in BET_OPTIONS"
            :key="opt.type"
            class="bet-btn"
            :class="{ 'user-pick': userBet?.betType === opt.type }"
          >
            <span class="btn-label">{{ opt.type }}</span>
            <span class="btn-odds">{{ getOdds(opt.oddsField) }}</span>
          </div>
        </div>
      </div>

      <!-- Scored: same greyed look as locked, user's pick gets green/red border -->
      <div v-else-if="isScored" class="bet-area scored-area">
        <div class="bet-grid">
          <div
            v-for="opt in BET_OPTIONS"
            :key="opt.type"
            class="bet-btn"
            :class="{
              'user-pick': userBet?.betType === opt.type,
              'user-correct': userBet?.betType === opt.type && isWinning(opt.type),
              'user-wrong': userBet?.betType === opt.type && !isWinning(opt.type),
            }"
          >
            <span class="btn-label">{{ opt.type }}</span>
            <span class="btn-odds">{{ getOdds(opt.oddsField) }}</span>
            <!-- Win/loss badge on user's pick -->
            <span
              v-if="userBet?.betType === opt.type"
              class="correct-badge"
              :class="isWinning(opt.type) ? 'badge-correct' : 'badge-wrong'"
            >{{ isWinning(opt.type) ? '✓' : '✗' }}</span>
          </div>
        </div>
        <!-- Points row for scored + user had a correct bet -->
        <div v-if="userBet && Number(userBet.pointsEarned) > 0" class="points-row">
          <span class="material-symbols-outlined points-star">stars</span>
          +{{ Number(userBet.pointsEarned).toFixed(2) }} pts
        </div>
      </div>

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
  position: relative;
  overflow: hidden;
}

.match-card.needs-bet {
  border-left: 4px solid #f59e0b;
  padding-left: 12px;
}

.match-card.is-live {
  border-left: 4px solid rgba(186, 26, 26, 0.45);
  padding-left: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.match-card.is-live:hover {
  box-shadow: 0 6px 24px rgba(186, 26, 26, 0.1);
}

.match-card.is-scored {
  background: #fafafa;
  cursor: pointer;
  transition: box-shadow 0.15s, background-color 0.15s;
}

.match-card.is-scored:hover {
  box-shadow: 0 6px 24px rgba(0, 104, 95, 0.1);
  background-color: #f8fffe;
}

.live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ba1a1a;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
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

.admin-edit-btn {
  padding: 0 !important;
  width: 20px !important;
  height: 20px !important;
  min-width: unset !important;
  color: #6d7a77 !important;
}

/* ── Status badge ── */
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

.status-open {
  background: #eeeeee;
  color: #3d4947;
}

.status-badge.status-locked {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(186, 26, 26, 0.1);
  color: #ba1a1a;
}

.status-badge.status-scored {
  background: #eeeeee;
  color: #6d7a77;
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

/* ── Bet areas ── */
.bet-area {
  padding-top: 12px;
  border-top: 1px solid #f0f1f1;
}

/* ── Shared bet grid (same structure as BetSelector) ── */
.bet-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  width: 100%;
}

.bet-btn {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid rgba(188, 201, 198, 0.25);
  background: #f3f3f3;
  position: relative;
}

.btn-label {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem;
  color: #00685f;
  line-height: 1.2;
}

.btn-odds {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #6d7a77;
  line-height: 1;
}

/* ── Locked + scored: shared muted style for non-picked buttons ── */
.locked-area .bet-btn:not(.user-pick) .btn-label,
.scored-area .bet-btn:not(.user-pick) .btn-label {
  color: #c4ccc9;
}

.locked-area .bet-btn:not(.user-pick) .btn-odds,
.scored-area .bet-btn:not(.user-pick) .btn-odds {
  color: #d1d5db;
}

/* ── Locked + scored: user's pick — teal fill ── */
.locked-area .bet-btn.user-pick,
.scored-area .bet-btn.user-pick {
  background: #0d9488;
  border-color: #0d9488;
}

.locked-area .bet-btn.user-pick .btn-label,
.locked-area .bet-btn.user-pick .btn-odds,
.scored-area .bet-btn.user-pick .btn-label,
.scored-area .bet-btn.user-pick .btn-odds {
  color: white;
}

/* ── Scored only: strong border signals win/loss ── */
.scored-area .bet-btn.user-correct {
  border: 3px solid #16a34a;
}

.scored-area .bet-btn.user-wrong {
  border: 3px solid #dc2626;
}

/* Checkmark / cross badge */
.correct-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 900;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  line-height: 1;
}

.correct-badge.badge-correct {
  background: #10b981;
}

.correct-badge.badge-wrong {
  background: #ef4444;
}

/* ── Points row (scored, correct prediction) ── */
.points-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 0.6875rem;
  font-weight: 800;
  color: #059669;
}

.points-star {
  font-size: 14px;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  line-height: 1;
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

  .match-card.is-live {
    padding-left: 20px;
  }

  .match-card.is-scored {
    padding-left: 24px;
  }

  .card-left {
    min-width: 0;
    gap: 8px;
  }

  .card-right {
    min-width: 0;
  }

  .bet-area {
    padding-top: 0;
    border-top: none;
  }

  .team-name {
    font-size: 1.0625rem;
  }

  /* Match BetSelector button sizing at desktop */
  .bet-grid {
    gap: 6px;
  }

  .bet-btn {
    width: 52px;
    min-height: 48px;
  }

  /* Visual divider between buttons 3 and 4 (same as BetSelector) */
  .bet-btn:nth-child(3) {
    margin-right: 14px;
    position: relative;
  }

  .bet-btn:nth-child(3)::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 20%;
    height: 60%;
    width: 1px;
    background: rgba(188, 201, 198, 0.5);
  }
}
</style>
