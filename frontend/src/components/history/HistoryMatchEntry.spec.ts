import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import HistoryMatchEntry from './HistoryMatchEntry.vue'
import type { HistoryEntry } from '@/api/types'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      history: {
        loading: 'Loading history...',
        empty: 'No match results yet.',
        missed: '— missed',
        pending: 'pending',
        noBet: 'no bet',
        pointsEarned: '+{points}',
        pointsZero: '0 pts',
      },
    },
  },
})

const mountEntry = (entry: HistoryEntry) =>
  mount(HistoryMatchEntry, {
    props: { entry },
    global: { plugins: [i18n] },
  })

const createEntry = (overrides?: Partial<HistoryEntry>): HistoryEntry => ({
  matchId: 1,
  homeTeam: 'Home FC',
  awayTeam: 'Away FC',
  kickoffTime: '2024-06-01T15:00:00.000Z',
  homeScore: null,
  awayScore: null,
  betType: null,
  pointsEarned: 0,
  correct: null,
  ...overrides,
})

describe('HistoryMatchEntry', () => {
  describe('accessibility', () => {
    it('has role="listitem"', () => {
      const wrapper = mountEntry(createEntry())
      expect(wrapper.find('li').attributes('role')).toBe('listitem')
    })
  })

  describe('correct state (bet placed, points > 0)', () => {
    it('renders correct state with green class and positive points', () => {
      const entry = createEntry({
        correct: true,
        betType: '1',
        pointsEarned: 3.5,
        homeScore: 2,
        awayScore: 1,
      })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('[data-state="correct"]').exists()).toBe(true)
      const stateEl = wrapper.find('.state-correct')
      expect(stateEl.exists()).toBe(true)
      expect(stateEl.text()).toContain('1')
      expect(stateEl.text()).toContain('3.50')
    })
  })

  describe('wrong state (bet placed, points = 0, match scored)', () => {
    it('renders wrong state with gray class', () => {
      const entry = createEntry({
        correct: false,
        betType: 'X',
        pointsEarned: 0,
        homeScore: 2,
        awayScore: 1,
      })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('[data-state="wrong"]').exists()).toBe(true)
      expect(wrapper.find('.state-wrong').exists()).toBe(true)
      expect(wrapper.find('.state-wrong').text()).toContain('X')
    })
  })

  describe('missed state (no bet, match scored)', () => {
    it('renders missed state with gray class', () => {
      const entry = createEntry({
        correct: false,
        betType: null,
        pointsEarned: 0,
        homeScore: 1,
        awayScore: 1,
      })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('[data-state="missed"]').exists()).toBe(true)
      expect(wrapper.find('.state-missed').exists()).toBe(true)
    })
  })

  describe('pending state (bet placed, match not scored)', () => {
    it('renders pending state', () => {
      const entry = createEntry({
        correct: null,
        betType: '2',
        pointsEarned: 0,
        homeScore: null,
        awayScore: null,
      })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('[data-state="pending"]').exists()).toBe(true)
      expect(wrapper.find('.state-pending').exists()).toBe(true)
      expect(wrapper.find('.state-pending').text()).toContain('2')
    })
  })

  describe('no-bet state (no bet, match not scored)', () => {
    it('renders no-bet state with gray class', () => {
      const entry = createEntry({
        correct: null,
        betType: null,
        pointsEarned: 0,
        homeScore: null,
        awayScore: null,
      })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('[data-state="no-bet"]').exists()).toBe(true)
      expect(wrapper.find('.state-no-bet').exists()).toBe(true)
    })
  })

  describe('match info display', () => {
    it('shows home and away teams', () => {
      const entry = createEntry({ homeTeam: 'Team A', awayTeam: 'Team B' })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('.entry-teams').text()).toContain('Team A')
      expect(wrapper.find('.entry-teams').text()).toContain('Team B')
    })

    it('shows score when match is scored', () => {
      const entry = createEntry({ homeScore: 2, awayScore: 1 })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('.entry-score').text()).toBe('2 - 1')
    })

    it('hides score when match is not scored', () => {
      const entry = createEntry({ homeScore: null, awayScore: null })
      const wrapper = mountEntry(entry)
      expect(wrapper.find('.entry-score').exists()).toBe(false)
    })
  })
})
