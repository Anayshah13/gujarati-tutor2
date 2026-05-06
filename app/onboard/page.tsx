'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Spinner from '@/components/Spinner'

export default function OnboardPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bootstrapping, setBootstrapping] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const userId = localStorage.getItem('gujgyani_userId')
    if (!userId) {
      setBootstrapping(false)
      return
    }
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((u) => {
        if (u && u.id) {
          if (u.pretest_done) router.replace('/quiz')
          else router.replace('/pretest')
        } else {
          localStorage.removeItem('gujgyani_userId')
          setBootstrapping(false)
        }
      })
      .catch(() => {
        setBootstrapping(false)
      })
  }, [router])

  const handleStart = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || !data.userId) {
        setError(data.error || 'Could not create user')
        setLoading(false)
        return
      }
      localStorage.setItem('gujgyani_userId', data.userId)
      localStorage.setItem('gujgyani_userName', data.name)
      router.push('/pretest')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 border-b border-[#F5E6D0]">
        <Link href="/" className="font-extrabold text-xl text-[#FF6B00] flex items-center gap-2 w-fit">
          <span className="gujarati !text-[1.3rem]">ગ</span>
          <span>Guj-Gyani</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 md:p-10 w-full max-w-md"
        >
          <div className="gujarati text-3xl text-[#FF6B00] text-center mb-2">
            નમસ્તે
          </div>
          <h1 className="text-3xl font-extrabold text-center mb-3">
            What should we call you?
          </h1>
          <p className="text-[#5D3A1A] text-center mb-7">
            We’ll use your name to personalise your learning journey.
          </p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F5E6D0] focus:border-[#FF6B00] outline-none text-lg font-semibold transition-colors bg-[#FFF8F0]"
            autoFocus
          />

          {error && (
            <p className="text-[#C62828] text-sm mt-2 font-medium">{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="btn-primary w-full mt-6 text-base"
          >
            {loading ? 'Setting up…' : "Let's Begin →"}
          </button>

          <p className="text-xs text-[#8D6E63] text-center mt-5">
            Next: a quick 10-question pretest to find your level.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
