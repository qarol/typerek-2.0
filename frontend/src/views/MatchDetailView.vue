<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Skeleton from 'primevue/skeleton'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { useMatchesStore } from '@/stores/matches'
import { useBetsStore } from '@/stores/bets'
import { useAuthStore } from '@/stores/auth'
import { getMatchState, isBetCorrect } from '@/utils/matchSorting'
import type { RevealedBet } from '@/api/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const matchesStore = useMatchesStore()
const betsStore = useBetsStore()
const authStore = useAuthStore()

const matchId = computed(() => {
  const raw = route.params.matchId
  return Number(Array.isArray(raw) ? raw[0] : raw)
})

const initialized = ref(false)

const match = computed(() => matchesStore.matches.find((m) => m.id === matchId.value) ?? null)

const loading = computed(() => !initialized.value || matchesStore.loading)

const matchState = computed(() => (match.value ? getMatchState(match.value) : null))
const isScored = computed(() => match.value?.homeScore !== null)

const formattedKickoff = computed(() => {
  if (!match.value) return ''
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(match.value.kickoffTime))
})

const revealedBets = computed(() => betsStore.getRevealedBets(matchId.value) ?? [])
const betsLoading = computed(() => initialized.value && betsStore.getRevealedBets(matchId.value) === undefined)

const sortedRevealedBets = computed(() =>
  [...revealedBets.value].sort((a, b) => a.nickname.localeCompare(b.nickname)),
)

const allPlayers = computed(() => betsStore.getAllPlayers(matchId.value) ?? [])

const missedPlayers = computed(() =>
  allPlayers.value
    .filter((name) => !revealedBets.value.some((b) => b.nickname === name))
    .sort((a, b) => a.localeCompare(b)),
)

const isCurrentUser = (bet: RevealedBet) => bet.userId === authStore.user?.id

const BET_TYPE_LABELS: Record<string, string> = {
  '1': 'matches.betSelector.homeWin',
  'X': 'matches.betSelector.draw',
  '2': 'matches.betSelector.awayWin',
  '1X': 'matches.betSelector.homeOrDraw',
  'X2': 'matches.betSelector.drawOrAway',
  '12': 'matches.betSelector.homeOrAway',
}

const TEAM_FLAGS: Record<string, string> = {
  Mexico: '🇲🇽', Jamaica: '🇯🇲', Colombia: '🇨🇴', Senegal: '🇸🇳', USA: '🇺🇸',
  Morocco: '🇲🇦', Argentina: '🇦🇷', Denmark: '🇩🇰', Canada: '🇨🇦', Australia: '🇦🇺',
  Germany: '🇩🇪', Japan: '🇯🇵', Brazil: '🇧🇷', Nigeria: '🇳🇬', Spain: '🇪🇸',
  'South Korea': '🇰🇷', France: '🇫🇷', 'Saudi Arabia': '🇸🇦', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Netherlands: '🇳🇱', Portugal: '🇵🇹', Ecuador: '🇪🇨', Italy: '🇮🇹', Ghana: '🇬🇭',
  Belgium: '🇧🇪', Ukraine: '🇺🇦', Serbia: '🇷🇸', Switzerland: '🇨🇭', Austria: '🇦🇹',
  Pakistan: '🇵🇰', Czechia: '🇨🇿', Turkey: '🇹🇷', Greece: '🇬🇷', Slovakia: '🇸🇰',
  Norway: '🇳🇴', 'New Zealand': '🇳🇿', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Hong Kong': '🇭🇰',
  Hungary: '🇭🇺', Malta: '🇲🇹', Iceland: '🇮🇸', Guatemala: '🇬🇹', Kazakhstan: '🇰🇿',
  Slovenia: '🇸🇮', Croatia: '🇭🇷', China: '🇨🇳', Cameroon: '🇨🇲', Poland: '🇵🇱',
  Albania: '🇦🇱',
}

function getFlag(team: string) {
  return TEAM_FLAGS[team] ?? '🏳️'
}

function getBetLabel(betType: string) {
  return BET_TYPE_LABELS[betType] ? t(BET_TYPE_LABELS[betType]) : betType
}

function getPointsDisplay(bet: RevealedBet): string {
  const pts = Number(bet.pointsEarned) || 0
  return pts > 0 ? `+${pts.toFixed(2)}` : '0'
}

