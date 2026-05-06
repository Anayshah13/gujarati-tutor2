# Guj-Gyani

Adaptive Gujarati learning app — **Next.js 14** (App Router), TypeScript, Tailwind, SQLite (`better-sqlite3`), Framer Motion, Recharts, and optional **Google Gemini** for generated questions and session insights.

## Setup

```bash
npm install
```

Copy env and add your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

```env
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

Optional: pin a model (defaults to `gemini-flash-latest` in `lib/gemini.ts`):

```env
GEMINI_MODEL=gemini-2.5-flash
```

Optional: configure Gemini TTS fallback model order (first successful model is used):

```env
GEMINI_TTS_MODELS=gemini-2.5-flash-preview-tts,gemini-3.1-flash-tts-preview
```

Restart the dev server after changing `.env.local`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- First API hit creates `gujgyani.db` in the project root (WAL mode).
- Production build: `npm run build` then `npm start`.

## Flow

1. **Landing** → **Onboard** (name) → **Pretest** (10 MCQs) → **Quiz** (5 skills per level; Gemini kicks in after the five hardcoded questions per level when configured).
2. **Summary** shows stats and a coach tip (Gemini or fallback).
3. **Admin** lists sessions (requires `gujgyani_userId` in `localStorage` from onboarding).

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Next.js dev server   |
| `npm run build`| Production build     |
| `npm start`    | Production server    |
| `npm run lint` | ESLint               |

---

Guj-Gyani · adaptive Gujarati practice at your level.
