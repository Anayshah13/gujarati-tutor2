import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { createSessionToken, sessionCookieName } from '@/lib/session'
import { toPublicUser } from '@/lib/toPublicUser'

function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase()
}

function validLoginId(id: string): boolean {
  return /^[a-z0-9_-]{3,40}$/.test(id)
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
    const name = String(body?.name ?? '').trim()
    const loginId = normalizeLoginId(String(body?.loginId ?? ''))
    const password = String(body?.password ?? '')

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!validLoginId(loginId)) {
      return NextResponse.json(
        {
          error:
            'User ID must be 3–40 characters: lowercase letters, digits, underscore, or hyphen.',
        },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const passwordHash = hashPassword(password)
    const db = getDb()

    try {
      db.prepare(
        `INSERT INTO users (id, name, login_id, password_hash, current_level)
         VALUES (?, ?, ?, ?, 0)`
      ).run(id, name, loginId, passwordHash)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        return NextResponse.json(
          { error: 'That user ID is already taken. Pick another or log in.' },
          { status: 409 }
        )
      }
      throw e
    }

    const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id)
    const user = toPublicUser(row)
    const res = NextResponse.json({ user, userId: id, name })
    res.cookies.set(sessionCookieName(), createSessionToken(id), cookieOpts())
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
