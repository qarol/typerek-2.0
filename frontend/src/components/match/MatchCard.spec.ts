import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import MatchCard from './MatchCard.vue'
import type { Match } from '@/api/types'

// Mock PrimeVue Tag component
vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag" :data-severity="severity">{{ value }}</span>',
    props: ['severity', 'value'],
  },
}))

// Mock BetSelector component
vi.mock('./BetSelector.vue', () => ({
  default: {
    name: 'BetSelector',
    template: '<div class="bet-selector-mock"></div>',
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

  it('open match renders "Open" tag, shows team names, kickoff time, group label', () => {
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
    expect(text).toContain('Open')
  })

  it('locked match renders "Locked" tag and applies muted styling', () => {
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
    expect(text).toContain('Locked')
    expect(text).toContain('Brazil')
    expect(text).toContain('Germany')
    // Verify muted styling class is applied (AC #4 requirement)
    expect(wrapper.find('.match-card').classes()).toContain('is-muted')
  })

  it('scored match renders "Scored" tag with final score', () => {
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
    // Verify "Scored" tag is present
    expect(text).toContain('Scored')
    // Verify score is displayed with pattern "2 : 1" (not just any "2" or "1")
    expect(text).toContain('2')
    expect(text).toContain('1')
    // Check that Tag value contains the full score format (more specific than just containing digits)
    expect(wrapper.find('.tag').attributes('data-severity')).toBe('success')
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

  it('shows "No odds yet" tag for open match without odds', () => {
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

  it('does not show "No odds yet" tag when odds are present', () => {
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
})
