import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { readSessionUserId } from '@/lib/session'

/** Accounts created before login/password may have no hash — keep prior behaviour (open PATCH). */
export function userRequiresAuth(userId: string): boolean {
  const db = getDb()
  const row = db
    .prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .get(userId) as { password_hash: string | null } | undefined
  return Boolean(row?.password_hash)
}

/** Caller must enforce userId matches the resource being mutated. */
export function assertSessionMatchesUser(req: NextRequest, userId: string): boolean {
  if (!userRequiresAuth(userId)) return true
  const sid = readSessionUserId(req)
  return sid === userId
}
