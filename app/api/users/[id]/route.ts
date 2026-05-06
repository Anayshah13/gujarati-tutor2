import { NextRequest, NextResponse } from 'next/server'
import { assertSessionMatchesUser } from '@/lib/authGate'
import { getDb } from '@/lib/db'
import { toPublicUser } from '@/lib/toPublicUser'

interface UserRow {
  id: string
  name: string
  created_at: string
  pretest_done: number
  pretest_mode: string | null
  current_level: number
  skill_theory: number
  skill_pronunciation: number
  skill_sentence: number
  skill_translation: number
  skill_blanks: number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb()
    const row = db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(params.id) as UserRow | undefined
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(toPublicUser(row))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const ALLOWED_FIELDS: Record<string, string> = {
  currentLevel: 'current_level',
  current_level: 'current_level',
  pretest_done: 'pretest_done',
  pretestDone: 'pretest_done',
  pretest_mode: 'pretest_mode',
  pretestMode: 'pretest_mode',
  skill_theory: 'skill_theory',
  skill_pronunciation: 'skill_pronunciation',
  skill_sentence: 'skill_sentence',
  skill_translation: 'skill_translation',
  skill_blanks: 'skill_blanks',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!assertSessionMatchesUser(req, params.id)) {
      return NextResponse.json(
        { error: 'Sign in again to update your profile.' },
        { status: 401 }
      )
    }

    const body = (await req.json()) as Record<string, unknown>
    const sets: string[] = []
    const values: unknown[] = []

    for (const key of Object.keys(body)) {
      const dbField = ALLOWED_FIELDS[key]
      if (!dbField) continue
      sets.push(`${dbField} = ?`)
      let val: unknown = body[key]
      if (dbField === 'pretest_done') {
        val = val ? 1 : 0
      }
      values.push(val)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    values.push(params.id)
    const db = getDb()
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(
      ...(values as (string | number | null)[])
    )

    const updated = db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(params.id) as UserRow | undefined
    return NextResponse.json(toPublicUser(updated) ?? { ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!assertSessionMatchesUser(req, params.id)) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    }
    const db = getDb()
    db.prepare(`DELETE FROM answers WHERE user_id = ?`).run(params.id)
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(params.id)
    db.prepare(`DELETE FROM users WHERE id = ?`).run(params.id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
