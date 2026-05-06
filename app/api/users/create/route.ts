import { NextResponse } from 'next/server'

/** Password-less signup was removed — use POST /api/auth/register */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Account creation now uses a user ID and password. Use Register on the sign-in page, or POST /api/auth/register.',
    },
    { status: 410 }
  )
}
