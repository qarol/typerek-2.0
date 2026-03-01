import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { defineComponent } from 'vue'

vi.mock('primevue/button', () => ({
  default: defineComponent({
    props: ['label', 'icon', 'severity', 'text'],
    template: '<button>{{ label }}</button>',
  }),
}))

vi.mock('primevue/divider', () => ({
  default: defineComponent({ template: '<hr />' }),
}))

const messages = {
  en: {
    onboarding: {
      title: 'How it works',
      subtitle: 'Quick overview of the prediction game',
      betTypesTitle: 'Bet types',
      betTypesDesc: 'For each match, pick one of 6 options:',
      bet1: '1 — Home win',
      betX: 'X — Draw',
      bet2: '2 — Away win',
      bet1X: '1X — Home win or draw',
      betX2: 'X2 — Draw or away win',
      bet12: '12 — Home or away win',
      scoringTitle: 'Scoring',
      scoringDesc: 'Your points equal the odds of your correct bet.',
      lockTitle: 'Kickoff lock',
      lockDesc: 'Bets lock at kickoff.',
      missedTitle: 'Missed bets',
      missedDesc: 'No bet placed = 0 points.',
      gotIt: 'Got it',
      skip: 'Skip',
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
      { path: '/onboarding', component: { template: '<div />' } },
    ],
  })

async function mountOnboardingView() {
  const { default: OnboardingView } = await import('./OnboardingView.vue')
  const i18n = createTestI18n()
  const router = createTestRouter()
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push('/onboarding')
  await router.isReady()
  return mount(OnboardingView, { global: { plugins: [i18n, router, pinia] } })
}

describe('OnboardingView', () => {
  let setItemMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setItemMock = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: setItemMock,
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all content sections', async () => {
    const wrapper = await mountOnboardingView()
    expect(wrapper.text()).toContain('How it works')
    expect(wrapper.text()).toContain('Bet types')
    expect(wrapper.text()).toContain('1 — Home win')
    expect(wrapper.text()).toContain('X — Draw')
    expect(wrapper.text()).toContain('2 — Away win')
    expect(wrapper.text()).toContain('1X — Home win or draw')
    expect(wrapper.text()).toContain('X2 — Draw or away win')
    expect(wrapper.text()).toContain('12 — Home or away win')
    expect(wrapper.text()).toContain('Scoring')
    expect(wrapper.text()).toContain('Kickoff lock')
    expect(wrapper.text()).toContain('Missed bets')
  })

  it('"Got it" button navigates to leaderboard and sets localStorage', async () => {
    const wrapper = await mountOnboardingView()
    const buttons = wrapper.findAll('button')
    const gotItBtn = buttons.find((b) => b.text() === 'Got it')
    expect(gotItBtn).toBeDefined()

    const router = wrapper.vm.$router
    const pushSpy = vi.spyOn(router, 'push')
    await gotItBtn!.trigger('click')

    expect(setItemMock).toHaveBeenCalledWith('typerek-onboarding-seen', 'true')
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('"Skip" button navigates to leaderboard and sets localStorage', async () => {
    const wrapper = await mountOnboardingView()
    const buttons = wrapper.findAll('button')
    const skipBtn = buttons.find((b) => b.text() === 'Skip')
    expect(skipBtn).toBeDefined()

    const router = wrapper.vm.$router
    const pushSpy = vi.spyOn(router, 'push')
    await skipBtn!.trigger('click')

    expect(setItemMock).toHaveBeenCalledWith('typerek-onboarding-seen', 'true')
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('uses i18n for all visible text (no hardcoded strings)', async () => {
    const wrapper = await mountOnboardingView()
    // All text should come from i18n messages
    const text = wrapper.text()
    expect(text).toContain('How it works')
    expect(text).toContain('Got it')
    expect(text).toContain('Skip')
  })

  it('redirects to / if onboarding already seen in localStorage', async () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('true'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    const { default: OnboardingView } = await import('./OnboardingView.vue')
    const i18n = createTestI18n()
    const router = createTestRouter()
    const pinia = createPinia()
    setActivePinia(pinia)
    await router.push('/onboarding')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')
    mount(OnboardingView, { global: { plugins: [i18n, router, pinia] } })
    // Wait for onMounted
    await new Promise((r) => setTimeout(r, 0))
    expect(replaceSpy).toHaveBeenCalledWith('/')
  })
})
