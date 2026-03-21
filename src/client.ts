import { processAnswer } from "./evaluate";
import { shuffle } from "./arrayUtils";

const RECORD_SECONDS = 3;

/**
 * Removes the white rectangular background from a speech bubble PNG using a
 * BFS flood-fill from the image border. Any light-coloured pixel reachable
 * from the edge (without crossing the dark bubble outline) is made fully
 * transparent, leaving the bubble interior white.
 */
function removeBubbleBackground(img: HTMLImageElement): void {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;

  const isLight = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200;
  };

  // BFS flood-fill from all border pixels, making reachable light pixels transparent
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  for (let x = 0; x < w; x++) { queue.push(x, 0); queue.push(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { queue.push(0, y); queue.push(w - 1, y); }

  for (let qi = 0; qi < queue.length; qi += 2) {
    const x = queue[qi], y = queue[qi + 1];
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx] || !isLight(x, y)) continue;
    visited[idx] = 1;
    data[idx * 4 + 3] = 0;
    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);
  img.src = canvas.toDataURL();
}

interface WordEntry {
  word: string;
  illustration: string;
}

interface SoundGroup {
  sound: string;
  label: string;
  positions: {
    leading: WordEntry[];
    trailing: WordEntry[];
    "mid-word": WordEntry[];
  };
}

const WORD_GROUPS: SoundGroup[] = [
  {
    sound: "t",
    label: "/t/",
    positions: {
      leading: [
        { word: "ten",   illustration: "images/words/ten.svg" },
        { word: "top",   illustration: "images/words/top.svg" },
        { word: "tip",   illustration: "images/words/tip.svg" },
        { word: "tiger", illustration: "images/words/tiger.svg" },
        { word: "tent",  illustration: "images/words/tent.svg" },
        { word: "time",  illustration: "images/words/time.svg" },
        { word: "tea",   illustration: "images/words/tea.svg" },
        { word: "tree",  illustration: "images/words/tree.svg" },
        { word: "talk",  illustration: "images/words/talk.svg" },
        { word: "truck", illustration: "images/words/truck.svg" },
      ],
      trailing: [],
      "mid-word": [],
    },
  },
];

/**
 * Returns all non-empty WordEntry items across all groups and positions.
 * Only positions with at least one entry are included.
 */
function getActiveWords(): WordEntry[] {
  return WORD_GROUPS.flatMap(group =>
    Object.values(group.positions).flat()
  );
}

// Shuffled queue of words for the current session. Refills automatically when exhausted.
let wordQueue: WordEntry[] = [];

/**
 * Returns the next WordEntry from the session queue, ensuring no word repeats
 * until all words have been used. Reshuffles when the queue is exhausted.
 */
function pickWord(): WordEntry {
  if (wordQueue.length === 0) {
    wordQueue = shuffle(getActiveWords());
  }
  return wordQueue.pop()!;
}

// Currently playing TTS element — stopped when a new one starts.
let currentAudio: HTMLAudioElement | null = null;

/**
 * Stops any currently playing TTS audio immediately.
 */
function stopCurrentTts(): void {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.pause();
    URL.revokeObjectURL(currentAudio.src);
    currentAudio = null;
  }
}

/**
 * Plays a word or phrase via Azure TTS and resolves when playback ends.
 *
 * - `raw: true` sends the text as-is to the server (no "Say " prefix).
 * - Default: the server prepends "Say " before synthesizing.
 *
 * Any currently playing TTS is stopped before the new one starts.
 * Callers that need to wait for playback to finish should `await` this function.
 */
