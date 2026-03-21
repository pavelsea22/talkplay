# TalkPlay

A speech therapy web app for kids. Cindy the bunny prompts the child to say a word, listens to their response, and gives friendly feedback.

## Features

- Word prompts spoken aloud by Cindy using Azure Neural TTS
- 3-second microphone recording with countdown
- Speech-to-text via Azure Speech SDK with phrase list biasing for accurate word recognition
- Correct/incorrect feedback with animated bunny moods (happy, sad, crying)
- Feedback messages spoken aloud


## Future Features

- Rewards for doing exercises (small games)
- Parent account creation and login 
- More different practice exercises

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** Vanilla TypeScript, Web Audio API
- **Speech:** Azure AI Speech (STT + TTS), `en-US-AnaNeural` voice
- **Testing:** Jest + ts-jest

## Setup

1. Create an [Azure AI Speech](https://portal.azure.com) resource (F0 free tier works)
2. Copy your key and region:

```
cp .env.example .env
# Edit .env with your Azure credentials
```

3. Install dependencies and start:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Description |
|---|---|
| `AZURE_SPEECH_KEY` | Azure Speech API key |
| `AZURE_SPEECH_REGION` | Azure region (e.g. `westus`) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Build and start the server |
| `npm run build` | Compile TypeScript + bundle client |
| `npm test` | Run unit tests |
