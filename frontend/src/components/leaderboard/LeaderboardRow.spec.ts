import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LeaderboardRow from './LeaderboardRow.vue'
import type { LeaderboardEntry } from '@/api/types'

// Mock the router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('LeaderboardRow', () => {
  const createEntry = (overrides?: Partial<LeaderboardEntry>): LeaderboardEntry => ({
    position: 1,
    userId: 1,
    nickname: 'Player One',
    totalPoints: 100.5,
    previousPosition: null,
    ...overrides
  })

  describe('movement indicator logic', () => {
    it('shows up indicator when player moved up', () => {
      const entry = createEntry({
        position: 2,
        previousPosition: 5
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.text()).toContain('▲3')
    })

    it('shows down indicator when player moved down', () => {
      const entry = createEntry({
        position: 5,
        previousPosition: 2
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.text()).toContain('▼3')
    })

    it('shows same indicator when position unchanged', () => {
      const entry = createEntry({
        position: 3,
        previousPosition: 3
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.text()).toContain('—')
    })

    it('shows nothing when previousPosition is null', () => {
      const entry = createEntry({
        position: 1,
        previousPosition: null
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      // Movement div should not be rendered or should be empty
      const movements = wrapper.findAll('.movement')
      expect(movements.length === 0 || movements[0].text() === '').toBe(true)
    })
  })

  describe('current user highlighting', () => {
    it('applies is-current-user class when isCurrentUser is true', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: true }
      })
      expect(wrapper.find('.leaderboard-row').classes()).toContain('is-current-user')
    })

    it('does not apply is-current-user class when isCurrentUser is false', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.leaderboard-row').classes()).not.toContain('is-current-user')
    })
  })

  describe('position display', () => {
    it('displays position number correctly', () => {
      const entry = createEntry({ position: 7 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.position').text()).toBe('7')
    })

    it('displays nickname correctly', () => {
      const entry = createEntry({ nickname: 'TestPlayer' })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.nickname').text()).toBe('TestPlayer')
    })

    it('displays total points with 2 decimal places', () => {
      const entry = createEntry({ totalPoints: 100.5 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.points').text()).toContain('100.50')
    })
  })

  describe('accessibility', () => {
    it('has role="listitem" attribute', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.leaderboard-row').attributes('role')).toBe('listitem')
    })

    it('has tabindex="0" for keyboard accessibility', () => {
      const entry = createEntry()
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      expect(wrapper.find('.leaderboard-row').attributes('tabindex')).toBe('0')
    })
  })

  describe('movement colors', () => {
    it('applies green color for up movement', () => {
      const entry = createEntry({
        position: 1,
        previousPosition: 3
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      const movementDiv = wrapper.find('.movement')
      expect(movementDiv.attributes('style')).toContain('color: rgb(16, 185, 129)')
    })

    it('applies red color for down movement', () => {
      const entry = createEntry({
        position: 5,
        previousPosition: 2
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      const movementDiv = wrapper.find('.movement')
      expect(movementDiv.attributes('style')).toContain('color: rgb(239, 68, 68)')
    })

    it('applies gray color for no movement', () => {
      const entry = createEntry({
        position: 3,
        previousPosition: 3
      })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      const movementDiv = wrapper.find('.movement')
      expect(movementDiv.attributes('style')).toContain('color: rgb(156, 163, 175)')
    })
  })

  describe('row navigation', () => {
    beforeEach(() => {
      mockPush.mockClear()
    })

    it('navigates to history view when row is clicked', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      await wrapper.find('.leaderboard-row').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })

    it('navigates when Enter key is pressed', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      await wrapper.find('.leaderboard-row').trigger('keydown', { key: 'Enter' })
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })

    it('navigates when Space key is pressed', async () => {
      const entry = createEntry({ userId: 42 })
      const wrapper = mount(LeaderboardRow, {
        props: { entry, isCurrentUser: false }
      })
      await wrapper.find('.leaderboard-row').trigger('keydown', { key: ' ' })
      expect(mockPush).toHaveBeenCalledWith({ name: 'history', params: { userId: 42 } })
    })
  })
})
