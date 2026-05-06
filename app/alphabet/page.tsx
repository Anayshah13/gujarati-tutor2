'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { GUJARATI_ALPHABET_ROWS } from '@/data/gujaratiAlphabet'
import { speak } from '@/lib/speech'

const CLICKS_FOR_FULL = 5

function alphabetClicksKey(): string {
  if (typeof window === 'undefined') return 'gujgyani_alphabet_clicks'
  const uid = localStorage.getItem('gujgyani_userId')
  return uid ? `gujgyani_alphabet_clicks_${uid}` : 'gujgyani_alphabet_clicks'
}

function loadClickCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(alphabetClicksKey())
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function AlphabetPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [speakingChar, setSpeakingChar] = useState<string | null>(null)

  useEffect(() => {
    setCounts(loadClickCounts())
  }, [])

  const persist = useCallback((next: Record<string, number>) => {
    setCounts(next)
    try {
      localStorage.setItem(alphabetClicksKey(), JSON.stringify(next))
    } catch {
      /* ignore quota */
    }
  }, [])

  const handleTileClick = useCallback(
    async (char: string) => {
      setSpeakingChar(char)
      const prev = loadClickCounts()
      const n = (prev[char] ?? 0) + 1
      persist({ ...prev, [char]: n })
      try {
        await speak(char, 'gu')
      } finally {
        setSpeakingChar(null)
      }
    },
    [persist]
  )

  const flatTiles = useMemo(
    () => GUJARATI_ALPHABET_ROWS.flatMap((row) => row),
    []
  )

  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FFF8F0] text-[#1A0A00]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#FFB300]/18 via-[#FF6B00]/8 to-transparent blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-gradient-to-bl from-[#FFD54F]/20 via-[#FF6B00]/10 to-transparent blur-3xl sm:right-0" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-[#F5E6D0]/90 bg-[#FFF8F0]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="font-extrabold text-[#FF6B00] hover:text-[#E65100]">
            ← Home
          </Link>
          <Link href="/onboard" className="btn-primary !py-2 !px-4 text-sm">
            Start learning
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Let&apos;s learn Gujarati!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#5D3A1A] sm:text-lg">
            Kakko — the consonants. Tap any letter to hear it with your device&apos;s voice.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#8D6E63]">
            Best with a Gujarati (gu-IN) voice installed; we fall back to Hindi or English if needed.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 space-y-6 sm:mt-12 sm:space-y-8"
        >
          {GUJARATI_ALPHABET_ROWS.map((row, ri) => (
            <div
              key={ri}
              className={`flex flex-wrap justify-center gap-2.5 sm:gap-3 ${
                row.length <= 4 ? 'max-w-3xl mx-auto' : ''
              }`}
            >
              {row.map((tile, ti) => (
                <LetterTile
                  key={`${ri}-${ti}-${tile.char}`}
                  tile={tile}
                  clicks={counts[tile.char] ?? 0}
                  busy={speakingChar === tile.char}
                  onActivate={() => handleTileClick(tile.char)}
                />
              ))}
            </div>
          ))}
        </motion.div>

        <p className="mx-auto mt-10 max-w-md text-center text-xs text-[#8D6E63]">
          Progress fills as you replay letters ({CLICKS_FOR_FULL} listens = full bar).{' '}
          <button
            type="button"
            className="font-semibold text-[#FF6B00] underline-offset-2 hover:underline"
            onClick={() => persist({})}
          >
            Reset progress
          </button>
        </p>

        <div className="mx-auto mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/onboard" className="btn-primary">
            Continue to lessons →
          </Link>
          <Link href="/" className="btn-secondary">
            Back to homepage
          </Link>
        </div>

        <p className="mx-auto mt-8 text-center text-[11px] text-[#8D6E63]/90">
          {flatTiles.length} letters · Guj-Gyani
        </p>
      </main>
    </div>
  )
}

function LetterTile({
  tile,
  clicks,
  busy,
  onActivate,
}: {
  tile: { char: string; label: string }
  clicks: number
  busy: boolean
  onActivate: () => void
}) {
  const progress = Math.min(clicks / CLICKS_FOR_FULL, 1)

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      disabled={busy}
      aria-busy={busy}
      aria-label={`Speak Gujarati letter ${tile.label}`}
      onClick={onActivate}
      className={`relative flex min-h-[5.5rem] w-[4.35rem] flex-col items-center justify-between rounded-2xl border-2 px-1.5 pb-2 pt-3 shadow-sm transition-colors sm:min-h-[6rem] sm:w-[5rem] ${
        busy
          ? 'border-[#FF8F00] bg-[#FFF3E0]'
          : 'border-[#F5E6D0] bg-white hover:border-[#FFB300]/90 hover:bg-[#FFFDF9]'
      }`}
      style={{ boxShadow: '0 10px 28px -14px rgba(255, 107, 0, 0.22)' }}
    >
      <span className="gujarati text-[1.65rem] leading-none text-[#1A0A00] sm:text-[1.85rem]">
        {tile.char}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8D6E63] sm:text-xs">
        {tile.label}
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#F5E6D0]">
        <div
          className="h-full rounded-full bg-[#FF6B00] transition-[width] duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.button>
  )
}
