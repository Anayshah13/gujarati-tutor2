export interface TheoryQuestion {
  id: string
  level: number
  type: 'theory'
  question: string
  gujaratiText: string
  options: [string, string, string, string]
  answer: string
  explanation: string
}

export interface PronunciationQuestion {
  id: string
  level: number
  type: 'pronunciation'
  question: string
  gujaratiText: string
  targetRomanized: string
  explanation: string
}

export interface SentenceQuestion {
  id: string
  level: number
  type: 'sentence'
  question: string
  gujaratiText: string
  spokenText: string
  wordBlocks: string[]
  correctOrder: string[]
  explanation: string
}

export interface TranslationPair {
  english: string
  gujarati: string
}

export interface TranslationQuestion {
  id: string
  level: number
  type: 'translation'
  question: string
  pairs: TranslationPair[]
  explanation: string
}

export interface BlanksQuestion {
  id: string
  level: number
  type: 'blanks'
  question: string
  sentenceWithBlank: string
  gujaratiText: string
  answer: string
  hints: string[]
  explanation: string
}

export type Question =
  | TheoryQuestion
  | PronunciationQuestion
  | SentenceQuestion
  | TranslationQuestion
  | BlanksQuestion

export type QuestionType = Question['type']
