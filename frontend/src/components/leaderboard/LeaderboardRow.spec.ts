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
        newPlayer: 'new',
        gapToPrev: 'pts behind'
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

  describe('avatar', () => {
    it('shows the first letter of the nickname uppercased', () => {
      const entry = createEntry({ nickname: 'maciek' })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.p-avatar').text()).toBe('M')
    })

    it('handles single-char nicknames', () => {
      const entry = createEntry({ nickname: 'x' })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.p-avatar').text()).toBe('X')
    })
  })

  describe('"You" inline label', () => {
    it('shows "You" label next to name when isCurrentUser', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.you-label').exists()).toBe(true)
      expect(wrapper.find('.you-label').text()).toContain('You')
    })

    it('does not show "You" label when not current user', () => {
      const entry = createEntry({ position: 4 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.you-label').exists()).toBe(false)
    })

    it('shows "You" label even on podium positions', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.you-label').exists()).toBe(true)
    })

    it('has no .row-badge element at all', () => {
      const entry = createEntry({ position: 1 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-badge').exists()).toBe(false)
    })
  })

  describe('points formatting', () => {
    it('trims trailing zeros from points display', () => {
      const entry = createEntry({ totalPoints: 156.40 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 200 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.points').text()).toBe('156.4')
    })

    it('shows integer when points have no fractional part', () => {
      const entry = createEntry({ totalPoints: 100.00 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 200 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.points').text()).toBe('100')
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
      expect(wrapper.find('.rank-num').text()).toBe('7')
    })

    it('displays nickname correctly', () => {
      const entry = createEntry({ nickname: 'TestPlayer' })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.row-name').text()).toBe('TestPlayer')
    })

    it('displays total points with trailing zeros trimmed', () => {
      const entry = createEntry({ totalPoints: 100.5 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 200 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.points').text()).toContain('100.5')
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

  describe('gap to player above', () => {
    it('shows gap element when gapToPrev is a positive number', () => {
      const entry = createEntry({ position: 3, totalPoints: 80 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, gapToPrev: 12.4 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.gap-to-prev').exists()).toBe(true)
    })

    it('shows the formatted gap value', () => {
      const entry = createEntry({ position: 3, totalPoints: 80 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, gapToPrev: 12.4 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.gap-to-prev').text()).toContain('12.4')
    })

    it('trims trailing zeros in the gap value', () => {
      const entry = createEntry({ position: 2, totalPoints: 90 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, gapToPrev: 10.0 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.gap-to-prev').text()).toContain('10')
      expect(wrapper.find('.gap-to-prev').text()).not.toContain('10.0')
    })

    it('does not show gap when gapToPrev is null (first place)', () => {
      const entry = createEntry({ position: 1, totalPoints: 100 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, gapToPrev: null },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.gap-to-prev').exists()).toBe(false)
    })

    it('does not show gap when gapToPrev is 0 (tied)', () => {
      const entry = createEntry({ position: 1, totalPoints: 100 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, gapToPrev: 0 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.gap-to-prev').exists()).toBe(false)
    })
  })

  describe('progress bar', () => {
    it('renders a .progress-bar element', () => {
      const entry = createEntry({ totalPoints: 80 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })

    it('sets bar width to 100% for the leader (maxPoints === totalPoints)', () => {
      const entry = createEntry({ totalPoints: 150 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 150 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 100%')
    })

    it('sets bar width proportionally when behind the leader', () => {
      const entry = createEntry({ totalPoints: 50 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 50%')
    })

    it('sets bar width to 0% when totalPoints is 0', () => {
      const entry = createEntry({ totalPoints: 0 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 100 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 0%')
    })

    it('sets bar width to 0% when maxPoints is 0', () => {
      const entry = createEntry({ totalPoints: 0 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false, isCoWinner: false, maxPoints: 0 },
        global: { plugins: [i18n] }
      })
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 0%')
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
