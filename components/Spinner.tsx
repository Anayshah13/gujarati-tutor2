'use client'

import { motion } from 'framer-motion'

export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-[#FFE5C9] border-t-[#FF6B00]"
      />
    </div>
  )
}