function getPointsColor(bet: RevealedBet): string {
  return Number(bet.pointsEarned) > 0 ? '#10B981' : '#9CA3AF'
}

function isBetWon(bet: RevealedBet): boolean {
  if (!match.value || match.value.homeScore === null || match.value.awayScore === null) return false
  return isBetCorrect(bet.betType, match.value.homeScore, match.value.awayScore)
}

// Bet distribution: always show 1/X/2, then any doubles actually placed.
// Percentages use largest-remainder so they always sum to 100.
const betDistribution = computed(() => {
  const counts: Record<string, number> = {}
  for (const bet of revealedBets.value) {
    counts[bet.betType] = (counts[bet.betType] ?? 0) + 1
  }
  const total = revealedBets.value.length

  // Base outcomes always shown; doubles only when someone placed them
  const BASE_TYPES = ['1', 'X', '2']
  const extraTypes = Object.keys(counts).filter((t) => !BASE_TYPES.includes(t))
  const orderedTypes = [...BASE_TYPES, ...extraTypes]

  const getLabel = (type: string) => {
    if (type === '1' && match.value) return match.value.homeTeam
    if (type === '2' && match.value) return match.value.awayTeam
    return getBetLabel(type)
  }

  const items = orderedTypes.map((type) => {
    const count = counts[type] ?? 0
    const exact = total > 0 ? (count / total) * 100 : 0
    return { type, count, pct: Math.floor(exact), remainder: exact % 1, label: getLabel(type) }
  })

  // Largest-remainder correction so percentages sum to 100
  const gap = total > 0 ? 100 - items.reduce((s, i) => s + i.pct, 0) : 0
  items
    .slice()
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, gap)
    .forEach((item) => { item.pct += 1 })

  return items.map(({ type, count, pct, label }) => ({ type, count, pct, label }))
})

onMounted(async () => {
  if (!matchesStore.matches.length) {
    await matchesStore.fetchMatches()
  }
  if (betsStore.getRevealedBets(matchId.value) === undefined) {
    await betsStore.fetchMatchBets(matchId.value)
  }
  initialized.value = true
})
</script>

