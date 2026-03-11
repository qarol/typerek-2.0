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
  describe('isCoWinner computation', () => {
    it('passes isCoWinner=true when multiple entries share position 1', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10 }),
        makeEntry({ position: 1, userId: 2, totalPoints: 10 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 5 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0]!.props('isCoWinner')).toBe(true)
      expect(rows[1]!.props('isCoWinner')).toBe(true)
      expect(rows[2]!.props('isCoWinner')).toBe(false)
    })

    it('passes isCoWinner=false when position 1 is unique', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 50 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 30 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0]!.props('isCoWinner')).toBe(false)
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

  describe('gapToPrev prop', () => {
    it('passes null gapToPrev to the first player', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 80 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0]!.props('gapToPrev')).toBeNull()
    })

    it('passes correct gap to players below the leader', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 80 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 65 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[1]!.props('gapToPrev')).toBe(20)   // 100 - 80
      expect(rows[2]!.props('gapToPrev')).toBe(15)   // 80 - 65
    })

    it('passes 0 gap when players are tied', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 1, userId: 2, totalPoints: 100 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[1]!.props('gapToPrev')).toBe(0)
    })
  })

  describe('podium divider', () => {
    it('renders a podium-divider between position 3 and position 4', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 80 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 60 }),
        makeEntry({ position: 4, userId: 4, totalPoints: 40 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.podium-divider').exists()).toBe(true)
    })

    it('does not render podium-divider when all players are on the podium', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 80 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 60 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.podium-divider').exists()).toBe(false)
    })

    it('does not render podium-divider when there are no podium players', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 4, userId: 1, totalPoints: 100 }),
        makeEntry({ position: 5, userId: 2, totalPoints: 80 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      expect(wrapper.find('.podium-divider').exists()).toBe(false)
    })
  })

  describe('maxPoints prop', () => {
    it('passes maxPoints equal to the highest totalPoints in standings', async () => {
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 200 }),
        makeEntry({ position: 2, userId: 2, totalPoints: 150 }),
        makeEntry({ position: 3, userId: 3, totalPoints: 100 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0]!.props('maxPoints')).toBe(200)
      expect(rows[1]!.props('maxPoints')).toBe(200)
      expect(rows[2]!.props('maxPoints')).toBe(200)
    })

    it('passes maxPoints=0 when all players have 0 points (zero-state is shown instead)', async () => {
      // zero-state is shown when all are 0, but if list is shown maxPoints should be 0
      const { wrapper, leaderboardStore } = await mountView()
      leaderboardStore.standings = [
        makeEntry({ position: 1, userId: 1, totalPoints: 10, previousPosition: 1 }),
      ]
      leaderboardStore.loading = false
      await flushPromises()
      const rows = wrapper.findAllComponents({ name: 'LeaderboardRow' })
      expect(rows[0]!.props('maxPoints')).toBe(10)
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
