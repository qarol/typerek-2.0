import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { defineComponent } from 'vue'

vi.mock('primevue/divider', () => ({
  default: defineComponent({ template: '<hr />' }),
}))

const messages = {
  en: {
    rules: {
      title: 'How it works',
      betTypesTitle: 'Bet types',
      betTypesDesc: 'For each match you predict the outcome by choosing one of 6 options:',
      bet1: '1 — Home win',
      betX: 'X — Draw',
      bet2: '2 — Away win',
      bet1X: '1X — Home win or draw',
      betX2: 'X2 — Draw or away win',
      bet12: '12 — Home or away win',
      scoringTitle: 'Scoring — odds as points',
      scoringDesc: 'When your prediction is correct, you earn points equal to the odds.',
      lockTitle: 'Kickoff lock',
      lockDesc: 'You can place or change your bet any time before kickoff.',
      compoundTitle: 'Compound bets (1X, X2, 12)',
      compoundDesc: 'A compound bet covers two outcomes.',
      missedTitle: 'Missed bets',
      missedDesc: 'If you don\'t place a bet before kickoff, you score 0 points.',
    },
  },
}

const createTestI18n = () =>
  createI18n({ legacy: false, locale: 'en', messages })

const createTestRouter = () =>
  createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/rules', component: { template: '<div />' } },
    ],
  })

async function mountRulesView() {
  const { default: RulesView } = await import('./RulesView.vue')
  const i18n = createTestI18n()
  const router = createTestRouter()
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push('/rules')
  await router.isReady()
  return mount(RulesView, { global: { plugins: [i18n, router, pinia] } })
}

describe('RulesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all rule sections', async () => {
    const wrapper = await mountRulesView()
    const text = wrapper.text()
    expect(text).toContain('How it works')
    expect(text).toContain('Bet types')
    expect(text).toContain('Scoring — odds as points')
    expect(text).toContain('Kickoff lock')
    expect(text).toContain('Compound bets (1X, X2, 12)')
    expect(text).toContain('Missed bets')
  })

  it('displays all 6 bet types with descriptive labels', async () => {
    const wrapper = await mountRulesView()
    const text = wrapper.text()
    expect(text).toContain('1 — Home win')
    expect(text).toContain('X — Draw')
    expect(text).toContain('2 — Away win')
    expect(text).toContain('1X — Home win or draw')
    expect(text).toContain('X2 — Draw or away win')
    expect(text).toContain('12 — Home or away win')
  })

  it('uses i18n for all visible text', async () => {
    const wrapper = await mountRulesView()
    const text = wrapper.text()
    // Verify key content is from i18n
    expect(text).toContain('How it works')
    expect(text).toContain('A compound bet covers two outcomes.')
  })
})
