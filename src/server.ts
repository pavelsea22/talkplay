import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, "../src/public")));

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
          const details = sdk.CancellationDetails.fromResult(result as any);
          console.log("  → no speech reason:", details?.reason, details?.errorDetails);
        }
        resolve(result.reason === sdk.ResultReason.RecognizedSpeech ? result.text : "");
      },
      (err) => { recognizer.close(); reject(err); }
    );
  });
}

app.get("/speak", async (req, res) => {
  const word = (req.query.word as string)?.trim();
  if (!word) { res.status(400).end(); return; }

  const key = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const text = (req.query.raw === "1") ? word : `Say ${word}`;
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='en-US-AnaNeural'>${text}</voice></speak>`;

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(Buffer.from(await response.arrayBuffer()));
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No audio file received" }); return; }

  const key = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION!;
  const words: string[] = req.body.words ? JSON.parse(req.body.words) : [];

  try {
    const transcript = await transcribeWithSDK(req.file.buffer, key, region, words);
    res.json({ transcript });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
