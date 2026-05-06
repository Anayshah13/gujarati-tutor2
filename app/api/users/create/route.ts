import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body?.name ?? '').toString().trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const db = getDb()
    db.prepare(
      `INSERT INTO users (id, name, current_level) VALUES (?, ?, 0)`
    ).run(id, name)

    return NextResponse.json({ userId: id, name, currentLevel: 0 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
