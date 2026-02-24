import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { defineComponent, nextTick } from 'vue'
import App from './App.vue'

// Mock AppNavigation to avoid router/DOM complexity
vi.mock('./components/ui/AppNavigation.vue', () => ({
  default: defineComponent({ template: '<nav data-testid="app-navigation" />' }),
}))

// Mock Toast
vi.mock('primevue/toast', () => ({
  default: defineComponent({ template: '<div data-testid="toast" />' }),
}))

const createTestI18n = () =>
  createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        offline: { title: "You're offline. Connect to place bets." },
      },
      pl: {
        offline: { title: 'Jesteś offline. Połącz się, aby obstawiać.' },
      },
    },
  })

function mountApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const i18n = createTestI18n()
  return mount(App, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        RouterView: defineComponent({ template: '<div data-testid="router-view" />' }),
      },
    },
  })
}

describe('App.vue — offline banner', () => {
  let originalOnLine: boolean

  beforeEach(() => {
    originalOnLine = navigator.onLine
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    })
  })

  it('does not show offline banner when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows offline banner when navigator.onLine is false at mount', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the correct offline message text', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').text()).toBe("You're offline. Connect to place bets.")
    wrapper.unmount()
  })

  it('shows offline banner after offline event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').exists()).toBe(false)

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(wrapper.find('.offline-banner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('hides offline banner after online event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').exists()).toBe(true)

    window.dispatchEvent(new Event('online'))
    await nextTick()

    expect(wrapper.find('.offline-banner').exists()).toBe(false)
    wrapper.unmount()
  })

  it('offline banner has role="alert" for accessibility', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mountApp()
    expect(wrapper.find('.offline-banner').attributes('role')).toBe('alert')
    wrapper.unmount()
  })
})
