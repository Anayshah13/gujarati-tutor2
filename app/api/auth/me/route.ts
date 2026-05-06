import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { readSessionUserId } from '@/lib/session'
import { toPublicUser } from '@/lib/toPublicUser'

export async function GET(req: NextRequest) {
  try {
    const uid = readSessionUserId(req)
    if (!uid) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    const db = getDb()
    const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(uid)
    const user = toPublicUser(row)
    if (!user?.id) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    return NextResponse.json({ user })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
