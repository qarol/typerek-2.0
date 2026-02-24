import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useOnlineStatus } from './useOnlineStatus'

// Helper component to test the composable in a Vue lifecycle context
const TestComponent = defineComponent({
  setup() {
    const { isOnline } = useOnlineStatus()
    return { isOnline }
  },
  template: '<div>{{ isOnline }}</div>',
})

describe('useOnlineStatus', () => {
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

  it('initializes with the current navigator.onLine value when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isOnline).toBe(true)
    wrapper.unmount()
  })

  it('initializes with the current navigator.onLine value when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isOnline).toBe(false)
    wrapper.unmount()
  })

  it('sets isOnline to false when the offline event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isOnline).toBe(true)

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(wrapper.vm.isOnline).toBe(false)
    wrapper.unmount()
  })

  it('sets isOnline to true when the online event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isOnline).toBe(false)

    window.dispatchEvent(new Event('online'))
    await nextTick()

    expect(wrapper.vm.isOnline).toBe(true)
    wrapper.unmount()
  })

  it('removes event listeners on unmount (no memory leak)', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = mount(TestComponent)
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('does not react to events after unmount', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const wrapper = mount(TestComponent)
    wrapper.unmount()

    // After unmount, dispatching should not throw or cause issues
    expect(() => window.dispatchEvent(new Event('offline'))).not.toThrow()
  })
})
