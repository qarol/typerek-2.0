import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import RevealList from './RevealList.vue'
import { useBetsStore } from '@/stores/bets'
import { useAuthStore } from '@/stores/auth'
import type { Match, RevealedBet } from '@/api/types'

vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string
    field: string | null

    constructor(error: { code: string; message: string; field: string | null }) {
      super(error.message)
      this.code = error.code
      this.field = error.field
    }
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      matches: {
        betSelector: {
          homeWin: 'Home win',
          draw: 'Draw',
          awayWin: 'Away win',
          homeOrDraw: 'Home or draw',
          drawOrAway: 'Draw or away',
          homeOrAway: 'Home or away',
        },
        reveal: {
          title: "Everyone's bets",
          ariaLabel: "All players' predictions for this match",
          missed: '— missed',
        },
      },
    },
  },
})

describe('RevealList', () => {
  const mockMatch: Match = {
    id: 5,
    homeTeam: 'Germany',
    awayTeam: 'France',
    kickoffTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    groupLabel: 'Group E',
    homeScore: null,
    awayScore: null,
    oddsHome: null,
    oddsDraw: null,
    oddsAway: null,
    oddsHomeDraw: null,
    oddsDrawAway: null,
    oddsHomeAway: null,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render loading skeleton initially', () => {
    const store = useBetsStore()
    vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    const wrapper = mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    expect(wrapper.find('skeleton-stub').exists()).toBe(true)
  })

  it('should display revealed bets after loading', async () => {
    const mockBets: RevealedBet[] = [
      { id: 1, userId: 3, matchId: 5, betType: '1X', pointsEarned: 0, nickname: 'tomek' },
      { id: 2, userId: 1, matchId: 5, betType: '2', pointsEarned: 0, nickname: 'admin' },
    ]

    const store = useBetsStore()
    store.revealedBets.set(5, mockBets)

    vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    const wrapper = mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('tomek')
    expect(wrapper.text()).toContain('admin')
  })

  it('should highlight current user row with teal background', async () => {
    const mockBets: RevealedBet[] = [
      { id: 1, userId: 3, matchId: 5, betType: '1X', pointsEarned: 0, nickname: 'tomek' },
      { id: 2, userId: 1, matchId: 5, betType: '2', pointsEarned: 0, nickname: 'admin' },
    ]

    const store = useBetsStore()
    store.revealedBets.set(5, mockBets)

    const authStore = useAuthStore()
    authStore.user = { id: 3, nickname: 'tomek', admin: false }

    vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    const wrapper = mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    const rows = wrapper.findAll('.reveal-row')
    expect(rows[0].classes()).toContain('is-current-user')
    expect(rows[1].classes()).not.toContain('is-current-user')
  })

  it('should render title', async () => {
    const store = useBetsStore()
    store.revealedBets.set(5, [])

    vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    const wrapper = mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain("Everyone's bets")
  })

  it('should call fetchMatchBets on mount', async () => {
    const store = useBetsStore()
    const fetchSpy = vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(fetchSpy).toHaveBeenCalledWith(5)
  })

  it('should display missed players from allPlayers in store', async () => {
    const mockBets: RevealedBet[] = [
      { id: 1, userId: 3, matchId: 5, betType: '1X', pointsEarned: 0, nickname: 'tomek' },
    ]

    const store = useBetsStore()
    store.revealedBets.set(5, mockBets)
    store.allPlayersByMatch.set(5, ['admin', 'tomek', 'maciek'])

    vi.spyOn(store, 'fetchMatchBets').mockImplementation(() => Promise.resolve())

    const wrapper = mount(RevealList, {
      props: { match: mockMatch },
      global: {
        plugins: [i18n],
        stubs: {
          Skeleton: true,
          Tag: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    const text = wrapper.text()
    expect(text).toContain('tomek')
    expect(text).toContain('admin')
    expect(text).toContain('maciek')
    expect(text).toContain('— missed')
  })
})
