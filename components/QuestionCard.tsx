'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
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
  const reduceMotion = useReducedMotion()
  const lift = reduceMotion ? 0 : 14

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: lift },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring' as const,
          stiffness: 220,
          damping: 24,
          staggerChildren: 0.06,
          delayChildren: 0.04,
        },
      },
    }),
    [lift]
  )

  const blockVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
      },
    }),
    [reduceMotion]
  )

  return (
    <motion.div
      key={questionNumber}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
      className="card p-6 md:p-8 max-w-2xl mx-auto w-full"
    >
      <motion.div
        className="flex items-center justify-between mb-4"
        variants={blockVariants}
      >
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
      </motion.div>
      <motion.div variants={blockVariants}>{children}</motion.div>
    </motion.div>
  )
}
