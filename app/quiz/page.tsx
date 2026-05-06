'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

import Spinner from '@/components/Spinner'
import SpeakButton from '@/components/SpeakButton'
import ProgressBar from '@/components/ProgressBar'
import LevelDisplay from '@/components/LevelDisplay'
import SkillBars from '@/components/SkillBars'
import QuestionCard from '@/components/QuestionCard'
import WordBlocks from '@/components/WordBlocks'
import MatchColumns from '@/components/MatchColumns'
import { useToast } from '@/components/Toast'

import {
  applyLevelUp,
  checkLevelUp,
  getNextQuestionType,
  getScriptFade,
  initLevelState,
  processAnswer,
  type LevelState,
  type SkillKey,
} from '@/lib/adaptiveEngine'
import { scorePronunciation, stopSpeaking } from '@/lib/speech'
import {
  getQuestionByLevelAndType,
  getRandomFallbackQuestion,
} from '@/data/questions'
import type {
  BlanksQuestion,
  PronunciationQuestion,
  Question,
  SentenceQuestion,
  TheoryQuestion,
  TranslationQuestion,
} from '@/data/types'

interface UserData {
  id: string
  name: string
  pretest_done: number
  current_level: number
  skill_theory: number
  skill_pronunciation: number
  skill_sentence: number
  skill_translation: number
  skill_blanks: number
}

const QUESTION_TYPES: SkillKey[] = [
  'theory',
  'pronunciation',
  'sentence',
  'translation',
  'blanks',
]

