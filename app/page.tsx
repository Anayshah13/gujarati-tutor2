'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF8F0]/85 border-b border-[#F5E6D0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2">
            <span className="gujarati !text-[1.3rem]">ગ</span>
            <span>Guj-Gyani</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <a
              href="#features"
              className="hidden md:block text-sm font-semibold text-[#5D3A1A] hover:text-[#FF6B00] transition-colors"
            >
              How it works
            </a>
            <Link
              href="/admin"
              className="hidden md:block text-sm font-semibold text-[#5D3A1A] hover:text-[#FF6B00] transition-colors"
            >
              Admin
            </Link>
            <Link href="/onboard" className="btn-primary !py-2 !px-4 text-sm">
              Start Learning
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#F5E6D0] text-[#5D3A1A] text-sm font-medium shadow-sm mb-6"
            >
              <span className="text-[#FF6B00]">✦</span>
              Adaptive · 40 Levels · Gujarati
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-[64px] font-extrabold leading-[1.05] tracking-tight"
            >
              Learn Gujarati.
              <br />
              <span className="text-gradient">The smart way.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-5 text-lg text-[#5D3A1A] max-w-lg"
            >
              Guj-Gyani adapts to your exact level. Answer questions, speak Gujarati, and watch the system learn you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href="/onboard" className="btn-primary text-base">
                Begin Journey →
              </Link>
              <a href="#features" className="btn-secondary text-base">
                See how it works ↓
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-md"
            >
              <Stat label="Questions" value="200" />
              <Stat label="Levels" value="40" />
              <Stat label="Skills" value="5" />
            </motion.div>
          </div>

          <div className="relative h-[420px] hidden md:block">
            <motion.div
              initial={{ rotate: -2, y: 0, opacity: 0 }}
              animate={{ rotate: -2, y: [0, -16, 0], opacity: 1 }}
              transition={{
                opacity: { duration: 0.6 },
                y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute right-0 top-8 w-[380px] card p-6 shadow-2xl"
              style={{ boxShadow: '0 32px 48px -16px rgba(255,107,0,0.30)' }}
            >
              <div className="flex justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#1E88E51A] text-[#1E88E5]">
                  Theory
                </span>
                <span className="text-xs text-[#8D6E63]">Level 12</span>
              </div>
              <p className="text-base font-semibold mb-2">
                What is the gender of the noun ઘર (house)?
              </p>
              <p className="gujarati mb-5">ઘર</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="card p-2 text-center font-medium">Masculine</div>
                <div className="card p-2 text-center font-medium">Feminine</div>
                <div className="card p-2 text-center font-medium border-[#2E7D32] !border-2 bg-[#E8F5E9] text-[#1B5E20]">
                  Neuter ✓
                </div>
                <div className="card p-2 text-center font-medium">Plural</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ rotate: 4, opacity: 0 }}
              animate={{ rotate: 4, y: [0, 12, 0], opacity: 1 }}
              transition={{
                opacity: { duration: 0.6, delay: 0.3 },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute left-0 bottom-4 card p-4 px-5 shadow-xl"
            >
              <div className="text-[10px] uppercase tracking-widest text-[#8D6E63] font-bold mb-1">
                Skill
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🎤</span>
                <div>
                  <div className="font-semibold">Pronunciation</div>
                  <div className="text-xs text-[#5D3A1A]">78 / 100</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          How Guj-Gyani Works
        </h2>
        <p className="text-[#5D3A1A] text-lg mb-10 max-w-2xl">
          A focused system that meets you where you are and pushes you forward — one mastered question at a time.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="card p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-[#5D3A1A]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          40 Levels of Mastery
        </h2>
        <p className="text-[#5D3A1A] text-lg mb-10 max-w-2xl">
          Four bands of ten levels each. Each level: five hardcoded questions plus AI-generated extras when you’re ready.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {BANDS.map((b, i) => (
            <motion.div
              key={b.range}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="card p-6 flex gap-5 items-start"
              style={{ borderLeft: `6px solid ${b.color}` }}
            >
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: b.color }}
                >
                  {b.range}
                </div>
                <div className="text-2xl font-extrabold mt-1">{b.label}</div>
                <p className="text-[#5D3A1A] mt-2">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          Ready to start?
        </h2>
        <p className="text-[#5D3A1A] text-lg mb-8">
          Take a 60-second pretest. We’ll place you precisely. Then learn at your speed.
        </p>
        <Link href="/onboard" className="btn-primary text-lg">
          Begin Journey →
        </Link>
      </section>

      <footer className="border-t border-[#F5E6D0] py-12 text-center">
        <div className="gujarati text-2xl text-[#FF6B00] mb-3">ગુજ-જ્ઞાની</div>
        <div className="text-[#5D3A1A] text-sm">
          Guj-Gyani · DJ Sanghvi COE · IPD 2025-26
        </div>
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-[#FF6B00] tabular-nums">
        {value}
      </div>
      <div className="text-xs text-[#5D3A1A] uppercase tracking-wider font-semibold">
        {label}
      </div>
    </div>
  )
}
