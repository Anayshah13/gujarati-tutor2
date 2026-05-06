import { NextRequest, NextResponse } from 'next/server'
import { assertSessionMatchesUser } from '@/lib/authGate'
import { getDb } from '@/lib/db'

interface SessionRow {
  total_questions: number
  correct_answers: number
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, endLevel, durationSeconds } = (await req.json()) as {
      sessionId: string
      endLevel: number
      durationSeconds: number
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const db = getDb()
    const owner = db
      .prepare(`SELECT user_id FROM sessions WHERE id = ?`)
      .get(sessionId) as { user_id: string } | undefined
    if (!owner) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (!assertSessionMatchesUser(req, owner.user_id)) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    }

    const session = db
      .prepare(
        `SELECT total_questions, correct_answers FROM sessions WHERE id = ?`
      )
      .get(sessionId) as SessionRow | undefined

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const accuracy =
      session.total_questions > 0
        ? session.correct_answers / session.total_questions
        : 0

    db.prepare(
      `UPDATE sessions
       SET end_level = ?,
           ended_at = datetime('now'),
           duration_seconds = ?,
           accuracy = ?,
           status = 'completed'
       WHERE id = ?`
    ).run(endLevel, durationSeconds || 0, accuracy, sessionId)

    return NextResponse.json({ ok: true, accuracy })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
