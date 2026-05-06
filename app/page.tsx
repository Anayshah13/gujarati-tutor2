'use client'

import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const BANDS = [
  {
    range: 'L1 — L10',
    label: 'Beginner',
    color: '#FFB300',
    desc: 'Greetings, numbers, basic vocab. Build a friendly foundation.',
  },
  {
    range: 'L11 — L20',
    label: 'Elementary',
    color: '#FF8F00',
    desc: 'Pronouns, gender rules, simple sentences. Find your voice.',
  },
  {
    range: 'L21 — L30',
    label: 'Intermediate',
    color: '#FF6B00',
    desc: 'Postpositions, verb forms, longer phrases. Start sounding fluent.',
  },
  {
    range: 'L31 — L40',
    label: 'Advanced',
    color: '#E65100',
    desc: 'SOV structure, complex tenses, idioms. Speak with confidence.',
  },
]

const FEATURES = [
  {
    icon: '🎯',
    title: 'Knows Your Level',
    desc: 'A short pretest places you precisely on the 40-level ladder — no guessing.',
  },
  {
    icon: '🔤',
    title: 'Script Fade',
    desc: 'English fades as you advance. By Band 4 you read pure ગુજરાતી.',
  },
  {
    icon: '🎤',
    title: '5 Question Types',
    desc: 'Theory, pronunciation, sentence-build, matching, fill-in-blanks — all working together.',
  },
]

const SKILL_CHIPS = ['Theory', 'Pronunciation', 'Sentence', 'Translation', 'Fill blanks']

/** Large glyphs clipped — keeps watermark inside viewport */
const WATERMARK = [
  { char: 'ગ', left: '6%', top: '10%', rotate: '-12deg' },
  { char: 'ુ', left: '68%', top: '22%', rotate: '14deg' },
  { char: 'જ', left: '14%', top: '48%', rotate: '8deg' },
  { char: '્', left: '52%', top: '40%', rotate: '-18deg' },
  { char: 'ર', left: '78%', top: '58%', rotate: '12deg' },
  { char: 'ા', left: '36%', top: '70%', rotate: '-8deg' },
]

