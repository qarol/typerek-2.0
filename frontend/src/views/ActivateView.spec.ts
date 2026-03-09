import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { defineComponent } from 'vue'

vi.mock('primevue/password', () => ({
  default: defineComponent({
    props: ['modelValue', 'placeholder', 'feedback', 'toggleMask', 'autocomplete', 'fluid'],
    emits: ['update:modelValue'],
    template: '<input :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  }),
}))

vi.mock('primevue/button', () => ({
  default: defineComponent({
    props: ['label', 'loading', 'disabled', 'type', 'fluid'],
    template: '<button :type="type || \'button\'">{{ label }}</button>',
  }),
}))

vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    error: null,
    loading: false,
    isAuthenticated: false,
    activate: vi.fn().mockResolvedValue(undefined),
  })),
}))

const messages = {
  en: {
    activate: {
      title: 'Activate Account',
      activating: 'Activating…',
      password: 'Password',
      passwordConfirmation: 'Confirm Password',
      submit: 'Activate',
      passwordTooShort: 'Password too short',
      passwordMismatch: 'Passwords do not match',
    },
    errors: {
      INVALID_TOKEN: 'Invalid or expired invite link.',
    },
  },
}

const createTestI18n = () => createI18n({ legacy: false, locale: 'en', messages })

const createTestRouter = () =>
  createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/activate', component: { template: '<div />' } },
      { path: '/onboarding', component: { template: '<div />' } },
    ],
  })

async function mountActivateView(_getItemReturnValue: string | null = null) {
  const { default: ActivateView } = await import('./ActivateView.vue')
  const { api } = await import('@/api/client')
  vi.mocked(api.get).mockResolvedValue({ data: { nickname: 'TestUser' } })

  const i18n = createTestI18n()
  const router = createTestRouter()
  const pinia = createPinia()
  setActivePinia(pinia)

  await router.push('/activate?token=valid-token')
  await router.isReady()

  const wrapper = mount(ActivateView, { global: { plugins: [i18n, router, pinia] } })
  return { wrapper, router }
}

describe('ActivateView – onboarding redirect on first activation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('redirects to /onboarding after activation when onboarding not yet seen', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const { wrapper, router } = await mountActivateView(null)
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')

    // Simulate successful form submission by calling handleActivate directly
    // Access the component's internal router to verify push
    const vm = wrapper.vm as unknown as { handleActivate: () => Promise<void> }
    // Set password fields to bypass validation
    ;(wrapper.vm as unknown as Record<string, unknown>).password = 'password123'
    ;(wrapper.vm as unknown as Record<string, unknown>).passwordConfirmation = 'password123'

    await vm.handleActivate?.()
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/onboarding')
  })

  it('redirects to / (leaderboard) after activation when onboarding already seen', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('true'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const { wrapper, router } = await mountActivateView('true')
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')

    const vm = wrapper.vm as unknown as { handleActivate: () => Promise<void> }
    ;(wrapper.vm as unknown as Record<string, unknown>).password = 'password123'
    ;(wrapper.vm as unknown as Record<string, unknown>).passwordConfirmation = 'password123'

    await vm.handleActivate?.()
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/')
  })
})
