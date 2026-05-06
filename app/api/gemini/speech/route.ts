import { NextRequest, NextResponse } from 'next/server'
import { generateSpeech } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string
      lang?: 'en' | 'gu'
      preferredGender?: 'male' | 'female'
    }

    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    const speech = await generateSpeech(text, {
      lang: body.lang === 'gu' ? 'gu' : 'en',
      preferredGender:
        body.preferredGender === 'male' || body.preferredGender === 'female'
          ? body.preferredGender
          : undefined,
    })

    if (!speech) {
      return NextResponse.json({ audio: null }, { status: 200 })
    }

    return NextResponse.json({
      audio: {
        base64: speech.audioBase64,
        mimeType: speech.mimeType,
        model: speech.model,
        voice: speech.voice,
        gender: speech.gender,
        provider: 'gemini',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg, audio: null }, { status: 200 })
  }
}
