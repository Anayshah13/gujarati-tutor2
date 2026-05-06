import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSessionToken, sessionCookieName } from '@/lib/session'
import { toPublicUser } from '@/lib/toPublicUser'

function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase()
}

function cookieOpts(): Parameters<NextResponse['cookies']['set']>[2] {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const loginId = normalizeLoginId(String(body?.loginId ?? ''))
    const password = String(body?.password ?? '')

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required.' },
        { status: 400 }
      )
    }

    const db = getDb()
    const row = db
      .prepare(`SELECT * FROM users WHERE login_id = ?`)
      .get(loginId) as Record<string, unknown> | undefined

    if (!row || !verifyPassword(password, row.password_hash as string | null)) {
      return NextResponse.json(
        { error: 'Invalid user ID or password.' },
        { status: 401 }
      )
    }

    const id = row.id as string
    const user = toPublicUser(row)
    const res = NextResponse.json({ user, userId: id, name: row.name })
    res.cookies.set(sessionCookieName(), createSessionToken(id), cookieOpts())
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
