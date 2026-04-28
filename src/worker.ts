import type { PhonemeAssessment } from './tasks/shared/types';

export interface Env {
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
  /** Cloudflare static asset binding — serves files from dist/public. */
  ASSETS: Fetcher;
}

/** Shape of a word entry in the Azure STT detailed JSON response. */
interface AzureWordResult {
  Word: string;
  PronunciationAssessment: { AccuracyScore: number };
  Phonemes: Array<{ Phoneme: string; PronunciationAssessment: { AccuracyScore: number } }>;
}

/** Top-level shape of the Azure STT REST response (format=detailed). */
interface AzureSpeechResponse {
  RecognitionStatus: string;
  DisplayText?: string;
  NBest?: Array<{ Words: AzureWordResult[] }>;
}

/**
 * GET /speak
 * Proxies a TTS request to Azure and returns an MP3 audio stream.
 *
 * Query params:
 * - `word` (required) – Text to synthesise.
 * - `raw=1` (optional) – Speak the text as-is; otherwise prepends "Say ".
 */
async function handleSpeak(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const word = url.searchParams.get('word')?.trim();
  if (!word) return new Response(null, { status: 400 });

  const text = url.searchParams.get('raw') === '1' ? word : `Say ${word}`;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='en-US-AnaNeural'>${escaped}</voice></speak>`;

  const ssmlBytes = new TextEncoder().encode(ssml);

  const response = await fetch(
    `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'Content-Length': String(ssmlBytes.byteLength),
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'talkplay-worker/1.0',
      },
      body: ssmlBytes,
    },
  );

  if (!response.ok) {
    console.error('Azure TTS error:', response.status, await response.text());
    return new Response(null, { status: 502 });
  }

  return new Response(response.body, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}

/**
 * POST /transcribe
 * Accepts a WAV audio file and returns the recognised transcript, plus an
 * optional phoneme-level pronunciation assessment when `word` is supplied.
 * Uses the Azure Speech-to-Text REST API (no Node.js SDK).
 *
 * Form fields:
 * - `audio` – WAV file (multipart/form-data).
 * - `words` – JSON array of candidate words for phrase-list biasing.
 * - `word`  – (optional) Reference word for pronunciation assessment.
 */
async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Invalid multipart form data', 400);
  }

  const audioFile = form.get('audio');
  // FormData.get() returns string | File | null; reject missing or plain-string values.
  if (!audioFile || typeof audioFile === 'string') return jsonError('No audio file received', 400);

  let words: string[] = [];
  const wordsParam = form.get('words');
  if (wordsParam) {
    try {
      words = JSON.parse(wordsParam as string) as string[];
    } catch {
      return jsonError('Invalid words parameter — expected a JSON array', 400);
    }
  }

  const targetWord = (form.get('word') as string | null)?.trim() || undefined;

  const params = new URLSearchParams({ language: 'en-US', format: 'detailed' });
  // Phrase-list biasing: semicolon-separated words passed as a single `phrases` hint.
  if (words.length > 0) params.set('phrases', words.join(';'));

  const audioBytes = await (audioFile as File).arrayBuffer();

  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
    'Content-Type': 'audio/wav',
    'Content-Length': String(audioBytes.byteLength),
    'Accept': 'application/json',
    'User-Agent': 'talkplay-worker/1.0',
  };

  if (targetWord) {
    const assessmentConfig = {
      ReferenceText: targetWord,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      EnableMiscue: true,
      PhonemeAlphabet: 'IPA',
    };
    // Azure expects the config as a base64-encoded JSON string in this header.
    headers['Pronunciation-Assessment'] = btoa(JSON.stringify(assessmentConfig));
  }

  const azureUrl = `https://${env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?${params}`;

  let azureResponse: Response;
  try {
    azureResponse = await fetch(azureUrl, {
      method: 'POST',
      headers,
      body: audioBytes,
    });
  } catch (err) {
    console.error('Azure fetch error:', err);
    return jsonError('Transcription failed', 500);
  }

  if (!azureResponse.ok) {
    console.error('Azure error:', azureResponse.status, await azureResponse.text());
    return jsonError('Transcription failed', 500);
  }

  const result = (await azureResponse.json()) as AzureSpeechResponse;
  const transcript = result.RecognitionStatus === 'Success' ? (result.DisplayText ?? '') : '';
  console.log('Azure result:', result.RecognitionStatus, '| text:', transcript || '(empty)');

  let assessment: PhonemeAssessment | null = null;
  if (targetWord) {
    const wordResult = result.NBest?.[0]?.Words?.[0];
    if (wordResult?.PronunciationAssessment && Array.isArray(wordResult.Phonemes)) {
      assessment = {
        accuracyScore: wordResult.PronunciationAssessment.AccuracyScore,
        phonemes: wordResult.Phonemes.map(p => ({
          phoneme: p.Phoneme,
          accuracyScore: p.PronunciationAssessment.AccuracyScore,
        })),
      };
      console.log('pronunciation score:', assessment.accuracyScore);
    }
  }

  return new Response(JSON.stringify({ transcript, assessment }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    console.log('Worker fetch:', request.method, pathname, 'key set:', !!env.AZURE_SPEECH_KEY);

    if (pathname === '/speak' && request.method === 'GET') return handleSpeak(request, env);
    if (pathname === '/transcribe' && request.method === 'POST') return handleTranscribe(request, env);

    // All other requests (static HTML, JS, CSS, images) are served from dist/public.
    return env.ASSETS.fetch(request);
  },
};
