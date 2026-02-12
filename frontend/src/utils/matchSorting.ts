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

// Determine the simple match result from scores
export function determineMatchResult(homeScore: number, awayScore: number): '1' | 'X' | '2' {
  if (homeScore > awayScore) return '1'
  if (homeScore === awayScore) return 'X'
  return '2'
}

// Check if a bet type wins given the match result
export function isBetCorrect(betType: string, homeScore: number, awayScore: number): boolean {
  switch (betType) {
    case '1':
      return homeScore > awayScore
    case 'X':
      return homeScore === awayScore
    case '2':
      return awayScore > homeScore
    case '1X':
      return homeScore >= awayScore
    case 'X2':
      return awayScore >= homeScore
    case '12':
      return homeScore !== awayScore
    default:
      return false
  }
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
