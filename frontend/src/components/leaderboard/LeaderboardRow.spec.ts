import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LeaderboardRow from './LeaderboardRow.vue'
import type { LeaderboardEntry } from '@/api/types'

// Mock the router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      leaderboard: {
        you: 'You',
        leader: 'Leader',
        coWinner: 'Co-winner',
        secondPlace: '2nd place',
        thirdPlace: '3rd place',
        newPlayer: 'new'
      }
    }
  }
})

describe('LeaderboardRow', () => {
  const createEntry = (overrides?: Partial<LeaderboardEntry>): LeaderboardEntry => ({
    position: 1,
    userId: 1,
    nickname: 'Player One',
    totalPoints: 100.5,
    previousPosition: null,
    ...overrides
  })

  describe('movement indicator', () => {
    it('renders up-arrow icon when player moved up', () => {
      const entry = createEntry({ position: 2, previousPosition: 5 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.movement-up').exists()).toBe(true)
      expect(wrapper.find('.pi-arrow-up').exists()).toBe(true)
    })

    it('renders down-arrow icon when player moved down', () => {
      const entry = createEntry({ position: 5, previousPosition: 2 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.movement-down').exists()).toBe(true)
      expect(wrapper.find('.pi-arrow-down').exists()).toBe(true)
    })

    it('renders dash when position unchanged', () => {
      const entry = createEntry({ position: 3, previousPosition: 3 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.movement-same').exists()).toBe(true)
    })

    it('renders "new" label when previousPosition is null', () => {
      const entry = createEntry({ position: 1, previousPosition: null })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.movement-new').exists()).toBe(true)
    })
  })

  describe('medal row class', () => {
    it('applies row-gold class for position 1', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-gold')
    })

    it('applies row-silver class for position 2', () => {
      const entry = createEntry({ position: 2 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-silver')
    })

    it('applies row-bronze class for position 3', () => {
      const entry = createEntry({ position: 3 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-bronze')
    })

    it('applies row-plain class for position 4+', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-plain')
    })

    it('applies medal class even when isCurrentUser for podium positions', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-gold')
      expect(wrapper.find('.leaderboard-row').classes()).not.toContain('row-you')
    })

    it('applies row-you class when isCurrentUser at position 4+', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('row-you')
    })
  })

  describe('badge', () => {
    it('shows crown icon for position 1', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-crown').exists()).toBe(true)
    })

    it('shows crown icon for co-winner', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: true },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-crown').exists()).toBe(true)
    })

    it('shows "Leader" badge label when position 1 and not co-winner', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-badge').text()).toContain('Leader')
    })

    it('shows "Co-winner" badge label when position 1 and is co-winner', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: true },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-badge').text()).toContain('Co-winner')
    })

    it('shows star-fill icon for position 2', () => {
      const entry = createEntry({ position: 2 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-star-fill').exists()).toBe(true)
    })

    it('shows trophy icon for position 3', () => {
      const entry = createEntry({ position: 3 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-trophy').exists()).toBe(true)
    })

    it('shows no badge icon for position 4+', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-badge').exists()).toBe(false)
    })

    it('shows user icon badge when isCurrentUser', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-user').exists()).toBe(true)
    })

    it('shows medal badge with "· You" suffix when isCurrentUser on podium', () => {
      const entry = createEntry({ position: 2 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.pi-star-fill').exists()).toBe(true)
      expect(wrapper.find('.row-badge').text()).toContain('2nd place')
      expect(wrapper.find('.row-badge').text()).toContain('You')
    })
  })

  describe('current user highlighting', () => {
    it('applies is-current-user class when isCurrentUser is true', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('is-current-user')
    })

    it('does not apply is-current-user class when isCurrentUser is false', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').classes()).not.toContain('is-current-user')
    })
  })

  describe('position display', () => {
    it('displays position number correctly', () => {
      const entry = createEntry({ position: 7 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.rank-circle').text()).toBe('7')
    })

    it('displays nickname correctly', () => {
      const entry = createEntry({ nickname: 'TestPlayer' })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-name').text()).toBe('TestPlayer')
    })

    it('displays total points with 2 decimal places', () => {
      const entry = createEntry({ totalPoints: 100.5 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.points').text()).toContain('100.50')
    })
  })

  describe('accessibility', () => {
    it('has role="listitem" attribute', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').attributes('role')).toBe('listitem')
    })

    it('has tabindex="0" for keyboard accessibility', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.leaderboard-row').attributes('tabindex')).toBe('0')
    })
  })

  describe('row navigation', () => {
    beforeEach(() => {
      mockPush.mockClear()
    })

    it('navigates to history view when row is clicked', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      await wrapper.find('.leaderboard-row').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })

    it('navigates when Enter key is pressed', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      await wrapper.find('.leaderboard-row').trigger('keydown', { key: 'Enter' })
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })

    it('navigates when Space key is pressed', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      await wrapper.find('.leaderboard-row').trigger('keydown', { key: ' ' })
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })
  })
})
