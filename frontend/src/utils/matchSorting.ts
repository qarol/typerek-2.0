import type { Match } from '@/api/types'

export type MatchState = 'open' | 'locked' | 'scored'

export function getMatchState(match: Match): MatchState {
  if (match.homeScore !== null && match.awayScore !== null) {
    return 'scored'
  }
  if (new Date() >= new Date(match.kickoffTime)) {
    return 'locked'
  }
  return 'open'
}

function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function getMatchPriority(match: Match, now: Date): number {
  const state = getMatchState(match)
  const kickoff = new Date(match.kickoffTime)

  if (state === 'open' && isToday(kickoff, now)) return 0 // Today's open matches first
  if (state === 'open') return 1 // Future open matches
  if (state === 'locked') return 2 // Locked, no score
  return 3 // Scored matches last
}

export function sortMatchesForDisplay(matches: Match[]): Match[] {
  const now = new Date()
  return [...matches].sort((a, b) => {
    const priorityDiff = getMatchPriority(a, now) - getMatchPriority(b, now)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
  })
}
