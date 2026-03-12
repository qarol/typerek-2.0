import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { useLeaderboardStore } from '@/stores/leaderboard'
import { useAuthStore } from '@/stores/auth'
import LeaderboardView from './LeaderboardView.vue'
import type { LeaderboardEntry } from '@/api/types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' }
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      nav: { standings: 'Standings' },
      leaderboard: {
        loading: 'Loading...',
        empty: 'No players',
        zeroState: 'Season not started yet',
        zeroStateHint: 'Standings will appear here once the first match result is entered.',
        playersRegistered: '{n} players registered',
        you: 'You',
        matchesPlayed: 'Matches played',
        pointsFormat: '{points} pts',
        tierPlayerCount: '{count} players',
        avatarHistoryLabel: "View {nickname}'s history",
        moveUpLabel: 'Moved up {n}',
        moveDownLabel: 'Moved down {n}',
        noChangeLabel: 'No change',
        legend: { up: 'moved up', down: 'moved down', same: 'no change', new: 'first appearance' },
        newPlayer: 'new',
        gapToPrev: 'pts behind',
        leader: 'Leader',
        coWinner: 'Co-winner',
        secondPlace: '2nd place',
        thirdPlace: '3rd place'
      },
      errors: {}
    }
  }
})

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  position: 1, userId: 1, nickname: 'Player', totalPoints: 0, previousPosition: null,
  ...overrides
})

async function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  // Mock fetchLeaderboard so it doesn't make real HTTP requests
  const leaderboardStore = useLeaderboardStore()
  leaderboardStore.fetchLeaderboard = vi.fn().mockResolvedValue(undefined)

  const authStore = useAuthStore()
  authStore.user = null

  const wrapper = mount(LeaderboardView, {
    global: { plugins: [pinia, i18n] }
  })

  return { wrapper, leaderboardStore, authStore }
}

describe('LeaderboardView', () => {
  describe('tier grouping', () => {
    it('groups players sharing a position into a single LeaderboardTier', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10 }),
        makeEntry({ position: 1, userId: 2, totalPoints: 10, nickname: 'Bob' }),
        makeEntry({ position: 3, userId: 3, totalPoints: 5, nickname: 'Carol' }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const tiers = wrapper.findAllComponents({ name: 'LeaderboardTier' })
      expect(tiers.length).toBe(2)
      expect(tiers[0]!.props('players')).toHaveLength(2)
      expect(tiers[1]!.props('players')).toHaveLength(1)
    })

    it('renders separate tiers for each distinct position', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 80, nickname: 'Bob' }),
        makeEntry({ position: 3, userId: 3, totalPoints: 60, nickname: 'Carol' }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const tiers = wrapper.findAllComponents({ name: 'LeaderboardTier' })
      expect(tiers.length).toBe(3)
      expect(tiers[0]!.props('position')).toBe(1)
      expect(tiers[1]!.props('position')).toBe(2)
      expect(tiers[2]!.props('position')).toBe(3)
    })

    it('passes correct totalPoints to each tier', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 50, nickname: 'Bob' }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const tiers = wrapper.findAllComponents({ name: 'LeaderboardTier' })
      expect(tiers[0]!.props('totalPoints')).toBe(100)
      expect(tiers[1]!.props('totalPoints')).toBe(50)
    })

    it('passes currentUserId from auth store to each tier', async () => {
      const { wrapper, leaderboardStore, authStore } = await mountView()
      authStore.user = { id: 5, nickname: 'Me', admin: false }
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 5, totalPoints: 100, nickname: 'Me' }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const tier = wrapper.findComponent({ name: 'LeaderboardTier' })
      expect(tier.props('currentUserId')).toBe(5)
    })
  })

  describe('tournament progress header', () => {
    it('shows progress header when totalMatches > 0', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [makeEntry({ totalPoints: 10, previousPosition: 1 })]
      leaderboardStore.scoredMatches = 38
      leaderboardStore.totalMatches = 104
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.tournament-progress').exists()).toBe(true)
    })

    it('shows correct match counts in header', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [makeEntry({ totalPoints: 10, previousPosition: 1 })]
      leaderboardStore.scoredMatches = 38
      leaderboardStore.totalMatches = 104
      leaderboardStore.loading = false
      await flushPromises()
      const header = wrapper.find('.tournament-progress')
      expect(header.text()).toContain('38')
      expect(header.text()).toContain('104')
    })

    it('hides progress header when totalMatches is 0', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = []
      leaderboardStore.scoredMatches = 0
      leaderboardStore.totalMatches = 0
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.tournament-progress').exists()).toBe(false)
    })
  })

  describe('zero-state', () => {
    it('shows zero-state when all players have 0 points and no previousPosition', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 0, previousPosition: null }),
        makeEntry({ position: 1, userId: 2, totalPoints: 0, previousPosition: null }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.zero-card').exists()).toBe(true)
      expect(wrapper.find('.leaderboard-list').exists()).toBe(false)
    })

    it('shows list when at least one player has points > 0', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10, previousPosition: null }),
        makeEntry({ position: 2, userId: 2, totalPoints: 0, previousPosition: null }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-zero-state').exists()).toBe(false)
      expect(wrapper.find('.leaderboard-list').exists()).toBe(true)
    })
  })

  describe('legend', () => {
    it('shows legend when at least one entry has a non-null previousPosition', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 50, previousPosition: 2 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-legend').exists()).toBe(true)
    })

    it('hides legend when no entry has a previousPosition', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10, previousPosition: null }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.leaderboard-legend').exists()).toBe(false)
    })
  })
})
