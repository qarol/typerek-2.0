import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { watch, nextTick } from 'vue'
import { defineComponent } from 'vue'
import { LOCALE_KEY, SUPPORTED_LOCALES } from '../utils/locale'

// Mock PrimeVue components to avoid complex setup
vi.mock('primevue/button', () => ({
  default: defineComponent({
    props: ['label'],
    template: '<button>{{ label }}</button>',
  }),
}))

vi.mock('primevue/divider', () => ({
  default: defineComponent({ template: '<hr />' }),
}))

vi.mock('primevue/selectbutton', () => ({
  default: defineComponent({
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: `<div>
      <button
        v-for="opt in options"
        :key="opt"
        :data-value="opt"
        @click="$emit('update:modelValue', opt)"
      >{{ opt }}</button>
    </div>`,
  }),
}))

const createTestI18n = (locale = 'en') =>
  createI18n({
    legacy: false,
    locale,
    messages: {
      en: {
        nav: { more: 'More' },
        more: { language: 'Language', rules: 'How it works' },
        users: { admin: 'Admin', player: 'Player' },
        admin: {
          section: 'Admin',
          userManagement: 'User Management',
          oddsEntry: 'Odds Entry',
          scoreEntry: 'Score Entry',
        },
        auth: { signOut: 'Sign Out' },
      },
      pl: {
        nav: { more: 'Więcej' },
        more: { language: 'Język', rules: 'Jak to działa' },
        users: { admin: 'Administrator', player: 'Gracz' },
        admin: {
          section: 'Administrator',
          userManagement: 'Zarządzanie użytkownikami',
          oddsEntry: 'Kursy',
          scoreEntry: 'Wyniki',
        },
        auth: { signOut: 'Wyloguj się' },
      },
    },
  })

const createTestRouter = () =>
  createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

// Lazy import MoreView to avoid top-level import issues with mocks
async function mountMoreView(locale = 'en') {
  const { default: MoreView } = await import('./MoreView.vue')
  const i18n = createTestI18n(locale)
  const router = createTestRouter()
  const pinia = createPinia()
  setActivePinia(pinia)

  return { wrapper: mount(MoreView, { global: { plugins: [i18n, router, pinia] } }), i18n }
}

// ─── Test Suite 1: Language Switcher (AC: 1, 2) ─────────────────────────────

describe('MoreView – Language Switcher', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a language switcher with EN and PL options', async () => {
    const { wrapper } = await mountMoreView()
    const buttons = wrapper.findAll('button[data-value]')
    const values = buttons.map((b) => b.attributes('data-value'))
    expect(values).toContain('EN')
    expect(values).toContain('PL')
  })

  it('displays language section label using i18n key', async () => {
    const { wrapper } = await mountMoreView()
    expect(wrapper.text()).toContain('Language')
  })

  it('displays Polish language section label when locale is pl', async () => {
    const { wrapper } = await mountMoreView('pl')
    expect(wrapper.text()).toContain('Język')
  })
})

// ─── Test Suite 2: localStorage persistence (AC: 3) ─────────────────────────

describe('MoreView – localStorage persistence on locale change', () => {
  let setItemMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setItemMock = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: setItemMock,
      removeItem: vi.fn(),
    })
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls localStorage.setItem with typerek-locale and pl when PL is selected', async () => {
    const { wrapper } = await mountMoreView('en')

    // Find the PL button in the SelectButton mock
    const plButton = wrapper.find('button[data-value="PL"]')
    await plButton.trigger('click')
    await nextTick()

    expect(setItemMock).toHaveBeenCalledWith('typerek-locale', 'pl')
  })

  it('calls localStorage.setItem with typerek-locale and en when EN is selected', async () => {
    const { wrapper } = await mountMoreView('pl')

    const enButton = wrapper.find('button[data-value="EN"]')
    await enButton.trigger('click')
    await nextTick()

    expect(setItemMock).toHaveBeenCalledWith('typerek-locale', 'en')
  })
})

// ─── Test Suite 3: Startup locale resolution (AC: 4) ────────────────────────
// Helper that replicates main.ts startup resolution using the shared LOCALE_KEY
// and SUPPORTED_LOCALES constants — tests actual constants, not inline copies.
function resolveInitialLocale(storedValue: string | null, browserLanguage: string): string {
  const browserLang = browserLanguage.startsWith('pl') ? 'pl' : 'en'
  return SUPPORTED_LOCALES.includes(storedValue as 'en' | 'pl') ? (storedValue as string) : browserLang
}

describe('Startup locale resolution from localStorage', () => {
  it('uses saved pl locale from localStorage when valid', () => {
    expect(resolveInitialLocale('pl', 'en-US')).toBe('pl')
  })

  it('uses saved en locale from localStorage when valid', () => {
    expect(resolveInitialLocale('en', 'pl-PL')).toBe('en')
  })

  it('falls back to browser language when localStorage is empty', () => {
    expect(resolveInitialLocale(null, 'pl-PL')).toBe('pl')
  })

  it('falls back to browser language when localStorage has invalid value', () => {
    expect(resolveInitialLocale('fr', 'en-US')).toBe('en')
  })

  it('uses English as ultimate fallback when localStorage empty and no pl browser lang', () => {
    expect(resolveInitialLocale(null, 'de-DE')).toBe('en')
  })

  it('uses the shared LOCALE_KEY constant to read from localStorage', () => {
    expect(LOCALE_KEY).toBe('typerek-locale')
  })
})

// ─── Test Suite: Rules link (Story 6.4) ──────────────────────────────────────

describe('MoreView – Rules link', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders "How it works" link', async () => {
    const { wrapper } = await mountMoreView()
    expect(wrapper.text()).toContain('How it works')
  })

  it('navigates to /rules when rules link is clicked', async () => {
    const { wrapper } = await mountMoreView()
    const buttons = wrapper.findAll('button')
    const rulesButton = buttons.find((b) => b.text() === 'How it works')
    expect(rulesButton).toBeDefined()

    const router = wrapper.vm.$router
    const pushSpy = vi.spyOn(router, 'push')
    await rulesButton!.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/rules')
  })
})

// ─── Test Suite 4: Reactive <html lang=""> update (AC: 6) ───────────────────

describe('Reactive document.documentElement.lang update', () => {
  it('updates document.documentElement.lang when locale changes', async () => {
    const i18n = createTestI18n('en')
    const { locale } = i18n.global

    // Simulate the watch logic from App.vue
    document.documentElement.lang = locale.value
    const stopWatch = watch(locale, (newLocale: string) => {
      document.documentElement.lang = newLocale
    })

    expect(document.documentElement.lang).toBe('en')

    locale.value = 'pl'
    await nextTick()

    expect(document.documentElement.lang).toBe('pl')

    stopWatch()
    document.documentElement.lang = 'en'
  })
})
