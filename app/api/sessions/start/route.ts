import { NextRequest, NextResponse } from 'next/server'
import { assertSessionMatchesUser } from '@/lib/authGate'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { userId, startLevel } = (await req.json()) as {
      userId: string
      startLevel: number
    }
    if (!userId || typeof startLevel !== 'number') {
      return NextResponse.json(
        { error: 'userId and startLevel are required' },
        { status: 400 }
      )
    }
    if (!assertSessionMatchesUser(req, userId)) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    }
    const id = crypto.randomUUID()
    const db = getDb()
    db.prepare(
      `INSERT INTO sessions (id, user_id, start_level, status) VALUES (?, ?, ?, 'active')`
    ).run(id, userId, startLevel)
    return NextResponse.json({ sessionId: id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
