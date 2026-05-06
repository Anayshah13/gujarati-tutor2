'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Spinner from '@/components/Spinner'
import type { SkillScores, SkillKey } from '@/lib/adaptiveEngine'
import { endSession, getGameState, getXPLevel, type GameState } from '@/lib/gamification'
import { withCredentials } from '@/lib/apiClient'

interface LastSession {
  sessionId: string | null
  startLevel: number
  endLevel: number
  skills: SkillScores
  durationSeconds: number
  skillsStart?: SkillScores | null
  xpEarnedSession?: number
  titleLevelStart?: number
}

interface SessionSummary {
  total_questions: number
  correct_answers: number
  accuracy: number
}

const SKILL_COLORS: Record<SkillKey, string> = {
  theory: '#1E88E5',
  pronunciation: '#FF6B00',
  sentence: '#2E7D32',
  translation: '#7B1FA2',
  blanks: '#FF8F00',
}

const SKILL_LABEL: Record<SkillKey, string> = {
  theory: 'Theory',
  pronunciation: 'Pronunciation',
  sentence: 'Sentence',
  translation: 'Translation',
  blanks: 'Fill blanks',
}

const SKILL_ICON: Record<SkillKey, string> = {
  theory: '🎯',
  pronunciation: '🎤',
  sentence: '🧩',
  translation: '🔗',
  blanks: '✏️',
}

