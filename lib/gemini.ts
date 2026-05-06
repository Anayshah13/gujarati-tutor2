import { GoogleGenerativeAI } from '@google/generative-ai'

// Auto-tracking alias to the current production Gemini Flash model.
// Override via GEMINI_MODEL env var if you want to pin to a specific version
// (e.g. "gemini-2.5-flash", "gemini-2.0-flash", "gemini-3-flash-preview").
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

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

  const model = client.getGenerativeModel({ model: GEMINI_MODEL })

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
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })
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
  _text: string
): Promise<string | null> => {
  return null
}
