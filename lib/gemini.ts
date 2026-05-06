import { GoogleGenerativeAI } from '@google/generative-ai'

// Auto-tracking alias to the current production Gemini Flash model.
// Override via GEMINI_MODEL env var if you want to pin to a specific version
// (e.g. "gemini-2.5-flash", "gemini-2.0-flash", "gemini-3-flash-preview").
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
// Single model by default — each extra entry is tried sequentially and slows failures.
// Add fallbacks via GEMINI_TTS_MODELS=comma,separated,list if needed.
const GEMINI_TTS_MODELS = (process.env.GEMINI_TTS_MODELS || 'gemini-2.5-flash-preview-tts')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)

const GEMINI_TTS_VOICES = {
  male: ['Puck', 'Fenrir', 'Orus', 'Charon'],
  female: ['Kore', 'Leda', 'Aoede', 'Callirrhoe'],
} as const

const getClient = () => {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!key || key === 'your_key_here') {
    throw new Error('Gemini API key not configured')
  }
  return new GoogleGenerativeAI(key)
}

const logGeminiError = (where: string, err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  // Surfaces the underlying SDK error in your dev terminal so you know
  // why Gemini fell back to hardcoded questions.
  console.error(`[gemini:${where}]`, msg)
}

const randomId = (): string =>
  'gen_' + Math.random().toString(36).slice(2, 8)

export const generateQuestion = async (
  level: number,
  type: string,
  previousIds: string[]
): Promise<unknown> => {
  let client: GoogleGenerativeAI
  try {
    client = getClient()
  } catch (e) {
    logGeminiError('question:init', e)
    return null
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  })

  const bandDesc =
    level <= 10
      ? 'beginner: greetings, numbers, basic words'
      : level <= 20
      ? 'elementary: gender, pronouns, simple sentences'
      : level <= 30
      ? 'intermediate: postpositions, verb forms, phrases'
      : 'advanced: complex sentences, SOV structure'

  const rid = randomId()

  const typePrompts: Record<string, string> = {
    theory: `Generate a theory/grammar MCQ about Gujarati.
Return ONLY this JSON, no markdown, no extra text:
{
  "id": "${rid}",
  "level": ${level},
  "type": "theory",
  "question": "English grammar question here",
  "gujaratiText": "relevant gujarati script",
  "options": ["opt1","opt2","opt3","opt4"],
  "answer": "must exactly match one option",
  "explanation": "brief explanation"
}`,

    pronunciation: `Generate a pronunciation question.
A Gujarati word appropriate for level ${level} (${bandDesc}).
Return ONLY this JSON, no markdown, no extra text:
{
  "id": "${rid}",
  "level": ${level},
  "type": "pronunciation",
  "question": "Listen and type what you hear:",
  "gujaratiText": "the gujarati word/phrase",
  "targetRomanized": "romanized pronunciation",
  "explanation": "pronunciation guide"
}`,

    sentence: `Generate a sentence arrangement question.
Level ${level} (${bandDesc}).
Return ONLY this JSON, no markdown, no extra text:
{
  "id": "${rid}",
  "level": ${level},
  "type": "sentence",
  "question": "Arrange the words to form the sentence:",
  "gujaratiText": "full gujarati sentence",
  "spokenText": "the sentence to speak aloud",
  "wordBlocks": ["shuffled","word","array"],
  "correctOrder": ["correct","word","order"],
  "explanation": "translation and explanation"
}`,

    translation: `Generate a match-the-columns question.
Level ${level} (${bandDesc}).
Return ONLY this JSON, no markdown, no extra text:
{
  "id": "${rid}",
  "level": ${level},
  "type": "translation",
  "question": "Match the English to Gujarati:",
  "pairs": [
    {"english":"word1","gujarati":"ગુજ1"},
    {"english":"word2","gujarati":"ગુજ2"},
    {"english":"word3","gujarati":"ગુજ3"},
    {"english":"word4","gujarati":"ગુજ4"}
  ],
  "explanation": "brief note on these words"
}`,

    blanks: `Generate a fill-in-the-blank question.
Level ${level} (${bandDesc}).
Return ONLY this JSON, no markdown, no extra text:
{
  "id": "${rid}",
  "level": ${level},
  "type": "blanks",
  "question": "English context clue for the blank",
  "sentenceWithBlank": "ગુજરાતી ___ વાક્ય",
  "gujaratiText": "full sentence without blank",
  "answer": "correct word",
  "hints": ["wrong1","wrong2","wrong3"],
  "explanation": "why this answer is correct"
}`,
  }

  if (!typePrompts[type]) return null

  try {
    const result = await model.generateContent(
      `You are a Gujarati language teacher creating quiz questions for level ${level}/40 learners.
Band: ${bandDesc}
Previously used IDs to avoid: ${previousIds.join(',')}

${typePrompts[type]}

CRITICAL: Return ONLY raw JSON. No markdown. No backticks. No explanation. Just the JSON object.`
    )

    const text = result.response
      .text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(text)

    if (!parsed.id || !parsed.type || typeof parsed.level !== 'number') {
      throw new Error('Invalid question structure')
    }

    if (parsed.type === 'theory') {
      if (!Array.isArray(parsed.options) || !parsed.options.includes(parsed.answer)) {
        throw new Error('Answer not in options')
      }
    }

    return parsed
  } catch (e) {
    logGeminiError('question:generate', e)
    return null
  }
}

