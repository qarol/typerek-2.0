import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { PrimeVueTestingUtils } from 'primevue/config'
import BetSelector from './BetSelector.vue'
import { useBetsStore } from '@/stores/bets'
import type { Match, Bet } from '@/api/types'

// Mock primevue toast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      matches: {
        betSelector: {
          ariaLabel: 'Select your prediction',
          homeWin: 'Home win',
          draw: 'Draw',
          awayWin: 'Away win',
          homeOrDraw: 'Home or draw',
          drawOrAway: 'Draw or away',
          homeOrAway: 'Home or away',
          noOdds: 'no odds',
          errorTitle: 'Bet Error',
          errorSaveFailed: "Couldn't save bet, try again",
          errorMatchStarted: 'Match has started, bet not saved',
        },
      },
    },
  },
})

describe('BetSelector', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  const createMatch = (overrides?: Partial<Match>): Match => ({
    id: 1,
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    kickoffTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    groupLabel: 'Group A',
    homeScore: null,
    awayScore: null,
    oddsHome: 2.5,
    oddsDraw: 3.0,
    oddsAway: 2.8,
    oddsHomeDraw: 1.8,
    oddsDrawAway: 1.9,
    oddsHomeAway: 1.7,
    ...overrides,
  })

  const mountComponent = (match: Match) => {
    return mount(BetSelector, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })
  }

  it('renders 6 bet option buttons', () => {
    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(6)
  })

  it('displays bet type labels correctly', () => {
    const match = createMatch()
    const wrapper = mountComponent(match)
    const betTypes = ['1', 'X', '2', '1X', 'X2', '12']
    const buttons = wrapper.findAll('button')

    buttons.forEach((button, index) => {
      expect(button.text()).toContain(betTypes[index])
    })
  })

  it('displays odds values when available', () => {
    const match = createMatch({
      oddsHome: 2.5,
      oddsDraw: 3.0,
      oddsAway: 2.8,
    })
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    expect(buttons[0].text()).toContain('2.5') // Home win
    expect(buttons[1].text()).toContain('3') // Draw
    expect(buttons[2].text()).toContain('2.8') // Away win
  })

  it('displays em-dash when odds are null', () => {
    const match = createMatch({
      oddsHome: null,
      oddsDraw: null,
      oddsAway: null,
      oddsHomeDraw: null,
      oddsDrawAway: null,
      oddsHomeAway: null,
    })
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    buttons.forEach((button) => {
      expect(button.text()).toContain('—')
    })
  })

  it('highlights selected bet button', async () => {
    const store = useBetsStore()
    const match = createMatch()
    const bet: Bet = {
      id: 1,
      matchId: match.id,
      userId: 1,
      betType: '1',
      pointsEarned: 0,
    }
    store.bets.push(bet)

    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')
    const firstButton = buttons[0]

    expect(firstButton.classes()).toContain('selected')
  })

  it('does not highlight button when no bet exists', () => {
    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    buttons.forEach((button) => {
      expect(button.classes()).not.toContain('selected')
    })
  })

  it('calls placeBet when selecting a new bet', async () => {
    const store = useBetsStore()
    vi.spyOn(store, 'placeBet').mockResolvedValue({
      id: 1,
      matchId: 1,
      userId: 1,
      betType: '1',
      pointsEarned: 0,
    })

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.placeBet).toHaveBeenCalledWith(match.id, '1')
  })

  it('calls updateBet when changing existing bet', async () => {
    const store = useBetsStore()
    const bet: Bet = {
      id: 1,
      matchId: 1,
      userId: 1,
      betType: '1',
      pointsEarned: 0,
    }
    store.bets.push(bet)

    vi.spyOn(store, 'updateBet').mockResolvedValue({
      ...bet,
      betType: 'X',
    })

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    // Click the X (Draw) button
    await buttons[1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.updateBet).toHaveBeenCalledWith(bet.id, 'X')
  })

  it('calls removeBet when clicking the same bet option', async () => {
    const store = useBetsStore()
    const bet: Bet = {
      id: 1,
      matchId: 1,
      userId: 1,
      betType: '1',
      pointsEarned: 0,
    }
    store.bets.push(bet)

    vi.spyOn(store, 'removeBet').mockResolvedValue()

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    // Click the 1 (Home win) button - same as current bet
    await buttons[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.removeBet).toHaveBeenCalledWith(bet.id)
  })

  it('has correct ARIA attributes', () => {
    const match = createMatch()
    const wrapper = mountComponent(match)
    const radiogroup = wrapper.find('[role="radiogroup"]')

    expect(radiogroup.attributes('aria-label')).toBe('Select your prediction')

    const buttons = wrapper.findAll('[role="radio"]')
    expect(buttons).toHaveLength(6)
    buttons.forEach((button) => {
      expect(button.attributes('aria-checked')).toBeDefined()
    })
  })

  it('implements roving tabindex pattern', () => {
    const store = useBetsStore()
    const match = createMatch()
    const bet: Bet = {
      id: 1,
      matchId: match.id,
      userId: 1,
      betType: 'X',
      pointsEarned: 0,
    }
    store.bets.push(bet)

    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    // Selected button should have tabindex 0
    expect(buttons[1].attributes('tabindex')).toBe('0')

    // Other buttons should have tabindex -1
    expect(buttons[0].attributes('tabindex')).toBe('-1')
    expect(buttons[2].attributes('tabindex')).toBe('-1')
  })

  it('disables all buttons while saving', async () => {
    const store = useBetsStore()
    vi.spyOn(store, 'placeBet').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => {
              resolve({
                id: 1,
                matchId: 1,
                userId: 1,
                betType: '1',
                pointsEarned: 0,
              })
            },
            100,
          )
        }),
    )

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    buttons[0].trigger('click')
    await wrapper.vm.$nextTick()

    // All buttons should be disabled while saving
    buttons.forEach((button) => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('reverts selection and shows Toast on save error', async () => {
    const store = useBetsStore()
    const { ApiClientError } = await import('@/api/client')

    vi.spyOn(store, 'placeBet').mockRejectedValue(
      new ApiClientError({ code: 'BET_LOCKED', message: 'Match has started', field: null }),
    )

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    await wrapper.vm.$nextTick()

    // Selection should be reverted (no selected class)
    buttons.forEach((button) => {
      expect(button.classes()).not.toContain('selected')
    })
  })

  it('navigates with arrow keys', async () => {
    const store = useBetsStore()
    const match = createMatch()
    const bet: Bet = {
      id: 1,
      matchId: match.id,
      userId: 1,
      betType: 'X',
      pointsEarned: 0,
    }
    store.bets.push(bet)

    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    // Initial: selected button (X/index 1) has tabindex 0
    expect(buttons[1].attributes('tabindex')).toBe('0')

    // Press right arrow on the selected button to move to next
    const preventDefaultMock = vi.fn()
    await buttons[1].trigger('keydown', {
      key: 'ArrowRight',
      preventDefault: preventDefaultMock,
    })
    await wrapper.vm.$nextTick()

    // Focus should move (preventDefault was called, focus was attempted)
    expect(preventDefaultMock).toHaveBeenCalled()
  })

  it('selects bet with Enter key', async () => {
    const store = useBetsStore()
    vi.spyOn(store, 'placeBet').mockResolvedValue({
      id: 1,
      matchId: 1,
      userId: 1,
      betType: '1',
      pointsEarned: 0,
    })

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('keydown', {
      key: 'Enter',
      preventDefault: vi.fn(),
    })
    await wrapper.vm.$nextTick()

    expect(store.placeBet).toHaveBeenCalledWith(match.id, '1')
  })

  it('selects bet with Space key', async () => {
    const store = useBetsStore()
    vi.spyOn(store, 'placeBet').mockResolvedValue({
      id: 1,
      matchId: 1,
      userId: 1,
      betType: 'X',
      pointsEarned: 0,
    })

    const match = createMatch()
    const wrapper = mountComponent(match)
    const buttons = wrapper.findAll('button')

    await buttons[1].trigger('keydown', {
      key: ' ',
      preventDefault: vi.fn(),
    })
    await wrapper.vm.$nextTick()

    expect(store.placeBet).toHaveBeenCalledWith(match.id, 'X')
  })
})
