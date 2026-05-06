import { NextRequest, NextResponse } from 'next/server'
import { generateQuestion, generateInsight } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode?: 'question' | 'insight'
      level?: number
      type?: string
      previousIds?: string[]
      startLevel?: number
      endLevel?: number
      weakestSkill?: string
      accuracy?: number
    }

    if (body.mode === 'insight') {
      const text = await generateInsight(
        body.startLevel ?? 0,
        body.endLevel ?? 0,
        body.weakestSkill ?? 'theory',
        body.accuracy ?? 0
      )
      return NextResponse.json({ text })
    }

    if (typeof body.level !== 'number' || !body.type) {
      return NextResponse.json(
        { error: 'level and type required' },
        { status: 400 }
      )
    }
    const q = await generateQuestion(
      body.level,
      body.type,
      body.previousIds ?? []
    )
    return NextResponse.json({ question: q })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg, question: null }, { status: 200 })
  }
}