export const generateInsight = async (
  startLevel: number,
  endLevel: number,
  weakestSkill: string,
  accuracy: number
): Promise<string | null> => {
  let client: GoogleGenerativeAI
  try {
    client = getClient()
  } catch (e) {
    logGeminiError('insight:init', e)
    return null
  }
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200,
    },
  })
  try {
    const result = await model.generateContent(
      `User completed a Gujarati learning session.
Start level: ${startLevel}/40
End level: ${endLevel}/40
Weakest skill: ${weakestSkill}
Accuracy: ${Math.round(accuracy * 100)}%

Give exactly 2 sentences in plain text (no markdown):
1. An observation about their performance.
2. One actionable tip for improving their weakest skill.
Be warm and encouraging. Keep total under 60 words.`
    )
    return result.response.text().trim()
  } catch (e) {
    logGeminiError('insight:generate', e)
    return null
  }
}

export const generateSpeech = async (
  text: string,
  opts?: { lang?: 'en' | 'gu'; preferredGender?: 'male' | 'female' }
): Promise<{
  audioBase64: string
  mimeType: string
  model: string
  voice: string
  gender: 'male' | 'female'
} | null> => {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!key || key === 'your_key_here') {
    logGeminiError('speech:init', 'Gemini API key not configured')
    return null
  }

  const cleanText = text.trim()
  if (!cleanText) return null

  const gender: 'male' | 'female' =
    opts?.preferredGender ?? (Math.random() < 0.5 ? 'male' : 'female')
  const voicePool = GEMINI_TTS_VOICES[gender]
  const voice = voicePool[Math.floor(Math.random() * voicePool.length)]

  const languageInstruction =
    opts?.lang === 'gu'
      ? 'Speak naturally in Gujarati (gu-IN) with clear diction and neutral pace.'
      : 'Speak naturally in English (en-US) with clear diction and neutral pace.'

  const toWavBase64 = (pcmBase64: string, mimeType: string): string => {
    if (mimeType.toLowerCase().includes('wav')) return pcmBase64
    const pcm = Buffer.from(pcmBase64, 'base64')
    const sampleRate = Number(mimeType.match(/rate=(\d+)/i)?.[1] ?? 24000)
    const channels = Number(mimeType.match(/channels=(\d+)/i)?.[1] ?? 1)
    const bitsPerSample = 16
    const byteRate = (sampleRate * channels * bitsPerSample) / 8
    const blockAlign = (channels * bitsPerSample) / 8
    const dataSize = pcm.length
    const wav = Buffer.alloc(44 + dataSize)

    wav.write('RIFF', 0)
    wav.writeUInt32LE(36 + dataSize, 4)
    wav.write('WAVE', 8)
    wav.write('fmt ', 12)
    wav.writeUInt32LE(16, 16) // PCM chunk size
    wav.writeUInt16LE(1, 20) // PCM format
    wav.writeUInt16LE(channels, 22)
    wav.writeUInt32LE(sampleRate, 24)
    wav.writeUInt32LE(byteRate, 28)
    wav.writeUInt16LE(blockAlign, 32)
    wav.writeUInt16LE(bitsPerSample, 34)
    wav.write('data', 36)
    wav.writeUInt32LE(dataSize, 40)
    pcm.copy(wav, 44)

    return wav.toString('base64')
  }

  const tryModel = async (model: string) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(key)}`

    const body = {
      contents: [
        {
          parts: [
            {
              text: `${languageInstruction}\n\nText to speak:\n${cleanText}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const json = (await res.json()) as {
      error?: { message?: string }
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>
        }
      }>
    }

    if (!res.ok || json.error) {
      const msg = json.error?.message || `HTTP ${res.status}`
      throw new Error(msg)
    }

    const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData
    const data = inline?.data
    if (!data) throw new Error('No audio returned from Gemini TTS')
    const mimeType = inline?.mimeType || 'audio/L16;rate=24000'
    const wavBase64 = toWavBase64(data, mimeType)

    return {
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
      model,
      voice,
      gender,
    }
  }

  for (const model of GEMINI_TTS_MODELS) {
    try {
      const out = await tryModel(model)
      return out
    } catch (e) {
      logGeminiError(`speech:${model}`, e)
    }
  }

  return null
}
