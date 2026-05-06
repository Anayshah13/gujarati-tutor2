'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { TranslationPair } from '@/data/types'

interface Props {
  pairs: TranslationPair[]
  onComplete?: (allCorrect: boolean) => void
  disabled?: boolean
}

interface MatchState {
  matchedEng: Set<string>
  matchedGuj: Set<string>
  selectedEng: string | null
  selectedGuj: string | null
  flashWrong: { eng: string; guj: string } | null
  pairsCorrect: number
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchColumns({ pairs, onComplete, disabled }: Props) {
  const englishList = useMemo(() => shuffle(pairs.map((p) => p.english)), [pairs])
  const gujaratiList = useMemo(
    () => shuffle(pairs.map((p) => p.gujarati)),
    [pairs]
  )

  const correctMap = useMemo(() => {
    const m = new Map<string, string>()
    pairs.forEach((p) => m.set(p.english, p.gujarati))
    return m
  }, [pairs])

  const [state, setState] = useState<MatchState>({
    matchedEng: new Set(),
    matchedGuj: new Set(),
    selectedEng: null,
    selectedGuj: null,
    flashWrong: null,
    pairsCorrect: 0,
  })

  useEffect(() => {
    if (state.pairsCorrect === pairs.length) {
      onComplete?.(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pairsCorrect, pairs.length])

  const tryMatch = (eng: string | null, guj: string | null) => {
    if (!eng || !guj) return
    if (correctMap.get(eng) === guj) {
      setState((prev) => ({
        ...prev,
        matchedEng: new Set(prev.matchedEng).add(eng),
        matchedGuj: new Set(prev.matchedGuj).add(guj),
        selectedEng: null,
        selectedGuj: null,
        pairsCorrect: prev.pairsCorrect + 1,
      }))
    } else {
      setState((prev) => ({
        ...prev,
        flashWrong: { eng, guj },
        selectedEng: null,
        selectedGuj: null,
      }))
      setTimeout(() => {
        setState((prev) => ({ ...prev, flashWrong: null }))
      }, 600)
    }
  }

  const handleEng = (eng: string) => {
    if (disabled || state.matchedEng.has(eng)) return
    if (state.selectedGuj) {
      tryMatch(eng, state.selectedGuj)
    } else {
      setState((prev) => ({ ...prev, selectedEng: eng }))
    }
  }

  const handleGuj = (guj: string) => {
    if (disabled || state.matchedGuj.has(guj)) return
    if (state.selectedEng) {
      tryMatch(state.selectedEng, guj)
    } else {
      setState((prev) => ({ ...prev, selectedGuj: guj }))
    }
  }

  const tileClass = (
    isMatched: boolean,
    isSelected: boolean,
    isFlashWrong: boolean
  ) => {
    if (isFlashWrong) return 'border-[#C62828] bg-[#FFEBEE] text-[#C62828]'
    if (isMatched) return 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20]'
    if (isSelected) return 'border-[#FF6B00] bg-[#FFF3E0] text-[#E65100]'
    return 'border-[#F5E6D0] bg-white hover:border-[#FF6B00]'
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider mb-1">
          English
        </div>
        {englishList.map((eng) => {
          const matched = state.matchedEng.has(eng)
          const selected = state.selectedEng === eng
          const wrong = state.flashWrong?.eng === eng
          return (
            <motion.button
              key={eng}
              type="button"
              onClick={() => handleEng(eng)}
              whileHover={!matched ? { scale: 1.02 } : undefined}
              whileTap={!matched ? { scale: 0.98 } : undefined}
              animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
              transition={{ duration: 0.4 }}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold transition-colors ${tileClass(
                matched,
                selected,
                wrong
              )}`}
            >
              {matched && '✓ '}
              {eng}
            </motion.button>
          )
        })}
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider mb-1">
          ગુજરાતી
        </div>
        {gujaratiList.map((guj) => {
          const matched = state.matchedGuj.has(guj)
          const selected = state.selectedGuj === guj
          const wrong = state.flashWrong?.guj === guj
          return (
            <motion.button
              key={guj}
              type="button"
              onClick={() => handleGuj(guj)}
              whileHover={!matched ? { scale: 1.02 } : undefined}
              whileTap={!matched ? { scale: 0.98 } : undefined}
              animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
              transition={{ duration: 0.4 }}
              className={`gujarati w-full text-right px-4 py-3 rounded-xl border-2 transition-colors ${tileClass(
                matched,
                selected,
                wrong
              )}`}
            >
              {guj}
              {matched && ' ✓'}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