const FALLBACK_TIPS: Record<SkillKey, string> = {
  theory:
    "Great work today! Try reading short Gujarati grammar explanations daily — even 5 minutes builds intuition fast.",
  pronunciation:
    "You moved forward today. Practise speaking common words aloud — record yourself and compare to native audio.",
  sentence:
    "Solid session! Build sentence-rebuild flashcards from Band 2 examples to lock in word order.",
  translation:
    "Nice progress. Keep building word-pair flashcards — short daily review beats long sporadic sessions.",
  blanks:
    "Well done. When you miss a blank, write the full corrected sentence by hand — it cements the rule.",
}

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function AnimatedXP({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const duration = 950
    let frame: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <span className="tabular-nums">{display}</span>
}

export default function SummaryPage() {
  const router = useRouter()
  const [last, setLast] = useState<LastSession | null>(null)
  const [serverSession, setServerSession] = useState<SessionSummary | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(true)
  const [gameSnap, setGameSnap] = useState<GameState | null>(null)
  const ranFx = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('gujgyani_lastSession')
    if (!raw) {
      router.replace('/')
      return
    }
    let data: LastSession | null = null
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }
    if (!data) {
      router.replace('/')
      return
    }
    setLast(data)

    if (!ranFx.current && sessionStorage.getItem('gujgyani_finalize_gamification')) {
      ranFx.current = true
      sessionStorage.removeItem('gujgyani_finalize_gamification')
      endSession()
    }
    setGameSnap(getGameState())

    if (data.sessionId) {
      const userId = localStorage.getItem('gujgyani_userId')
      if (userId) {
        fetch(`/api/sessions/all?userId=${userId}`, withCredentials)
          .then((r) => r.json())
          .then((d) => {
            const session = (d?.sessions || []).find(
              (s: { id: string }) => s.id === data!.sessionId
            )
            if (session) setServerSession(session)
          })
          .catch(() => {
            /* ignore */
          })
      }
    }

    const weakest = (Object.entries(data.skills) as [SkillKey, number][]).sort(
      ([, a], [, b]) => a - b
    )[0]?.[0] as SkillKey

    fetch('/api/gemini/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'insight',
        startLevel: data.startLevel,
        endLevel: data.endLevel,
        weakestSkill: weakest,
        accuracy: 0.7,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.text) setInsight(d.text)
        else setInsight(FALLBACK_TIPS[weakest] || FALLBACK_TIPS.theory)
      })
      .catch(() => setInsight(FALLBACK_TIPS[weakest] || FALLBACK_TIPS.theory))
      .finally(() => setInsightLoading(false))
  }, [router])

  const xpMeta = useMemo(() => {
    if (!gameSnap) return null
    return getXPLevel(gameSnap.totalXP)
  }, [gameSnap])

  if (!last || !gameSnap || !xpMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  const totalQ = serverSession?.total_questions ?? 0
  const correct = serverSession?.correct_answers ?? 0
  const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0

  const xpEarned = last.xpEarnedSession ?? 0
  const titleStart = last.titleLevelStart ?? 0
  const titleLeveledUp = xpMeta.level > titleStart

  const skillRows = (Object.keys(last.skills) as SkillKey[]).map((k) => {
    const end = last.skills[k]
    const start = last.skillsStart?.[k] ?? end
    const delta = Math.round(end - start)
    return { key: k, end, delta }
  })

  const streak = gameSnap.streak

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      <nav className="px-6 py-4 border-b border-[#F5E6D0] bg-[#FFF8F0]/90 backdrop-blur-sm">
        <Link href="/" className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2 w-fit">
          <span className="gujarati !text-[1.3rem]">ગ</span>
          <span>Guj-Gyani</span>
        </Link>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="text-5xl mb-2">🎯</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            Session Complete
          </h1>
          <p className="text-[#5D3A1A]">Here’s how you did.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FFB300] p-[1px] shadow-xl"
        >
          <div className="rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FFB300] px-6 py-8 text-center text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-white/90 mb-2">
              XP earned this session
            </div>
            <div className="text-5xl font-extrabold tabular-nums">
              +<AnimatedXP value={xpEarned} /> XP
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card p-6 md:p-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest text-[#8D6E63] font-bold mb-1">
              Knowledge title
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#1A0A00]">
              You are a <span className="text-[#FF6B00]">{xpMeta.label}</span>
            </div>
            {titleLeveledUp && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 font-semibold text-[#2E7D32]"
              >
                🎉 New title unlocked!
              </motion.p>
            )}
          </div>
          <div className="text-sm font-semibold text-[#5D3A1A] shrink-0">
            Next milestone: <span className="text-[#FF6B00]">{xpMeta.nextAt} XP</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="card p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#8D6E63] font-bold mb-1">
                Streak
              </div>
              <div className="text-3xl font-extrabold text-[#FF6B00]">
                🔥 {streak} day streak
              </div>
              {streak >= 3 && (
                <p className="mt-2 text-sm font-semibold text-[#5D3A1A]">
                  Keep it up! Come back tomorrow
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      i < Math.min(streak, 7) ? 'bg-[#FF6B00]' : 'bg-[#F5E6D0]'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card p-6 md:p-8 flex flex-col items-center"
        >
          <div className="text-xs uppercase tracking-widest text-[#8D6E63] font-bold mb-3">
            Level
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-5xl md:text-6xl font-extrabold tabular-nums">
            <span className="text-[#5D3A1A]">{last.startLevel}</span>
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[#FF6B00]"
            >
              →
            </motion.span>
            <span className="text-gradient">{last.endLevel}</span>
          </div>
          <div className="text-[#5D3A1A] font-medium mt-2">
            {last.endLevel > last.startLevel
              ? `+${last.endLevel - last.startLevel} levels gained`
              : last.endLevel === last.startLevel
              ? 'Held your level — keep building those skills!'
              : 'Level adjusted'}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="Questions" value={`${totalQ}`} />
          <Stat label="Correct" value={`${correct}`} accent />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="text-xl font-bold mb-5">Skill summary</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {skillRows.map(({ key, end, delta }) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl border border-[#F5E6D0] bg-white px-4 py-3"
              >
                <span className="text-xl">{SKILL_ICON[key]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#1A0A00]">{SKILL_LABEL[key]}</span>
                    <span className="font-extrabold tabular-nums text-[#1A0A00]">{end}</span>
                  </div>
                  <div
                    className={`text-xs font-bold tabular-nums ${
                      delta > 0 ? 'text-[#2E7D32]' : delta < 0 ? 'text-[#C62828]' : 'text-[#8D6E63]'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : `${delta}`}
                  </div>
                </div>
                <div
                  className="h-10 w-1.5 rounded-full"
                  style={{ background: SKILL_COLORS[key] }}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillRows.map(({ key, end }) => ({
                  name: SKILL_LABEL[key],
                  value: end,
                  key,
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D0" />
                <XAxis dataKey="name" stroke="#5D3A1A" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#5D3A1A" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #F5E6D0',
                    borderRadius: 12,
                  }}
                  cursor={{ fill: '#FFF3E0' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {skillRows.map(({ key }) => (
                    <Cell key={key} fill={SKILL_COLORS[key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 md:p-8 bg-gradient-to-br from-[#FFF3E0] to-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💡</span>
            <h2 className="text-xl font-bold">Coach insight</h2>
          </div>
          {insightLoading ? (
            <div className="flex items-center gap-2 text-[#5D3A1A]">
              <Spinner size={18} />
              <span>Generating personalised tip…</span>
            </div>
          ) : (
            <p className="text-[#1A0A00] leading-relaxed font-medium whitespace-pre-line">
              {insight}
            </p>
          )}
        </div>

        <div className="card p-6 flex justify-between items-center text-sm text-[#5D3A1A]">
          <span>Session duration</span>
          <span className="font-bold tabular-nums text-[#1A0A00]">
            {formatDuration(last.durationSeconds)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/quiz" className="btn-primary flex-1 justify-center">
            Continue Learning →
          </Link>
          <Link href="/" className="btn-secondary flex-1 justify-center">
            Home
          </Link>
        </div>
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="card p-5 text-center">
      <div className="text-xs font-bold uppercase tracking-widest text-[#8D6E63] mb-1">
        {label}
      </div>
      <div
        className={`text-3xl font-extrabold tabular-nums ${
          accent ? 'text-[#FF6B00]' : 'text-[#1A0A00]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
