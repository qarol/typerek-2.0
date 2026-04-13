import { onUnmounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'

const POLL_INTERVAL_MS = 30_000

export function useMatchPolling() {
  const matchesStore = useMatchesStore()

  let intervalId: ReturnType<typeof setInterval> | null = null
  let listenerRegistered = false

  function onVisibilityChange() {
    if (!document.hidden) {
      matchesStore.fetchMatchesSilent()
    }
  }

  function startPolling() {
    if (intervalId !== null) return

    intervalId = setInterval(() => {
      if (!document.hidden) {
        matchesStore.fetchMatchesSilent()
      }
    }, POLL_INTERVAL_MS)

    if (!listenerRegistered) {
      document.addEventListener('visibilitychange', onVisibilityChange)
      listenerRegistered = true
    }
  }

  function stopPolling() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (listenerRegistered) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      listenerRegistered = false
    }
  }

  onUnmounted(() => stopPolling())

  return { startPolling, stopPolling }
}