async function speakWord(word: string, options: { raw?: boolean } = {}): Promise<void> {
  try {
    const rawParam = options.raw ? "&raw=1" : "";
    const res = await fetch(`/speak?word=${encodeURIComponent(word)}${rawParam}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    stopCurrentTts();

    const audio = new Audio(url);
    currentAudio = audio;

    return new Promise<void>(resolve => {
      audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      audio.play();
    });
  } catch (err) {
    console.error("TTS failed:", err);
  }
}

const btn                = document.getElementById("mic-btn") as HTMLButtonElement;
const statusEl           = document.getElementById("status") as HTMLDivElement;
const countdown          = document.getElementById("countdown") as HTMLDivElement;
const playback           = document.getElementById("playback") as HTMLDivElement;
const wordEl             = document.getElementById("word") as HTMLSpanElement;
const feedbackEl         = document.getElementById("feedback") as HTMLDivElement;
const cindyEl            = document.getElementById("cindy") as HTMLImageElement;
const nextBtn            = document.getElementById("next-btn") as HTMLButtonElement;
const bubbleBg           = document.getElementById("bubble-bg") as HTMLImageElement;
const wordIllustrationEl = document.getElementById("word-illustration") as HTMLImageElement;

// Remove white background from bubble PNG on load
if (bubbleBg.complete) {
  removeBubbleBackground(bubbleBg);
} else {
  bubbleBg.addEventListener("load", () => removeBubbleBackground(bubbleBg), { once: true });
}

/** Updates Cindy's image to reflect the given mood. */
function showCindy(mood: string): void {
  cindyEl.src = `images/Cindy_${mood}.png`;
}

/** Renders the word prompt in the speech bubble, shows its illustration, and resets Cindy to neutral. */
function showPrompt(entry: WordEntry): void {
  wordIllustrationEl.src = entry.illustration;
  wordIllustrationEl.style.display = "block";
  feedbackEl.innerHTML = `Say <strong>${entry.word}</strong>`;
  feedbackEl.className = "";
  showCindy("neutral");
}

nextBtn.addEventListener("click", () => {
  const next = pickWord();
  wordEl.textContent = next.word;
  showPrompt(next);
  nextBtn.classList.add("hidden");
  btn.classList.remove("hidden");
  statusEl.textContent = "Press the mic to record";
  wordSpoken = true;
  speakWord(next.word);
});

const firstEntry = pickWord();
wordEl.textContent = firstEntry.word;
showPrompt(firstEntry);

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;
let wordSpoken = false;

btn.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording(stream);
  } catch (err) {
    statusEl.textContent = "Microphone access denied.";
    console.error(err);
  }
});

/**
 * Converts a raw audio Blob (e.g. WebM/Opus from MediaRecorder) into a
 * 16 kHz mono PCM WAV ArrayBuffer suitable for the Azure Speech SDK.
 * Uses the Web Audio API to decode and resample the audio.
 */
async function blobToWav(blob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const targetRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start();
  const resampled = await offlineCtx.startRendering();
  return encodeWav(resampled.getChannelData(0), targetRate);
}

/**
 * Encodes a Float32Array of mono PCM samples into a WAV ArrayBuffer.
 * Produces a standard 44-byte RIFF/WAVE header followed by 16-bit PCM data.
 *
 * @param samples - Normalised audio samples in the range [-1, 1].
 * @param sampleRate - Sample rate in Hz (e.g. 16000).
 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buf);
  const w = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  w(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true);
  w(8, "WAVE"); w(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  w(36, "data"); view.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);
  return buf;
}

/**
 * Starts a recording session from the given MediaStream.
 * Sequence:
 * 1. Shows a 1-second "Get ready…" pre-roll (speaks the word prompt on first attempt).
 * 2. Records for {@link RECORD_SECONDS} seconds with a live countdown.
 * 3. On stop: converts audio to WAV, sends to /transcribe, evaluates the result,
 *    updates the UI and speaks the feedback.
 */
async function startRecording(stream: MediaStream): Promise<void> {
  chunks = [];
  playback.style.display = "none";
  btn.disabled = true;

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, { type: mediaRecorder!.mimeType });

    try {
      const wavBuffer = await blobToWav(blob);
      const form = new FormData();
      form.append("audio", new Blob([wavBuffer], { type: "audio/wav" }), "audio.wav");
      form.append("words", JSON.stringify([wordEl.textContent]));
      const res = await fetch("/transcribe", { method: "POST", body: form });
      const { transcript } = await res.json();

      const outcome = processAnswer(transcript, wordEl.textContent!, retryCount);
      wordIllustrationEl.style.display = "none";
      feedbackEl.textContent = outcome.screenMessage;
      feedbackEl.className = outcome.screenClass;
      statusEl.textContent = "";
      showCindy(outcome.cindyMood);

      if (outcome.correct) {
        retryCount = 0;
        btn.disabled = false;
        btn.classList.add("hidden");
        nextBtn.classList.remove("hidden");
        speakWord(outcome.spoken!, { raw: true }); // fire-and-forget for "You got it!"
      } else {
        retryCount++;
        // Await TTS so the button stays disabled until the full message has played,
        // preventing the user from clicking mic mid-sentence and cutting it off.
        await speakWord(outcome.spoken!, { raw: true });
        statusEl.textContent = "Press the mic to record";
        btn.disabled = false;
      }
    } catch (err) {
      feedbackEl.textContent = "(transcription error)";
      console.error(err);
      btn.disabled = false;
    }
  };

  mediaRecorder.start();

  statusEl.textContent = "Get ready…";
  if (!wordSpoken) { speakWord(wordEl.textContent!); wordSpoken = true; }
  await new Promise(r => setTimeout(r, 1000));

  btn.classList.add("recording");
  let remaining = RECORD_SECONDS;
  countdown.textContent = String(remaining);
  countdown.classList.remove("hidden");
  statusEl.textContent = "Speak now!";

  timerInterval = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      countdown.textContent = String(remaining);
    } else {
      clearInterval(timerInterval!);
      countdown.classList.add("hidden");
      mediaRecorder!.stop();
      btn.classList.remove("recording");
      statusEl.textContent = "Processing…";
    }
  }, 1000);
}
