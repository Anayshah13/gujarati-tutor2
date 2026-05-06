'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { speak, type SpeechLang } from '@/lib/speech'

type State = 'idle' | 'speaking' | 'done' | 'error'

interface Props {
  text: string
  lang?: SpeechLang
  autoPlay?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export default function SpeakButton({
  text,
  lang = 'en',
  autoPlay = false,
  size = 'md',
  label,
}: Props) {
  const [state, setState] = useState<State>('idle')
  const ranAuto = useRef(false)

  const sizeMap: Record<string, { btn: string; icon: string }> = {
    sm: { btn: 'w-9 h-9 text-base', icon: 'text-base' },
    md: { btn: 'w-12 h-12 text-xl', icon: 'text-xl' },
    lg: { btn: 'w-16 h-16 text-2xl', icon: 'text-2xl' },
  }

  const handleClick = async () => {
    if (state === 'speaking') return
    setState('speaking')
    try {
      await speak(text, lang)
      setState('done')
      setTimeout(() => setState('idle'), 1200)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  useEffect(() => {
    if (autoPlay && !ranAuto.current) {
      ranAuto.current = true
      const t = setTimeout(() => {
        handleClick()
      }, 350)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  return (
    <div className="inline-flex items-center gap-3">
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`relative rounded-full border-2 border-[#FF6B00] bg-white text-[#FF6B00] flex items-center justify-center ${sizeMap[size].btn} shadow-sm`}
        aria-label="Speak"
      >
        <AnimatePresence mode="wait">
          {state === 'speaking' && (
            <motion.span
              key="ring"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [1, 1.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-[#FF6B00]"
            />
          )}
        </AnimatePresence>
        {state === 'done' ? (
          <span className="text-[#2E7D32]">✓</span>
        ) : state === 'error' ? (
          <span className="text-[#C62828]">!</span>
        ) : (
          <span>🔊</span>
        )}
      </motion.button>
      {label && <span className="text-sm text-[#5D3A1A] font-medium">{label}</span>}
    </div>
  )
}
