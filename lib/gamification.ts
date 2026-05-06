export interface GameState {
  xp: number
  totalXP: number
  streak: number
  lastPlayedDate: string
  sessionsCompleted: number
  totalQuestionsAnswered: number
  totalCorrect: number
  xpHistory: { sessionNumber: number; totalXP: number }[]
}

const defaultState: GameState = {
  xp: 0,
  totalXP: 0,
  streak: 0,
  lastPlayedDate: '',
  sessionsCompleted: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  xpHistory: [],
}

function gameStorageKey(): string {
  if (typeof window === 'undefined') return 'gujgyani_game'
  const uid = localStorage.getItem('gujgyani_userId')
  return uid ? `gujgyani_game_${uid}` : 'gujgyani_game'
}

function streakStorageKey(): string {
  if (typeof window === 'undefined') return 'gujgyani_streak'
  const uid = localStorage.getItem('gujgyani_userId')
  return uid ? `gujgyani_streak_${uid}` : 'gujgyani_streak'
}

/** Navbar / landing streak badge (per logged-in user). */
export function readStreakBadge(): number {
  if (typeof window === 'undefined') return 0
  const v = parseInt(localStorage.getItem(streakStorageKey()) || '0', 10)
  return Number.isFinite(v) ? v : 0
}

/** Copy legacy global keys into per-user keys once after login/register */
export function migrateLegacyGamificationToUser(userId: string): void {
  if (typeof window === 'undefined' || !userId) return
  const keyedGame = `gujgyani_game_${userId}`
  const legacyGame = localStorage.getItem('gujgyani_game')
  if (legacyGame && !localStorage.getItem(keyedGame)) {
    localStorage.setItem(keyedGame, legacyGame)
  }
  const keyedStreak = `gujgyani_streak_${userId}`
  const legacyStreak = localStorage.getItem('gujgyani_streak')
  if (legacyStreak != null && localStorage.getItem(keyedStreak) == null) {
    localStorage.setItem(keyedStreak, legacyStreak)
  }
}

export const getGameState = (): GameState => {
  if (typeof window === 'undefined') return defaultState
  const data = localStorage.getItem(gameStorageKey())
  if (!data) return defaultState
  try {
    const parsed = JSON.parse(data) as Partial<GameState>
    return {
      ...defaultState,
      ...parsed,
      xpHistory: Array.isArray(parsed.xpHistory) ? parsed.xpHistory : [],
    }
  } catch {
    return defaultState
  }
}

export const awardXP = (correct: boolean, currentStreak: number): number => {
  if (!correct) return 0
  const bonus =
    currentStreak >= 5 ? 5 : currentStreak >= 3 ? 2 : 0
  return 10 + bonus
}

export const updateStreak = (): number => {
  if (typeof window === 'undefined') return 0
  const state = getGameState()
  const today = new Date().toDateString()
  const last = state.lastPlayedDate

  let newStreak = state.streak

  if (last === today) {
    return newStreak
  }

  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (last === yesterday) {
    newStreak = state.streak + 1
  } else if (last === '') {
    newStreak = 1
  } else {
    newStreak = 1
  }

  saveGameState({
    ...state,
    streak: newStreak,
    lastPlayedDate: today,
  })

  return newStreak
}

export const recordAnswer = (correct: boolean, xpEarned: number): void => {
  if (typeof window === 'undefined') return
  const state = getGameState()
  saveGameState({
    ...state,
    xp: state.xp + xpEarned,
    totalXP: state.totalXP + xpEarned,
    totalQuestionsAnswered: state.totalQuestionsAnswered + 1,
    totalCorrect: correct ? state.totalCorrect + 1 : state.totalCorrect,
  })
}

export const endSession = (): void => {
  if (typeof window === 'undefined') return
  const state = getGameState()
  const nextSessionCount = state.sessionsCompleted + 1
  saveGameState({
    ...state,
    sessionsCompleted: nextSessionCount,
    xpHistory: [
      ...state.xpHistory,
      { sessionNumber: nextSessionCount, totalXP: state.totalXP },
    ],
  })
}

const saveGameState = (state: GameState): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(gameStorageKey(), JSON.stringify(state))
  localStorage.setItem(streakStorageKey(), String(state.streak))
}

export const getXPLevel = (
  totalXP: number
): {
  level: number
  label: string
  nextAt: number
  progress: number
} => {
  const thresholds = [
    0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 5000,
  ]
  const labels = [
    'Newcomer',
    'Curious',
    'Learner',
    'Student',
    'Scholar',
    'Pundit',
    'Vidwan',
    'Gyani',
    'MahaGyani',
    'Guru',
  ]
  let level = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXP >= thresholds[i]) level = i
  }
  const current = thresholds[level]
  const next = thresholds[level + 1] ?? 9999
  const denom = next - current
  const progress =
    denom <= 0
      ? 100
      : Math.round(((totalXP - current) / denom) * 100)
  return {
    level,
    label: labels[level],
    nextAt: next,
    progress: Math.min(100, Math.max(0, progress)),
  }
}
