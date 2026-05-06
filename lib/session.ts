import crypto from 'crypto'
import type { NextRequest } from 'next/server'

const COOKIE = 'gujgyani_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 30

function secret(): string {
  return (
    process.env.GUJGYANI_SESSION_SECRET ||
    'dev-only-change-GUJGYANI_SESSION_SECRET-in-production'
  )
}

export function sessionCookieName(): typeof COOKIE {
  return COOKIE
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp }), 'utf8').toString(
    'base64url'
  )
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null
  const lastDot = token.lastIndexOf('.')
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  try {
    const a = Buffer.from(sig, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return null
    if (!crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string
      exp?: number
    }
    if (!data.uid || typeof data.exp !== 'number') return null
    if (data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

export function readSessionUserId(req: NextRequest): string | null {
  return verifySessionToken(req.cookies.get(COOKIE)?.value)
}
