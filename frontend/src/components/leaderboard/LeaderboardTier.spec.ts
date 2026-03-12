import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LeaderboardTier from './LeaderboardTier.vue'
import type { LeaderboardEntry } from '@/api/types'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      leaderboard: {
        tierPlayerCount: '{count} players',
        avatarHistoryLabel: "View {nickname}'s history",
        moveUpLabel: 'Moved up {n}',
        moveDownLabel: 'Moved down {n}',
        noChangeLabel: 'No change',
      },
    },
  },
})

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  position: 1,
  userId: 1,
  nickname: 'Alice',
  totalPoints: 12.5,
  previousPosition: null,
  ...overrides,
})

const mountTier = (props: ConstructorParameters<typeof LeaderboardTier>[0]['propsData'] = {}) =>
  mount(LeaderboardTier, {
    props: {
      position: 1,
      totalPoints: 12.5,
      players: [makeEntry()],
      currentUserId: null,
      ...props,
    } as any,
    global: { plugins: [i18n] },
  })

describe('LeaderboardTier', () => {
  describe('tier accent classes', () => {
    it('applies tier-gold class for position 1', () => {
      const w = mountTier({ position: 1 })
      expect(w.find('.tier-head').classes()).toContain('tier-gold')
    })

    it('applies tier-silver class for position 2', () => {
      const w = mountTier({ position: 2 })
      expect(w.find('.tier-head').classes()).toContain('tier-silver')
    })

    it('applies tier-bronze class for position 3', () => {
      const w = mountTier({ position: 3 })
      expect(w.find('.tier-head').classes()).toContain('tier-bronze')
    })

    it('applies no medal class for position 4', () => {
      const w = mountTier({ position: 4 })
      const classes = w.find('.tier-head').classes()
      expect(classes).not.toContain('tier-gold')
      expect(classes).not.toContain('tier-silver')
      expect(classes).not.toContain('tier-bronze')
    })
  })

  describe('ordinal position label', () => {
    it('shows "1st" for position 1', () => {
      const w = mountTier({ position: 1 })
      expect(w.find('.tier-pos').text()).toContain('1')
      expect(w.find('.tier-pos').html()).toContain('st')
    })

    it('shows "2nd" for position 2', () => {
      const w = mountTier({ position: 2 })
      expect(w.find('.tier-pos').html()).toContain('nd')
    })

    it('shows "3rd" for position 3', () => {
      const w = mountTier({ position: 3 })
      expect(w.find('.tier-pos').html()).toContain('rd')
    })

    it('shows "4th" for position 4', () => {
      const w = mountTier({ position: 4 })
      expect(w.find('.tier-pos').html()).toContain('th')
    })

    it('shows "11th" not "11st" (English exception)', () => {
      const w = mountTier({ position: 11 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('st')
    })

    it('shows "12th" not "12nd"', () => {
      const w = mountTier({ position: 12 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('nd')
    })

    it('shows "13th" not "13rd"', () => {
      const w = mountTier({ position: 13 })
      expect(w.find('.tier-pos').html()).toContain('th')
      expect(w.find('.tier-pos').html()).not.toContain('rd')
    })

    it('shows "21st" for position 21', () => {
      const w = mountTier({ position: 21 })
      expect(w.find('.tier-pos').html()).toContain('st')
    })
  })

  describe('player count badge', () => {
    it('hides count badge when only 1 player', () => {
      const w = mountTier({ players: [makeEntry()] })
      expect(w.find('.tier-count').exists()).toBe(false)
    })

    it('shows count badge when 2+ players', () => {
      const w = mountTier({
        players: [makeEntry({ userId: 1 }), makeEntry({ userId: 2, nickname: 'Bob' })],
      })
      expect(w.find('.tier-count').exists()).toBe(true)
      expect(w.find('.tier-count').text()).toContain('2')
    })
  })

  describe('avatar grid', () => {
    it('renders one avatar per player', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
        makeEntry({ userId: 3, nickname: 'Carol' }),
      ]
      const w = mountTier({ players })
      expect(w.findAll('.av-circle').length).toBe(3)
    })

    it('shows first letter of nickname uppercased in avatar', () => {
      const w = mountTier({ players: [makeEntry({ nickname: 'alice' })] })
      expect(w.find('.av-circle').text()).toContain('A')
    })
  })

  describe('current user', () => {
    it('applies av-circle--me class to current user avatar', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
      ]
      const w = mountTier({ players, currentUserId: 2 })
      const circles = w.findAll('.av-circle')
      // Current user (Bob, userId=2) should have --me class
      const meCircle = circles.find(c => c.classes().includes('av-circle--me'))
      expect(meCircle).toBeDefined()
    })

    it('places current user avatar first', () => {
      const players = [
        makeEntry({ userId: 1, nickname: 'Alice' }),
        makeEntry({ userId: 2, nickname: 'Bob' }),
        makeEntry({ userId: 3, nickname: 'Carol' }),
      ]
      const w = mountTier({ players, currentUserId: 2 })
      const names = w.findAll('.av-name').map(n => n.text())
      expect(names[0]).toContain('Bob')
    })

    it('applies av-name--me class to current user name', () => {
      const w = mountTier({
        players: [makeEntry({ userId: 5, nickname: 'Bob' })],
        currentUserId: 5,
      })
      expect(w.find('.av-name--me').exists()).toBe(true)
    })

    it('does not apply --me class when currentUserId is null', () => {
      const w = mountTier({ players: [makeEntry({ userId: 1 })], currentUserId: null })
      expect(w.find('.av-circle--me').exists()).toBe(false)
    })
  })

  describe('movement badge', () => {
    it('shows up badge when previousPosition > position (moved up)', () => {
      const w = mountTier({
        players: [makeEntry({ position: 2, previousPosition: 5 })],
      })
      expect(w.find('.av-badge--up').exists()).toBe(true)
      expect(w.find('.av-badge--up').text()).toContain('3') // diff = previousPosition - position = 5 - 2 = 3
    })

    it('shows correct up value', () => {
      const w = mountTier({
        players: [makeEntry({ position: 1, previousPosition: 4 })],
      })
      // diff = previousPosition - position = 4 - 1 = 3
      expect(w.find('.av-badge--up').text()).toContain('3')
    })

    it('shows down badge when previousPosition < position (moved down)', () => {
      const w = mountTier({
        players: [makeEntry({ position: 5, previousPosition: 2 })],
      })
      expect(w.find('.av-badge--dn').exists()).toBe(true)
      expect(w.find('.av-badge--dn').text()).toContain('3')
    })

    it('shows dash badge when position unchanged', () => {
      const w = mountTier({
        players: [makeEntry({ position: 3, previousPosition: 3 })],
      })
      expect(w.find('.av-badge--nc').exists()).toBe(true)
    })

    it('hides badge when previousPosition is null', () => {
      const w = mountTier({
        players: [makeEntry({ previousPosition: null })],
      })
      expect(w.find('.av-badge--up').exists()).toBe(false)
      expect(w.find('.av-badge--dn').exists()).toBe(false)
      expect(w.find('.av-badge--nc').exists()).toBe(false)
    })

    it('up badge has aria-label "Moved up N"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 1, previousPosition: 4 })],
      })
      // diff = 4 - 1 = 3
      expect(w.find('.av-badge--up').attributes('aria-label')).toBe('Moved up 3')
    })

    it('down badge has aria-label "Moved down N"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 5, previousPosition: 2 })],
      })
      // diff = |2 - 5| = 3
      expect(w.find('.av-badge--dn').attributes('aria-label')).toBe('Moved down 3')
    })

    it('no-change badge has aria-label "No change"', () => {
      const w = mountTier({
        players: [makeEntry({ position: 3, previousPosition: 3 })],
      })
      expect(w.find('.av-badge--nc').attributes('aria-label')).toBe('No change')
    })
  })

  describe('accessibility', () => {
    it('has role="listitem" on root element', () => {
      const w = mountTier()
      expect(w.find('[role="listitem"]').exists()).toBe(true)
    })

    it('each avatar has tabindex="0"', () => {
      const w = mountTier({ players: [makeEntry({ userId: 1 }), makeEntry({ userId: 2, nickname: 'Bob' })] })
      w.findAll('.av-circle').forEach(c => {
        expect(c.attributes('tabindex')).toBe('0')
      })
    })

    it('each avatar has aria-label with nickname', () => {
      const w = mountTier({ players: [makeEntry({ nickname: 'Alice' })] })
      expect(w.find('.av-circle').attributes('aria-label')).toContain('Alice')
    })
  })

  describe('navigation', () => {
    it('emits navigate with userId when avatar is clicked', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 42 })] })
      await w.find('.av-circle').trigger('click')
      expect(w.emitted('navigate')).toBeTruthy()
      expect(w.emitted('navigate')![0]).toEqual([42])
    })

    it('emits navigate when Enter is pressed on avatar', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 7 })] })
      await w.find('.av-circle').trigger('keydown', { key: 'Enter' })
      expect(w.emitted('navigate')![0]).toEqual([7])
    })

    it('emits navigate when Space is pressed on avatar', async () => {
      const w = mountTier({ players: [makeEntry({ userId: 7 })] })
      await w.find('.av-circle').trigger('keydown', { key: ' ' })
      expect(w.emitted('navigate')![0]).toEqual([7])
    })
  })
})
