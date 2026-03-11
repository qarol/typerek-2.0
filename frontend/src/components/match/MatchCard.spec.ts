import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import MatchCard from './MatchCard.vue'
import type { Match } from '@/api/types'

// Mock BetSelector component
vi.mock('./BetSelector.vue', () => ({
  default: {
    name: 'BetSelector',
    template: '<div class="bet-selector-mock"></div>',
    props: ['match'],
  },
}))

// Mock RevealDrawer component
vi.mock('./RevealDrawer.vue', () => ({
  default: {
    name: 'RevealDrawer',
    template: '<div class="reveal-drawer-mock"></div>',
    props: ['match'],
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      matches: {
        open: 'Open',
        locked: 'Locked',
        scored: 'Scored',
        yourBet: 'Your bet',
        noBetPlaced: 'No bet placed yet',
        noOddsYet: 'No odds yet',
        matchCard: {
          homeWin: 'Home win',
          draw: 'Draw',
          awayWin: 'Away win',
        },
      },
    },
  },
})

describe('MatchCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createMatch = (overrides: Partial<Match> = {}): Match => ({
    id: 1,
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    kickoffTime: new Date().toISOString(),
    groupLabel: 'Group A',
    homeScore: null,
    awayScore: null,
    oddsHome: null,
    oddsDraw: null,
    oddsAway: null,
    oddsHomeDraw: null,
    oddsDrawAway: null,
    oddsHomeAway: null,
    ...overrides,
  })

  it('open match shows team names, kickoff time, group label', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      kickoffTime: futureTime.toISOString(),
      groupLabel: 'Group A',
      homeScore: null,
      awayScore: null,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Brazil')
    expect(text).toContain('Germany')
    expect(text).toContain('Group A')
  })

  it('locked match applies muted styling', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      kickoffTime: pastTime.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Brazil')
    expect(text).toContain('Germany')
    // Verify muted styling class is applied
    expect(wrapper.find('.match-card').classes()).toContain('is-muted')
  })

  it('scored match displays final score', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      kickoffTime: pastTime.toISOString(),
      homeScore: 2,
      awayScore: 1,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('2')
    expect(text).toContain('1')
  })

  it('match without group label does not render group label section', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      kickoffTime: futureTime.toISOString(),
      groupLabel: null,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).not.toContain('Group')
  })

  it('renders BetSelector for open match', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      kickoffTime: futureTime.toISOString(),
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.bet-selector-mock').exists()).toBe(true)
  })

  it('does not render BetSelector for locked match', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.bet-selector-mock').exists()).toBe(false)
  })

  it('shows "No odds yet" hint for open match without odds', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      kickoffTime: futureTime.toISOString(),
      oddsHome: null,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).toContain('No odds yet')
  })

  it('does not show "No odds yet" hint when odds are present', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      kickoffTime: futureTime.toISOString(),
      oddsHome: 2.5,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).not.toContain('No odds yet')
  })

  it('renders RevealDrawer for locked match', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.reveal-drawer-mock').exists()).toBe(true)
  })

  it('renders RevealDrawer for scored match', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
      homeScore: 2,
      awayScore: 1,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.reveal-drawer-mock').exists()).toBe(true)
  })

  it('does not render RevealDrawer for open match', () => {
    const futureTime = new Date()
    futureTime.setDate(futureTime.getDate() + 1)

    const match = createMatch({
      kickoffTime: futureTime.toISOString(),
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.reveal-drawer-mock').exists()).toBe(false)
  })

  it('scored match shows home score higher than away score for home win', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
      homeScore: 2,
      awayScore: 1,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('2')
    expect(text).toContain('1')
  })

  it('scored match shows equal scores for draw', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
      homeScore: 1,
      awayScore: 1,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('1')
  })

  it('scored match shows away score higher than home score for away win', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
      homeScore: 0,
      awayScore: 2,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('0')
    expect(text).toContain('2')
  })

  it('locked match without scores does not show score', () => {
    const pastTime = new Date()
    pastTime.setDate(pastTime.getDate() - 1)

    const match = createMatch({
      kickoffTime: pastTime.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const wrapper = mount(MatchCard, {
      props: { match },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.score').exists()).toBe(false)
  })
})
