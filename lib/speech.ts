export type SpeechLang = 'en' | 'gu'

let cachedVoices: SpeechSynthesisVoice[] = []

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
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const voices = await loadVoices()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85
  utterance.pitch = 1.0
  utterance.volume = 1.0

  if (lang === 'gu') {
    const guVoice = voices.find((v) => v.lang === 'gu-IN')
    const hiVoice = voices.find((v) => v.lang === 'hi-IN')
    const enInVoice = voices.find((v) => v.lang === 'en-IN')
    if (guVoice) {
      utterance.voice = guVoice
      utterance.lang = 'gu-IN'
    } else if (hiVoice) {
      utterance.voice = hiVoice
      utterance.lang = 'hi-IN'
    } else if (enInVoice) {
      utterance.voice = enInVoice
      utterance.lang = 'en-IN'
    } else {
      utterance.lang = 'en-US'
    }
  } else {
    utterance.lang = 'en-US'
  }

  return new Promise((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export const stopSpeaking = () => {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
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
