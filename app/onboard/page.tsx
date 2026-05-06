'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Spinner from '@/components/Spinner'
import { migrateLegacyGamificationToUser } from '@/lib/gamification'
import { withCredentials } from '@/lib/apiClient'

type Tab = 'login' | 'register'

function redirectForUser(u: {
  id: string
  pretest_done?: number
}) {
  return u.pretest_done ? '/quiz' : '/pretest'
}

export default function OnboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [bootstrapping, setBootstrapping] = useState(true)

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const meRes = await fetch('/api/auth/me', withCredentials)
        const me = await meRes.json()
        if (!cancelled && me?.user?.id) {
          const u = me.user as {
            id: string
            name: string
            pretest_done?: number
          }
          localStorage.setItem('gujgyani_userId', u.id)
          localStorage.setItem('gujgyani_userName', String(u.name ?? ''))
          migrateLegacyGamificationToUser(u.id)
          router.replace(redirectForUser(u))
          return
        }
      } catch {
        /* fall through */
      }

      const userId = localStorage.getItem('gujgyani_userId')
      if (!userId) {
        if (!cancelled) setBootstrapping(false)
        return
      }

      try {
        const r = await fetch(`/api/users/${userId}`, withCredentials)
        const u = await r.json()
        if (!cancelled && u?.id) {
          router.replace(redirectForUser(u))
          return
        }
      } catch {
        /* ignore */
      }

      if (!cancelled) {
        localStorage.removeItem('gujgyani_userId')
        localStorage.removeItem('gujgyani_userName')
        setBootstrapping(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [router])

  const persistSession = (userId: string, displayName: string) => {
    localStorage.setItem('gujgyani_userId', userId)
    localStorage.setItem('gujgyani_userName', displayName)
    migrateLegacyGamificationToUser(userId)
  }

  const handleRegister = async () => {
    const trimmedName = name.trim()
    const trimmedId = loginId.trim().toLowerCase()
    if (!trimmedName) {
      setError('Please enter your name')
      return
    }
    if (!trimmedId || !password) {
      setError('Choose a user ID and password')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        ...withCredentials,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          loginId: trimmedId,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.userId) {
        setError(data.error || 'Could not create account')
        setLoading(false)
        return
      }
      persistSession(data.userId, String(data.name ?? trimmedName))
      router.push('/pretest')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    const trimmedId = loginId.trim().toLowerCase()
    if (!trimmedId || !password) {
      setError('Enter your user ID and password')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        ...withCredentials,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: trimmedId, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.userId) {
        setError(data.error || 'Could not sign in')
        setLoading(false)
        return
      }
      persistSession(data.userId, String(data.name ?? ''))
      const u = data.user as { pretest_done?: number }
      router.replace(u?.pretest_done ? '/quiz' : '/pretest')
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
        <div className="card p-8 md:p-10 w-full max-w-md">
          <div className="gujarati text-3xl text-[#FF6B00] text-center mb-2">નમસ્તે</div>
          <h1 className="text-3xl font-extrabold text-center mb-3">Sign in</h1>
          <p className="text-[#5D3A1A] text-center mb-6 text-sm">
            Your progress is tied to your account. Use the same user ID on this device to resume.
          </p>

          <div className="flex rounded-xl border border-[#F5E6D0] p-1 mb-6 bg-[#FFF8F0]">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                setError(null)
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === 'login' ? 'bg-white shadow-sm text-[#FF6B00]' : 'text-[#5D3A1A]'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register')
                setError(null)
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === 'register' ? 'bg-white shadow-sm text-[#FF6B00]' : 'text-[#5D3A1A]'
              }`}
            >
              Register
            </button>
          </div>

          {tab === 'register' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F5E6D0] focus:border-[#FF6B00] outline-none text-lg font-semibold transition-colors bg-[#FFF8F0] mb-3"
            />
          )}

          <label className="block text-xs font-bold uppercase tracking-wider text-[#8D6E63] mb-1">
            User ID
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister()
            }}
            placeholder="e.g. anay_shah"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F5E6D0] focus:border-[#FF6B00] outline-none text-lg font-semibold transition-colors bg-[#FFF8F0] mb-3"
          />

          <label className="block text-xs font-bold uppercase tracking-wider text-[#8D6E63] mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister()
            }}
            placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F5E6D0] focus:border-[#FF6B00] outline-none text-lg font-semibold transition-colors bg-[#FFF8F0]"
          />

          {error && (
            <p className="text-[#C62828] text-sm mt-3 font-medium">{error}</p>
          )}

          <button
            type="button"
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="btn-primary w-full mt-6 text-base"
          >
            {loading
              ? 'Please wait…'
              : tab === 'login'
                ? 'Log in'
                : 'Create account & continue →'}
          </button>

          <p className="text-xs text-[#8D6E63] text-center mt-5">
            {tab === 'register'
              ? 'Next: placement pretest (you can skip it from that screen if you prefer).'
              : 'Forgot which ID you used? Register a new account — your old progress stays on the previous ID.'}
          </p>
        </div>
      </div>
    </div>
  )
}
