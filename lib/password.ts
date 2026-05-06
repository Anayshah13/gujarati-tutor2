import crypto from 'crypto'

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto
    .scryptSync(plain, salt, 64, SCRYPT_OPTS)
    .toString('hex')
  return `scrypt$${salt}$${derived}`
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith('scrypt$')) return false
  const parts = stored.split('$')
  const salt = parts[1]
  const hash = parts[2]
  if (!salt || !hash) return false
  try {
    const derived = crypto
      .scryptSync(plain, salt, 64, SCRYPT_OPTS)
      .toString('hex')
    const a = Buffer.from(hash, 'hex')
    const b = Buffer.from(derived, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
