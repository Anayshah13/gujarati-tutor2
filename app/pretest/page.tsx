'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/Spinner'
import SpeakButton from '@/components/SpeakButton'
import ProgressBar from '@/components/ProgressBar'
import { easyPretest, mediumPretest, hardPretest } from '@/data/pretest'
import { calculatePretestLevel } from '@/lib/adaptiveEngine'
import type { TheoryQuestion } from '@/data/types'

type Mode = 'easy' | 'medium' | 'hard'

interface ModeCard {
  id: Mode
  title: string
  desc: string
  range: string
  color: string
}

const MODES: ModeCard[] = [
  {
    id: 'easy',
    title: 'Easy',
    desc: 'I know basic Gujarati greetings.',
    range: 'Levels 1 – 10',
    color: '#FFB300',
  },
  {
    id: 'medium',
    title: 'Medium',
    desc: 'I know some grammar and sentences.',
    range: 'Levels 10 – 20',
    color: '#FF8F00',
  },
  {
    id: 'hard',
    title: 'Hard',
    desc: 'I’m comfortable with Gujarati sentences.',
    range: 'Levels 20 – 30',
    color: '#FF6B00',
  },
]

export default function PretestPage() {
  const router = useRouter()
  const [bootstrapping, setBootstrapping] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [pickedOption, setPickedOption] = useState<string | null>(null)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [resultLevel, setResultLevel] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = localStorage.getItem('gujgyani_userId')
    if (!id) {
      router.replace('/onboard')
      return
    }
    setUserId(id)
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((u) => {
        if (u?.pretest_done) {
          router.replace('/quiz')
          return
        }
        setBootstrapping(false)
      })
      .catch(() => setBootstrapping(false))
  }, [router])

  const questions: TheoryQuestion[] = useMemo(() => {
    if (mode === 'easy') return easyPretest
    if (mode === 'medium') return mediumPretest
    if (mode === 'hard') return hardPretest
    return []
  }, [mode])

  const handlePick = (opt: string) => {
    if (pickedOption) return
    setPickedOption(opt)
    const correct = opt === questions[currentQ].answer
    if (correct) setScore((s) => s + 1)
    setFlash(correct ? 'correct' : 'wrong')
    setTimeout(() => {
      setFlash(null)
      setPickedOption(null)
      if (currentQ + 1 >= questions.length) {
        finishPretest()
      } else {
        setCurrentQ((c) => c + 1)
      }
    }, 600)
  }

  const finishPretest = async () => {
    if (!userId || !mode) return
    setCalculating(true)
    const finalScore = score + (pickedOption === questions[currentQ].answer ? 1 : 0)
    const level = calculatePretestLevel(mode, finalScore)
    await new Promise((r) => setTimeout(r, 1500))
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLevel: level,
          pretest_done: 1,
          pretest_mode: mode,
        }),
      })
    } catch {
      // continue regardless
    }
    setResultLevel(level)
    setCalculating(false)
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  if (resultLevel !== null) {
    return <ResultCard level={resultLevel} mode={mode!} score={score} total={questions.length} />
  }

  if (calculating) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Spinner size={48} />
        <p className="text-[#5D3A1A] font-semibold animate-pulse">
          Placing you at the right level…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 border-b border-[#F5E6D0]">
        <Link href="/" className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2 w-fit">
          <span className="gujarati !text-[1.3rem]">ગ</span>
          <span>Guj-Gyani</span>
        </Link>
      </nav>

      <div className="flex-1 p-6 flex items-center justify-center">
        {!mode ? (
          <ModePicker onPick={setMode} />
        ) : (
          <PretestQuestion
            mode={mode}
            question={questions[currentQ]}
            currentQ={currentQ}
            total={questions.length}
            pickedOption={pickedOption}
            flash={flash}
            onPick={handlePick}
          />
        )}
      </div>
    </div>
  )
}

function ModePicker({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          Where are you starting from?
        </h1>
        <p className="text-[#5D3A1A] text-lg">
          Pick the option that fits — we’ll fine-tune from there.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {MODES.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(m.id)}
            className="card p-6 text-left flex flex-col gap-3"
            style={{ borderTop: `5px solid ${m.color}` }}
          >
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: m.color }}
            >
              {m.range}
            </div>
            <div className="text-2xl font-extrabold">{m.title}</div>
            <p className="text-[#5D3A1A]">{m.desc}</p>
            <span className="mt-auto pt-2 text-[#FF6B00] font-semibold">
              Pick this →
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function PretestQuestion({
  mode,
  question,
  currentQ,
  total,
  pickedOption,
  flash,
  onPick,
}: {
  mode: Mode
  question: TheoryQuestion
  currentQ: number
  total: number
  pickedOption: string | null
  flash: 'correct' | 'wrong' | null
  onPick: (opt: string) => void
}) {
  return (
    <motion.div
      key={currentQ}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className="text-[#FF6B00] uppercase tracking-wider">
          {mode} pretest
        </span>
        <span className="text-[#5D3A1A]">
          Question {currentQ + 1} of {total}
        </span>
      </div>
      <ProgressBar value={currentQ + 1} max={total} />
      <div className={`card p-6 md:p-8 mt-5 transition-all ${
        flash === 'correct' ? 'border-[#2E7D32] bg-[#E8F5E9]'
        : flash === 'wrong' ? 'border-[#C62828] bg-[#FFEBEE]'
        : ''
      }`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-xl md:text-2xl font-bold flex-1">
            {question.question}
          </h2>
          <SpeakButton text={question.gujaratiText} lang="gu" size="sm" />
        </div>
        {question.gujaratiText && (
          <div className="gujarati text-3xl text-[#1A0A00] mb-6">
            {question.gujaratiText}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {question.options.map((opt) => {
            const isPicked = pickedOption === opt
            const isCorrect = opt === question.answer
            const showCorrect = pickedOption && isCorrect
            const showWrong = isPicked && !isCorrect
            return (
              <motion.button
                key={opt}
                whileHover={!pickedOption ? { scale: 1.03 } : undefined}
                whileTap={!pickedOption ? { scale: 0.97 } : undefined}
                onClick={() => onPick(opt)}
                disabled={!!pickedOption}
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
      </div>
    </motion.div>
  )
}

function ResultCard({
  level,
  mode,
  score,
  total,
}: {
  level: number
  mode: Mode
  score: number
  total: number
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 border-b border-[#F5E6D0]">
        <Link href="/" className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2 w-fit">
          <span className="gujarati !text-[1.3rem]">ગ</span>
          <span>Guj-Gyani</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="card p-8 md:p-10 w-full max-w-md text-center"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-[#8D6E63] mb-2">
            Your Level
          </div>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
            className="text-7xl font-extrabold text-gradient mb-2 leading-none"
          >
            {level}
          </motion.div>
          <div className="text-[#5D3A1A] mb-6 font-medium capitalize">
            {mode} mode · {score}/{total} correct
          </div>
          <div className="bg-[#FFF3E0] rounded-xl p-4 mb-6">
            <div className="text-xs uppercase font-bold text-[#5D3A1A] mb-2 tracking-wider">
              Level meter
            </div>
            <div className="relative h-3 rounded-full bg-white overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(level / 40) * 100}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, #FFB300 0%, #FF8F00 33%, #FF6B00 66%, #E65100 100%)',
                }}
              />
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `calc(${(level / 40) * 100}% - 6px)` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#1A0A00] shadow"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-semibold text-[#8D6E63]">
              <span>L1</span>
              <span>L40</span>
            </div>
          </div>
          <Link href="/quiz" className="btn-primary w-full text-base">
            Start Learning →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
