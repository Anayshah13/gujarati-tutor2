'use client'

import { motion } from 'framer-motion'

export default function ProgressBar({
  value,
  max = 100,
  color = '#FF6B00',
  height = 10,
  showLabel = false,
}: {
  value: number
  max?: number
  color?: string
  height?: number
  showLabel?: boolean
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full">
      <div
        className="w-full bg-[#FFE5C9] rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: color, height }}
          className="rounded-full"
        />
      </div>
      {showLabel && (
        <div className="text-xs text-[#5D3A1A] mt-1 text-right tabular-nums">
          {Math.round(pct)}%
        </div>
      )}
    </div>
  )
}
