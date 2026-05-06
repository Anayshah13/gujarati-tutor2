import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC`
      )
      .all(userId)
    return NextResponse.json({ sessions: rows })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
