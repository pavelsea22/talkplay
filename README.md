# TalkPlay

A speech therapy web app for kids. Cindy the bunny guides children through spoken-word exercises and gives friendly, animated feedback.

## Features

- **DrillWord** — Cindy prompts the child to say a word, records their response, and gives feedback (correct / retry / failed)
- **MinPairDiscrimination** — Two similar-sounding words are shown as illustrated cards; the app speaks one and the child must click the correct card
- Lesson progress bar — pills at the top showing pass / fail / pending per task
- All prompts and feedback spoken aloud via Azure Neural TTS
- Speech-to-text via Azure Speech SDK with phrase list biasing for accurate word recognition
- Pop-the-Balloon minigame shown on lesson completion
- `/demo` page for previewing any task type with a hardcoded fixture

## Pages

| URL | Description |
|-----|-------------|
| `/` | Lesson selector |
| `/activity` | Active lesson (DrillWord + MinPair tasks mixed) |
| `/demo` | Developer preview — one fixture per task type |

## Architecture

```
src/
  server.ts                  # Express API (/speak, /transcribe) + static file serving
  tasks/
    shared/types.ts          # Shared TaskOutcome, TaskStatus, TaskResult
    drillWord/               # DrillWord task — type, evaluator, picker, Activity UI
    minPairDiscrim/          # MinPairDiscrim task — type, evaluator, pairs data, Activity UI
    index.ts                 # Task union type + pickLesson() (60% DrillWord / 40% MinPair)
  words.ts                   # Word groups and illustrations for DrillWord
  client/
    activity/                # Lesson shell: progress bar, task routing
    demo/                    # /demo page (tab-switched task previews)
    minigames/               # Pop-the-Balloon celebration minigame
```

Each task type lives in its own feature folder and owns its TypeScript type, evaluator function, data/picker, and Svelte `Activity` component. The lesson shell routes to the right component based on the `task.type` discriminant.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** Svelte 5 (runes), Vite, TypeScript
- **Speech:** Azure AI Speech (STT + TTS)
- **Testing:** Jest + ts-jest

## Setup

1. Create an [Azure AI Speech](https://portal.azure.com) resource (F0 free tier works)
2. Copy your key and region:

```bash
cp .env.example .env
# Edit .env with your Azure credentials
```

3. Install dependencies and start in dev mode:

```bash
npm install
npm run dev
```

This starts the Express API on port 3001 and the Vite dev server on port 5173.
Open http://localhost:5173

## Environment Variables

| Variable | Description |
|---|---|
| `AZURE_SPEECH_KEY` | Azure Speech API key |
| `AZURE_SPEECH_REGION` | Azure region (e.g. `westus`) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API (port 3001) + Vite dev server (port 5173) concurrently |
| `npm run dev:api` | Start Express API only |
| `npm run dev:ui` | Start Vite dev server only |
| `npm run build` | Lint + compile TypeScript + bundle client into `dist/` |
| `npm start` | Serve production build (port 3000) |
| `npm test` | Run unit tests |
| `npm run verify` | Lint + test (used before committing) |

## Adding Illustrations

Word illustrations are SVGs placed in `public/images/words/`.
The filename must match the word exactly (e.g. `cat.svg` for the word *cat*).
Missing illustrations are hidden gracefully — they do not break the UI.
