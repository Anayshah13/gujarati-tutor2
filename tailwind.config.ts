import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFF8F0',
        'bg-2': '#FFF3E0',
        card: '#FFFFFF',
        border: '#F5E6D0',
        accent: '#FF6B00',
        gold: '#FFB300',
        burnt: '#E65100',
        success: '#2E7D32',
        error: '#C62828',
        amber: '#FF8F00',
        'text-1': '#1A0A00',
        'text-2': '#5D3A1A',
        muted: '#8D6E63',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        gujarati: ['"Noto Sans Gujarati"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(255, 107, 0, 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
