'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

interface SessionRow {
  id: string
  user_id: string
  created_at: string
  ended_at: string | null
  start_level: number
  end_level: number | null
  total_questions: number
  correct_answers: number
  accuracy: number
  duration_seconds: number
  status: string
}

const formatDate = (s: string) => {
  if (!s) return '—'
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z')
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

const formatDuration = (sec: number) => {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

export default function AdminPage() {
  const { show } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasUser, setHasUser] = useState(true)

  const load = (id: string) => {
    setLoading(true)
    fetch(`/api/sessions/all?userId=${id}`)
      .then((r) => r.json())
      .then((d) => setSessions(d?.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = localStorage.getItem('gujgyani_userId')
    if (!id) {
      setHasUser(false)
      setLoading(false)
      return
    }
    setUserId(id)
    load(id)
  }, [])

  const totalSessions = sessions.length
  const totalQuestions = sessions.reduce((a, s) => a + (s.total_questions || 0), 0)
  const bestLevel = sessions.reduce(
    (m, s) => Math.max(m, s.end_level || s.start_level),
    0
  )
  const avgAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
          (sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length) *
            100
        )

  const chartData = sessions
    .slice()
    .reverse()
    .map((s, i) => ({
      n: i + 1,
      level: s.end_level ?? s.start_level,
    }))

  const handleClear = async () => {
    if (!userId) return
    const confirmed = window.confirm(
      'This will delete your account, all sessions, and clear local data. Continue?'
    )
    if (!confirmed) return
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    } catch {
      /* ignore */
    }
    localStorage.removeItem('gujgyani_userId')
    localStorage.removeItem('gujgyani_userName')
    localStorage.removeItem('gujgyani_lastSession')
    show('All data cleared.', 'success')
    setTimeout(() => (window.location.href = '/'), 800)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 border-b border-[#F5E6D0] flex items-center justify-between">
        <Link
          href="/"
          className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2"
        >
          <span className="gujarati !text-[1.3rem]">ગ</span>
          <span>Guj-Gyani</span>
        </Link>
        <Link href="/quiz" className="btn-secondary !py-2 !px-4 text-sm">
          Back to Quiz
        </Link>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Learning Dashboard
            </h1>
            <p className="text-[#5D3A1A] mt-1">
              Your progress across every session.
            </p>
          </div>
          {hasUser && (
            <button
              onClick={handleClear}
              className="text-sm font-semibold px-4 py-2 rounded-xl border-2 border-[#C62828] text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
            >
              Clear All Data
            </button>
          )}
        </div>

        {!hasUser ? (
          <div className="card p-10 text-center">
            <p className="text-[#5D3A1A] mb-4">
              No user found. Start learning to populate your dashboard.
            </p>
            <Link href="/onboard" className="btn-primary">
              Begin Journey →
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center p-20">
            <Spinner size={40} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-[#5D3A1A] mb-4">
              No sessions yet — finish a quiz to see your stats here.
            </p>
            <Link href="/quiz" className="btn-primary">
              Start a Session →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Sessions" value={`${totalSessions}`} />
              <StatCard label="Questions" value={`${totalQuestions}`} accent />
              <StatCard label="Best Level" value={`${bestLevel}`} />
              <StatCard label="Avg. Accuracy" value={`${avgAccuracy}%`} />
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Level progression</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D0" />
                    <XAxis
                      dataKey="n"
                      stroke="#5D3A1A"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Session #', position: 'insideBottom', offset: -2, fill: '#8D6E63' }}
                    />
                    <YAxis
                      domain={[0, 40]}
                      stroke="#5D3A1A"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #F5E6D0',
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="level"
                      stroke="#FF6B00"
                      strokeWidth={3}
                      dot={{ fill: '#FF6B00', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-5 border-b border-[#F5E6D0]">
                <h2 className="text-xl font-bold">All sessions</h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FFF3E0] text-[#5D3A1A]">
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                      <th className="text-left px-4 py-3 font-semibold">Start L.</th>
                      <th className="text-left px-4 py-3 font-semibold">End L.</th>
                      <th className="text-left px-4 py-3 font-semibold">Questions</th>
                      <th className="text-left px-4 py-3 font-semibold">Accuracy</th>
                      <th className="text-left px-4 py-3 font-semibold">Duration</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-[#F5E6D0] hover:bg-[#FFF3E0] transition-colors"
                      >
                        <td className="px-4 py-3">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3 font-semibold">{s.start_level}</td>
                        <td className="px-4 py-3 font-bold text-[#FF6B00]">
                          {s.end_level ?? '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {s.correct_answers}/{s.total_questions}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {Math.round((s.accuracy || 0) * 100)}%
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatDuration(s.duration_seconds)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              s.status === 'completed'
                                ? 'bg-[#E8F5E9] text-[#1B5E20]'
                                : 'bg-[#FFF3E0] text-[#E65100]'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="card p-5">
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
