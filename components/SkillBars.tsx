'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import type { SkillKey, SkillScores } from '@/lib/adaptiveEngine'

const LABELS: Record<SkillKey, string> = {
  theory: 'Theory',
  pronunciation: 'Pronunciation',
  sentence: 'Sentence',
  translation: 'Translation',
  blanks: 'Blanks',
}

const COLORS_BY_TYPE: Record<SkillKey, string> = {
  theory: '#1E88E5',
  pronunciation: '#FF6B00',
  sentence: '#2E7D32',
  translation: '#7B1FA2',
  blanks: '#FF8F00',
}

interface Props {
  skills: SkillScores
  rescueSkill?: SkillKey | null
}

const colorFor = (val: number, base: string) => {
  if (val < 30) return '#C62828'
  if (val < 60) return '#FF8F00'
  return base
}

export default function SkillBars({ skills, rescueSkill }: Props) {
  const reduceMotion = useReducedMotion()
  const rowVariants = useMemo(
    () => ({
      hidden: { opacity: 0, x: reduceMotion ? 0 : -8 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
      },
    }),
    [reduceMotion]
  )
  const listVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.07, delayChildren: 0.04 },
    },
  }

  return (
    <motion.div
      className="card p-4 space-y-3"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-[11px] uppercase tracking-wider text-[#8D6E63] font-semibold mb-1">
        Skills
      </div>
      {(Object.keys(skills) as SkillKey[]).map((k) => {
        const val = skills[k]
        const isRescue = rescueSkill === k
        const barColor = colorFor(val, COLORS_BY_TYPE[k])
        return (
          <motion.div key={k} className="space-y-1" variants={rowVariants}>
            <div className="flex items-baseline justify-between text-xs">
              <span
                className={`font-semibold ${
                  isRescue ? 'text-[#C62828]' : 'text-[#1A0A00]'
                }`}
              >
                {LABELS[k]}
                {isRescue && ' 🎯'}
              </span>
              <span className="tabular-nums text-[#5D3A1A]">{val}</span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-[#FFE5C9] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${val}%`, background: barColor }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              {isRescue && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ background: '#C62828' }}
                />
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
