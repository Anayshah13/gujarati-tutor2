/** Kakko — consonants row layout matching classroom poster order */

export type AlphabetTile = {
  /** Gujarati grapheme(s) to display and pass to TTS */
  char: string
  /** Latin transliteration hint */
  label: string
}

export const GUJARATI_ALPHABET_ROWS: AlphabetTile[][] = [
  [
    { char: 'ક', label: 'Ka' },
    { char: 'ખ', label: 'Kha' },
    { char: 'ગ', label: 'Ga' },
    { char: 'ઘ', label: 'Gha' },
    { char: 'ચ', label: 'Cha' },
    { char: 'છ', label: 'Chha' },
    { char: 'જ', label: 'Ja' },
    { char: 'ઝ', label: 'Jha' },
  ],
  [
    { char: 'ટ', label: 'Ta' },
    { char: 'ઠ', label: 'Tha' },
    { char: 'ડ', label: 'Da' },
    { char: 'ઢ', label: 'Dha' },
    { char: 'ણ', label: 'NA' },
    { char: 'ત', label: 'Ta' },
    { char: 'થ', label: 'Tha' },
    { char: 'દ', label: 'Da' },
    { char: 'ધ', label: 'Dha' },
    { char: 'ન', label: 'NA' },
  ],
  [
    { char: 'પ', label: 'Pa' },
    { char: 'ફ', label: 'Pha' },
    { char: 'બ', label: 'Ba' },
    { char: 'ભ', label: 'Bha' },
    { char: 'મ', label: 'Ma' },
    { char: 'ય', label: 'Ya' },
    { char: 'ર', label: 'Ra' },
    { char: 'લ', label: 'La' },
    { char: 'વ', label: 'Va' },
    { char: 'શ', label: 'Sha' },
  ],
  [
    { char: 'ષ', label: 'Sha' },
    { char: 'સ', label: 'Sa' },
    { char: 'હ', label: 'Ha' },
    { char: 'ળ', label: 'La' },
  ],
  [
    { char: 'ક્ષ', label: 'Ksha' },
    { char: 'જ્ઞ', label: 'Gya' },
    { char: 'ત્ર', label: 'Hri' },
  ],
]