export default function LandingPage() {
  const { scrollY } = useScroll()
  const [navSolid, setNavSolid] = useState(false)
  const [streak, setStreak] = useState(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    setNavSolid(y > 12)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = parseInt(localStorage.getItem('gujgyani_streak') || '0', 10)
    setStreak(Number.isFinite(v) ? v : 0)
  }, [])

  return (
    <div className="relative min-h-screen w-full max-w-[100vw] bg-[#FFF8F0] text-[#1A0A00] overflow-x-hidden">
      {/* Background blobs — clipped to viewport */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#FFB300]/20 via-[#FF6B00]/8 to-transparent blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-gradient-to-bl from-[#FFD54F]/22 via-[#FF6B00]/10 to-transparent blur-3xl sm:right-0" />
        <div className="absolute bottom-16 left-1/4 h-48 w-48 rounded-[40%] bg-gradient-to-tr from-[#FFB300]/18 to-transparent blur-3xl sm:h-64 sm:w-64" />
      </div>

      {/* Watermark — responsive size + clipping */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden gujarati select-none">
        {WATERMARK.map((w, i) => (
          <span
            key={i}
            className="absolute leading-none text-[#FF6B00]/[0.045] text-[min(22vw,7.5rem)] sm:text-[min(18vw,9rem)] md:text-[min(14vw,11rem)]"
            style={{
              left: w.left,
              top: w.top,
              transform: `rotate(${w.rotate})`,
            }}
          >
            {w.char}
          </span>
        ))}
      </div>

      <nav
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          navSolid
            ? 'border-[#F5E6D0]/90 bg-[#FFF8F0]/85 backdrop-blur-md'
            : 'border-transparent bg-[#FFF8F0]/70 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 min-w-0">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-extrabold text-lg sm:text-xl text-[#FF6B00]"
          >
            <span className="gujarati shrink-0 !text-[1.25rem]">ગ</span>
            <span className="truncate">Guj-Gyani</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">
            {streak > 0 && (
              <span className="hidden rounded-full border border-[#FFB300]/50 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#E65100] sm:inline">
                🔥 {streak}d
              </span>
            )}
            <a
              href="#features"
              className="hidden text-sm font-semibold text-[#5D3A1A] hover:text-[#FF6B00] md:block"
            >
              How it works
            </a>
            <Link
              href="/admin"
              className="hidden text-sm font-semibold text-[#5D3A1A] hover:text-[#FF6B00] md:block"
            >
              Admin
            </Link>
            <Link href="/onboard" className="btn-primary !py-2 !px-3 text-xs sm:!px-4 sm:text-sm">
              Start Learning
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-6xl min-w-0 px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20">
        <div className="grid min-w-0 items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F5E6D0] bg-white px-3 py-1 text-xs font-semibold text-[#5D3A1A] shadow-sm sm:text-sm"
            >
              <span className="text-[#FF6B00]">✦</span>
              Adaptive · 40 Levels · Gujarati
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
            >
              Learn Gujarati.
              <br />
              <span className="text-gradient">The smart way.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mt-4 max-w-lg text-base text-[#5D3A1A] sm:text-lg"
            >
              Guj-Gyani adapts to your exact level. Answer questions, speak Gujarati, and watch the
              system learn you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <Link href="/onboard" className="btn-primary text-sm sm:text-base">
                Begin Journey →
              </Link>
              <a href="#features" className="btn-secondary text-sm sm:text-base">
                See how it works ↓
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="mt-9 grid max-w-md grid-cols-3 gap-3 sm:max-w-lg"
            >
              <Stat label="Questions" value="200" />
              <Stat label="Levels" value="40" />
              <Stat label="Skills" value="5" />
            </motion.div>

            <div className="mt-6 flex flex-wrap gap-2">
              {SKILL_CHIPS.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#FFB300]/80 bg-white px-3 py-1 text-xs font-semibold text-[#FF6B00]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Preview — contained, no negative offsets */}
          <div className="relative mx-auto hidden min-h-[380px] w-full max-w-[380px] md:block">
            <motion.div
              initial={{ rotate: -2, opacity: 0 }}
              animate={{ rotate: -2, y: [0, -10, 0], opacity: 1 }}
              transition={{
                opacity: { duration: 0.5 },
                y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="relative z-10 mx-auto w-full max-w-[340px] card p-5 shadow-2xl sm:p-6"
              style={{ boxShadow: '0 24px 40px -16px rgba(255,107,0,0.28)' }}
            >
              <div className="mb-3 flex justify-between gap-2">
                <span className="shrink-0 rounded-full bg-[#1E88E51A] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1E88E5] sm:text-xs">
                  Theory
                </span>
                <span className="text-[10px] text-[#8D6E63] sm:text-xs">Level 12</span>
              </div>
              <p className="mb-2 text-sm font-semibold sm:text-base">
                What is the gender of the noun ઘર (house)?
              </p>
              <p className="gujarati mb-4 text-[1.35rem]">ઘર</p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="card p-2 text-center font-medium">Masculine</div>
                <div className="card p-2 text-center font-medium">Feminine</div>
                <div className="card border-[#2E7D32] bg-[#E8F5E9] p-2 text-center font-medium !border-2 text-[#1B5E20]">
                  Neuter ✓
                </div>
                <div className="card p-2 text-center font-medium">Plural</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ rotate: 4, opacity: 0 }}
              animate={{ rotate: 4, y: [0, 10, 0], opacity: 1 }}
              transition={{
                opacity: { duration: 0.5, delay: 0.15 },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute bottom-2 left-1 z-20 w-[min(100%,240px)] card p-4 shadow-xl"
            >
              <div className="text-[10px] uppercase tracking-widest text-[#8D6E63] font-bold mb-1">
                Skill
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🎤</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Pronunciation</div>
                  <div className="text-xs text-[#5D3A1A]">78 / 100</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl min-w-0 px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-2xl font-extrabold md:text-4xl">How Guj-Gyani Works</h2>
        <p className="mt-2 max-w-2xl text-[#5D3A1A] sm:text-lg">
          A focused system that meets you where you are and pushes you forward — one mastered
          question at a time.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="card p-5 sm:p-6"
            >
              <div className="mb-2 text-2xl sm:text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-bold sm:text-xl">{f.title}</h3>
              <p className="text-sm text-[#5D3A1A] sm:text-base">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl min-w-0 px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-2xl font-extrabold md:text-4xl">40 Levels of Mastery</h2>
        <p className="mt-2 max-w-2xl text-[#5D3A1A] sm:text-lg">
          Four bands of ten levels each. Each level: five hardcoded questions plus AI-generated
          extras when you’re ready.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {BANDS.map((b, i) => (
            <motion.div
              key={b.range}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              className="card flex gap-4 p-5 sm:p-6"
              style={{ borderLeft: `6px solid ${b.color}` }}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: b.color }}>
                  {b.range}
                </div>
                <div className="mt-1 text-xl font-extrabold sm:text-2xl">{b.label}</div>
                <p className="mt-2 text-sm text-[#5D3A1A] sm:text-base">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 md:py-20">
        <h2 className="text-2xl font-extrabold md:text-4xl">Ready to start?</h2>
        <p className="mt-3 text-[#5D3A1A] sm:text-lg">
          Take a 60-second pretest. We’ll place you precisely. Then learn at your speed.
        </p>
        <Link href="/onboard" className="btn-primary mt-6 inline-flex text-base">
          Begin Journey →
        </Link>
      </section>

      <footer className="relative z-10 border-t border-[#F5E6D0] bg-[#FFF8F0]/95 py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:items-start md:gap-10">
          <div>
            <div className="text-xl font-extrabold text-[#FF6B00]">Guj-Gyani</div>
            <p className="mt-1 text-sm font-medium text-[#5D3A1A]">Learn Gujarati the smart way</p>
            <p className="mt-2 text-xs text-[#8D6E63] sm:text-sm">
              Built at DJ Sanghvi COE · IPD 2025-26
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end md:text-right">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#5D3A1A]">
              <Link href="/" className="hover:text-[#FF6B00]">
                Home
              </Link>
              <a href="#features" className="hover:text-[#FF6B00]">
                How it works
              </a>
              <Link href="/admin" className="hover:text-[#FF6B00]">
                Admin
              </Link>
            </div>
            <div className="gujarati text-3xl font-bold text-[#FF6B00]/15 sm:text-4xl">ગુજ-જ્ઞાની</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#F5E6D0] bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="text-2xl font-extrabold leading-none text-[#FF6B00] sm:text-[28px] tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8D6E63] sm:text-xs">
        {label}
      </div>
    </div>
  )
}