export default function QuizPage() {
  const router = useRouter()
  const { show } = useToast()

  const [user, setUser] = useState<UserData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionStartTime = useRef<number>(Date.now())
  const startLevel = useRef<number>(1)

  const [levelState, setLevelState] = useState<LevelState | null>(null)
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [scoreDelta, setScoreDelta] = useState<number | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [showEnglish, setShowEnglish] = useState(true)
  const [endingSession, setEndingSession] = useState(false)

  const askedTypesThisLevel = useRef<SkillKey[]>([])
  const usedQuestionIds = useRef<string[]>([])

  // ---- Bootstrap ----
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = localStorage.getItem('gujgyani_userId')
    if (!id) {
      router.replace('/onboard')
      return
    }
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((u: UserData) => {
        if (!u || !u.id) {
          router.replace('/onboard')
          return
        }
        if (!u.pretest_done) {
          router.replace('/pretest')
          return
        }
        setUser(u)
        const startingLevel = Math.max(1, u.current_level || 1)
        startLevel.current = startingLevel
        const initialState = initLevelState(startingLevel)
        initialState.skills = {
          theory: u.skill_theory ?? 50,
          pronunciation: u.skill_pronunciation ?? 50,
          sentence: u.skill_sentence ?? 50,
          translation: u.skill_translation ?? 50,
          blanks: u.skill_blanks ?? 50,
        }
        setLevelState(initialState)

        fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id, startLevel: startingLevel }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.sessionId) setSessionId(d.sessionId)
          })
          .catch(() => {
            // session is optional for the UI to work
          })

        // load first question
        const type = QUESTION_TYPES[0]
        askedTypesThisLevel.current = [type]
        const q =
          getQuestionByLevelAndType(startingLevel, type) ||
          getRandomFallbackQuestion(startingLevel, type)
        if (q) {
          usedQuestionIds.current = [q.id]
          setCurrentQ(q)
        }
      })
      .catch(() => router.replace('/onboard'))
  }, [router])

  // ---- Persist skills/level on change (debounced via stable ref) ----
  const persistUserState = useCallback(
    (state: LevelState) => {
      if (!user) return
      fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLevel: state.currentLevel,
          skill_theory: state.skills.theory,
          skill_pronunciation: state.skills.pronunciation,
          skill_sentence: state.skills.sentence,
          skill_translation: state.skills.translation,
          skill_blanks: state.skills.blanks,
        }),
      }).catch(() => {
        /* ignore */
      })
    },
    [user]
  )

  // ---- Answer resolution ----
  const handleAnswerResolved = useCallback(
    async (correct: boolean) => {
      if (!levelState || !currentQ || !user) return

      const prevState = levelState
      const newState = processAnswer(prevState, currentQ.type, correct)
      const skillBefore = prevState.skills[currentQ.type]
      const skillAfter = newState.skills[currentQ.type]

      // Fire-and-forget DB log
      if (sessionId) {
        fetch('/api/sessions/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: user.id,
            questionId: currentQ.id,
            questionType: currentQ.type,
            levelNumber: prevState.currentLevel,
            correct,
            scoreBefore: prevState.score,
            scoreAfter: newState.score,
            skillScoreBefore: skillBefore,
            skillScoreAfter: skillAfter,
          }),
        }).catch(() => {
          /* ignore */
        })
      }

      setScoreDelta(correct ? +10 : -5)
      setTimeout(() => setScoreDelta(null), 800)

      // Detect rescue mode just activated
      if (!prevState.skillRescueMode && newState.skillRescueMode) {
        show(
          `Skill alert! Focusing on ${newState.rescueSkill} until it improves.`,
          'warning'
        )
      }

      // Check level up
      if (checkLevelUp(newState)) {
        const leveled = applyLevelUp(newState)
        setLevelState(leveled)
        triggerLevelUp(leveled.currentLevel)
        askedTypesThisLevel.current = []
        persistUserState(leveled)
        // After 2s, load next question for new level
        setTimeout(() => {
          loadNextQuestion(leveled)
        }, 2200)
      } else {
        setLevelState(newState)
        persistUserState(newState)
        loadNextQuestion(newState)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [levelState, currentQ, user, sessionId]
  )

  const triggerLevelUp = (newLevel: number) => {
    setShowLevelUp(true)
    setTimeout(() => {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B00', '#FFB300', '#FF8F00', '#E65100'],
        })
      } catch {
        /* canvas-confetti can fail silently in SSR-like edge cases */
      }
    }, 100)
    setTimeout(() => setShowLevelUp(false), 2000)
    void newLevel
  }

  const loadNextQuestion = async (state: LevelState) => {
    setLoadingNext(true)
    setQuestionNumber((n) => n + 1)
    const nextType = getNextQuestionType(state, askedTypesThisLevel.current)
    askedTypesThisLevel.current = [...askedTypesThisLevel.current, nextType]

    let q: Question | undefined | null = null

    if (!state.hardcodedDone) {
      q = getQuestionByLevelAndType(state.currentLevel, nextType)
      if (q && usedQuestionIds.current.includes(q.id)) {
        q = getRandomFallbackQuestion(state.currentLevel, nextType, usedQuestionIds.current)
      }
    } else {
      // Try Gemini first; fallback to hardcoded fallback
      try {
        const res = await fetch('/api/gemini/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: state.currentLevel,
            type: nextType,
            previousIds: usedQuestionIds.current,
          }),
        })
        const data = await res.json()
        if (data?.question) {
          q = data.question as Question
        }
      } catch {
        /* fall through */
      }
      if (!q) {
        q = getRandomFallbackQuestion(state.currentLevel, nextType, usedQuestionIds.current)
      }
    }

    if (!q) {
      // Last resort
      q = getQuestionByLevelAndType(state.currentLevel, nextType)
    }

    if (q) {
      usedQuestionIds.current = [...usedQuestionIds.current, q.id]
      setCurrentQ(q)
    }
    setLoadingNext(false)
  }

  const endSession = async () => {
    if (!user || !levelState) return
    setEndingSession(true)
    stopSpeaking()
    const duration = Math.round((Date.now() - sessionStartTime.current) / 1000)

    if (sessionId) {
      try {
        await fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            endLevel: levelState.currentLevel,
            durationSeconds: duration,
          }),
        })
      } catch {
        /* ignore */
      }
    }

    persistUserState(levelState)

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'gujgyani_lastSession',
        JSON.stringify({
          sessionId,
          startLevel: startLevel.current,
          endLevel: levelState.currentLevel,
          skills: levelState.skills,
          durationSeconds: duration,
        })
      )
    }

    router.push('/summary')
  }

  if (!user || !levelState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  const fade = getScriptFade(levelState.currentLevel)

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FFF8F0]/85 border-b border-[#F5E6D0]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="font-extrabold text-lg text-[#FF6B00] flex items-center gap-2"
          >
            <span className="gujarati !text-[1.2rem]">ગ</span>
            <span className="hidden sm:inline">Guj-Gyani</span>
          </Link>

          <div className="flex items-center gap-4 md:gap-8">
            <LevelDisplay level={levelState.currentLevel} scoreDelta={scoreDelta} />
            <div className="hidden sm:block w-32 md:w-48">
              <div className="text-[10px] uppercase tracking-widest text-[#8D6E63] font-semibold mb-1">
                Score · {levelState.score}/50+
              </div>
              <ProgressBar
                value={levelState.score}
                max={60}
                color="#FF6B00"
                height={8}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fade.showEnglishToggle && (
              <button
                onClick={() => setShowEnglish((s) => !s)}
                className="text-xs font-semibold text-[#5D3A1A] hover:text-[#FF6B00] px-2 py-1 rounded"
              >
                {showEnglish ? 'Hide English' : 'Show English'}
              </button>
            )}
            <button
              onClick={endSession}
              disabled={endingSession}
              className="btn-primary !py-2 !px-3 text-sm"
            >
              {endingSession ? '…' : 'End Session'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            {loadingNext ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-10 max-w-2xl mx-auto flex flex-col items-center gap-4"
              >
                <Spinner size={40} />
                <p className="text-[#5D3A1A] font-medium">Loading next question…</p>
              </motion.div>
            ) : currentQ ? (
              <ActiveQuestion
                key={currentQ.id + '_' + questionNumber}
                question={currentQ}
                questionNumber={questionNumber}
                onAnswered={handleAnswerResolved}
                fadeEnglishOpacity={
                  fade.showEnglishToggle && !showEnglish ? 0 : fade.englishOpacity
                }
              />
            ) : (
              <div className="card p-10 max-w-2xl mx-auto text-center">
                <p className="text-[#5D3A1A] font-medium">No question available.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SkillBars
            skills={levelState.skills}
            rescueSkill={levelState.rescueSkill}
          />
          <div className="card p-4 text-xs text-[#5D3A1A]">
            <div className="font-bold uppercase tracking-wider mb-2 text-[#8D6E63]">
              How scoring works
            </div>
            <ul className="space-y-1">
              <li>+10 score &amp; +5 skill on correct</li>
              <li>−5 score &amp; −3 skill on wrong</li>
              <li>Level up requires score &gt; 50, avg skill &gt; 40</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* LEVEL-UP OVERLAY */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="card p-8 md:p-10 text-center max-w-md"
            >
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-2xl font-extrabold mb-1">Level Up!</div>
              <div className="text-[#5D3A1A]">
                You’re now at <span className="text-[#FF6B00] font-bold">Level {levelState.currentLevel}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==============================================================
// ACTIVE QUESTION — switches by question type
// ==============================================================

interface ActiveQuestionProps {
  question: Question
  questionNumber: number
  onAnswered: (correct: boolean) => void
  fadeEnglishOpacity: number
}

function ActiveQuestion({
  question,
  questionNumber,
  onAnswered,
  fadeEnglishOpacity,
}: ActiveQuestionProps) {
  switch (question.type) {
    case 'theory':
      return (
        <TheoryView
          q={question}
          number={questionNumber}
          onAnswered={onAnswered}
          fadeOpacity={fadeEnglishOpacity}
        />
      )
    case 'pronunciation':
      return (
        <PronunciationView
          q={question}
          number={questionNumber}
          onAnswered={onAnswered}
          fadeOpacity={fadeEnglishOpacity}
        />
      )
    case 'sentence':
      return (
        <SentenceView
          q={question}
          number={questionNumber}
          onAnswered={onAnswered}
          fadeOpacity={fadeEnglishOpacity}
        />
      )
    case 'translation':
      return (
        <TranslationView
          q={question}
          number={questionNumber}
          onAnswered={onAnswered}
          fadeOpacity={fadeEnglishOpacity}
        />
      )
    case 'blanks':
      return (
        <BlanksView
          q={question}
          number={questionNumber}
          onAnswered={onAnswered}
          fadeOpacity={fadeEnglishOpacity}
        />
      )
    default:
      return null
  }
}

// ---------- THEORY ----------
function TheoryView({
  q,
  number,
  onAnswered,
  fadeOpacity,
}: {
  q: TheoryQuestion
  number: number
  onAnswered: (c: boolean) => void
  fadeOpacity: number
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [committed, setCommitted] = useState(false)

  const handlePick = (opt: string) => {
    if (picked) return
    setPicked(opt)
  }

  const handleNext = () => {
    if (!picked || committed) return
    setCommitted(true)
    onAnswered(picked === q.answer)
  }

  return (
    <QuestionCard questionType="theory" questionNumber={number}>
      <p
        className="text-lg md:text-xl font-semibold fade-script mb-4"
        style={{ opacity: fadeOpacity }}
      >
        {q.question}
      </p>
      <div className="flex items-center gap-3 mb-6">
        <SpeakButton text={q.gujaratiText} lang="gu" size="sm" />
        <span className="gujarati text-[#1A0A00]">{q.gujaratiText}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((opt) => {
          const isPicked = picked === opt
          const isCorrect = opt === q.answer
          const showCorrect = picked && isCorrect
          const showWrong = isPicked && !isCorrect
          return (
            <motion.button
              key={opt}
              whileHover={!picked ? { scale: 1.02 } : undefined}
              whileTap={!picked ? { scale: 0.97 } : undefined}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className={`px-4 py-3 rounded-xl border-2 font-semibold text-left transition-colors ${
                showCorrect
                  ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
                  : showWrong
                  ? 'border-[#C62828] bg-[#FFEBEE] text-[#B71C1C]'
                  : 'border-[#F5E6D0] bg-white hover:border-[#FF6B00]'
              }`}
            >
              {opt}
              {showCorrect && ' ✓'}
              {showWrong && ' ✕'}
            </motion.button>
          )
        })}
      </div>

      {picked && (
        <Explanation
          correct={picked === q.answer}
          text={q.explanation}
          onNext={handleNext}
          disabled={committed}
        />
      )}
    </QuestionCard>
  )
}

// ---------- PRONUNCIATION ----------
function PronunciationView({
  q,
  number,
  onAnswered,
  fadeOpacity,
}: {
  q: PronunciationQuestion
  number: number
  onAnswered: (c: boolean) => void
  fadeOpacity: number
}) {
  const [input, setInput] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [retries, setRetries] = useState(0)
  const [committed, setCommitted] = useState(false)
  const [almost, setAlmost] = useState(false)

  const handleCheck = () => {
    if (committed) return
    const s = scorePronunciation(q.targetRomanized, input)
    setScore(s)
    if (s >= 0.75) {
      setAlmost(false)
    } else if (s >= 0.5 && retries === 0) {
      setAlmost(true)
      setScore(null)
      setRetries(1)
      return
    } else {
      setAlmost(false)
    }
  }

  const handleNext = () => {
    if (committed || score === null) return
    setCommitted(true)
    onAnswered(score >= 0.75)
  }

  const showAnswer = score !== null

  return (
    <QuestionCard questionType="pronunciation" questionNumber={number}>
      <p
        className="text-lg md:text-xl font-semibold fade-script mb-5"
        style={{ opacity: fadeOpacity }}
      >
        {q.question}
      </p>

      <div className="flex flex-col items-center gap-4 mb-6">
        <SpeakButton
          text={q.gujaratiText}
          lang="gu"
          size="lg"
          autoPlay
          label="Tap to hear again"
        />
        <div
          className={`gujarati text-4xl text-[#1A0A00] transition-all ${
            !showAnswer ? 'blur-md select-none' : ''
          }`}
        >
          {q.gujaratiText}
        </div>
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !committed && handleCheck()}
        disabled={committed}
        placeholder="Type what you hear (in English letters)…"
        className="w-full px-4 py-3 rounded-xl border-2 border-[#F5E6D0] focus:border-[#FF6B00] outline-none text-lg font-semibold transition-colors bg-[#FFF8F0]"
      />

      {almost && (
        <p className="mt-2 text-sm font-semibold text-[#FF8F00]">
          Almost! Listen again and try once more.
        </p>
      )}

      {score === null ? (
        <button
          onClick={handleCheck}
          disabled={!input.trim()}
          className="btn-primary w-full mt-5"
        >
          Check
        </button>
      ) : (
        <Explanation
          correct={score >= 0.75}
          text={`${q.explanation} (Match score: ${Math.round(score * 100)}%)`}
          onNext={handleNext}
          disabled={committed}
        />
      )}
    </QuestionCard>
  )
}

// ---------- SENTENCE ----------
function SentenceView({
  q,
  number,
  onAnswered,
  fadeOpacity,
}: {
  q: SentenceQuestion
  number: number
  onAnswered: (c: boolean) => void
  fadeOpacity: number
}) {
  const [arrangement, setArrangement] = useState<string[]>([])
  const [committed, setCommitted] = useState(false)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  const handleCheck = () => {
    if (result || committed) return
    if (arrangement.length !== q.correctOrder.length) return
    const ok =
      arrangement.length === q.correctOrder.length &&
      arrangement.every((w, i) => w === q.correctOrder[i])
    setResult(ok ? 'correct' : 'wrong')
  }

  const handleNext = () => {
    if (committed || !result) return
    setCommitted(true)
    onAnswered(result === 'correct')
  }

  return (
    <QuestionCard questionType="sentence" questionNumber={number}>
      <p
        className="text-lg md:text-xl font-semibold fade-script mb-4"
        style={{ opacity: fadeOpacity }}
      >
        {q.question}
      </p>
      <div className="mb-6">
        <SpeakButton
          text={q.spokenText}
          lang="gu"
          size="md"
          autoPlay
          label="Tap to hear again"
        />
      </div>

      <WordBlocks
        words={q.wordBlocks}
        onChange={setArrangement}
        disabled={!!result}
        highlight={result}
      />

      {result ? (
        <>
          <div className="mt-5 px-4 py-3 rounded-xl bg-[#FFF3E0] border border-[#F5E6D0]">
            <div className="text-xs uppercase font-bold text-[#8D6E63] tracking-wider mb-1">
              Correct sentence
            </div>
            <div className="gujarati text-2xl text-[#1A0A00]">
              {q.gujaratiText}
            </div>
          </div>
          <Explanation
            correct={result === 'correct'}
            text={q.explanation}
            onNext={handleNext}
            disabled={committed}
          />
        </>
      ) : (
        <button
          onClick={handleCheck}
          disabled={arrangement.length !== q.correctOrder.length}
          className="btn-primary w-full mt-5"
        >
          Check Order
        </button>
      )}
    </QuestionCard>
  )
}

// ---------- TRANSLATION ----------
function TranslationView({
  q,
  number,
  onAnswered,
  fadeOpacity,
}: {
  q: TranslationQuestion
  number: number
  onAnswered: (c: boolean) => void
  fadeOpacity: number
}) {
  const [completed, setCompleted] = useState(false)
  const [committed, setCommitted] = useState(false)

  const handleNext = () => {
    if (committed) return
    setCommitted(true)
    onAnswered(true)
  }

  return (
    <QuestionCard questionType="translation" questionNumber={number}>
      <p
        className="text-lg md:text-xl font-semibold fade-script mb-5"
        style={{ opacity: fadeOpacity }}
      >
        {q.question}
      </p>

      <MatchColumns
        pairs={q.pairs}
        onComplete={(ok) => setCompleted(ok)}
        disabled={committed}
      />

      {completed && (
        <Explanation
          correct
          text={q.explanation}
          onNext={handleNext}
          disabled={committed}
        />
      )}
    </QuestionCard>
  )
}

// ---------- BLANKS ----------
function BlanksView({
  q,
  number,
  onAnswered,
  fadeOpacity,
}: {
  q: BlanksQuestion
  number: number
  onAnswered: (c: boolean) => void
  fadeOpacity: number
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [committed, setCommitted] = useState(false)

  const choices = useMemo(() => {
    const all = [q.answer, ...q.hints]
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id])

  const handlePick = (opt: string) => {
    if (picked) return
    setPicked(opt)
  }

  const handleNext = () => {
    if (!picked || committed) return
    setCommitted(true)
    onAnswered(picked === q.answer)
  }

  return (
    <QuestionCard questionType="blanks" questionNumber={number}>
      <p
        className="text-base md:text-lg font-semibold fade-script mb-4"
        style={{ opacity: fadeOpacity }}
      >
        {q.question}
      </p>
      <div className="bg-[#FFF3E0] rounded-xl p-5 mb-3 flex items-center gap-3">
        <SpeakButton text={q.gujaratiText} lang="gu" size="sm" />
        <div className="gujarati text-2xl md:text-3xl text-[#1A0A00] flex-1">
          {q.sentenceWithBlank}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {choices.map((opt) => {
          const isPicked = picked === opt
          const isCorrect = opt === q.answer
          const showCorrect = picked && isCorrect
          const showWrong = isPicked && !isCorrect
          return (
            <motion.button
              key={opt}
              whileHover={!picked ? { scale: 1.02 } : undefined}
              whileTap={!picked ? { scale: 0.97 } : undefined}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className={`gujarati px-4 py-3 rounded-xl border-2 font-semibold text-center transition-colors ${
                showCorrect
                  ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
                  : showWrong
                  ? 'border-[#C62828] bg-[#FFEBEE] text-[#B71C1C]'
                  : 'border-[#F5E6D0] bg-white hover:border-[#FF6B00]'
              }`}
            >
              {opt}
              {showCorrect && ' ✓'}
              {showWrong && ' ✕'}
            </motion.button>
          )
        })}
      </div>

      {picked && (
        <Explanation
          correct={picked === q.answer}
          text={q.explanation}
          onNext={handleNext}
          disabled={committed}
        />
      )}
    </QuestionCard>
  )
}

// ---------- EXPLANATION + NEXT ----------
function Explanation({
  correct,
  text,
  onNext,
  disabled,
}: {
  correct: boolean
  text: string
  onNext: () => void
  disabled: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      <div
        className={`px-4 py-3 rounded-xl border-2 ${
          correct
            ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
            : 'border-[#C62828] bg-[#FFEBEE] text-[#B71C1C]'
        }`}
      >
        <div className="text-xs uppercase font-bold tracking-wider mb-1">
          {correct ? 'Correct' : 'Not quite'}
        </div>
        <p className="text-sm font-medium">{text}</p>
      </div>
      <button onClick={onNext} disabled={disabled} className="btn-primary w-full mt-4">
        Next →
      </button>
    </motion.div>
  )
}