<template>
  <div class="match-detail-page">
    <!-- Loading match -->
    <template v-if="loading && !match">
      <div class="hero-skeleton">
        <Skeleton height="220px" border-radius="0" />
      </div>
    </template>

    <!-- Match not found -->
    <template v-else-if="!loading && !match">
      <div class="not-found-wrapper">
        <Message severity="error" :closable="false">{{ t('matchDetail.error.notFound') }}</Message>
        <Button
          :label="t('matchDetail.backToMatches')"
          icon="pi pi-arrow-left"
          text
          @click="router.push({ name: 'matches' })"
        />
      </div>
    </template>

    <!-- Full page -->
    <template v-else-if="match">
      <!-- ── Hero ── -->
      <section class="hero">
        <div class="hero-inner">
          <!-- Back button -->
          <div class="hero-nav">
            <Button
              :label="t('matchDetail.backToMatches')"
              icon="pi pi-arrow-left"
              text
              class="back-btn"
              @click="router.push({ name: 'matches' })"
            />
          </div>

          <!-- Meta -->
          <div class="hero-meta">
            <span v-if="match.groupLabel" class="hero-group">{{ match.groupLabel }}</span>
            <span class="hero-kickoff">{{ formattedKickoff }}</span>
          </div>

          <!-- Teams + score -->
          <div class="hero-match">
            <!-- Home -->
            <div class="hero-team">
              <span class="hero-flag">{{ getFlag(match.homeTeam) }}</span>
              <span class="hero-team-name">{{ match.homeTeam }}</span>
            </div>

            <!-- Score / VS -->
            <div class="hero-center">
              <div v-if="isScored" class="hero-score">
                <span class="hero-score-num">{{ match.homeScore }}</span>
                <span class="hero-score-sep">–</span>
                <span class="hero-score-num">{{ match.awayScore }}</span>
              </div>
              <span v-else class="hero-vs">VS</span>

              <Tag
                :value="t(`matchDetail.status.${matchState}`)"
                :severity="matchState === 'locked' ? 'danger' : matchState === 'scored' ? 'secondary' : 'success'"
                class="hero-status-tag"
              />
            </div>

            <!-- Away -->
            <div class="hero-team hero-team--away">
              <span class="hero-team-name">{{ match.awayTeam }}</span>
              <span class="hero-flag">{{ getFlag(match.awayTeam) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Content ── -->
      <div class="page-content">

        <!-- Bet distribution -->
        <section v-if="!betsLoading" class="card distribution-card">
          <h2 class="card-title">{{ t('matchDetail.distribution.title') }}</h2>
          <Divider />
          <div class="distribution-list">
            <div v-for="item in betDistribution" :key="item.type" class="dist-row">
              <div class="dist-label">
                <Tag :value="item.type" severity="info" class="dist-bet-tag" />
                <span class="dist-type-label">{{ item.label }}</span>
              </div>
              <div class="dist-bar-wrap">
                <div class="dist-bar">
                  <div class="dist-bar-fill" :style="{ width: `${item.pct}%` }" />
                </div>
                <span class="dist-pct">{{ item.pct }}%</span>
                <span class="dist-count">{{ t('matchDetail.distribution.bets', { n: item.count }) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bets table -->
        <section class="card table-card">
          <h2 class="card-title">{{ t('matchDetail.table.title') }}</h2>
          <Divider />

          <!-- Loading skeletons -->
          <template v-if="betsLoading">
            <div v-for="i in 6" :key="i" class="skeleton-row">
              <Skeleton height="3rem" border-radius="8px" />
            </div>
          </template>

          <template v-else>
            <table class="bets-table">
              <colgroup>
                <col class="col-player" />
                <col class="col-bet" />
                <col v-if="isScored" class="col-outcome" />
                <col v-if="isScored" class="col-points" />
              </colgroup>
              <thead>
                <tr>
                  <th class="col-player">{{ t('matchDetail.table.player') }}</th>
                  <th class="col-bet">{{ t('matchDetail.table.bet') }}</th>
                  <th v-if="isScored" class="col-outcome">{{ t('matchDetail.table.outcome') }}</th>
                  <th v-if="isScored" class="col-points">{{ t('matchDetail.table.points') }}</th>
                </tr>
              </thead>

              <!-- Players who placed a bet -->
              <tbody>
                <tr
                  v-for="bet in sortedRevealedBets"
                  :key="bet.id"
                  :class="{ 'row-me': isCurrentUser(bet) }"
                >
                  <td class="col-player">
                    <div class="player-cell">
                      <span class="player-name">{{ bet.nickname }}</span>
                      <Tag
                        v-if="isCurrentUser(bet)"
                        :value="t('matches.reveal.you')"
                        severity="success"
                        class="you-tag"
                      />
                    </div>
                  </td>
                  <td class="col-bet">
                    <div class="bet-cell">
                      <Tag :value="bet.betType" severity="info" class="bet-code-tag" />
                      <span class="bet-label-text">{{ getBetLabel(bet.betType) }}</span>
                    </div>
                  </td>
                  <td v-if="isScored" class="col-outcome">
                    <i
                      :class="isBetWon(bet) ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                      :style="{ color: isBetWon(bet) ? '#10B981' : '#EF4444', fontSize: '1.125rem' }"
                    />
                  </td>
                  <td v-if="isScored" class="col-points">
                    <span class="points-val" :style="{ color: getPointsColor(bet) }">
                      {{ getPointsDisplay(bet) }}
                    </span>
                  </td>
                </tr>
              </tbody>

              <!-- Missed players — separate tbody keeps column alignment guaranteed -->
              <tbody v-if="missedPlayers.length" class="tbody-missed">
                <tr class="missed-section-header">
                  <td :colspan="isScored ? 4 : 2" class="missed-divider-cell">
                    {{ t('matchDetail.table.noBetSection') }}
                  </td>
                </tr>
                <tr v-for="name in missedPlayers" :key="name">
                  <td class="col-player">
                    <span class="player-name player-name--missed">{{ name }}</span>
                  </td>
                  <td class="col-bet">
                    <span class="missed-dash">{{ t('matchDetail.table.noBet') }}</span>
                  </td>
                  <td v-if="isScored" class="col-outcome" />
                  <td v-if="isScored" class="col-points">
                    <span class="points-val" style="color: #9CA3AF">0</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Page shell ── */
.match-detail-page {
  min-height: calc(100vh - 64px);
  background: #f9f9f9;
}

.not-found-wrapper {
  max-width: 480px;
  margin: 4rem auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Hero ── */
.hero {
  background: #0d9488;
  color: white;
  padding: 2rem 1.5rem 2.5rem;
}

.hero-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.hero-nav {
  margin-bottom: 1.25rem;
}

.back-btn {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.875rem;
  padding: 0.25rem 0 !important;
}

.back-btn:hover {
  color: white !important;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.25rem;
  justify-content: center;
}

.hero-group {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.hero-kickoff {
  font-size: 0.8125rem;
  opacity: 0.8;
}

.hero-match {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.hero-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.hero-team--away {
  align-items: center;
}

.hero-flag {
  font-size: 3rem;
  line-height: 1;
}

.hero-team-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.125rem;
  text-align: center;
  line-height: 1.2;
}

.hero-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.hero-score {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', sans-serif;
}

.hero-score-num {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
}

.hero-score-sep {
  font-size: 2rem;
  font-weight: 400;
  opacity: 0.6;
  margin: 0 2px;
}

.hero-vs {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  opacity: 0.7;
  letter-spacing: 0.1em;
}

.hero-status-tag {
  font-size: 0.625rem !important;
  letter-spacing: 0.08em;
}

/* ── Content layout ── */
.page-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Card ── */
.card {
  background: white;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 104, 95, 0.06);
  border: 1px solid rgba(188, 201, 198, 0.12);
}

.card-title {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #1a1c1c;
  margin: 0;
}

/* ── Distribution ── */
.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dist-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 160px;
  flex-shrink: 0;
}

.dist-bet-tag {
  flex-shrink: 0;
}

.dist-type-label {
  font-size: 0.8125rem;
  color: #3d4947;
  white-space: nowrap;
}

.dist-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
}

.dist-bar {
  flex: 1;
  height: 8px;
  background: #eeeeee;
  border-radius: 100px;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  background: #0d9488;
  border-radius: 100px;
  transition: width 0.4s ease;
}

.dist-pct {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1a1c1c;
  min-width: 2.5rem;
  text-align: right;
}

.dist-count {
  font-size: 0.75rem;
  color: #6d7a77;
  white-space: nowrap;
}

/* ── Bets table ── */
.skeleton-row + .skeleton-row {
  margin-top: 6px;
}

.bets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.bets-table thead th {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6d7a77;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #f0f1f1;
}

.bets-table tbody tr {
  border-bottom: 1px solid #f9f9f9;
  transition: background 0.1s;
}

.bets-table tbody tr:hover {
  background: #f9f9f9;
}

.bets-table tbody tr.row-me {
  background: #f0fdfa;
}

.bets-table tbody tr.row-me:hover {
  background: #e6faf6;
}

.bets-table td {
  padding: 0.75rem 0.75rem;
  vertical-align: middle;
}

.col-player {
  min-width: 140px;
}

.col-bet {
  min-width: 160px;
}

.col-outcome {
  width: 60px;
  text-align: center;
}

.col-points {
  width: 80px;
  text-align: right;
}

thead .col-outcome,
thead .col-points {
  text-align: right;
}

thead .col-outcome {
  text-align: center;
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-name {
  font-weight: 600;
  color: #1a1c1c;
}

.player-name--missed {
  color: #9ca3af;
  font-weight: 400;
}

.you-tag {
  font-size: 0.5625rem !important;
}

.bet-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bet-code-tag {
  flex-shrink: 0;
}

.bet-label-text {
  font-size: 0.8125rem;
  color: #3d4947;
}

.points-val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.missed-divider-cell {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  padding: 1rem 0.75rem 0.25rem;
  border-bottom: none;
}

.tbody-missed tr:hover {
  background: transparent !important;
}

.missed-dash {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.8125rem;
}

/* ── Desktop ── */
@media (min-width: 768px) {
  .hero {
    padding: 2.5rem 2rem 3rem;
  }

  .hero-flag {
    font-size: 4rem;
  }

  .hero-team-name {
    font-size: 1.5rem;
  }

  .hero-score-num {
    font-size: 5rem;
  }

  .hero-score-sep {
    font-size: 3rem;
  }

  .hero-vs {
    font-size: 2rem;
  }

  .page-content {
    padding: 2rem 2rem 4rem;
  }

  .card {
    padding: 2rem;
  }
}
</style>
