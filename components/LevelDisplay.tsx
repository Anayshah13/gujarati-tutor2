'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getBand } from '@/lib/adaptiveEngine'

interface Props {
  level: number
  scoreDelta?: number | null
}

export default function LevelDisplay({ level, scoreDelta }: Props) {
  const band = getBand(Math.max(1, level))
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (scoreDelta == null || scoreDelta === 0) return
    setFlash(scoreDelta > 0 ? 'up' : 'down')
    const t = setTimeout(() => setFlash(null), 700)
    return () => clearTimeout(t)
  }, [scoreDelta])

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="text-[10px] uppercase tracking-widest text-[#8D6E63] font-semibold">
        Level
      </div>
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={level}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="text-4xl md:text-5xl font-extrabold tabular-nums"
            style={{ color: band.color }}
          >
            {level}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash + Math.random()}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: flash === 'up' ? -30 : 30, scale: 1.1 }}
              transition={{ duration: 0.7 }}
              className={`absolute -top-2 left-full ml-1 text-sm font-bold ${
                flash === 'up' ? 'text-[#2E7D32]' : 'text-[#C62828]'
              }`}
            >
              {flash === 'up' ? `+${scoreDelta}` : `${scoreDelta}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: band.color + '22',
          color: band.color,
        }}
      >
        Band {band.num} · {band.label}
      </div>
    </div>
  )
}
