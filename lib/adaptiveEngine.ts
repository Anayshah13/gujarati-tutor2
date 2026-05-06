export interface SkillScores {
  theory: number
  pronunciation: number
  sentence: number
  translation: number
  blanks: number
}

export type SkillKey = keyof SkillScores

export interface LevelState {
  currentLevel: number
  score: number
  skills: SkillScores
  questionsAnsweredThisLevel: number
  hardcodedDone: boolean
  skillRescueMode: boolean
  rescueSkill: SkillKey | null
}

export const ALL_SKILLS: SkillKey[] = [
  'theory',
  'pronunciation',
  'sentence',
  'translation',
  'blanks',
]

export const initLevelState = (startingLevel: number): LevelState => ({
  currentLevel: startingLevel,
  score: 0,
  skills: {
    theory: 50,
    pronunciation: 50,
    sentence: 50,
    translation: 50,
    blanks: 50,
  },
  questionsAnsweredThisLevel: 0,
  hardcodedDone: false,
  skillRescueMode: false,
  rescueSkill: null,
})

const checkRescueNeeded = (skills: SkillScores): SkillKey | null => {
  const entries = Object.entries(skills) as [SkillKey, number][]
  const failing = entries.find(([, v]) => v < 30)
  return failing ? failing[0] : null
}

export const processAnswer = (
  state: LevelState,
  questionType: SkillKey,
  correct: boolean
): LevelState => {
  const next = structuredClone(state)

  if (correct) {
    next.score = Math.min(next.score + 10, 200)
    next.skills[questionType] = Math.min(next.skills[questionType] + 5, 100)
  } else {
    next.score = Math.max(next.score - 5, 0)
    next.skills[questionType] = Math.max(next.skills[questionType] - 3, 0)
  }

  next.questionsAnsweredThisLevel++

  if (next.questionsAnsweredThisLevel >= 5) {
    next.hardcodedDone = true
  }

  const rescueSkill = checkRescueNeeded(next.skills)
  next.skillRescueMode = rescueSkill !== null
  next.rescueSkill = rescueSkill

  return next
}

export const checkLevelUp = (state: LevelState): boolean => {
  if (state.score <= 50) return false
  const skillValues = Object.values(state.skills)
  const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length
  const minSkill = Math.min(...skillValues)
  return avg > 40 && minSkill >= 30
}

export const applyLevelUp = (state: LevelState): LevelState => {
  const next = structuredClone(state)
  next.currentLevel = Math.min(next.currentLevel + 1, 40)
  next.score = 0
  next.questionsAnsweredThisLevel = 0
  next.hardcodedDone = false
  next.skillRescueMode = false
  next.rescueSkill = null
  return next
}

export const getNextQuestionType = (
  state: LevelState,
  askedTypesThisLevel: SkillKey[]
): SkillKey => {
  if (state.skillRescueMode && state.rescueSkill) {
    return state.rescueSkill
  }
  const unanswered = ALL_SKILLS.filter((t) => !askedTypesThisLevel.includes(t))
  if (unanswered.length > 0) return unanswered[0]
  return (Object.entries(state.skills).sort(([, a], [, b]) => a - b)[0][0]) as SkillKey
}

export const getAverageSkill = (skills: SkillScores): number => {
  const vals = Object.values(skills)
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export const calculatePretestLevel = (
  mode: 'easy' | 'medium' | 'hard',
  score: number
): number => {
  if (mode === 'easy') return Math.max(1, score)
  if (mode === 'medium') return 10 + score
  return 20 + score
}

export const getBand = (level: number): { num: number; label: string; color: string } => {
  if (level <= 10) return { num: 1, label: 'Beginner', color: '#FFB300' }
  if (level <= 20) return { num: 2, label: 'Elementary', color: '#FF8F00' }
  if (level <= 30) return { num: 3, label: 'Intermediate', color: '#FF6B00' }
  return { num: 4, label: 'Advanced', color: '#E65100' }
}

export interface ScriptFade {
  englishOpacity: number
  gujaratiOpacity: number
  gujaratiSize: string
  showEnglishToggle: boolean
}

export const getScriptFade = (level: number): ScriptFade => {
  if (level <= 10) {
    return {
      englishOpacity: 1,
      gujaratiOpacity: 0.6,
      gujaratiSize: '20px',
      showEnglishToggle: false,
    }
  }
  if (level <= 20) {
    return {
      englishOpacity: 0.8,
      gujaratiOpacity: 0.8,
      gujaratiSize: '24px',
      showEnglishToggle: false,
    }
  }
  if (level <= 30) {
    return {
      englishOpacity: 0.6,
      gujaratiOpacity: 1,
      gujaratiSize: '28px',
      showEnglishToggle: false,
    }
  }
  return {
    englishOpacity: 0,
    gujaratiOpacity: 1,
    gujaratiSize: '32px',
    showEnglishToggle: true,
  }
}
