export type SpeechLang = 'en' | 'gu'

let cachedVoices: SpeechSynthesisVoice[] = []
let activeAudio: HTMLAudioElement | null = null

type VoiceGender = 'male' | 'female'

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([])
      return
    }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      cachedVoices = voices
      resolve(voices)
      return
    }
    let resolved = false
    const finish = () => {
      if (resolved) return
      resolved = true
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
    window.speechSynthesis.onvoiceschanged = finish
    setTimeout(finish, 1500)
  })
}

export const speak = async (
  text: string,
  lang: SpeechLang = 'en'
): Promise<void> => {
  if (typeof window === 'undefined') return
  stopSpeaking()

  // Gemini TTS is a full round-trip per click; off by default for snappy UI.
  // Set NEXT_PUBLIC_GEMINI_TTS=true to use Gemini audio first (then browser fallback).
  const geminiTtsFirst = process.env.NEXT_PUBLIC_GEMINI_TTS === 'true'

  const preferredGender: VoiceGender = Math.random() < 0.5 ? 'male' : 'female'

  const playGeminiAudio = async (): Promise<boolean> => {
    if (!navigator.onLine) return false
    try {
      const res = await fetch('/api/gemini/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, preferredGender }),
      })
      if (!res.ok) return false
      const data = (await res.json()) as {
        audio?: { base64: string; mimeType?: string } | null
      }
      if (!data.audio?.base64) return false

      const mime = data.audio.mimeType || 'audio/wav'
      const audio = new Audio(`data:${mime};base64,${data.audio.base64}`)
      activeAudio = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('audio-playback-failed'))
        audio
          .play()
          .then(() => {
            // no-op, wait for onended
          })
          .catch(reject)
      })
      activeAudio = null
      return true
    } catch {
      activeAudio = null
      return false
    }
  }

  const pickVoice = (
    voices: SpeechSynthesisVoice[],
    targetLangs: string[],
    gender: VoiceGender
  ): SpeechSynthesisVoice | undefined => {
    const languageMatches = voices.filter((v) =>
      targetLangs.some((target) => v.lang.toLowerCase().startsWith(target.toLowerCase()))
    )
    if (languageMatches.length === 0) return undefined

    const maleHints = ['male', 'man', 'david', 'mark', 'alex', 'john', 'rahul']
    const femaleHints = ['female', 'woman', 'zira', 'susan', 'sara', 'karen', 'priya']
    const hints = gender === 'male' ? maleHints : femaleHints

    const gendered = languageMatches.find((v) =>
      hints.some((h) => v.name.toLowerCase().includes(h))
    )
    return gendered || languageMatches[0]
  }

  const playLocal = async (): Promise<void> => {
    if (!('speechSynthesis' in window)) return
    const voices = await loadVoices()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    if (lang === 'gu') {
      const selected =
        pickVoice(voices, ['gu-in'], preferredGender) ||
        pickVoice(voices, ['hi-in'], preferredGender) ||
        pickVoice(voices, ['en-in'], preferredGender)
      if (selected) {
        utterance.voice = selected
        utterance.lang = selected.lang
      } else {
        utterance.lang = 'gu-IN'
      }
    } else {
      const selected = pickVoice(voices, ['en-us', 'en-gb', 'en-in'], preferredGender)
      if (selected) {
        utterance.voice = selected
        utterance.lang = selected.lang
      } else {
        utterance.lang = 'en-US'
      }
    }

    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }

  if (geminiTtsFirst) {
    if (await playGeminiAudio()) return
  }
  await playLocal()
}

export const stopSpeaking = () => {
  if (typeof window === 'undefined') return
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export const scorePronunciation = (expected: string, got: string): number => {
  const a = expected.toLowerCase().trim()
  const b = got.toLowerCase().trim()
  if (a === b) return 1.0
  if (a.length === 0 || b.length === 0) return 0
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  let matches = 0
  const longerArr = longer.split('')
  shorter.split('').forEach((char) => {
    const idx = longerArr.indexOf(char)
    if (idx !== -1) {
      matches++
      longerArr.splice(idx, 1)
    }
  })
  return matches / longer.length
}
