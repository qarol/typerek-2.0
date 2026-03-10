import { describe, it, expect, vi, beforeEach } from 'vitest'
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
      expect(rows[0].props('isCoWinner')).toBe(true)
      expect(rows[1].props('isCoWinner')).toBe(true)
      expect(rows[2].props('isCoWinner')).toBe(false)
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
      expect(rows[0].props('isCoWinner')).toBe(false)
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
      expect(wrapper.find('.leaderboard-zero-state').exists()).toBe(true)
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
