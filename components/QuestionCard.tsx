'use client'

import { motion } from 'framer-motion'
import type { QuestionType } from '@/data/types'

const TYPE_META: Record<QuestionType, { label: string; color: string }> = {
  theory: { label: 'Theory', color: '#1E88E5' },
  pronunciation: { label: 'Pronunciation', color: '#FF6B00' },
  sentence: { label: 'Sentence', color: '#2E7D32' },
  translation: { label: 'Translation', color: '#7B1FA2' },
  blanks: { label: 'Blanks', color: '#FF8F00' },
}

interface Props {
  questionType: QuestionType
  questionNumber: number
  children: React.ReactNode
}

export default function QuestionCard({
  questionType,
  questionNumber,
  children,
}: Props) {
  const meta = TYPE_META[questionType]
  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="card p-6 md:p-8 max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: meta.color + '18',
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
        <span className="text-xs text-[#8D6E63] font-medium">
          Question #{questionNumber}
        </span>
      </div>
      {children}
    </motion.div>
  )
}
