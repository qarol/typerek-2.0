import { watch, onUnmounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import { getMatchState } from '@/utils/matchSorting'

const POLL_INTERVAL_MS = 30_000

export function useMatchPolling() {
  const matchesStore = useMatchesStore()

  let intervalId: ReturnType<typeof setInterval> | null = null
  let listenerRegistered = false
  const kickoffTimers: ReturnType<typeof setTimeout>[] = []

  function clearKickoffTimers() {
    for (const id of kickoffTimers.splice(0)) {
      clearTimeout(id)
    }
  }

  function scheduleKickoffTimers() {
    // Only schedule when polling is active to avoid stale timers after logout
    if (intervalId === null) return
    clearKickoffTimers()
    const now = Date.now()
    for (const match of matchesStore.matches) {
      if (getMatchState(match) === 'open') {
        const delay = new Date(match.kickoffTime).getTime() - now
        if (delay > 0) {
          kickoffTimers.push(setTimeout(() => matchesStore.fetchMatchesSilent(), delay))
        }
      }
    }
  }

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

    scheduleKickoffTimers()
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
    clearKickoffTimers()
  }

  // Reschedule kickoff timers whenever the matches list changes.
  // Guard in scheduleKickoffTimers ensures this is a no-op while polling is stopped.
  watch(
    () => matchesStore.matches,
    () => scheduleKickoffTimers(),
    { deep: false },
  )

  onUnmounted(() => stopPolling())

  return { startPolling, stopPolling }
}
