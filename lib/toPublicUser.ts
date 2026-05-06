export function toPublicUser(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null
  const o = { ...(row as Record<string, unknown>) }
  delete o.password_hash
  return o
}
