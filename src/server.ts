import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Fail fast if Azure credentials are missing — avoids cryptic errors on first request.
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
  console.error("Fatal: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set in .env");
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000");
const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/activity", (_req, res) => res.sendFile(path.join(__dirname, "public/activity/index.html")));
app.get("/demo",     (_req, res) => res.sendFile(path.join(__dirname, "public/demo/index.html")));

app.use(express.static(path.join(__dirname, "public")));

/**
 * Transcribes a 16 kHz mono PCM WAV buffer using the Azure Speech SDK.
 * Applies phrase list biasing so that the recognizer favours the expected words.
 *
 * @param wavBuffer - Raw WAV file bytes (Node.js Buffer, includes 44-byte header).
 * @param key - Azure Speech subscription key.
 * @param region - Azure region (e.g. "westus").
 * @param words - Candidate words to bias the recognizer toward.
 * @returns The recognised text, or an empty string if no speech was detected.
 */
function transcribeWithSDK(wavBuffer: Buffer, key: string, region: string, words: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "8000");
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1500");

    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    const pushStream = sdk.AudioInputStream.createPushStream(format);
    // Convert to proper ArrayBuffer slice (Node Buffer.slice shares the memory pool)
    const pcm = wavBuffer.buffer.slice(wavBuffer.byteOffset + 44, wavBuffer.byteOffset + wavBuffer.length) as ArrayBuffer;
    pushStream.write(pcm);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    if (words.length > 0) {
      const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
      for (const word of words) phraseList.addPhrase(word);
    }

    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        const reasonName = sdk.ResultReason[result.reason];
        console.log("SDK result:", reasonName, "| text:", result.text || "(empty)");
        if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
          const details = sdk.CancellationDetails.fromResult(result as sdk.SpeechRecognitionResult);
          console.log("  → no speech reason:", details?.reason, details?.errorDetails);
        }
        resolve(result.reason === sdk.ResultReason.RecognizedSpeech ? result.text : "");
      },
      (err) => { recognizer.close(); reject(err); }
    );
  });
}

/**
 * GET /speak
 * Synthesises speech via Azure TTS and returns an MP3 audio stream.
 *
 * Query params:
 * - `word` (required) – Text to synthesise.
 * - `raw=1` (optional) – If set, speaks the text as-is; otherwise prepends "Say ".
 */
app.get("/speak", async (req, res) => {
  const word = (req.query.word as string)?.trim();
  if (!word) { res.status(400).end(); return; }

  const text = (req.query.raw === "1") ? word : `Say ${word}`;
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='en-US-AnaNeural'>${escaped}</voice></speak>`;

  const response = await fetch(
    `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(Buffer.from(await response.arrayBuffer()));
});

/**
 * POST /transcribe
 * Accepts a WAV audio file and returns the recognised transcript.
 *
 * Form fields:
 * - `audio` – WAV file (multipart/form-data).
 * - `words` – JSON array of candidate words for phrase list biasing.
 */
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No audio file received" }); return; }

  let words: string[] = [];
  try {
    words = req.body.words ? JSON.parse(req.body.words) : [];
  } catch {
    res.status(400).json({ error: "Invalid words parameter — expected a JSON array" });
    return;
  }

  try {
    const transcript = await transcribeWithSDK(req.file.buffer, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, words);
    res.json({ transcript });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
