import { NextRequest, NextResponse } from 'next/server'
import { assertSessionMatchesUser } from '@/lib/authGate'
import { getDb } from '@/lib/db'

interface AnswerPayload {
  sessionId: string
  userId: string
  questionId: string
  questionType: string
  levelNumber: number
  correct: boolean
  scoreBefore: number
  scoreAfter: number
  skillScoreBefore: number
  skillScoreAfter: number
}

export async function POST(req: NextRequest) {
  try {
    const p = (await req.json()) as AnswerPayload
    if (!p.sessionId || !p.userId || !p.questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = getDb()

    const sess = db
      .prepare(`SELECT user_id FROM sessions WHERE id = ?`)
      .get(p.sessionId) as { user_id: string } | undefined
    if (!sess || sess.user_id !== p.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }
    if (!assertSessionMatchesUser(req, p.userId)) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    }

    db.prepare(
      `INSERT INTO answers (
        session_id, user_id, question_id, question_type,
        level_number, correct, score_before, score_after,
        skill_score_before, skill_score_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      p.sessionId,
      p.userId,
      p.questionId,
      p.questionType,
      p.levelNumber,
      p.correct ? 1 : 0,
      p.scoreBefore,
      p.scoreAfter,
      p.skillScoreBefore,
      p.skillScoreAfter
    )

    db.prepare(
      `UPDATE sessions
       SET total_questions = total_questions + 1,
           correct_answers = correct_answers + ?
       WHERE id = ?`
    ).run(p.correct ? 1 : 0, p.sessionId)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
