export interface ApiResponse<T> {
  data: T
}

export interface ApiCollectionResponse<T> {
  data: T[]
  meta: { count: number; allPlayers?: string[] }
}

export interface ApiError {
  error: {
    code: string
    message: string
    field: string | null
  }
}

export interface User {
  id: number
  nickname: string
  admin: boolean
}

export interface AdminUser {
  id: number
  nickname: string
  admin: boolean
  activated: boolean
}

export interface InviteResponse {
  id: number
  nickname: string
  inviteUrl: string
}

export interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  kickoffTime: string
  groupLabel: string | null
  homeScore: number | null
  awayScore: number | null
  oddsHome: number | null
  oddsDraw: number | null
  oddsAway: number | null
  oddsHomeDraw: number | null
  oddsDrawAway: number | null
  oddsHomeAway: number | null
}

export interface Bet {
  id: number
  matchId: number
  userId: number
  betType: string
  pointsEarned: number
}

export interface RevealedBet {
  id: number
  userId: number
  matchId: number
  betType: string
  pointsEarned: number
  nickname: string
}

export interface LeaderboardEntry {
  position: number
  userId: number
  nickname: string
  totalPoints: number
  previousPosition: number | null
}
