'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  words: string[]
  onChange?: (current: string[]) => void
  disabled?: boolean
  highlight?: 'correct' | 'wrong' | null
}

interface Token {
  id: string
  word: string
}

export default function WordBlocks({
  words,
  onChange,
  disabled,
  highlight,
}: Props) {
  const [pool, setPool] = useState<Token[]>([])
  const [answer, setAnswer] = useState<Token[]>([])

  useEffect(() => {
    const tokens: Token[] = words.map((w, i) => ({ id: `${i}_${w}_${Math.random().toString(36).slice(2, 6)}`, word: w }))
    setPool(tokens)
    setAnswer([])
  }, [words.join('|')])

  useEffect(() => {
    onChange?.(answer.map((t) => t.word))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer])

  const moveToAnswer = (t: Token) => {
    if (disabled) return
    setPool((p) => p.filter((x) => x.id !== t.id))
    setAnswer((a) => [...a, t])
  }
  const moveToPool = (t: Token) => {
    if (disabled) return
    setAnswer((a) => a.filter((x) => x.id !== t.id))
    setPool((p) => [...p, t])
  }

  const slotBorder =
    highlight === 'correct'
      ? 'border-[#2E7D32] bg-[#E8F5E9]'
      : highlight === 'wrong'
      ? 'border-[#C62828] bg-[#FFEBEE]'
      : 'border-[#F5E6D0] bg-[#FFF8F0]'

  return (
    <div className="space-y-4">
      <div
        className={`min-h-[80px] rounded-xl border-2 border-dashed ${slotBorder} p-3 flex flex-wrap gap-2 items-center`}
      >
        {answer.length === 0 && (
          <span className="text-sm text-[#8D6E63] italic">
            Tap a word below to add it here…
          </span>
        )}
        <AnimatePresence>
          {answer.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => moveToPool(t)}
              layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="gujarati px-3 py-2 rounded-lg bg-white border-2 border-[#FF6B00] text-[#1A0A00] shadow-sm"
            >
              {t.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {pool.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => moveToAnswer(t)}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="gujarati px-3 py-2 rounded-lg bg-[#FFF3E0] border-2 border-[#F5E6D0] text-[#1A0A00] hover:border-[#FF6B00]"
            >
              {t.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
